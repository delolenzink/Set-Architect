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
    pitchShiftSemiTonesB,
    mashupDurationMode,
  } = options;

  onProgress?.(10, 'Decoding audio buffers for Track A & Track B...');

  const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

  // Decode audio buffers
  const bufferA = await ensureTrackAudioBuffer(trackA);
  const bufferB = await ensureTrackAudioBuffer(trackB);

  onProgress?.(30, 'Calculating tempo playback rates & pitch offsets...');

  // Calculate playback rates for tempo & pitch shift
  const rateA = targetBpm / (trackA.bpm || targetBpm);
  const baseRateB = targetBpm / (trackB.bpm || targetBpm);
  const pitchFactorB = Math.pow(2, pitchShiftSemiTonesB / 12);
  const rateB = baseRateB * pitchFactorB;

  // Calculate durations
  const durA = bufferA ? bufferA.duration / rateA : trackA.durationSeconds;
  const durB = bufferB ? bufferB.duration / rateB + trackBOffsetSeconds : trackB.durationSeconds;

  let totalDuration = Math.max(durA, durB);

  if (mashupDurationMode === 'TWO_MIN') {
    totalDuration = Math.min(totalDuration, 120);
  } else if (mashupDurationMode === 'ONE_MIN') {
    totalDuration = Math.min(totalDuration, 60);
  }

  onProgress?.(50, 'Configuring Web Audio EQ filters & stem gain nodes...');

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

  const startB = Math.max(0, trackBOffsetSeconds);
  const playDurB = Math.max(0, totalDuration - startB);

  if (bufferB && playDurB > 0) {
    const srcB = offlineCtx.createBufferSource();
    srcB.buffer = bufferB;
    srcB.playbackRate.setValueAtTime(rateB, 0);
    srcB.connect(hpFilterB);
    srcB.start(startB, 0, playDurB);
  } else if (playDurB > 0) {
    // Synthetic Vocal Lead fallback
    generateSyntheticVocalLead(offlineCtx, hpFilterB, trackB, targetBpm, startB, playDurB);
  }

  onProgress?.(75, 'Rendering mashup audio buffer via Web Audio DSP...');

  const renderedBuffer = await offlineCtx.startRendering();

  onProgress?.(90, 'Encoding 16-bit PCM WAV File...');

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

  onProgress?.(100, 'Studio Mashup Rendered Successfully!');

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
