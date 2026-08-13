import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Upload,
  Sliders,
  X,
  Zap,
  Disc,
  Loader2,
  Music,
  RefreshCw,
  Link,
  Check,
  ArrowLeft,
} from 'lucide-react';
import { Track } from '../types';
import { analyzeAudioFile, detectFirstDownbeat } from '../lib/audioAnalyzer';
import { ensureTrackAudioBuffer } from '../lib/setAudioRenderer';

interface DualDeckPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  deckATrack: Track | null;
  deckBTrack: Track | null;
  allTracks?: Track[];
  onSelectDeckATrack?: (track: Track) => void;
  onSelectDeckBTrack?: (track: Track) => void;
  onAddTracks?: (tracks: Track[], crateName?: string) => void;
}

export const DualDeckPlayer: React.FC<DualDeckPlayerProps> = ({
  isOpen,
  onClose,
  deckATrack: initialDeckATrack,
  deckBTrack: initialDeckBTrack,
  allTracks = [],
  onSelectDeckATrack,
  onSelectDeckBTrack,
  onAddTracks,
}) => {
  const [deckA, setDeckA] = useState<Track | null>(initialDeckATrack);
  const [deckB, setDeckB] = useState<Track | null>(initialDeckBTrack);

  const [isLoadingA, setIsLoadingA] = useState(false);
  const [isLoadingB, setIsLoadingB] = useState(false);

  const [isPlayingA, setIsPlayingA] = useState(false);
  const [isPlayingB, setIsPlayingB] = useState(false);
  const [isBeatSynced, setIsBeatSynced] = useState(true);

  const [crossfader, setCrossfader] = useState(0.5); // 0.0 = 100% Deck A, 1.0 = 100% Deck B

  // Deck A 3-Band EQ (-12dB to +6dB)
  const [lowA, setLowA] = useState(0);
  const [midA, setMidA] = useState(0);
  const [highA, setHighA] = useState(0);

  // Deck B 3-Band EQ (-12dB to +6dB)
  const [lowB, setLowB] = useState(0);
  const [midB, setMidB] = useState(0);
  const [highB, setHighB] = useState(0);

  // File Input Refs
  const fileInputARef = useRef<HTMLInputElement>(null);
  const fileInputBRef = useRef<HTMLInputElement>(null);

  // Web Audio Context & Nodes
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Deck A Audio Nodes
  const sourceARef = useRef<AudioBufferSourceNode | OscillatorNode | null>(null);
  const lowFilterARef = useRef<BiquadFilterNode | null>(null);
  const midFilterARef = useRef<BiquadFilterNode | null>(null);
  const highFilterARef = useRef<BiquadFilterNode | null>(null);
  const gainARef = useRef<GainNode | null>(null);

  // Deck B Audio Nodes
  const sourceBRef = useRef<AudioBufferSourceNode | OscillatorNode | null>(null);
  const lowFilterBRef = useRef<BiquadFilterNode | null>(null);
  const midFilterBRef = useRef<BiquadFilterNode | null>(null);
  const highFilterBRef = useRef<BiquadFilterNode | null>(null);
  const gainBRef = useRef<GainNode | null>(null);

  // Sync initial props
  useEffect(() => {
    setDeckA(initialDeckATrack);
  }, [initialDeckATrack]);

  useEffect(() => {
    setDeckB(initialDeckBTrack);
  }, [initialDeckBTrack]);

  // Initialize Web Audio Context
  useEffect(() => {
    if (isOpen) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      // Master Gain for Deck A
      const gainA = ctx.createGain();
      const lowFilterA = ctx.createBiquadFilter();
      lowFilterA.type = 'lowshelf';
      lowFilterA.frequency.setValueAtTime(250, ctx.currentTime);

      const midFilterA = ctx.createBiquadFilter();
      midFilterA.type = 'peaking';
      midFilterA.frequency.setValueAtTime(1000, ctx.currentTime);
      midFilterA.Q.setValueAtTime(1.0, ctx.currentTime);

      const highFilterA = ctx.createBiquadFilter();
      highFilterA.type = 'highshelf';
      highFilterA.frequency.setValueAtTime(4000, ctx.currentTime);

      lowFilterA.connect(midFilterA);
      midFilterA.connect(highFilterA);
      highFilterA.connect(gainA);
      gainA.connect(ctx.destination);

      lowFilterARef.current = lowFilterA;
      midFilterARef.current = midFilterA;
      highFilterARef.current = highFilterA;
      gainARef.current = gainA;

      // Master Gain for Deck B
      const gainB = ctx.createGain();
      const lowFilterB = ctx.createBiquadFilter();
      lowFilterB.type = 'lowshelf';
      lowFilterB.frequency.setValueAtTime(250, ctx.currentTime);

      const midFilterB = ctx.createBiquadFilter();
      midFilterB.type = 'peaking';
      midFilterB.frequency.setValueAtTime(1000, ctx.currentTime);
      midFilterB.Q.setValueAtTime(1.0, ctx.currentTime);

      const highFilterB = ctx.createBiquadFilter();
      highFilterB.type = 'highshelf';
      highFilterB.frequency.setValueAtTime(4000, ctx.currentTime);

      lowFilterB.connect(midFilterB);
      midFilterB.connect(highFilterB);
      highFilterB.connect(gainB);
      gainB.connect(ctx.destination);

      lowFilterBRef.current = lowFilterB;
      midFilterBRef.current = midFilterB;
      highFilterBRef.current = highFilterB;
      gainBRef.current = gainB;

      // Apply initial crossfader
      gainA.gain.value = Math.cos(crossfader * 0.5 * Math.PI);
      gainB.gain.value = Math.sin(crossfader * 0.5 * Math.PI);
    }

    return () => {
      stopDeckA();
      stopDeckB();
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
    };
  }, [isOpen]);

  // Update Crossfader
  useEffect(() => {
    if (gainARef.current && gainBRef.current) {
      gainARef.current.gain.value = Math.cos(crossfader * 0.5 * Math.PI);
      gainBRef.current.gain.value = Math.sin(crossfader * 0.5 * Math.PI);
    }
  }, [crossfader]);

  // Update EQ Deck A
  useEffect(() => {
    if (lowFilterARef.current) lowFilterARef.current.gain.value = lowA;
    if (midFilterARef.current) midFilterARef.current.gain.value = midA;
    if (highFilterARef.current) highFilterARef.current.gain.value = highA;
  }, [lowA, midA, highA]);

  // Update EQ Deck B
  useEffect(() => {
    if (lowFilterBRef.current) lowFilterBRef.current.gain.value = lowB;
    if (midFilterBRef.current) midFilterBRef.current.gain.value = midB;
    if (highFilterBRef.current) highFilterBRef.current.gain.value = highB;
  }, [lowB, midB, highB]);

  const stopDeckA = () => {
    if (sourceARef.current) {
      try {
        sourceARef.current.stop();
      } catch {
        // Ignore
      }
      sourceARef.current = null;
    }
    setIsPlayingA(false);
  };

  const stopDeckB = () => {
    if (sourceBRef.current) {
      try {
        sourceBRef.current.stop();
      } catch {
        // Ignore
      }
      sourceBRef.current = null;
    }
    setIsPlayingB(false);
  };

  // Target Master Audition BPM
  const masterAuditionBpm = deckA?.bpm || deckB?.bpm || 124;

  // Play / Pause Deck A
  const togglePlayA = async () => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') await ctx.resume();

    if (isPlayingA) {
      stopDeckA();
      return;
    }

    if (!deckA) return;

    setIsLoadingA(true);
    const audioBuffer = await ensureTrackAudioBuffer(deckA);
    setIsLoadingA(false);

    if (audioBuffer && lowFilterARef.current) {
      const srcNode = ctx.createBufferSource();
      srcNode.buffer = audioBuffer;
      srcNode.loop = true;

      // Lock playback rate if Beat Sync is active
      if (isBeatSynced) {
        const rateA = masterAuditionBpm / (deckA.bpm || masterAuditionBpm);
        srcNode.playbackRate.value = rateA;
      }

      srcNode.connect(lowFilterARef.current);
      srcNode.start(0);
      sourceARef.current = srcNode;
      setIsPlayingA(true);
    } else if (lowFilterARef.current) {
      // Fallback Synth
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = (deckA.bpm || 120) * 0.8;
      osc.connect(lowFilterARef.current);
      osc.start(0);
      sourceARef.current = osc;
      setIsPlayingA(true);
    }
  };

  // Play / Pause Deck B with Beat Sync & Downbeat Transient Alignment
  const togglePlayB = async () => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') await ctx.resume();

    if (isPlayingB) {
      stopDeckB();
      return;
    }

    if (!deckB) return;

    setIsLoadingB(true);
    const audioBuffer = await ensureTrackAudioBuffer(deckB);
    setIsLoadingB(false);

    if (audioBuffer && lowFilterBRef.current) {
      const srcNode = ctx.createBufferSource();
      srcNode.buffer = audioBuffer;
      srcNode.loop = true;

      // Calculate tempo playback rate
      const rateB = isBeatSynced ? masterAuditionBpm / (deckB.bpm || masterAuditionBpm) : 1.0;
      srcNode.playbackRate.value = rateB;

      // Detect downbeat transient onset in Deck B
      const onsetB = detectFirstDownbeat(audioBuffer);
      const startOffsetSec = Math.max(0, onsetB);

      srcNode.connect(lowFilterBRef.current);
      srcNode.start(0, startOffsetSec);
      sourceBRef.current = srcNode;
      setIsPlayingB(true);
    } else if (lowFilterBRef.current) {
      // Fallback Synth
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = (deckB.bpm || 123) * 0.9;
      osc.connect(lowFilterBRef.current);
      osc.start(0);
      sourceBRef.current = osc;
      setIsPlayingB(true);
    }
  };

  // Simulate smooth beat-matched crossfade transition
  const handleSimulateCrossfade = async () => {
    if (!deckA || !deckB) return;

    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') await ctx.resume();

    // Start Deck A if not playing
    if (!isPlayingA) {
      await togglePlayA();
    }

    // Start Deck B in sync if not playing
    if (!isPlayingB) {
      await togglePlayB();
    }

    // Reset crossfader to Deck A 100%
    setCrossfader(0.0);

    // Smoothly animate crossfader from 0.0 to 1.0 over 8 bars
    let curr = 0;
    const totalSteps = 40;
    const intervalMs = 200; // 8 seconds total transition blend
    const stepIncrement = 1.0 / totalSteps;

    const timer = setInterval(() => {
      curr += stepIncrement;
      if (curr >= 1.0) {
        setCrossfader(1.0);
        clearInterval(timer);
      } else {
        setCrossfader(curr);
      }
    }, intervalMs);
  };


  // Upload track directly to Deck A
  const handleUploadDeckA = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoadingA(true);
    stopDeckA();

    try {
      const analysis = await analyzeAudioFile(file);
      const newTrack: Track = {
        id: `deck-a-upload-${Date.now()}`,
        title: analysis.title || file.name.replace(/\.[^/.]+$/, ''),
        artist: 'Uploaded Track',
        genre: 'Electronic',
        bpm: analysis.bpm || 124,
        key: analysis.key || { code: '8A', number: 8, letter: 'A', musicalKey: 'A minor' },
        des: analysis.des || 6.0,
        durationSeconds: analysis.durationSeconds || 300,
        spectral: analysis.spectral || {
          subBassWeight: 6.0,
          midRangeDensity: 6.0,
          highFrequencyRatio: 6.0,
          dominantFrequencyHz: 80,
          percussiveDensity: 6.0,
          rmsDb: -14.0,
        },
        cuePoints: analysis.cuePoints || [],
        waveformPeaks: analysis.waveformPeaks || [],
        fileName: file.name,
        fileObject: file,
        audioBuffer: analysis.audioBuffer,
      };

      setDeckA(newTrack);
      onSelectDeckATrack?.(newTrack);
      onAddTracks?.([newTrack], 'Dual Deck Audition Crate');
    } catch (err) {
      console.error('Failed to upload track to Deck A:', err);
    } finally {
      setIsLoadingA(false);
    }
  };

  // Upload track directly to Deck B
  const handleUploadDeckB = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoadingB(true);
    stopDeckB();

    try {
      const analysis = await analyzeAudioFile(file);
      const newTrack: Track = {
        id: `deck-b-upload-${Date.now()}`,
        title: analysis.title || file.name.replace(/\.[^/.]+$/, ''),
        artist: 'Uploaded Track',
        genre: 'Electronic',
        bpm: analysis.bpm || 124,
        key: analysis.key || { code: '8A', number: 8, letter: 'A', musicalKey: 'A minor' },
        des: analysis.des || 6.0,
        durationSeconds: analysis.durationSeconds || 300,
        spectral: analysis.spectral || {
          subBassWeight: 6.0,
          midRangeDensity: 6.0,
          highFrequencyRatio: 6.0,
          dominantFrequencyHz: 80,
          percussiveDensity: 6.0,
          rmsDb: -14.0,
        },
        cuePoints: analysis.cuePoints || [],
        waveformPeaks: analysis.waveformPeaks || [],
        fileName: file.name,
        fileObject: file,
        audioBuffer: analysis.audioBuffer,
      };

      setDeckB(newTrack);
      onSelectDeckBTrack?.(newTrack);
      onAddTracks?.([newTrack], 'Dual Deck Audition Crate');
    } catch (err) {
      console.error('Failed to upload track to Deck B:', err);
    } finally {
      setIsLoadingB(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full p-6 shadow-2xl relative overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20">
              <Disc className="w-5 h-5 animate-spin" style={{ animationDuration: '4s' }} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100 font-mono tracking-wide">
                DUAL DECK TRANSITION AUDITION CONSOLE
              </h3>
              <p className="text-xs text-slate-400">
                Upload audio files directly or pick from setlist to test 3-band EQ & crossfader transition
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 font-mono text-xs font-bold transition border border-slate-700 shadow-md"
              title="Return to Main Set Studio"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>← Back to Studio</span>
            </button>

            <button
              onClick={() => setIsBeatSynced(!isBeatSynced)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 border ${
                isBeatSynced
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
              title="Toggle Beat Sync & Downbeat Phase Lock between Deck A and Deck B"
            >
              <Link className="w-3.5 h-3.5" />
              <span>BEAT SYNC: {isBeatSynced ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Hidden File Inputs */}
        <input
          type="file"
          ref={fileInputARef}
          onChange={handleUploadDeckA}
          accept="audio/*,.wav,.mp3,.flac,.m4a,.aac"
          className="hidden"
        />
        <input
          type="file"
          ref={fileInputBRef}
          onChange={handleUploadDeckB}
          accept="audio/*,.wav,.mp3,.flac,.m4a,.aac"
          className="hidden"
        />

        {/* Console Layout */}
        <div className="py-6 space-y-6 overflow-y-auto">
          {/* Dual Decks Side-by-Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* DECK A */}
            <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4 relative">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-800">
                  DECK A
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {deckA ? `${deckA.bpm} BPM | Key ${deckA.key.code}` : 'No Track Loaded'}
                </span>
              </div>

              {/* Select or Upload Control */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <select
                    value={deckA?.id || ''}
                    onChange={(e) => {
                      const found = allTracks.find((t) => t.id === e.target.value);
                      if (found) {
                        stopDeckA();
                        setDeckA(found);
                        onSelectDeckATrack?.(found);
                      }
                    }}
                    className="flex-1 bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 font-mono focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="">-- Choose Track for Deck A --</option>
                    {allTracks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title} ({t.bpm} BPM | {t.key.code})
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => fileInputARef.current?.click()}
                    disabled={isLoadingA}
                    className="px-3 py-2 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-400 border border-cyan-800 text-xs font-mono font-bold transition flex items-center gap-1.5 shrink-0"
                  >
                    {isLoadingA ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>UPLOAD</span>
                  </button>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-100 line-clamp-1">
                    {deckA?.title || 'No Track Selected'}
                  </h4>
                  <p className="text-xs text-slate-400 line-clamp-1">
                    {deckA?.artist || 'Click Upload or Select from Dropdown'}
                  </p>
                </div>
              </div>

              {/* Waveform Bar */}
              <div className="h-12 bg-slate-900 rounded-lg p-1.5 flex items-end gap-[2px] overflow-hidden">
                {(deckA?.waveformPeaks || Array.from({ length: 40 }, () => 0.4)).map((p, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-cyan-500/80 rounded-t-sm"
                    style={{ height: `${p * 100}%` }}
                  ></div>
                ))}
              </div>

              {/* EQ & Transport Controls */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono text-slate-400">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>LOW</span>
                      <span className="text-cyan-400 font-bold">{lowA > 0 ? `+${lowA}` : lowA}dB</span>
                    </div>
                    <input
                      type="range"
                      min="-12"
                      max="6"
                      value={lowA}
                      onChange={(e) => setLowA(parseInt(e.target.value, 10))}
                      className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>MID</span>
                      <span className="text-cyan-400 font-bold">{midA > 0 ? `+${midA}` : midA}dB</span>
                    </div>
                    <input
                      type="range"
                      min="-12"
                      max="6"
                      value={midA}
                      onChange={(e) => setMidA(parseInt(e.target.value, 10))}
                      className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>HIGH</span>
                      <span className="text-cyan-400 font-bold">{highA > 0 ? `+${highA}` : highA}dB</span>
                    </div>
                    <input
                      type="range"
                      min="-12"
                      max="6"
                      value={highA}
                      onChange={(e) => setHighA(parseInt(e.target.value, 10))}
                      className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>

                <button
                  onClick={togglePlayA}
                  disabled={!deckA || isLoadingA}
                  className={`w-full py-2.5 rounded-lg font-mono text-xs font-bold transition flex items-center justify-center gap-2 ${
                    isPlayingA
                      ? 'bg-rose-950 text-rose-400 border border-rose-800 shadow-lg shadow-rose-950/50'
                      : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20'
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  {isLoadingA ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isPlayingA ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 fill-current" />
                  )}
                  <span>
                    {isLoadingA
                      ? 'DECODING AUDIO...'
                      : isPlayingA
                      ? 'PAUSE DECK A'
                      : 'CUE DECK A'}
                  </span>
                </button>
              </div>
            </div>

            {/* DECK B */}
            <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4 relative">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-violet-950 text-violet-400 border border-violet-800">
                  DECK B
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {deckB ? `${deckB.bpm} BPM | Key ${deckB.key.code}` : 'No Track Loaded'}
                </span>
              </div>

              {/* Select or Upload Control */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <select
                    value={deckB?.id || ''}
                    onChange={(e) => {
                      const found = allTracks.find((t) => t.id === e.target.value);
                      if (found) {
                        stopDeckB();
                        setDeckB(found);
                        onSelectDeckBTrack?.(found);
                      }
                    }}
                    className="flex-1 bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 font-mono focus:border-violet-500 focus:outline-none"
                  >
                    <option value="">-- Choose Track for Deck B --</option>
                    {allTracks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title} ({t.bpm} BPM | {t.key.code})
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => fileInputBRef.current?.click()}
                    disabled={isLoadingB}
                    className="px-3 py-2 rounded-lg bg-violet-950 hover:bg-violet-900 text-violet-400 border border-violet-800 text-xs font-mono font-bold transition flex items-center gap-1.5 shrink-0"
                  >
                    {isLoadingB ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>UPLOAD</span>
                  </button>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-100 line-clamp-1">
                    {deckB?.title || 'No Track Selected'}
                  </h4>
                  <p className="text-xs text-slate-400 line-clamp-1">
                    {deckB?.artist || 'Click Upload or Select from Dropdown'}
                  </p>
                </div>
              </div>

              {/* Waveform Bar */}
              <div className="h-12 bg-slate-900 rounded-lg p-1.5 flex items-end gap-[2px] overflow-hidden">
                {(deckB?.waveformPeaks || Array.from({ length: 40 }, () => 0.4)).map((p, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-violet-500/80 rounded-t-sm"
                    style={{ height: `${p * 100}%` }}
                  ></div>
                ))}
              </div>

              {/* EQ & Transport Controls */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono text-slate-400">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>LOW</span>
                      <span className="text-violet-400 font-bold">{lowB > 0 ? `+${lowB}` : lowB}dB</span>
                    </div>
                    <input
                      type="range"
                      min="-12"
                      max="6"
                      value={lowB}
                      onChange={(e) => setLowB(parseInt(e.target.value, 10))}
                      className="w-full accent-violet-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>MID</span>
                      <span className="text-violet-400 font-bold">{midB > 0 ? `+${midB}` : midB}dB</span>
                    </div>
                    <input
                      type="range"
                      min="-12"
                      max="6"
                      value={midB}
                      onChange={(e) => setMidB(parseInt(e.target.value, 10))}
                      className="w-full accent-violet-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>HIGH</span>
                      <span className="text-violet-400 font-bold">{highB > 0 ? `+${highB}` : highB}dB</span>
                    </div>
                    <input
                      type="range"
                      min="-12"
                      max="6"
                      value={highB}
                      onChange={(e) => setHighB(parseInt(e.target.value, 10))}
                      className="w-full accent-violet-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>

                <button
                  onClick={togglePlayB}
                  disabled={!deckB || isLoadingB}
                  className={`w-full py-2.5 rounded-lg font-mono text-xs font-bold transition flex items-center justify-center gap-2 ${
                    isPlayingB
                      ? 'bg-rose-950 text-rose-400 border border-rose-800 shadow-lg shadow-rose-950/50'
                      : 'bg-violet-600 hover:bg-violet-500 text-white shadow-md shadow-violet-600/20'
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  {isLoadingB ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isPlayingB ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 fill-current" />
                  )}
                  <span>
                    {isLoadingB
                      ? 'DECODING AUDIO...'
                      : isPlayingB
                      ? 'PAUSE DECK B'
                      : 'CUE DECK B'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Master Crossfader Bar */}
          <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono font-bold">
              <span className="text-cyan-400">100% DECK A</span>
              <span className="text-slate-200 uppercase tracking-wider">MASTER CROSSFADER</span>
              <span className="text-violet-400">100% DECK B</span>
            </div>

            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={crossfader}
              onChange={(e) => setCrossfader(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 bg-slate-800 h-3 rounded-lg cursor-pointer"
            />

            <div className="flex justify-center pt-2 gap-3">
              <button
                onClick={handleSimulateCrossfade}
                className="px-4 py-2 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/50 text-xs font-mono font-semibold transition flex items-center gap-2 active:scale-95 shadow-md shadow-cyan-950/30"
              >
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <span>Simulate 8s Beat-Synced Smooth Mix into Next Track</span>
              </button>

              <button
                onClick={() => {
                  setLowA(0);
                  setMidA(0);
                  setHighA(0);
                  setLowB(0);
                  setMidB(0);
                  setHighB(0);
                  setCrossfader(0.5);
                }}
                className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 text-xs font-mono transition flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset EQs</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
