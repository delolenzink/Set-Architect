import React from 'react';
import {
  ArrowDown,
  ArrowUp,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Plus,
  Unlock,
  Play,
  Sliders,
  Sparkles,
  Trash2,
  Zap,
  Volume2,
} from 'lucide-react';
import { Track, TransitionAnalysis } from '../types';
import { getCamelotColor } from '../lib/camelot';

interface TrackListProps {
  tracks: Track[];
  transitions: TransitionAnalysis[];
  onMoveTrack: (fromIndex: number, toIndex: number) => void;
  onRemoveTrack: (id: string) => void;
  onInspectTransition: (index: number) => void;
  onAuditionTrack: (track: Track) => void;
  lockedTrackIds: Set<string>;
  onToggleLock: (id: string) => void;
  onOpenAddTrackModal?: () => void;
  onOpenCreateTransitionsModal?: () => void;
}

export const TrackList: React.FC<TrackListProps> = ({
  tracks,
  transitions,
  onMoveTrack,
  onRemoveTrack,
  onInspectTransition,
  onAuditionTrack,
  lockedTrackIds,
  onToggleLock,
  onOpenAddTrackModal,
  onOpenCreateTransitionsModal,
}) => {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-2xl backdrop-blur-md">
      {/* Table Header Controls */}
      <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-[#ff4e00]/10 border border-[#ff4e00]/40 text-[#ff4e00]">
            <Zap className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-100 font-mono tracking-wider">
                AUTO-SORTED PLAYLIST SEQUENCE
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-cyan-400 border border-slate-700 font-semibold">
                {tracks.length} Tracks
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Harmonically ordered set sequence. Click transition badges to inspect EQ blend parameters.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono text-slate-400 mr-2 hidden md:inline">
            Total Duration: {Math.floor(tracks.reduce((acc, t) => acc + t.durationSeconds, 0) / 60)} mins
          </span>

          {onOpenAddTrackModal && (
            <button
              onClick={onOpenAddTrackModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold font-mono bg-cyan-600 hover:bg-cyan-500 text-black rounded-sm transition shadow-md shadow-cyan-600/20 whitespace-nowrap"
              title="Create or import new track to auto-sort set"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>CREATE TRACK</span>
            </button>
          )}

          {onOpenCreateTransitionsModal && (
            <button
              onClick={onOpenCreateTransitionsModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold font-mono bg-[#ff4e00] hover:bg-[#ff5e1a] text-black rounded-sm transition shadow-lg shadow-[#ff4e00]/25 whitespace-nowrap animate-pulse"
              title="Auto-sort tracks and render continuous set mix audio file"
            >
              <Zap className="w-3.5 h-3.5 fill-current stroke-[2.5]" />
              <span>CREATE MIX</span>
            </button>
          )}
        </div>
      </div>

      {/* Track Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/90 border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px] tracking-wider sticky top-0">
            <tr>
              <th className="py-3 px-3 w-10 text-center">#</th>
              <th className="py-3 px-3">Track Title & Artist</th>
              <th className="py-3 px-3 w-20 text-center">BPM</th>
              <th className="py-3 px-3 w-20 text-center">Key</th>
              <th className="py-3 px-3 w-28 text-center">DES Energy</th>
              <th className="py-3 px-3 w-28 text-center">Sub-Bass</th>
              <th className="py-3 px-3">Transition Flow</th>
              <th className="py-3 px-3 w-24 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/60 font-sans text-slate-200">
            {tracks.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-20 px-6 text-center text-slate-400 font-mono">
                  <div className="max-w-md mx-auto space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-[#ff4e00]/10 border border-[#ff4e00]/30 text-[#ff4e00] flex items-center justify-center mx-auto shadow-xl shadow-[#ff4e00]/10">
                      <Zap className="w-8 h-8 stroke-[2.5] animate-pulse" />
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-base font-bold text-slate-100 uppercase tracking-wide">
                        READY TO MIX YOUR UPLOADED TRACKS
                      </h4>
                      <p className="text-xs text-slate-400 font-sans">
                        Upload your audio files (.MP3, .WAV, .FLAC, .AIFF) or Rekordbox XML playlist. The system will auto-sort them harmonically and render your perfect continuous DJ set mix.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                      {onOpenAddTrackModal && (
                        <button
                          onClick={onOpenAddTrackModal}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold font-mono bg-[#ff4e00] hover:bg-[#ff5e1a] text-black rounded-sm transition shadow-lg shadow-[#ff4e00]/25"
                        >
                          <Plus className="w-4 h-4 stroke-[3]" />
                          <span>UPLOAD AUDIO TRACKS</span>
                        </button>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              tracks.map((track, idx) => {
                const transition = transitions[idx]; // Transition to NEXT track
                const keyColor = getCamelotColor(track.key.code);
                const isLocked = lockedTrackIds.has(track.id);

                return (
                  <React.Fragment key={track.id}>
                    <tr
                      className={`hover:bg-slate-800/50 transition-colors group ${
                        isLocked ? 'bg-cyan-950/20' : ''
                      }`}
                    >
                      {/* Step Number & Order Controls */}
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-400">
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="text-cyan-400">#{String(idx + 1).padStart(2, '0')}</span>
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => onMoveTrack(idx, idx - 1)}
                              disabled={idx === 0}
                              className="text-slate-500 hover:text-slate-200 disabled:opacity-30"
                              title="Move Up"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => onMoveTrack(idx, idx + 1)}
                              disabled={idx === tracks.length - 1}
                              className="text-slate-500 hover:text-slate-200 disabled:opacity-30"
                              title="Move Down"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Title & Artist */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onAuditionTrack(track)}
                            className="p-1 rounded-md bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-cyan-400 transition"
                            title="Audition in Dual Deck Player"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                          </button>
                          <div>
                            <div className="font-semibold text-slate-100 line-clamp-1 flex items-center gap-1.5">
                              {track.title}
                              {isLocked && <Lock className="w-3 h-3 text-cyan-400 inline shrink-0" />}
                            </div>
                            <div className="text-[11px] text-slate-400 line-clamp-1">
                              {track.artist} {track.genre ? `• ${track.genre}` : ''}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* BPM */}
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-amber-400">
                        {track.bpm}
                      </td>

                      {/* Camelot Key Badge */}
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className="inline-block px-2 py-1 rounded-md text-[11px] font-mono font-bold shadow-sm"
                          style={{
                            backgroundColor: `${keyColor}20`,
                            color: keyColor,
                            border: `1px solid ${keyColor}60`,
                          }}
                        >
                          {track.key.code}
                        </span>
                      </td>

                      {/* DES Energy Score */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-mono font-bold text-violet-400">{track.des}</span>
                          <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500 rounded-full"
                              style={{ width: `${(track.des / 10) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>

                      {/* Sub-Bass Weight Meter */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-mono text-slate-300 font-medium">
                            {track.spectral.subBassWeight}
                            {track.spectral.subBassWeight > 7.5 && (
                              <AlertTriangle className="w-3 h-3 text-rose-400 inline ml-1" />
                            )}
                          </span>
                          <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                track.spectral.subBassWeight > 7.5 ? 'bg-rose-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${(track.spectral.subBassWeight / 10) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>

                      {/* Transition Flow Badge (To Next Track) */}
                      <td className="py-2.5 px-3">
                        {transition ? (
                          <div
                            onClick={() => onInspectTransition(idx)}
                            className="cursor-pointer group/trans flex items-center gap-2 p-1.5 rounded-lg bg-slate-950/80 hover:bg-slate-850 border border-slate-800 transition"
                            title="Click to inspect transition EQ notes"
                          >
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-tight whitespace-nowrap ${
                                transition.type === 'EXACT_HARMONIC'
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/80'
                                  : transition.type === 'SMOOTH_HARMONIC'
                                  ? 'bg-cyan-950 text-cyan-400 border border-cyan-800/80'
                                  : transition.type === 'ENERGY_BOOST'
                                  ? 'bg-amber-950 text-amber-400 border border-amber-800/80'
                                  : transition.type === 'RELATIVE_SHIFT'
                                  ? 'bg-violet-950 text-violet-400 border border-violet-800/80'
                                  : 'bg-rose-950 text-rose-400 border border-rose-800/80'
                              }`}
                            >
                              {transition.type.replace('_', ' ')}
                            </span>

                            {transition.subBassClashRisk === 'HIGH' && (
                              <span
                                className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-rose-900/60 text-rose-300 border border-rose-700/60 flex items-center gap-1"
                                title="Sub-bass collision warning"
                              >
                                <AlertTriangle className="w-2.5 h-2.5" /> BASS CLASH
                              </span>
                            )}

                            <Sliders className="w-3.5 h-3.5 text-slate-500 group-hover/trans:text-cyan-400 ml-auto transition-colors" />
                          </div>
                        ) : (
                          <span className="text-[10px] font-mono text-slate-600 uppercase">
                            Set Closer
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onToggleLock(track.id)}
                            className={`p-1.5 rounded-md transition ${
                              isLocked
                                ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                            }`}
                            title={isLocked ? 'Unlock Position' : 'Lock Position in Sorter'}
                          >
                            {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            onClick={() => onRemoveTrack(track.id)}
                            className="p-1.5 rounded-md bg-slate-800/80 hover:bg-rose-950 hover:text-rose-400 text-slate-400 transition"
                            title="Remove Track"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
