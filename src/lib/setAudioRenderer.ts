import { Track, TransitionAnalysis } from '../types';
import { detectFirstDownbeat } from './audioAnalyzer';

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
  const downbeatOnsets: number[] = [];

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

    const onset = buffer ? detectFirstDownbeat(buffer) : 0;
    downbeatOnsets.push(onset);
  }

  onProgress?.(18, 'Calculating beat-grid alignments & sub-bass swap schedules...');

  // Target set BPM calculation (defaults to first track BPM or average BPM across set)
  const masterBpm = tracks[0]?.bpm || 124;
  const beatSec = 60 / masterBpm;

  const introCueBuffers: number[] = [];
  const outroCueBuffers: number[] = [];
  const rawDurations: number[] = [];
  const playbackRates: number[] = [];

  for (let i = 0; i < tracks.length; i++) {
    const buf = decodedBuffers[i];
    const track = tracks[i];
    const nativeBpm = track.bpm || masterBpm;

    // Calculate playback rate so all tracks in transition blend at masterBpm
    const rate = masterBpm / nativeBpm;
    playbackRates.push(rate);

    let rawDur = buf ? buf.duration : track.durationSeconds || 300;

    if (mixMode === 'SHORT_EDIT') {
      rawDur = Math.min(120, rawDur);
    } else if (mixMode === 'MINI_TEASER') {
      rawDur = Math.min(35, rawDur);
    }

    rawDurations.push(rawDur);

    // Get clean Intro Cue position in buffer seconds (mix-in downbeat)
    let introCue = track.cuePoints?.find((c) => c.type === 'INTRO')?.positionSeconds;
    if (introCue === undefined || introCue < 0 || introCue >= rawDur) {
      introCue = buf ? detectFirstDownbeat(buf) : 0;
    }
    introCueBuffers.push(introCue);

    // Get clean Outro Cue position in buffer seconds (mix-out point)
    let outroCue = track.cuePoints?.find((c) => c.type === 'OUTRO')?.positionSeconds;
    const phraseBeats = mixMode === 'SHORT_EDIT' ? 16 : mixMode === 'MINI_TEASER' ? 8 : 32;
    const phraseSecNative = phraseBeats * (60 / nativeBpm);

    if (outroCue === undefined || outroCue <= introCue || outroCue >= rawDur) {
      outroCue = Math.max(introCue + phraseSecNative, rawDur - phraseSecNative);
    }
    outroCueBuffers.push(outroCue);
  }

  // Calculate 100% Phase-Aligned & Downbeat-Synced Timeline Start Times:
  // Track i+1 Intro Cue aligns millisecond-for-millisecond with Track i Outro Cue!
  const startTimes: number[] = [0];

  for (let i = 0; i < tracks.length - 1; i++) {
    const phraseBeats = mixMode === 'SHORT_EDIT' ? 16 : mixMode === 'MINI_TEASER' ? 8 : 32;
    const transitionTimelineSec = phraseBeats * beatSec;

    // Outro Cue time of Track i on the master timeline
    const trackI_OutroTimeline = startTimes[i] + (outroCueBuffers[i] / playbackRates[i]);

    // Track i+1 start time on master timeline so its Intro Cue downbeat lands at trackI_OutroTimeline:
    const trackNext_StartTimeline = Math.max(0, trackI_OutroTimeline - (introCueBuffers[i + 1] / playbackRates[i + 1]));

    startTimes.push(trackNext_StartTimeline);
  }

  // Calculate total master mix timeline duration
  const lastIdx = tracks.length - 1;
  const phraseBeatsLast = mixMode === 'SHORT_EDIT' ? 16 : mixMode === 'MINI_TEASER' ? 8 : 32;
  const lastOutroTimeline = startTimes[lastIdx] + (outroCueBuffers[lastIdx] / playbackRates[lastIdx]);
  const totalDurationSeconds = lastOutroTimeline + (phraseBeatsLast * beatSec);

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

  // Step 3: Schedule audio nodes for beat-matched playback
  for (let i = 0; i < tracks.length; i++) {
    const track = tracks[i];
    const audioBuf = decodedBuffers[i];
    const startTime = startTimes[i];
    const rate = playbackRates[i];
    const introCueBuf = introCueBuffers[i];
    const outroCueBuf = outroCueBuffers[i];

    const phraseBeats = mixMode === 'SHORT_EDIT' ? 16 : mixMode === 'MINI_TEASER' ? 8 : 32;
    const transitionTimelineSec = phraseBeats * beatSec;

    // Clean mix-out point on master timeline
    const mixOutTimeline = startTime + (outroCueBuf / rate);

    onProgress?.(
      20 + Math.floor((i / tracks.length) * 55),
      `Beat-Syncing Track ${i + 1}/${tracks.length}: "${track.title}" (${track.key.code}, ${track.bpm} BPM @ ${masterBpm} BPM)...`
    );

    const trackGain = offlineCtx.createGain();

    // Equal-Power Volume Envelope Scheduling
    if (i === 0) {
      trackGain.gain.setValueAtTime(1.0, startTime);
    } else {
      // Smooth Equal-Power Fade-In over transition
      trackGain.gain.setValueCurveAtTime(fadeInCurve, startTime, transitionTimelineSec);
    }

    if (i < tracks.length - 1) {
      // Smooth Equal-Power Fade-Out over transition
      trackGain.gain.setValueCurveAtTime(fadeOutCurve, mixOutTimeline, transitionTimelineSec);
    } else {
      // Final track end fade out
      const finalFadeStart = Math.max(startTime, mixOutTimeline);
      trackGain.gain.setValueAtTime(1.0, finalFadeStart);
      trackGain.gain.linearRampToValueAtTime(0.0001, finalFadeStart + transitionTimelineSec);
    }

    // Automated Sub-Bass Crossover Filter (Highpass 20Hz <-> 250Hz)
    // Prevents bass mud / phase cancellation during beat-mixed transitions
    const hpFilter = offlineCtx.createBiquadFilter();
    hpFilter.type = 'highpass';

    if (i > 0) {
      // Incoming Track: Keep sub-bass cut (250Hz) during initial intro blend,
      // then drop to 20Hz at the midpoint of the crossfade to bring in the new sub-bass!
      const swapPoint = startTime + transitionTimelineSec * 0.4;
      const swapDuration = transitionTimelineSec * 0.4;

      hpFilter.frequency.setValueAtTime(250, startTime);
      hpFilter.frequency.setValueAtTime(250, swapPoint);
      hpFilter.frequency.exponentialRampToValueAtTime(20, swapPoint + swapDuration);
    } else {
      hpFilter.frequency.setValueAtTime(20, startTime);
    }

    // Outgoing Track Sub-Bass Cut:
    if (i < tracks.length - 1) {
      const swapPoint = mixOutTimeline + transitionTimelineSec * 0.4;
      const swapDuration = transitionTimelineSec * 0.4;

      hpFilter.frequency.setValueAtTime(20, mixOutTimeline);
      hpFilter.frequency.setValueAtTime(20, swapPoint);
      hpFilter.frequency.exponentialRampToValueAtTime(250, swapPoint + swapDuration);
    }

    hpFilter.connect(trackGain);
    trackGain.connect(masterGain);

    const playEndTimeOnTimeline = (i < tracks.length - 1)
      ? (mixOutTimeline + transitionTimelineSec)
      : (startTime + (rawDurations[i] / rate));

    const playTimelineDuration = Math.max(0.1, playEndTimeOnTimeline - startTime);
    const playBufferDuration = playTimelineDuration * rate;

    if (audioBuf) {
      // Real uploaded audio track!
      const src = offlineCtx.createBufferSource();
      src.buffer = audioBuf;

      // Lock playback rate to masterBpm for 100% beat-matched phase alignment
      src.playbackRate.setValueAtTime(rate, startTime);

      src.connect(hpFilter);
      src.start(startTime, 0, Math.min(audioBuf.duration, playBufferDuration));
    } else {
      // Synthetic Studio Sound Fallback for manual tracks without audio files
      generateSyntheticTrackAudio(
        offlineCtx,
        hpFilter,
        track,
        startTime,
        playTimelineDuration,
        sampleRate,
        masterBpm
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
  sampleRate: number,
  masterBpm: number = 124
) {
  const bpm = masterBpm;
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

