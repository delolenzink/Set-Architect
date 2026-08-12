import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Sliders,
  RotateCcw,
  Volume2,
  X,
  Zap,
  Disc,
} from 'lucide-react';
import { Track } from '../types';

interface DualDeckPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  deckATrack: Track | null;
  deckBTrack: Track | null;
}

export const DualDeckPlayer: React.FC<DualDeckPlayerProps> = ({
  isOpen,
  onClose,
  deckATrack,
  deckBTrack,
}) => {
  const [isPlayingA, setIsPlayingA] = useState(false);
  const [isPlayingB, setIsPlayingB] = useState(false);
  const [crossfader, setCrossfader] = useState(0.5); // 0.0 = 100% Deck A, 1.0 = 100% Deck B

  // Deck A EQ
  const [lowA, setLowA] = useState(0); // -12dB to +6dB
  const [midA, setMidA] = useState(0);
  const [highA, setHighA] = useState(0);

  // Deck B EQ
  const [lowB, setLowB] = useState(0);
  const [midB, setMidB] = useState(0);
  const [highB, setHighB] = useState(0);

  // Web Audio Context & Oscillator Synth fallback
  const audioCtxRef = useRef<AudioContext | null>(null);
  const deckANodeRef = useRef<OscillatorNode | AudioBufferSourceNode | null>(null);
  const deckBNodeRef = useRef<OscillatorNode | AudioBufferSourceNode | null>(null);
  const gainARef = useRef<GainNode | null>(null);
  const gainBRef = useRef<GainNode | null>(null);

  useEffect(() => {
    if (isOpen) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtxRef.current = new AudioContextClass();

      const ctx = audioCtxRef.current;
      gainARef.current = ctx.createGain();
      gainBRef.current = ctx.createGain();

      gainARef.current.connect(ctx.destination);
      gainBRef.current.connect(ctx.destination);
    }

    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, [isOpen]);

  // Update Crossfader Gains
  useEffect(() => {
    if (gainARef.current && gainBRef.current) {
      gainARef.current.gain.value = Math.cos(crossfader * 0.5 * Math.PI);
      gainBRef.current.gain.value = Math.sin(crossfader * 0.5 * Math.PI);
    }
  }, [crossfader]);

  const togglePlayA = () => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    if (isPlayingA) {
      deckANodeRef.current?.stop();
      setIsPlayingA(false);
    } else {
      // Create synth beat oscillator for auditioning
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = (deckATrack?.bpm || 120) * 0.8;
      if (gainARef.current) osc.connect(gainARef.current);
      osc.start();
      deckANodeRef.current = osc;
      setIsPlayingA(true);
    }
  };

  const togglePlayB = () => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    if (isPlayingB) {
      deckBNodeRef.current?.stop();
      setIsPlayingB(false);
    } else {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = (deckBTrack?.bpm || 123) * 0.9;
      if (gainBRef.current) osc.connect(gainBRef.current);
      osc.start();
      deckBNodeRef.current = osc;
      setIsPlayingB(true);
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
              <h3 className="text-lg font-bold text-slate-100 font-mono">
                DUAL DECK TRANSITION AUDITION CONSOLE
              </h3>
              <p className="text-xs text-slate-400">
                Real-time Web Audio crossfader & 3-band EQ transition tester
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Console Layout */}
        <div className="py-6 space-y-6 overflow-y-auto">
          {/* Dual Decks Side-by-Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* DECK A */}
            <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-800">
                  DECK A
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {deckATrack ? `${deckATrack.bpm} BPM | ${deckATrack.key.code}` : 'No Track'}
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-100 line-clamp-1">
                  {deckATrack?.title || 'Select Track for Deck A'}
                </h4>
                <p className="text-xs text-slate-400 line-clamp-1">
                  {deckATrack?.artist || '—'}
                </p>
              </div>

              {/* Waveform Bar */}
              <div className="h-12 bg-slate-900 rounded-lg p-1.5 flex items-end gap-[2px] overflow-hidden">
                {(deckATrack?.waveformPeaks || Array.from({ length: 40 }, () => 0.4)).map((p, i) => (
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
                    <span>LOW</span>
                    <input
                      type="range"
                      min="-12"
                      max="6"
                      value={lowA}
                      onChange={(e) => setLowA(parseInt(e.target.value, 10))}
                      className="w-full accent-cyan-400 bg-slate-800 h-1 rounded-lg"
                    />
                  </div>
                  <div>
                    <span>MID</span>
                    <input
                      type="range"
                      min="-12"
                      max="6"
                      value={midA}
                      onChange={(e) => setMidA(parseInt(e.target.value, 10))}
                      className="w-full accent-cyan-400 bg-slate-800 h-1 rounded-lg"
                    />
                  </div>
                  <div>
                    <span>HIGH</span>
                    <input
                      type="range"
                      min="-12"
                      max="6"
                      value={highA}
                      onChange={(e) => setHighA(parseInt(e.target.value, 10))}
                      className="w-full accent-cyan-400 bg-slate-800 h-1 rounded-lg"
                    />
                  </div>
                </div>

                <button
                  onClick={togglePlayA}
                  className={`w-full py-2 rounded-lg font-mono text-xs font-bold transition flex items-center justify-center gap-2 ${
                    isPlayingA
                      ? 'bg-rose-950 text-rose-400 border border-rose-800'
                      : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
                  }`}
                >
                  {isPlayingA ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                  <span>{isPlayingA ? 'PAUSE DECK A' : 'CUE DECK A'}</span>
                </button>
              </div>
            </div>

            {/* DECK B */}
            <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-violet-950 text-violet-400 border border-violet-800">
                  DECK B
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {deckBTrack ? `${deckBTrack.bpm} BPM | ${deckBTrack.key.code}` : 'No Track'}
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-100 line-clamp-1">
                  {deckBTrack?.title || 'Select Track for Deck B'}
                </h4>
                <p className="text-xs text-slate-400 line-clamp-1">
                  {deckBTrack?.artist || '—'}
                </p>
              </div>

              {/* Waveform Bar */}
              <div className="h-12 bg-slate-900 rounded-lg p-1.5 flex items-end gap-[2px] overflow-hidden">
                {(deckBTrack?.waveformPeaks || Array.from({ length: 40 }, () => 0.4)).map((p, i) => (
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
                    <span>LOW</span>
                    <input
                      type="range"
                      min="-12"
                      max="6"
                      value={lowB}
                      onChange={(e) => setLowB(parseInt(e.target.value, 10))}
                      className="w-full accent-violet-400 bg-slate-800 h-1 rounded-lg"
                    />
                  </div>
                  <div>
                    <span>MID</span>
                    <input
                      type="range"
                      min="-12"
                      max="6"
                      value={midB}
                      onChange={(e) => setMidB(parseInt(e.target.value, 10))}
                      className="w-full accent-violet-400 bg-slate-800 h-1 rounded-lg"
                    />
                  </div>
                  <div>
                    <span>HIGH</span>
                    <input
                      type="range"
                      min="-12"
                      max="6"
                      value={highB}
                      onChange={(e) => setHighB(parseInt(e.target.value, 10))}
                      className="w-full accent-violet-400 bg-slate-800 h-1 rounded-lg"
                    />
                  </div>
                </div>

                <button
                  onClick={togglePlayB}
                  className={`w-full py-2 rounded-lg font-mono text-xs font-bold transition flex items-center justify-center gap-2 ${
                    isPlayingB
                      ? 'bg-rose-950 text-rose-400 border border-rose-800'
                      : 'bg-violet-600 hover:bg-violet-500 text-white'
                  }`}
                >
                  {isPlayingB ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                  <span>{isPlayingB ? 'PAUSE DECK B' : 'CUE DECK B'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Master Crossfader Bar */}
          <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono font-bold">
              <span className="text-cyan-400">100% DECK A</span>
              <span className="text-slate-200">MASTER CROSSFADER</span>
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

            <div className="flex justify-center pt-2">
              <button
                onClick={() => {
                  setCrossfader(0.0);
                  let curr = 0;
                  const interval = setInterval(() => {
                    curr += 0.05;
                    if (curr >= 1.0) {
                      setCrossfader(1.0);
                      clearInterval(interval);
                    } else {
                      setCrossfader(curr);
                    }
                  }, 200);
                }}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-semibold transition flex items-center gap-2"
              >
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <span>Simulate Smooth Auto-Crossfade (8 Bars)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
