import { Track, TransitionAnalysis } from '../types';

/**
 * Converts Camelot Key to fundamental frequency (Hz) for harmonic synth generation
 */
function camelotToFrequency(keyNumber: number, isMinor: boolean): number {
  // Mapping Camelot numbers to root note frequencies in Octave 2/3 (Bass range)
  // 1A/1B = Ab/G# (103.8 Hz)
  // 2A/2B = Eb/D# (77.78 Hz)
  // 3A/3B = Bb/A# (116.54 Hz)
  // 4A/4B = F (87.31 Hz)
  // 5A/5B = C (130.81 Hz)
  // 6A/6B = G (98.00 Hz)
  // 7A/7B = D (146.83 Hz)
  // 8A/8B = A (110.00 Hz)
  // 9A/9B = E (82.41 Hz)
  // 10A/10B = B (123.47 Hz)
  // 11A/11B = F# (92.50 Hz)
  // 12A/12B = C# (138.59 Hz)
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
  return isMinor ? base : base * 1.25; // Major 3rd tilt
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

  function writeUint32(val: number) {
    out.setUint32(pos, val, true);
    pos += 4;
  }

  function writeUint16(val: number) {
    out.setUint16(val, val, true); // bugfix parameter order
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
 * Renders a full continuous DJ set mix using Web Audio OfflineAudioContext
 */
export async function renderContinuousSetAudio(
  tracks: Track[],
  transitions: TransitionAnalysis[],
  onProgress?: (percent: number, status: string) => void
): Promise<{ blob: Blob; url: string; durationSeconds: number }> {
  if (tracks.length === 0) {
    throw new Error('No tracks to render in playlist');
  }

  onProgress?.(5, 'Initializing Web Audio DSP Mixer...');

  // Configuration for preview mix generation
  // Each track plays for trackDuration, with transitionOverlap overlapping crossfade
  const trackDuration = 20; // 20 seconds per track in continuous mix
  const overlapDuration = 6; // 6 seconds harmonic crossfade transition

  const totalDurationSeconds =
    tracks.length * trackDuration - (tracks.length - 1) * overlapDuration;

  const sampleRate = 44100;
  const totalSamples = Math.ceil(totalDurationSeconds * sampleRate);

  const offlineCtx = new OfflineAudioContext(2, totalSamples, sampleRate);

  // Master Gain & Limiter
  const masterGain = offlineCtx.createGain();
  masterGain.gain.setValueAtTime(0.85, 0);

  const compressor = offlineCtx.createDynamicsCompressor();
  compressor.threshold.setValueAtTime(-1.0, 0);
  compressor.knee.setValueAtTime(10, 0);
  compressor.ratio.setValueAtTime(8, 0);
  compressor.attack.setValueAtTime(0.003, 0);
  compressor.release.setValueAtTime(0.1, 0);

  masterGain.connect(compressor);
  compressor.connect(offlineCtx.destination);

  // Process each track and schedule nodes
  for (let i = 0; i < tracks.length; i++) {
    const track = tracks[i];
    const startTime = i * (trackDuration - overlapDuration);
    const endTime = startTime + trackDuration;

    onProgress?.(
      10 + Math.floor((i / tracks.length) * 60),
      `Synthesizing & Aligning Track ${i + 1}/${tracks.length}: "${track.title}" (${track.key.code}, ${track.bpm} BPM)...`
    );

    const trackGain = offlineCtx.createGain();

    // Volume Envelope for seamless crossfading
    // 1. Fade-in during overlap (except first track)
    if (i === 0) {
      trackGain.gain.setValueAtTime(1.0, startTime);
    } else {
      trackGain.gain.setValueAtTime(0.001, startTime);
      trackGain.gain.exponentialRampToValueAtTime(1.0, startTime + overlapDuration);
    }

    // 2. Main playback body
    const fadeOutStart = endTime - overlapDuration;
    if (i < tracks.length - 1) {
      trackGain.gain.setValueAtTime(1.0, fadeOutStart);
      trackGain.gain.exponentialRampToValueAtTime(0.001, endTime);
    } else {
      // Last track fades out at the very end
      trackGain.gain.setValueAtTime(1.0, endTime - 2);
      trackGain.gain.linearRampToValueAtTime(0.0, endTime);
    }

    trackGain.connect(masterGain);

    // If track has decoded PCM buffer from local file upload, use it!
    if (track.audioBuffer) {
      const src = offlineCtx.createBufferSource();
      src.buffer = track.audioBuffer;

      // Calculate playback rate for BPM matching to previous track if needed
      if (i > 0) {
        const prevTrack = tracks[i - 1];
        const bpmRatio = prevTrack.bpm / track.bpm;
        if (Math.abs(bpmRatio - 1) < 0.1) {
          src.playbackRate.setValueAtTime(bpmRatio, startTime);
        }
      }

      src.connect(trackGain);
      src.start(startTime, 0, trackDuration);
    } else {
      // Synthetic Studio Generation (Rich Electronic Beat + Harmonic Bassline + Chords)
      generateSyntheticTrackAudio(
        offlineCtx,
        trackGain,
        track,
        startTime,
        trackDuration,
        sampleRate
      );
    }
  }

  onProgress?.(75, 'Rendering Master Harmonic Audio Buffer via DSP DSP...');

  // Start offline audio rendering
  const renderedBuffer = await offlineCtx.startRendering();

  onProgress?.(90, 'Encoding Master 16-bit PCM WAV File...');

  const wavBlob = audioBufferToWav(renderedBuffer);
  const audioUrl = URL.createObjectURL(wavBlob);

  onProgress?.(100, 'Set Transitions Rendered Successfully!');

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
  outputGain: GainNode,
  track: Track,
  startTime: number,
  duration: number,
  sampleRate: number
) {
  const bpm = track.bpm || 124;
  const beatInterval = 60 / bpm;
  const totalBeats = Math.floor(duration / beatInterval);

  const rootFreq = camelotToFrequency(track.key.number, track.key.letter === 'A');

  // 1. Four-on-the-floor Kick Drum
  for (let b = 0; b < totalBeats; b++) {
    const beatTime = startTime + b * beatInterval;

    // Kick Oscillator
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

    // 2. Off-beat Hi-Hat (on beats 0.5, 1.5, 2.5, etc.)
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
  bassFilter.frequency.setValueAtTime(220 + track.des * 40, startTime);

  const bassVol = 0.2 + (track.spectral?.subBassWeight || 5) * 0.03;
  bassGain.gain.setValueAtTime(bassVol, startTime);

  bassOsc.connect(bassFilter);
  bassFilter.connect(bassGain);
  bassGain.connect(outputGain);

  bassOsc.start(startTime);
  bassOsc.stop(startTime + duration);

  // 4. Atmospheric Harmonic Chords / Lead Synth
  const chordOsc = ctx.createOscillator();
  const chordGain = ctx.createGain();

  chordOsc.type = 'triangle';
  // Perfect 5th harmonic above root
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
