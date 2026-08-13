import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Zap,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  TrendingUp,
  Music2,
  ListOrdered,
  Layers,
  Activity,
  Bot,
  Gauge,
  RotateCw,
} from 'lucide-react';
import { Track, TransitionAnalysis, BlueprintType } from '../types';
import { evaluateSetCohesion, getRankedNextTracks, calculateTrackFit } from '../lib/aiMixEngine';
import { getCamelotColor } from '../lib/camelot';
import { BLUEPRINTS } from '../lib/sortingAlgorithm';

interface AIMusicMixerModalProps {
  tracks: Track[];
  transitions: TransitionAnalysis[];
  selectedBlueprint: BlueprintType;
  customCurve?: number[];
  onClose: () => void;
  onAutoOptimizeSet: () => void;
  onReorderTrack?: (fromIdx: number, toIdx: number) => void;
}

export const AIMusicMixerModal: React.FC<AIMusicMixerModalProps> = ({
  tracks,
  transitions,
  selectedBlueprint,
  customCurve,
  onClose,
  onAutoOptimizeSet,
}) => {
  const blueprint = BLUEPRINTS[selectedBlueprint];
  const targetCurve = customCurve || blueprint.targetCurve;

  // Selected Track for "Next Track Finder"
  const [activeAnchorTrackId, setActiveAnchorTrackId] = useState<string>(tracks[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'NEXT_TRACK_MATCHER' | 'TRANSITION_COACH'>('OVERVIEW');

  // Compute Cohesion Report
  const cohesionReport = evaluateSetCohesion(tracks, transitions, targetCurve);

  // Ranked Next Tracks for active anchor track
  const rankedNext = getRankedNextTracks(tracks, activeAnchorTrackId);
  const activeAnchorTrack = tracks.find((t) => t.id === activeAnchorTrackId) || tracks[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-fadeIn overflow-y-auto">
      <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl max-w-5xl w-full p-6 shadow-2xl relative flex flex-col my-auto max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-amber-400 text-black shadow-lg shadow-cyan-500/20">
              <Bot className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white tracking-wide uppercase font-mono flex items-center gap-2">
                  AI MUSIC MIXER & SET FIT ENGINE
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-400 border border-cyan-800 font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-cyan-400 animate-pulse" /> INTELLIGENCE ACTIVE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Real-time BPM analysis, harmonic key alignment, and energy trajectory optimization
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 font-mono text-xs font-bold transition border border-slate-700 shadow-md mr-1"
              title="Return to Main Set Studio"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>← Back to Studio</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between mt-4 border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('OVERVIEW')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition flex items-center gap-2 ${
                activeTab === 'OVERVIEW'
                  ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white'
              }`}
            >
              <Gauge className="w-4 h-4" />
              <span>SET FIT RADAR</span>
            </button>

            <button
              onClick={() => setActiveTab('NEXT_TRACK_MATCHER')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition flex items-center gap-2 ${
                activeTab === 'NEXT_TRACK_MATCHER'
                  ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white'
              }`}
            >
              <Bot className="w-4 h-4" />
              <span>FIND BEST NEXT TRACK</span>
            </button>

            <button
              onClick={() => setActiveTab('TRANSITION_COACH')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition flex items-center gap-2 ${
                activeTab === 'TRANSITION_COACH'
                  ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>TRANSITION COACH</span>
            </button>
          </div>

          <button
            onClick={() => {
              onAutoOptimizeSet();
              onClose();
            }}
            className="px-4 py-1.5 bg-gradient-to-r from-cyan-500 to-amber-400 hover:from-cyan-400 hover:to-amber-300 text-black text-xs font-mono font-bold rounded-lg shadow-lg shadow-cyan-500/20 transition flex items-center gap-2 uppercase"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>AI AUTO-OPTIMIZE SET</span>
          </button>
        </div>

        {/* TAB 1: OVERVIEW & SET FIT RADAR */}
        {activeTab === 'OVERVIEW' && (
          <div className="mt-5 space-y-5 animate-fadeIn">
            {/* Top Stat Banner */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Overall Score */}
              <div className="bg-slate-950 border border-cyan-500/40 rounded-xl p-4 flex flex-col items-center justify-center text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-amber-400" />
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                  OVERALL SET FIT SCORE
                </span>
                <div className="text-4xl font-extrabold font-mono text-cyan-400 my-1">
                  {cohesionReport.overallFitPercent}%
                </div>
                <span className="text-[11px] font-mono text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {cohesionReport.overallFitPercent >= 85 ? 'SEAMLESS SET FLOW' : 'OPTIMIZATION AVAILABLE'}
                </span>
              </div>

              {/* BPM Consistency */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-1">
                <div className="flex justify-between items-center text-xs font-mono text-slate-400">
                  <span>BPM ACCURACY</span>
                  <span className="text-white font-bold">{cohesionReport.bpmConsistencyScore}%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 transition-all duration-500"
                    style={{ width: `${cohesionReport.bpmConsistencyScore}%` }}
                  />
                </div>
                <p className="text-[10px] font-mono text-slate-400 pt-1">
                  Average BPM: <span className="text-cyan-400 font-bold">{cohesionReport.avgBpm} BPM</span> ({cohesionReport.minBpm} - {cohesionReport.maxBpm})
                </p>
              </div>

              {/* Harmonic Flow */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-1">
                <div className="flex justify-between items-center text-xs font-mono text-slate-400">
                  <span>HARMONIC KEY FIT</span>
                  <span className="text-white font-bold">{cohesionReport.harmonicFlowScore}%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 transition-all duration-500"
                    style={{ width: `${cohesionReport.harmonicFlowScore}%` }}
                  />
                </div>
                <p className="text-[10px] font-mono text-slate-400 pt-1">
                  {cohesionReport.smoothTransitionCount} Harmonic Matches / {cohesionReport.keyClashCount} Key Clashes
                </p>
              </div>

              {/* Energy Curve Match */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-1">
                <div className="flex justify-between items-center text-xs font-mono text-slate-400">
                  <span>BLUEPRINT ENERGY ARC</span>
                  <span className="text-white font-bold">{cohesionReport.energyTrajectoryScore}%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 transition-all duration-500"
                    style={{ width: `${cohesionReport.energyTrajectoryScore}%` }}
                  />
                </div>
                <p className="text-[10px] font-mono text-slate-400 pt-1 truncate">
                  Blueprint: <span className="text-emerald-400 font-bold">{blueprint.name}</span>
                </p>
              </div>
            </div>

            {/* AI Advisor Card */}
            <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-cyan-400" />
                <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  AI DJ ADVISOR INSIGHTS & DIAGNOSTICS
                </h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                "{cohesionReport.aiAdvisorSummary}"
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono pt-1">
                {cohesionReport.keyInsights.map((insight, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 rounded bg-slate-900/80 text-slate-300 border border-slate-800/80">
                    <Activity className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="line-clamp-1">{insight}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Current Sequence Track Flow with Individual Fit Scores */}
            <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-mono font-bold text-slate-200 uppercase flex items-center gap-2">
                  <ListOrdered className="w-4 h-4 text-cyan-400" /> CURRENT TRACK SEQUENCE — INDIVIDUAL FIT RATINGS
                </span>
                <span className="text-[10px] font-mono text-slate-500">{tracks.length} TRACKS ANALYZED</span>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {tracks.map((track, idx) => {
                  const prevTrack = idx > 0 ? tracks[idx - 1] : null;
                  const fitScore = prevTrack ? calculateTrackFit(track, prevTrack) : null;

                  return (
                    <div
                      key={track.id}
                      className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs font-mono hover:border-slate-700 transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center font-bold text-slate-400 shrink-0 text-[11px]">
                          #{idx + 1}
                        </span>
                        <div>
                          <p className="font-bold text-white line-clamp-1">{track.title}</p>
                          <p className="text-[10px] text-slate-400">{track.artist}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
                          {track.bpm} BPM
                        </span>
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-bold"
                          style={{
                            backgroundColor: `${getCamelotColor(track.key.code)}20`,
                            color: getCamelotColor(track.key.code),
                            border: `1px solid ${getCamelotColor(track.key.code)}40`,
                          }}
                        >
                          {track.key.code}
                        </span>

                        {fitScore ? (
                          <span
                            className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                              fitScore.overallScore >= 88
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : fitScore.overallScore >= 75
                                ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                                : 'bg-amber-950 text-amber-400 border border-amber-800'
                            }`}
                          >
                            {fitScore.overallScore}% FIT
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 font-bold">
                            STARTER
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: FIND BEST NEXT TRACK MATCHER */}
        {activeTab === 'NEXT_TRACK_MATCHER' && (
          <div className="mt-5 space-y-4 animate-fadeIn">
            {/* Anchor Selector */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Music2 className="w-5 h-5 text-cyan-400 shrink-0" />
                <div>
                  <span className="text-xs font-mono font-bold text-white uppercase block">
                    SELECT CURRENT ACTIVE TRACK:
                  </span>
                  <p className="text-[10px] text-slate-400">
                    Find which remaining tracks fit best immediately after this track
                  </p>
                </div>
              </div>

              <select
                value={activeAnchorTrackId}
                onChange={(e) => setActiveAnchorTrackId(e.target.value)}
                className="w-full sm:w-80 bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white outline-none focus:border-cyan-500 font-mono font-bold"
              >
                {tracks.map((t, i) => (
                  <option key={t.id} value={t.id}>
                    #{i + 1} {t.title} ({t.bpm} BPM, {t.key.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Active Anchor Summary */}
            {activeAnchorTrack && (
              <div className="p-3 rounded-xl bg-slate-900/90 border border-cyan-500/30 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded font-bold">ANCHOR</span>
                  <div>
                    <span className="font-bold text-white">{activeAnchorTrack.title}</span>
                    <span className="text-slate-400 ml-2">by {activeAnchorTrack.artist}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">{activeAnchorTrack.bpm} BPM</span>
                  <span
                    className="px-2 py-0.5 rounded font-bold"
                    style={{
                      backgroundColor: `${getCamelotColor(activeAnchorTrack.key.code)}20`,
                      color: getCamelotColor(activeAnchorTrack.key.code),
                    }}
                  >
                    {activeAnchorTrack.key.code}
                  </span>
                </div>
              </div>
            )}

            {/* Ranked Candidates */}
            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              <h5 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Bot className="w-4 h-4 text-cyan-400" /> RECOMMENDED NEXT TRACKS RANKED BY AI COMPATIBILITY:
              </h5>

              {rankedNext.map(({ track, fit }, rank) => (
                <div
                  key={track.id}
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 transition space-y-2"
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded bg-slate-800 text-cyan-400 font-bold flex items-center justify-center text-[11px]">
                        #{rank + 1}
                      </span>
                      <div>
                        <span className="font-bold text-white text-sm">{track.title}</span>
                        <span className="text-slate-400 text-xs ml-2">— {track.artist}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">{track.bpm} BPM</span>
                      <span
                        className="px-2 py-0.5 rounded font-bold"
                        style={{
                          backgroundColor: `${getCamelotColor(track.key.code)}20`,
                          color: getCamelotColor(track.key.code),
                        }}
                      >
                        {track.key.code}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          fit.overallScore >= 88
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : fit.overallScore >= 75
                            ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                            : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}
                      >
                        {fit.overallScore}% FIT
                      </span>
                    </div>
                  </div>

                  {/* Insight Bar */}
                  <div className="text-[11px] font-sans text-slate-300 bg-slate-900/80 p-2 rounded border border-slate-800 flex items-center justify-between">
                    <span>{fit.aiInsight}</span>
                    <span className="text-[10px] font-mono text-cyan-400 shrink-0 ml-2">
                      Pitch Bend: {fit.pitchBendPercent >= 0 ? '+' : ''}{fit.pitchBendPercent}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: TRANSITION COACH */}
        {activeTab === 'TRANSITION_COACH' && (
          <div className="mt-5 space-y-4 animate-fadeIn">
            <h5 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" /> STEP-BY-STEP AI TRANSITION ADVICE & CUE POINT MIX ZONES
            </h5>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {transitions.map((trans, idx) => {
                const fromTrack = tracks.find((t) => t.id === trans.fromTrackId);
                const toTrack = tracks.find((t) => t.id === trans.toTrackId);

                if (!fromTrack || !toTrack) return null;

                return (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs font-mono"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-cyan-400 font-bold">TRANSITION #{idx + 1}:</span>
                        <span className="text-white font-bold">{fromTrack.title}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-white font-bold">{toTrack.title}</span>
                      </div>

                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
                        {trans.type.replace('_', ' ')}
                      </span>
                    </div>

                    <p className="text-slate-300 font-sans text-xs pt-1">{trans.techniqueNote}</p>

                    <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] text-slate-400">
                      <span className="px-2 py-0.5 bg-slate-900 rounded border border-slate-800 text-cyan-400">
                        Suggested Zone: {trans.suggestedMixZone}
                      </span>
                      <span className="px-2 py-0.5 bg-slate-900 rounded border border-slate-800 text-amber-400">
                        Sub-Bass Clash: {trans.subBassClashRisk}
                      </span>
                      <span className="px-2 py-0.5 bg-slate-900 rounded border border-slate-800 text-emerald-400">
                        BPM Pitch Bend: {trans.pitchBendPercent}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
