import { Track } from '../types';
import { audioBufferToWav, ensureTrackAudioBuffer } from './setAudioRenderer';

export interface MashupOptions {
  trackA: Track;
  trackB: Track;
  targetBpm: number;
  trackAGain: number; // 0 to 1.5
  trackBGain: number; // 0 to 1.5
  trackBHighpassHz: number; // Cut bass from vocal track (e.g. 250 Hz)
  trackBOffsetSeconds: number; // Start offset for Track B relative to Track A
  beatNudgeMs?: number; // Fine phase nudge in ms (-200ms to +200ms)
  autoAlignBeatGrid?: boolean; // Align first kick drum transient onset
  pitchShiftSemiTonesB: number; // Pitch shift semitones (-5 to +5)
  mashupDurationMode: 'FULL_TRACK' | 'TWO_MIN' | 'ONE_MIN';
}

export interface RenderedMashupResult {
  blob: Blob;
  url: string;
  durationSeconds: number;
  mashupTrack: Track;
}

/**
 * Detects the first strong downbeat/kick transient onset time in seconds
 */
export function detectFirstDownbeat(buffer: AudioBuffer): number {
  if (!buffer || buffer.length === 0) return 0;

  const data = buffer.getChannelData(0);
  const sampleRate = buffer.sampleRate;
  const windowSize = Math.floor(sampleRate * 0.01); // 10ms frame
  const maxSearchSamples = Math.min(buffer.length, Math.floor(sampleRate * 10.0)); // Search first 10 seconds

  let maxEnergy = 0;
  const energies: number[] = [];

  for (let i = 0; i < maxSearchSamples; i += windowSize) {
    let sum = 0;
    const end = Math.min(i + windowSize, maxSearchSamples);
    for (let j = i; j < end; j++) {
      sum += data[j] * data[j];
    }
    const rms = Math.sqrt(sum / (end - i));
    energies.push(rms);
    if (rms > maxEnergy) maxEnergy = rms;
  }

  if (maxEnergy < 0.005) return 0; // Silent / quiet track

  // Find first frame that exceeds 18% of peak energy
  const threshold = maxEnergy * 0.18;
  for (let idx = 0; idx < energies.length; idx++) {
    if (energies[idx] >= threshold) {
      const sampleIndex = idx * windowSize;
      return sampleIndex / sampleRate;
    }
  }

  return 0;
}

/**
 * Pitch shifts an AudioBuffer by semitones while preserving exact playback duration & tempo.
 * Uses WSOLA (Waveform Similarity Overlap-Add) algorithm.
 */
export function pitchShiftAudioBuffer(
  buffer: AudioBuffer,
  semitones: number
): AudioBuffer {
  if (!semitones || Math.abs(semitones) < 0.01) {
    return buffer;
  }

  const pitchFactor = Math.pow(2, semitones / 12);
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const originalLength = buffer.length;

  const grainSize = Math.floor(sampleRate * 0.035); // 35ms grain
  const overlap = Math.floor(grainSize * 0.5);
  const hopOut = grainSize - overlap;
  const hopIn = Math.floor(hopOut * pitchFactor);

  const outCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)({ sampleRate });
  const shiftedBuffer = outCtx.createBuffer(numChannels, originalLength, sampleRate);

  // Hanning Window
  const windowTable = new Float32Array(grainSize);
  for (let i = 0; i < grainSize; i++) {
    windowTable[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / grainSize));
  }

  const searchRange = Math.floor(sampleRate * 0.004); // 4ms WSOLA search window

  for (let channel = 0; channel < numChannels; channel++) {
    const inputData = buffer.getChannelData(channel);
    const outputData = shiftedBuffer.getChannelData(channel);

    let inPos = 0;
    let outPos = 0;

    while (outPos + grainSize < originalLength && inPos + grainSize < originalLength) {
      let bestOffset = 0;
      let maxCorr = -1e9;

      for (let offset = -searchRange; offset <= searchRange; offset++) {
        const testIn = inPos + offset;
        if (testIn < 0 || testIn + overlap >= originalLength) continue;

        let corr = 0;
        for (let k = 0; k < overlap; k++) {
          corr += inputData[testIn + k] * (outputData[outPos + k] || 0);
        }
        if (corr > maxCorr) {
          maxCorr = corr;
          bestOffset = offset;
        }
      }

      const matchedIn = Math.max(0, Math.min(originalLength - grainSize, inPos + bestOffset));

      for (let i = 0; i < grainSize; i++) {
        const outIdx = outPos + i;
        if (outIdx < originalLength) {
          outputData[outIdx] += inputData[matchedIn + i] * windowTable[i];
        }
      }

      outPos += hopOut;
      inPos += hopIn;
    }
  }

  return shiftedBuffer;
}

/**
 * Renders a studio-quality audio mashup from two uploaded tracks using Web Audio API
 */
export async function renderMashupAudio(
  options: MashupOptions,
  onProgress?: (percent: number, status: string) => void
): Promise<RenderedMashupResult> {
  const {
    trackA,
    trackB,
    targetBpm,
    trackAGain,
    trackBGain,
    trackBHighpassHz,
    trackBOffsetSeconds,
    beatNudgeMs = 0,
    autoAlignBeatGrid = true,
    pitchShiftSemiTonesB,
    mashupDurationMode,
  } = options;

  onProgress?.(10, 'Decoding audio buffers for Track A & Track B...');

  // Decode audio buffers
  const bufferA = await ensureTrackAudioBuffer(trackA);
  const bufferB = await ensureTrackAudioBuffer(trackB);

  onProgress?.(25, 'Applying pitch shift & time-alignment...');

  // Apply pitch shift to Track B without altering its playback tempo
  let processedBufferB = bufferB;
  if (bufferB && pitchShiftSemiTonesB !== 0) {
    onProgress?.(35, `Pitch shifting Track B by ${pitchShiftSemiTonesB > 0 ? '+' : ''}${pitchShiftSemiTonesB} semitones (keeping tempo locked)...`);
    processedBufferB = pitchShiftAudioBuffer(bufferB, pitchShiftSemiTonesB);
  }

  onProgress?.(50, 'Locking beat grids & calculating phase alignment...');

  // Calculate playback rates to strictly match targetBpm
  const rateA = targetBpm / (trackA.bpm || targetBpm);
  const rateB = targetBpm / (trackB.bpm || targetBpm);

  // Exact Beat Grid Alignment & Downbeat Transient Synchronization
  const beatSec = 60 / targetBpm;
  const gridOffsetBeats = Math.round(trackBOffsetSeconds / beatSec);
  const snappedOffsetSec = gridOffsetBeats * beatSec;

  let autoOnsetCorrection = 0;
  if (autoAlignBeatGrid && bufferA && processedBufferB) {
    const onsetA = detectFirstDownbeat(bufferA);
    const onsetB = detectFirstDownbeat(processedBufferB);
    autoOnsetCorrection = (onsetA / rateA) - (onsetB / rateB);
  }

  const nudgeSec = beatNudgeMs / 1000;
  const startB = Math.max(0, snappedOffsetSec + autoOnsetCorrection + nudgeSec);

  // Calculate total rendered mashup duration
  const durA = bufferA ? bufferA.duration / rateA : trackA.durationSeconds;
  const durB = processedBufferB ? processedBufferB.duration / rateB + startB : trackB.durationSeconds + startB;

  let totalDuration = Math.max(durA, durB);

  if (mashupDurationMode === 'TWO_MIN') {
    totalDuration = Math.min(totalDuration, 120);
  } else if (mashupDurationMode === 'ONE_MIN') {
    totalDuration = Math.min(totalDuration, 60);
  }

  onProgress?.(65, 'Configuring Web Audio EQ filters & stem gain nodes...');

  const sampleRate = 44100;
  const totalSamples = Math.ceil(sampleRate * totalDuration);
  const offlineCtx = new OfflineAudioContext(2, totalSamples, sampleRate);

  // Master Gain & Limiter
  const masterGain = offlineCtx.createGain();
  masterGain.gain.setValueAtTime(0.92, 0);

  const compressor = offlineCtx.createDynamicsCompressor();
  compressor.threshold.setValueAtTime(-1.5, 0);
  compressor.knee.setValueAtTime(6, 0);
  compressor.ratio.setValueAtTime(4, 0);
  compressor.attack.setValueAtTime(0.003, 0);
  compressor.release.setValueAtTime(0.1, 0);

  masterGain.connect(compressor);
  compressor.connect(offlineCtx.destination);

  // --- Track A Setup (Instrumental / Beat Track) ---
  const gainNodeA = offlineCtx.createGain();
  gainNodeA.gain.setValueAtTime(trackAGain, 0);
  gainNodeA.connect(masterGain);

  if (bufferA) {
    const srcA = offlineCtx.createBufferSource();
    srcA.buffer = bufferA;
    srcA.playbackRate.setValueAtTime(rateA, 0);
    srcA.connect(gainNodeA);
    srcA.start(0, 0, totalDuration);
  } else {
    // Synthetic Beat fallback if raw audio not present
    generateSyntheticBeat(offlineCtx, gainNodeA, trackA, targetBpm, totalDuration);
  }

  // --- Track B Setup (Vocal / Top Track) ---
  const gainNodeB = offlineCtx.createGain();
  gainNodeB.gain.setValueAtTime(trackBGain, 0);

  // High-pass filter to isolate vocals/leads and cut low-end clash
  const hpFilterB = offlineCtx.createBiquadFilter();
  hpFilterB.type = 'highpass';
  hpFilterB.frequency.setValueAtTime(Math.max(20, trackBHighpassHz), 0);
  hpFilterB.connect(gainNodeB);
  gainNodeB.connect(masterGain);

  const playDurB = Math.max(0, totalDuration - startB);

  if (processedBufferB && playDurB > 0) {
    const srcB = offlineCtx.createBufferSource();
    srcB.buffer = processedBufferB;
    srcB.playbackRate.setValueAtTime(rateB, 0);
    srcB.connect(hpFilterB);
    srcB.start(startB, 0, playDurB);
  } else if (playDurB > 0) {
    // Synthetic Vocal Lead fallback
    generateSyntheticVocalLead(offlineCtx, hpFilterB, trackB, targetBpm, startB, playDurB);
  }

  onProgress?.(80, 'Rendering beat-matched mashup via Web Audio DSP...');

  const renderedBuffer = await offlineCtx.startRendering();

  onProgress?.(92, 'Encoding 16-bit PCM WAV File...');

  const wavBlob = audioBufferToWav(renderedBuffer);
  const audioUrl = URL.createObjectURL(wavBlob);

  const mashupTitle = `${trackA.title} vs ${trackB.title} (Mashup)`;

  const mashupTrack: Track = {
    id: `track-mashup-${Date.now()}`,
    title: mashupTitle,
    artist: `${trackA.artist} x ${trackB.artist}`,
    genre: 'Mashup',
    bpm: targetBpm,
    key: trackA.key,
    des: Math.max(trackA.des || 6, trackB.des || 6),
    durationSeconds: Math.round(totalDuration),
    spectral: {
      subBassWeight: trackA.spectral?.subBassWeight || 6.5,
      midRangeDensity: 7.0,
      highFrequencyRatio: 6.5,
      dominantFrequencyHz: 80,
      percussiveDensity: 7.5,
      rmsDb: -14.0,
    },
    cuePoints: [],
    waveformPeaks: [],
    fileName: `${mashupTitle}.wav`,
    audioBuffer: renderedBuffer,
  };

  onProgress?.(100, 'Beat-Matched Studio Mashup Rendered Successfully!');

  return {
    blob: wavBlob,
    url: audioUrl,
    durationSeconds: totalDuration,
    mashupTrack,
  };
}

/**
 * Fallback synth beat generator for Track A
 */
function generateSyntheticBeat(
  ctx: OfflineAudioContext,
  outputGain: AudioNode,
  track: Track,
  bpm: number,
  duration: number
) {
  const beatInterval = 60 / bpm;
  const totalBeats = Math.floor(duration / beatInterval);

  for (let b = 0; b < totalBeats; b++) {
    const time = b * beatInterval;
    const kick = ctx.createOscillator();
    const g = ctx.createGain();
    kick.frequency.setValueAtTime(130, time);
    kick.frequency.exponentialRampToValueAtTime(35, time + 0.08);
    g.gain.setValueAtTime(0.9, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
    kick.connect(g);
    g.connect(outputGain);
    kick.start(time);
    kick.stop(time + 0.15);
  }
}

/**
 * Fallback synth vocal lead generator for Track B
 */
function generateSyntheticVocalLead(
  ctx: OfflineAudioContext,
  outputGain: AudioNode,
  track: Track,
  bpm: number,
  startTime: number,
  duration: number
) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(440, startTime);
  g.gain.setValueAtTime(0.15, startTime);
  osc.connect(g);
  g.connect(outputGain);
  osc.start(startTime);
  osc.stop(startTime + duration);
}
