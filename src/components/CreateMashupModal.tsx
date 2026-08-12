import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Sparkles,
  Play,
  Pause,
  Download,
  Plus,
  Sliders,
  Music2,
  Wand2,
  CheckCircle2,
  Zap,
  Volume2,
  RotateCcw,
} from 'lucide-react';
import { Track } from '../types';
import { renderMashupAudio, RenderedMashupResult } from '../lib/mashupRenderer';
import { getCamelotColor } from '../lib/camelot';

interface CreateMashupModalProps {
  tracks: Track[];
  initialTrackAId?: string;
  onClose: () => void;
  onAddMashupTrack: (track: Track) => void;
}

export const CreateMashupModal: React.FC<CreateMashupModalProps> = ({
  tracks,
  initialTrackAId,
  onClose,
  onAddMashupTrack,
}) => {
  // Select Track A and Track B (default to initialTrackAId or first two tracks)
  const [trackAId, setTrackAId] = useState<string>(initialTrackAId || tracks[0]?.id || '');
  const [trackBId, setTrackBId] = useState<string>(() => {
    if (initialTrackAId) {
      const otherTrack = tracks.find((t) => t.id !== initialTrackAId);
      if (otherTrack) return otherTrack.id;
    }
    return tracks[1]?.id || tracks[0]?.id || '';
  });

  const trackA = tracks.find((t) => t.id === trackAId) || tracks[0];
  const trackB = tracks.find((t) => t.id === trackBId) || tracks[1] || tracks[0];

  // Parameters
  const [targetBpm, setTargetBpm] = useState<number>(trackA?.bpm || 124);
  const [trackAGain, setTrackAGain] = useState<number>(1.0);
  const [trackBGain, setTrackBGain] = useState<number>(1.0);
  const [trackBHighpassHz, setTrackBHighpassHz] = useState<number>(250);
  const [trackBOffsetSeconds, setTrackBOffsetSeconds] = useState<number>(0);
  const [pitchShiftSemiTonesB, setPitchShiftSemiTonesB] = useState<number>(0);
  const [durationMode, setDurationMode] = useState<'FULL_TRACK' | 'TWO_MIN' | 'ONE_MIN'>('FULL_TRACK');

  // Sync target BPM when Track A changes
  useEffect(() => {
    if (trackA?.bpm) {
      setTargetBpm(trackA.bpm);
    }
  }, [trackAId, trackA?.bpm]);

  // Render State
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [renderedResult, setRenderedResult] = useState<RenderedMashupResult | null>(null);

  // Audio Playback State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Handle Play/Pause
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  // Generate Mashup
  const handleGenerateMashup = async () => {
    if (!trackA || !trackB) return;

    setIsRendering(true);
    setRenderProgress(0);
    setRenderedResult(null);
    setIsPlaying(false);

    try {
      const result = await renderMashupAudio(
        {
          trackA,
          trackB,
          targetBpm,
          trackAGain,
          trackBGain,
          trackBHighpassHz,
          trackBOffsetSeconds,
          pitchShiftSemiTonesB,
          mashupDurationMode: durationMode,
        },
        (progress, message) => {
          setRenderProgress(progress);
          setStatusMessage(message);
        }
      );

      setRenderedResult(result);
    } catch (err) {
      console.error('Mashup rendering failed:', err);
      setStatusMessage('Error rendering mashup. Please try again.');
    } finally {
      setIsRendering(false);
    }
  };

  // Harmonic Match Calculation
  const isKeyCompatible =
    trackA?.key?.code === trackB?.key?.code ||
    Math.abs((trackA?.key?.number || 0) - (trackB?.key?.number || 0)) <= 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-fadeIn overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full p-6 shadow-2xl relative flex flex-col my-auto max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-600 to-amber-500 text-black shadow-lg shadow-cyan-500/20">
              <Wand2 className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide uppercase font-mono">
                  MASHUP STUDIO — STEM BLENDER
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-400 border border-cyan-800 font-bold">
                  WEB AUDIO DSP
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Blend beat, basslines, and vocals from two uploaded tracks into a custom studio mashup
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Track Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
          {/* Track A: Beat / Instrumental */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Music2 className="w-3.5 h-3.5" /> TRACK A — BEAT / INSTRUMENTAL
              </span>
              <span className="text-[10px] font-mono text-slate-500">BASE LAYER</span>
            </div>

            {/* Select Track A */}
            <select
              value={trackAId}
              onChange={(e) => setTrackAId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white outline-none focus:border-cyan-500 transition font-mono"
            >
              {tracks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} - {t.artist} ({t.key.code}, {t.bpm} BPM)
                </option>
              ))}
            </select>

            {/* Track A Info */}
            {trackA && (
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-200 line-clamp-1">{trackA.title}</p>
                  <p className="text-[10px] text-slate-400">{trackA.artist}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                    {trackA.bpm} BPM
                  </span>
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-mono font-bold"
                    style={{
                      backgroundColor: `${getCamelotColor(trackA.key.code)}20`,
                      color: getCamelotColor(trackA.key.code),
                      border: `1px solid ${getCamelotColor(trackA.key.code)}40`,
                    }}
                  >
                    {trackA.key.code}
                  </span>
                </div>
              </div>
            )}

            {/* Track A Controls */}
            <div className="space-y-2 pt-1">
              <div className="flex justify-between text-[11px] font-mono text-slate-400">
                <span>Beat Gain / Level:</span>
                <span className="text-cyan-400 font-bold">{Math.round(trackAGain * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="1.5"
                step="0.05"
                value={trackAGain}
                onChange={(e) => setTrackAGain(parseFloat(e.target.value))}
                className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Track B: Vocal / Top Track */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Music2 className="w-3.5 h-3.5" /> TRACK B — VOCAL / TOP LAYER
              </span>
              <span className="text-[10px] font-mono text-slate-500">OVERLAY LAYER</span>
            </div>

            {/* Select Track B */}
            <select
              value={trackBId}
              onChange={(e) => setTrackBId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white outline-none focus:border-amber-500 transition font-mono"
            >
              {tracks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} - {t.artist} ({t.key.code}, {t.bpm} BPM)
                </option>
              ))}
            </select>

            {/* Track B Info */}
            {trackB && (
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-200 line-clamp-1">{trackB.title}</p>
                  <p className="text-[10px] text-slate-400">{trackB.artist}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                    {trackB.bpm} BPM
                  </span>
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-mono font-bold"
                    style={{
                      backgroundColor: `${getCamelotColor(trackB.key.code)}20`,
                      color: getCamelotColor(trackB.key.code),
                      border: `1px solid ${getCamelotColor(trackB.key.code)}40`,
                    }}
                  >
                    {trackB.key.code}
                  </span>
                </div>
              </div>
            )}

            {/* Track B Controls */}
            <div className="space-y-3 pt-1">
              {/* Vocal Gain */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono text-slate-400">
                  <span>Overlay Gain / Level:</span>
                  <span className="text-amber-400 font-bold">{Math.round(trackBGain * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="1.5"
                  step="0.05"
                  value={trackBGain}
                  onChange={(e) => setTrackBGain(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Highpass Vocal Isolator */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono text-slate-400">
                  <span>Vocal High-Pass Cut:</span>
                  <span className="text-amber-400 font-bold">{trackBHighpassHz} Hz</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="600"
                  step="10"
                  value={trackBHighpassHz}
                  onChange={(e) => setTrackBHighpassHz(parseInt(e.target.value))}
                  className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
                <p className="text-[10px] text-slate-500 italic">
                  Cuts sub-bass frequencies from Track B to isolate vocals and prevent bass clashing.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Alignment & Sync Settings */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 mt-4 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-mono font-bold text-slate-200 uppercase flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" /> MASHUP ALIGNMENT & HARMONIC SYNC
            </span>

            {/* Compatibility Badge */}
            <span
              className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold flex items-center gap-1.5 ${
                isKeyCompatible
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : 'bg-amber-950 text-amber-400 border border-amber-800'
              }`}
            >
              <Zap className="w-3 h-3" />
              {isKeyCompatible
                ? `HARMONIC MATCH (${trackA?.key?.code} & ${trackB?.key?.code})`
                : `KEY SHIFT SUGGESTED (${trackA?.key?.code} vs ${trackB?.key?.code})`}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
            {/* Target BPM */}
            <div className="space-y-1.5">
              <label className="text-slate-400 block text-[11px]">MASTER MASHUP BPM</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="70"
                  max="180"
                  value={targetBpm}
                  onChange={(e) => setTargetBpm(parseInt(e.target.value) || 124)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-bold text-center outline-none focus:border-cyan-500"
                />
                <button
                  onClick={() => setTargetBpm(trackA?.bpm || 124)}
                  className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px]"
                  title="Match Track A native BPM"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Vocal Offset */}
            <div className="space-y-1.5">
              <label className="text-slate-400 block text-[11px]">TRACK B START OFFSET</label>
              <select
                value={trackBOffsetSeconds}
                onChange={(e) => setTrackBOffsetSeconds(parseFloat(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white outline-none focus:border-cyan-500"
              >
                <option value={0}>0s (Immediate Start)</option>
                <option value={Math.round((60 / targetBpm) * 16)}>
                  16 Beats / 4 Bars (~{Math.round((60 / targetBpm) * 16)}s)
                </option>
                <option value={Math.round((60 / targetBpm) * 32)}>
                  32 Beats / 8 Bars (~{Math.round((60 / targetBpm) * 32)}s)
                </option>
                <option value={Math.round((60 / targetBpm) * 64)}>
                  64 Beats / 16 Bars (~{Math.round((60 / targetBpm) * 64)}s)
                </option>
              </select>
            </div>

            {/* Duration Mode */}
            <div className="space-y-1.5">
              <label className="text-slate-400 block text-[11px]">MASHUP DURATION</label>
              <select
                value={durationMode}
                onChange={(e) => setDurationMode(e.target.value as 'FULL_TRACK' | 'TWO_MIN' | 'ONE_MIN')}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white outline-none focus:border-cyan-500"
              >
                <option value="FULL_TRACK">Full Track Length</option>
                <option value="TWO_MIN">2-Minute Extended Mashup</option>
                <option value="ONE_MIN">1-Minute Studio Teaser</option>
              </select>
            </div>
          </div>
        </div>

        {/* Generate Mashup Button / Progress */}
        <div className="mt-5 space-y-3">
          {!isRendering ? (
            <button
              onClick={handleGenerateMashup}
              disabled={!trackA || !trackB}
              className="w-full py-3.5 px-6 rounded-xl font-bold font-mono text-sm bg-gradient-to-r from-[#ff4e00] to-amber-500 hover:from-[#ff5e1a] hover:to-amber-400 text-black shadow-xl shadow-[#ff4e00]/25 transition flex items-center justify-center gap-2.5 uppercase tracking-wider"
            >
              <Wand2 className="w-5 h-5 stroke-[2.5]" />
              <span>GENERATE STUDIO MASHUP</span>
            </button>
          ) : (
            <div className="p-4 rounded-xl bg-slate-950 border border-[#ff4e00]/40 space-y-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-[#ff4e00] font-bold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 animate-spin" /> {statusMessage || 'Blending stems...'}
                </span>
                <span className="text-slate-400 font-bold">{renderProgress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#ff4e00] to-amber-400 transition-all duration-300"
                  style={{ width: `${renderProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Rendered Result Audio Player & Export */}
        {renderedResult && (
          <div className="mt-5 p-5 rounded-2xl bg-slate-950 border border-cyan-500/40 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                <h4 className="text-sm font-bold text-white font-mono uppercase tracking-wide">
                  STUDIO MASHUP RENDER COMPLETE
                </h4>
              </div>
              <span className="text-xs font-mono text-cyan-400">
                Duration: {Math.floor(renderedResult.durationSeconds / 60)}m {Math.round(renderedResult.durationSeconds % 60)}s
              </span>
            </div>

            {/* Hidden Audio Element */}
            <audio
              ref={audioRef}
              src={renderedResult.url}
              onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
              onLoadedMetadata={() => setAudioDuration(audioRef.current?.duration || 0)}
              onEnded={() => setIsPlaying(false)}
            />

            {/* Audio Wave Scrubber */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center gap-4">
              <button
                onClick={togglePlay}
                className="w-12 h-12 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black flex items-center justify-center shrink-0 shadow-lg shadow-cyan-500/20 transition"
              >
                {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
              </button>

              <div className="flex-1 space-y-1">
                <div className="flex justify-between text-[11px] font-mono text-slate-400">
                  <span className="text-cyan-400 font-bold">{renderedResult.mashupTrack.title}</span>
                  <span>
                    {Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')} / {Math.floor(audioDuration / 60)}:{Math.floor(audioDuration % 60).toString().padStart(2, '0')}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={audioDuration || 100}
                  value={currentTime}
                  onChange={(e) => {
                    const time = parseFloat(e.target.value);
                    if (audioRef.current) audioRef.current.currentTime = time;
                    setCurrentTime(time);
                  }}
                  className="w-full accent-cyan-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <a
                href={renderedResult.url}
                download={renderedResult.mashupTrack.fileName}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl font-mono text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-black flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition"
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                <span>DOWNLOAD MASHUP WAV</span>
              </a>

              <button
                onClick={() => {
                  onAddMashupTrack(renderedResult.mashupTrack);
                  onClose();
                }}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl font-mono text-xs font-bold bg-[#ff4e00] hover:bg-[#ff5e1a] text-black flex items-center justify-center gap-2 shadow-lg shadow-[#ff4e00]/20 transition"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>ADD MASHUP TO MY MIX SET</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
