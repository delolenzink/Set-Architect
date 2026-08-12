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
async function ensureTrackAudioBuffer(
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
 * Renders a full continuous DJ set mix using Web Audio OfflineAudioContext
 * Blends uploaded audio tracks seamlessly with crossfades and EQ management.
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

  onProgress?.(2, 'Decoding uploaded audio files & preparing DSP Mixer...');

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

  onProgress?.(18, 'Calculating harmonic alignment & crossfade timelines...');

  // Step 2: Determine durations & transition overlap times
  const trackDurations: number[] = [];
  const overlaps: number[] = [];

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

    // Calculate crossfade overlap: 16 seconds or ~10-15% of track duration
    const overlap = i < tracks.length - 1 ? Math.min(16, Math.max(6, duration * 0.12)) : 0;
    overlaps.push(overlap);
  }

  // Calculate start times for each track
  const startTimes: number[] = [0];
  for (let i = 1; i < tracks.length; i++) {
    const prevStart = startTimes[i - 1];
    const prevDur = trackDurations[i - 1];
    const prevOverlap = overlaps[i - 1];
    startTimes.push(prevStart + prevDur - prevOverlap);
  }

  const totalDurationSeconds =
    startTimes[tracks.length - 1] + trackDurations[tracks.length - 1];

  const sampleRate = 44100;
  const totalSamples = Math.ceil(totalDurationSeconds * sampleRate);

  const offlineCtx = new OfflineAudioContext(2, totalSamples, sampleRate);

  // Master Gain & Limiter
  const masterGain = offlineCtx.createGain();
  masterGain.gain.setValueAtTime(0.88, 0);

  const compressor = offlineCtx.createDynamicsCompressor();
  compressor.threshold.setValueAtTime(-1.2, 0);
  compressor.knee.setValueAtTime(8, 0);
  compressor.ratio.setValueAtTime(6, 0);
  compressor.attack.setValueAtTime(0.003, 0);
  compressor.release.setValueAtTime(0.12, 0);

  masterGain.connect(compressor);
  compressor.connect(offlineCtx.destination);

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
      `Mixing Track ${i + 1}/${tracks.length}: "${track.title}" (${track.key.code}, ${track.bpm} BPM)...`
    );

    const trackGain = offlineCtx.createGain();

    // Volume Envelope for seamless crossfading
    // 1. Fade-in during overlap from previous track
    if (i === 0) {
      trackGain.gain.setValueAtTime(1.0, startTime);
    } else {
      trackGain.gain.setValueAtTime(0.0001, startTime);
      trackGain.gain.exponentialRampToValueAtTime(1.0, startTime + overlapIn);
    }

    // 2. Main playback body and fade-out into next track
    const fadeOutStart = endTime - overlapOut;
    if (i < tracks.length - 1 && overlapOut > 0) {
      trackGain.gain.setValueAtTime(1.0, fadeOutStart);
      trackGain.gain.exponentialRampToValueAtTime(0.0001, endTime);
    } else {
      // Final track fade out at end
      trackGain.gain.setValueAtTime(1.0, Math.max(startTime, endTime - 3));
      trackGain.gain.linearRampToValueAtTime(0.0001, endTime);
    }

    // Highpass Filter for sub-bass swap during fade in
    const filter = offlineCtx.createBiquadFilter();
    filter.type = 'highpass';

    if (i > 0 && overlapIn > 0) {
      // Start with low frequencies cut, then bring sub-bass in smoothly
      filter.frequency.setValueAtTime(250, startTime);
      filter.frequency.exponentialRampToValueAtTime(20, startTime + overlapIn * 0.8);
    } else {
      filter.frequency.setValueAtTime(20, startTime);
    }

    filter.connect(trackGain);
    trackGain.connect(masterGain);

    if (audioBuf) {
      // Real uploaded audio track!
      const src = offlineCtx.createBufferSource();
      src.buffer = audioBuf;

      // Pitch-bend / tempo adjustment to align with set BPM if applicable
      if (i > 0) {
        const prevTrack = tracks[i - 1];
        if (prevTrack.bpm && track.bpm) {
          const bpmRatio = prevTrack.bpm / track.bpm;
          if (Math.abs(bpmRatio - 1) <= 0.08) {
            src.playbackRate.setValueAtTime(bpmRatio, startTime);
          }
        }
      }

      src.connect(filter);
      src.start(startTime, 0, playDuration);
    } else {
      // Fallback synthetic studio sound for demo metadata tracks without raw audio files
      generateSyntheticTrackAudio(
        offlineCtx,
        filter,
        track,
        startTime,
        playDuration,
        sampleRate
      );
    }
  }

  onProgress?.(80, 'Rendering master continuous set audio buffer via Web Audio DSP...');

  const renderedBuffer = await offlineCtx.startRendering();

  onProgress?.(92, 'Encoding master 16-bit PCM WAV File...');

  const wavBlob = audioBufferToWav(renderedBuffer);
  const audioUrl = URL.createObjectURL(wavBlob);

  onProgress?.(100, 'Set Mix Rendered Successfully!');

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
