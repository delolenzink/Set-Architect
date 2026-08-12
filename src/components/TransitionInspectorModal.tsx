import React from 'react';
import {
  X,
  Sliders,
  AlertTriangle,
  CheckCircle,
  Zap,
  Activity,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Track, TransitionAnalysis } from '../types';

interface TransitionInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  transitionIndex: number | null;
  tracks: Track[];
  transitions: TransitionAnalysis[];
  onAuditionTransition: (fromTrack: Track, toTrack: Track) => void;
  onOpenCreateTransitionsModal?: () => void;
}

export const TransitionInspectorModal: React.FC<TransitionInspectorModalProps> = ({
  isOpen,
  onClose,
  transitionIndex,
  tracks,
  transitions,
  onAuditionTransition,
  onOpenCreateTransitionsModal,
}) => {
  if (!isOpen || transitionIndex === null || transitionIndex >= transitions.length) return null;

  const transition = transitions[transitionIndex];
  const fromTrack = tracks[transitionIndex];
  const toTrack = tracks[transitionIndex + 1];

  if (!fromTrack || !toTrack) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600 text-white shadow-lg shadow-cyan-500/20">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100 font-mono flex items-center gap-2">
                TRANSITION INSPECTOR #{transitionIndex + 1}
              </h3>
              <p className="text-xs text-slate-400">
                Spectral frequency overlap AI & mix cue recommendation engine
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-5 space-y-6">
          {/* Side-by-Side Track Matchup Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
            {/* From Track A */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 relative space-y-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-800">
                OUTRO MIX-OUT :: TRACK #{transitionIndex + 1}
              </span>
              <h4 className="text-sm font-bold text-slate-100 line-clamp-1">{fromTrack.title}</h4>
              <p className="text-xs text-slate-400">{fromTrack.artist}</p>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 font-mono text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block">BPM</span>
                  <span className="text-amber-400 font-bold">{fromTrack.bpm}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">KEY</span>
                  <span className="text-cyan-400 font-bold">{fromTrack.key.code}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">DES ENERGY</span>
                  <span className="text-violet-400 font-bold">{fromTrack.des}</span>
                </div>
              </div>
            </div>

            {/* Connecting Arrow */}
            <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-slate-800 border border-slate-700 items-center justify-center text-cyan-400 shadow-md">
              <ArrowRight className="w-4 h-4" />
            </div>

            {/* To Track B */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 relative space-y-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-violet-950 text-violet-400 border border-violet-800">
                INTRO MIX-IN :: TRACK #{transitionIndex + 2}
              </span>
              <h4 className="text-sm font-bold text-slate-100 line-clamp-1">{toTrack.title}</h4>
              <p className="text-xs text-slate-400">{toTrack.artist}</p>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 font-mono text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block">BPM</span>
                  <span className="text-amber-400 font-bold">{toTrack.bpm}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">KEY</span>
                  <span className="text-cyan-400 font-bold">{toTrack.key.code}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">DES ENERGY</span>
                  <span className="text-violet-400 font-bold">{toTrack.des}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Transition Analysis & Pitch Bend Stats */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-mono text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-cyan-400" />
                TRANSITION METRICS
              </span>

              <span
                className={`px-2.5 py-1 rounded text-xs font-mono font-bold ${
                  transition.type === 'EXACT_HARMONIC'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : transition.type === 'ENERGY_BOOST'
                    ? 'bg-amber-950 text-amber-400 border border-amber-800'
                    : 'bg-violet-950 text-violet-400 border border-violet-800'
                }`}
              >
                {transition.type.replace('_', ' ')}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">PITCH BEND %</span>
                <span className="text-sm font-bold text-amber-400">
                  {transition.pitchBendPercent > 0 ? `+${transition.pitchBendPercent}` : transition.pitchBendPercent}%
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">BPM DELTA</span>
                <span className="text-sm font-bold text-slate-200">{transition.bpmDelta} BPM</span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">SUB-BASS RISK</span>
                <span
                  className={`text-sm font-bold ${
                    transition.subBassClashRisk === 'HIGH' ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {transition.subBassClashRisk}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">ENERGY SHIFT</span>
                <span className="text-sm font-bold text-violet-400">
                  {transition.energyDelta > 0 ? `+${transition.energyDelta}` : transition.energyDelta} DES
                </span>
              </div>
            </div>
          </div>

          {/* Spectral Frequency Overlap Comparison */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-4">
            <span className="text-xs font-bold font-mono text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-violet-400" />
              SPECTRAL & FREQUENCY OVERLAP PROFILE
            </span>

            {/* Sub-Bass (<100Hz) */}
            <div className="space-y-1 text-xs font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Sub-Bass Weight (&lt; 100 Hz)</span>
                <span>
                  Track A: {fromTrack.spectral.subBassWeight}/10 vs Track B: {toTrack.spectral.subBassWeight}/10
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 h-2.5 bg-slate-900 rounded-full p-[1px]">
                <div
                  className="h-full bg-cyan-500 rounded-full"
                  style={{ width: `${(fromTrack.spectral.subBassWeight / 10) * 100}%` }}
                ></div>
                <div
                  className="h-full bg-violet-500 rounded-full"
                  style={{ width: `${(toTrack.spectral.subBassWeight / 10) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Mid-Range (300Hz - 3kHz) */}
            <div className="space-y-1 text-xs font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Mid-Range Synth Clutter (300Hz - 3kHz)</span>
                <span>
                  Track A: {fromTrack.spectral.midRangeDensity}/10 vs Track B: {toTrack.spectral.midRangeDensity}/10
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 h-2.5 bg-slate-900 rounded-full p-[1px]">
                <div
                  className="h-full bg-cyan-500 rounded-full"
                  style={{ width: `${(fromTrack.spectral.midRangeDensity / 10) * 100}%` }}
                ></div>
                <div
                  className="h-full bg-violet-500 rounded-full"
                  style={{ width: `${(toTrack.spectral.midRangeDensity / 10) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Suggested DJ Mix Technique Note */}
          <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-800/60 space-y-2">
            <span className="text-xs font-bold font-mono text-cyan-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              EXECUTIVE DJ TECHNIQUE ADVISORY
            </span>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {transition.techniqueNote}
            </p>
            <p className="text-[11px] font-mono text-slate-400 pt-1">
              Suggested Cue Alignment: {transition.suggestedMixZone}
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onAuditionTransition(fromTrack, toTrack)}
              className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white rounded-xl font-mono text-xs font-bold transition shadow-lg shadow-cyan-500/10"
            >
              <Zap className="w-4 h-4" />
              <span>Audition Transition</span>
            </button>

            {onOpenCreateTransitionsModal && (
              <button
                onClick={() => {
                  onClose();
                  onOpenCreateTransitionsModal();
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-[#ff4e00] hover:bg-[#ff5e1a] text-black rounded-xl font-mono text-xs font-bold transition shadow-lg shadow-[#ff4e00]/20"
              >
                <Sparkles className="w-4 h-4" />
                <span>Create Perfect Mix</span>
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-mono font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
