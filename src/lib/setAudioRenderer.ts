import { Track, TransitionAnalysis } from '../types';

/**
 * Converts Camelot Key to fundamental frequency (Hz) for harmonic synth fallback
 */
function camelotToFrequency(keyNumber: number, isMinor: boolean): number {
  const baseFreqs: Record<number, number> = {
    1: 103.83,
    2: 77.78,
    3: 116.54,
    4: 87.31,
    5: 130.81,
    6: 98.0,
    7: 146.83,
    8: 110.0,
    9: 82.41,
    10: 123.47,
    11: 92.5,
    12: 138.59,
  };

  const base = baseFreqs[keyNumber] || 110.0;
  return isMinor ? base : base * 1.25;
}

/**
 * Encodes an AudioBuffer into a downloadable WAV Blob (16-bit PCM)
 */
export function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const numSamples = buffer.length;
  const bytesPerSample = 2; // 16-bit
  const blockAlign = numOfChan * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;

  const arrayBuffer = new ArrayBuffer(totalSize);
  const out = new DataView(arrayBuffer);

  let pos = 0;

  function writeString(str: string) {
    for (let i = 0; i < str.length; i++) {
      out.setUint8(pos++, str.charCodeAt(i));
    }
  }

  // RIFF chunk descriptor
  writeString('RIFF');
  out.setUint32(pos, totalSize - 8, true);
  pos += 4;
  writeString('WAVE');

  // fmt sub-chunk
  writeString('fmt ');
  out.setUint32(pos, 16, true);
  pos += 4; // SubChunk1Size (16 for PCM)
  out.setUint16(pos, 1, true);
  pos += 2; // AudioFormat (1 for PCM)
  out.setUint16(pos, numOfChan, true);
  pos += 2; // NumChannels
  out.setUint32(pos, sampleRate, true);
  pos += 4; // SampleRate
  out.setUint32(pos, byteRate, true);
  pos += 4; // ByteRate
  out.setUint16(pos, blockAlign, true);
  pos += 2; // BlockAlign
  out.setUint16(pos, 16, true);
  pos += 2; // BitsPerSample

  // data sub-chunk
  writeString('data');
  out.setUint32(pos, dataSize, true);
  pos += 4;

  // Write PCM audio data
  const channels: Float32Array[] = [];
  for (let c = 0; c < numOfChan; c++) {
    channels.push(buffer.getChannelData(c));
  }

  for (let i = 0; i < numSamples; i++) {
    for (let c = 0; c < numOfChan; c++) {
      let sample = Math.max(-1, Math.min(1, channels[c][i]));
      sample = sample < 0 ? sample * 32768 : sample * 32767;
      out.setInt16(pos, sample, true);
      pos += 2;
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

/**
 * Ensures track audioBuffer is loaded/decoded if a fileObject exists
 */
export async function ensureTrackAudioBuffer(
  track: Track,
  onStatus?: (msg: string) => void
): Promise<AudioBuffer | null> {
  if (track.audioBuffer) return track.audioBuffer;

  if (track.fileObject) {
    onStatus?.(`Decoding uploaded audio: "${track.fileName || track.title}"...`);
    try {
      const arrayBuffer = await track.fileObject.arrayBuffer();
      const audioCtx = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      track.audioBuffer = decodedBuffer;
      return decodedBuffer;
    } catch (err) {
      console.warn(`Failed to decode file audio for "${track.title}":`, err);
    }
  }

  return null;
}

export type MixMode = 'FULL_TRACKS' | 'SHORT_EDIT' | 'MINI_TEASER';

/**
 * Generates an Equal-Power Fade Out Curve (Cosine: 1.0 -> 0.0)
 */
function createEqualPowerFadeOutCurve(steps = 256): Float32Array {
  const curve = new Float32Array(steps);
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    curve[i] = Math.cos((t * Math.PI) / 2);
  }
  return curve;
}

/**
 * Generates an Equal-Power Fade In Curve (Sine: 0.0 -> 1.0)
 */
function createEqualPowerFadeInCurve(steps = 256): Float32Array {
  const curve = new Float32Array(steps);
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    curve[i] = Math.sin((t * Math.PI) / 2);
  }
  return curve;
}

/**
 * Renders a full continuous DJ set mix using Web Audio OfflineAudioContext.
 * Performs beat-matched phase alignment, equal-power crossfading, and clean sub-bass crossover swaps.
 */
export async function renderContinuousSetAudio(
  tracks: Track[],
  transitions: TransitionAnalysis[],
  onProgress?: (percent: number, status: string) => void,
  mixMode: MixMode = 'FULL_TRACKS'
): Promise<{ blob: Blob; url: string; durationSeconds: number }> {
  if (tracks.length === 0) {
    throw new Error('No tracks to render in playlist');
  }

  onProgress?.(2, 'Decoding uploaded audio files & preparing Beat-Sync DSP Mixer...');

  // Step 1: Decode all uploaded track audio buffers if needed
  const decodedBuffers: (AudioBuffer | null)[] = [];
  for (let i = 0; i < tracks.length; i++) {
    const track = tracks[i];
    onProgress?.(
      2 + Math.floor((i / tracks.length) * 15),
      `Preparing Track ${i + 1}/${tracks.length}: "${track.title}"`
    );
    const buffer = await ensureTrackAudioBuffer(track, (msg) => {
      onProgress?.(2 + Math.floor((i / tracks.length) * 15), msg);
    });
    decodedBuffers.push(buffer);
  }

  onProgress?.(18, 'Calculating beat-grid alignments & sub-bass swap schedules...');

  // Step 2: Calculate track durations, phrase overlaps, and grid-aligned start times
  const trackDurations: number[] = [];
  const overlaps: number[] = [];
  const targetMixBpms: number[] = [];

  for (let i = 0; i < tracks.length; i++) {
    const buf = decodedBuffers[i];
    const track = tracks[i];
    let duration = buf ? buf.duration : track.durationSeconds || 300;

    if (mixMode === 'SHORT_EDIT') {
      duration = Math.min(120, duration);
    } else if (mixMode === 'MINI_TEASER') {
      duration = Math.min(35, duration);
    }

    trackDurations.push(duration);

    const bpm = track.bpm || 124;
    targetMixBpms.push(bpm);

    // Calculate phrase-aligned overlap in beats:
    // 32 beats (8 bars) for full tracks, 16 beats for short edit, 8 beats for teaser
    let phraseBeats = 32;
    if (mixMode === 'SHORT_EDIT') phraseBeats = 16;
    if (mixMode === 'MINI_TEASER') phraseBeats = 8;

    // Convert beats to exact seconds based on current track BPM
    const beatSec = 60 / bpm;
    let overlapSec = phraseBeats * beatSec;

    // Safety constraint: overlap shouldn't exceed 25% of track duration
    if (overlapSec > duration * 0.25) {
      overlapSec = Math.floor((duration * 0.25) / beatSec) * beatSec;
    }

    overlaps.push(i < tracks.length - 1 ? overlapSec : 0);
  }

  // Calculate grid-snapped timeline start times
  const startTimes: number[] = [0];
  for (let i = 1; i < tracks.length; i++) {
    const prevStart = startTimes[i - 1];
    const prevDur = trackDurations[i - 1];
    const prevOverlap = overlaps[i - 1];

    // Align start time exactly on a beat boundary of the previous track
    const prevBpm = targetMixBpms[i - 1];
    const prevBeatSec = 60 / prevBpm;

    const rawStart = prevStart + prevDur - prevOverlap;
    const snappedStart = Math.round(rawStart / prevBeatSec) * prevBeatSec;

    startTimes.push(snappedStart);
  }

  const totalDurationSeconds =
    startTimes[tracks.length - 1] + trackDurations[tracks.length - 1];

  const sampleRate = 44100;
  const totalSamples = Math.ceil(totalDurationSeconds * sampleRate);

  const offlineCtx = new OfflineAudioContext(2, totalSamples, sampleRate);

  // Master Gain & Brickwall Peak Limiter
  const masterGain = offlineCtx.createGain();
  masterGain.gain.setValueAtTime(0.90, 0);

  const compressor = offlineCtx.createDynamicsCompressor();
  compressor.threshold.setValueAtTime(-1.5, 0);
  compressor.knee.setValueAtTime(6, 0);
  compressor.ratio.setValueAtTime(4, 0);
  compressor.attack.setValueAtTime(0.003, 0);
  compressor.release.setValueAtTime(0.1, 0);

  masterGain.connect(compressor);
  compressor.connect(offlineCtx.destination);

  const fadeInCurve = createEqualPowerFadeInCurve();
  const fadeOutCurve = createEqualPowerFadeOutCurve();

  // Step 3: Process each track and schedule audio nodes
  for (let i = 0; i < tracks.length; i++) {
    const track = tracks[i];
    const audioBuf = decodedBuffers[i];
    const startTime = startTimes[i];
    const playDuration = trackDurations[i];
    const overlapIn = i > 0 ? overlaps[i - 1] : 0;
    const overlapOut = overlaps[i];
    const endTime = startTime + playDuration;

    onProgress?.(
      20 + Math.floor((i / tracks.length) * 55),
      `Beat-Syncing Track ${i + 1}/${tracks.length}: "${track.title}" (${track.key.code}, ${track.bpm} BPM)...`
    );

    const trackGain = offlineCtx.createGain();

    // Equal-Power Volume Envelope Scheduling for Seamless Crossfades
    if (i === 0) {
      trackGain.gain.setValueAtTime(1.0, startTime);
    } else if (overlapIn > 0) {
      // Smooth Equal-Power Fade-In over the overlap window
      trackGain.gain.setValueCurveAtTime(fadeInCurve, startTime, overlapIn);
    }

    const fadeOutStart = endTime - overlapOut;
    if (i < tracks.length - 1 && overlapOut > 0) {
      // Smooth Equal-Power Fade-Out over the next track's overlap window
      trackGain.gain.setValueCurveAtTime(fadeOutCurve, fadeOutStart, overlapOut);
    } else {
      // Final track end fade out (last 2.5 seconds)
      const finalFadeStart = Math.max(startTime, endTime - 2.5);
      trackGain.gain.setValueAtTime(1.0, finalFadeStart);
      trackGain.gain.linearRampToValueAtTime(0.0001, endTime);
    }

    // Automated Sub-Bass Crossover Filter (Highpass 20Hz <-> 250Hz)
    // Prevents bass mud / phase cancellation during beat-mixed transitions
    const hpFilter = offlineCtx.createBiquadFilter();
    hpFilter.type = 'highpass';

    if (i > 0 && overlapIn > 0) {
      // Incoming Track: Keep sub-bass cut (250Hz) during initial intro blend,
      // then drop to 20Hz at the midpoint of the crossfade to bring in the new sub-bass!
      const swapPoint = startTime + overlapIn * 0.5;
      const swapDuration = overlapIn * 0.3;

      hpFilter.frequency.setValueAtTime(250, startTime);
      hpFilter.frequency.setValueAtTime(250, swapPoint);
      hpFilter.frequency.exponentialRampToValueAtTime(20, swapPoint + swapDuration);
    } else {
      hpFilter.frequency.setValueAtTime(20, startTime);
    }

    // Outgoing Track Sub-Bass Cut:
    if (i < tracks.length - 1 && overlapOut > 0) {
      const swapPoint = fadeOutStart + overlapOut * 0.5;
      const swapDuration = overlapOut * 0.3;

      hpFilter.frequency.setValueAtTime(20, fadeOutStart);
      hpFilter.frequency.setValueAtTime(20, swapPoint);
      hpFilter.frequency.exponentialRampToValueAtTime(250, swapPoint + swapDuration);
    }

    hpFilter.connect(trackGain);
    trackGain.connect(masterGain);

    if (audioBuf) {
      // Real uploaded audio track!
      const src = offlineCtx.createBufferSource();
      src.buffer = audioBuf;

      // Precise Beat-Sync Tempo Matching
      // Align incoming track playback rate to match previous track tempo during transition
      if (i > 0) {
        const prevBpm = targetMixBpms[i - 1];
        const currBpm = track.bpm || 124;

        if (prevBpm && currBpm) {
          const bpmRatio = prevBpm / currBpm;
          // Match tempo during the crossfade transition
          src.playbackRate.setValueAtTime(bpmRatio, startTime);

          // Gently ramp back to native BPM over 16 beats after the transition completes
          const beatSec = 60 / currBpm;
          const rampDuration = 16 * beatSec;
          const rampStart = startTime + overlapIn;
          const rampEnd = Math.min(endTime - overlapOut, rampStart + rampDuration);

          if (rampEnd > rampStart) {
            src.playbackRate.setValueAtTime(bpmRatio, rampStart);
            src.playbackRate.linearRampToValueAtTime(1.0, rampEnd);
          }
        }
      }

      src.connect(hpFilter);
      src.start(startTime, 0, playDuration);
    } else {
      // Synthetic Studio Sound Fallback for manual tracks without audio files
      generateSyntheticTrackAudio(
        offlineCtx,
        hpFilter,
        track,
        startTime,
        playDuration,
        sampleRate
      );
    }
  }

  onProgress?.(80, 'Rendering continuous beat-mixed set audio via Web Audio DSP...');

  const renderedBuffer = await offlineCtx.startRendering();

  onProgress?.(92, 'Encoding master 16-bit PCM WAV File...');

  const wavBlob = audioBufferToWav(renderedBuffer);
  const audioUrl = URL.createObjectURL(wavBlob);

  onProgress?.(100, 'Seamless DJ Beat Mix Rendered Successfully!');

  return {
    blob: wavBlob,
    url: audioUrl,
    durationSeconds: totalDurationSeconds,
  };
}

/**
 * Generates rhythmic electronic elements (Kick, Sub-Bass, Hi-Hats, Melodic Pad) for synthetic tracks
 */
function generateSyntheticTrackAudio(
  ctx: OfflineAudioContext,
  outputGain: AudioNode,
  track: Track,
  startTime: number,
  duration: number,
  sampleRate: number
) {
  const bpm = track.bpm || 124;
  const beatInterval = 60 / bpm;
  const totalBeats = Math.floor(duration / beatInterval);

  const rootFreq = camelotToFrequency(track.key?.number || 8, track.key?.letter === 'A');

  // 1. Four-on-the-floor Kick Drum
  for (let b = 0; b < totalBeats; b++) {
    const beatTime = startTime + b * beatInterval;

    const kickOsc = ctx.createOscillator();
    const kickGain = ctx.createGain();

    kickOsc.type = 'sine';
    kickOsc.frequency.setValueAtTime(rootFreq * 1.5, beatTime);
    kickOsc.frequency.exponentialRampToValueAtTime(38, beatTime + 0.08);

    kickGain.gain.setValueAtTime(1.0, beatTime);
    kickGain.gain.exponentialRampToValueAtTime(0.001, beatTime + 0.12);

    kickOsc.connect(kickGain);
    kickGain.connect(outputGain);

    kickOsc.start(beatTime);
    kickOsc.stop(beatTime + 0.15);

    // 2. Off-beat Hi-Hat
    const hatTime = beatTime + beatInterval * 0.5;
    const hatBuffer = createNoiseBuffer(ctx, 0.05, sampleRate);
    const hatSrc = ctx.createBufferSource();
    hatSrc.buffer = hatBuffer;

    const hatFilter = ctx.createBiquadFilter();
    hatFilter.type = 'highpass';
    hatFilter.frequency.setValueAtTime(7000, hatTime);

    const hatGain = ctx.createGain();
    hatGain.gain.setValueAtTime(0.25, hatTime);
    hatGain.gain.exponentialRampToValueAtTime(0.001, hatTime + 0.04);

    hatSrc.connect(hatFilter);
    hatFilter.connect(hatGain);
    hatGain.connect(outputGain);

    hatSrc.start(hatTime);
    hatSrc.stop(hatTime + 0.05);
  }

  // 3. Sub-Bass Synth Line
  const bassOsc = ctx.createOscillator();
  const bassGain = ctx.createGain();
  const bassFilter = ctx.createBiquadFilter();

  bassOsc.type = 'sawtooth';
  bassOsc.frequency.setValueAtTime(rootFreq, startTime);

  bassFilter.type = 'lowpass';
  bassFilter.frequency.setValueAtTime(220 + (track.des || 5) * 40, startTime);

  const bassVol = 0.2 + (track.spectral?.subBassWeight || 5) * 0.03;
  bassGain.gain.setValueAtTime(bassVol, startTime);

  bassOsc.connect(bassFilter);
  bassFilter.connect(bassGain);
  bassGain.connect(outputGain);

  bassOsc.start(startTime);
  bassOsc.stop(startTime + duration);

  // 4. Atmospheric Lead Synth
  const chordOsc = ctx.createOscillator();
  const chordGain = ctx.createGain();

  chordOsc.type = 'triangle';
  chordOsc.frequency.setValueAtTime(rootFreq * 1.5, startTime);

  chordGain.gain.setValueAtTime(0.08, startTime);

  chordOsc.connect(chordGain);
  chordGain.connect(outputGain);

  chordOsc.start(startTime);
  chordOsc.stop(startTime + duration);
}

/**
 * Creates white noise buffer for percussion synthesis
 */
function createNoiseBuffer(
  ctx: OfflineAudioContext,
  duration: number,
  sampleRate: number
): AudioBuffer {
  const bufferSize = Math.ceil(sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

