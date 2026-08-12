import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Download,
  Play,
  Pause,
  Zap,
  CheckCircle2,
  Music,
  Disc,
  Clock,
  Layers,
  Sliders,
  Volume2,
} from 'lucide-react';
import { Track, TransitionAnalysis } from '../types';
import { renderContinuousSetAudio, MixMode } from '../lib/setAudioRenderer';

interface CreateTransitionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tracks: Track[];
  transitions: TransitionAnalysis[];
  blueprintName: string;
}

export const CreateTransitionsModal: React.FC<CreateTransitionsModalProps> = ({
  isOpen,
  onClose,
  tracks,
  transitions,
  blueprintName,
}) => {
  const [mixMode, setMixMode] = useState<MixMode>('FULL_TRACKS');
  const [isRendering, setIsRendering] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [renderedAudioUrl, setRenderedAudioUrl] = useState<string | null>(null);
  const [renderedDuration, setRenderedDuration] = useState<number>(0);

  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  if (!isOpen) return null;

  const handleStartRender = async () => {
    setIsRendering(true);
    setProgressPercent(0);
    setStatusMessage('Initializing DSP Harmonic Renderer...');
    setRenderedAudioUrl(null);

    try {
      const result = await renderContinuousSetAudio(
        tracks,
        transitions,
        (percent, status) => {
          setProgressPercent(percent);
          setStatusMessage(status);
        },
        mixMode
      );

      setRenderedAudioUrl(result.url);
      setRenderedDuration(result.durationSeconds);
      setIsRendering(false);
    } catch (err) {
      console.error('Render set error:', err);
      setStatusMessage('Error rendering set transitions. Please try again.');
      setIsRendering(false);
    }
  };

  const handleDownloadWav = () => {
    if (!renderedAudioUrl) return;
    const a = document.createElement('a');
    a.href = renderedAudioUrl;
    a.download = `PreRecordedSet_${blueprintName.replace(/\s+/g, '_')}_ContinuousMix.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const togglePlayPreview = () => {
    if (!audioRef.current) return;
    if (isPlayingPreview) {
      audioRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      audioRef.current.play();
      setIsPlayingPreview(true);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Calculate average harmonic match score
  const exactCount = transitions.filter((t) => t.type === 'EXACT_HARMONIC').length;
  const harmonicPercent =
    transitions.length > 0 ? Math.round((exactCount / transitions.length) * 100) : 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-[#0e0e12] border border-[#2a2a32] rounded-sm max-w-2xl w-full p-6 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#2a2a32]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-sm bg-[#ff4e00]/10 border border-[#ff4e00]/40 text-[#ff4e00] shadow-lg shadow-[#ff4e00]/10">
              <Zap className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                CREATE PERFECT SET MIX
              </h3>
              <p className="text-xs text-[#888]">
                Generate & render seamless continuous DJ transitions for download as a pre-recorded set
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-sm bg-[#1a1a20] hover:bg-[#25252e] text-[#888] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="py-5 space-y-5 overflow-y-auto flex-1">
          {/* Blueprint & Set Quick Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
            <div className="p-3 bg-[#131318] border border-[#23232c] rounded-sm">
              <span className="text-[10px] text-[#777] uppercase block">PLAYLIST SIZE</span>
              <span className="text-sm font-bold text-white flex items-center gap-1.5 mt-0.5">
                <Music className="w-3.5 h-3.5 text-[#ff4e00]" />
                {tracks.length} Tracks
              </span>
            </div>

            <div className="p-3 bg-[#131318] border border-[#23232c] rounded-sm">
              <span className="text-[10px] text-[#777] uppercase block">HARMONIC MATCH</span>
              <span className="text-sm font-bold text-[#00ff94] flex items-center gap-1.5 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {harmonicPercent}% Score
              </span>
            </div>

            <div className="p-3 bg-[#131318] border border-[#23232c] rounded-sm">
              <span className="text-[10px] text-[#777] uppercase block">CROSSFADE ZONE</span>
              <span className="text-sm font-bold text-[#ff4e00] flex items-center gap-1.5 mt-0.5">
                <Sliders className="w-3.5 h-3.5" />
                16-Bar EQ
              </span>
            </div>

            <div className="p-3 bg-[#131318] border border-[#23232c] rounded-sm">
              <span className="text-[10px] text-[#777] uppercase block">BLUEPRINT</span>
              <span className="text-xs font-bold text-amber-400 truncate block mt-1">
                {blueprintName}
              </span>
            </div>
          </div>

          {/* Action Trigger Area */}
          {!renderedAudioUrl && !isRendering && (
            <div className="p-6 bg-[#131318] border border-[#282832] rounded-sm space-y-5">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-[#ff4e00]/10 border border-[#ff4e00]/40 text-[#ff4e00] flex items-center justify-center mx-auto shadow-xl shadow-[#ff4e00]/10 animate-pulse">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-white font-mono uppercase tracking-wide">
                  Mix Format & Track Duration
                </h4>
                <p className="text-xs text-[#888] max-w-md mx-auto">
                  Renders your uploaded songs into a continuous DJ set mix with key-matched crossfades and sub-bass management.
                </p>
              </div>

              {/* Mix Mode Selection Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => setMixMode('FULL_TRACKS')}
                  className={`p-3 rounded border text-left transition-all ${
                    mixMode === 'FULL_TRACKS'
                      ? 'bg-[#ff4e00]/15 border-[#ff4e00] text-white shadow-lg shadow-[#ff4e00]/10'
                      : 'bg-[#1a1a20] border-[#2a2a35] text-[#888] hover:text-white hover:bg-[#22222a]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#ff4e00]">FULL SONGS MIX</span>
                    {mixMode === 'FULL_TRACKS' && <CheckCircle2 className="w-3.5 h-3.5 text-[#ff4e00]" />}
                  </div>
                  <span className="text-[10px] text-[#aaa] block mt-1">
                    Mixes entire length of all uploaded audio tracks
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setMixMode('SHORT_EDIT')}
                  className={`p-3 rounded border text-left transition-all ${
                    mixMode === 'SHORT_EDIT'
                      ? 'bg-[#ff4e00]/15 border-[#ff4e00] text-white shadow-lg shadow-[#ff4e00]/10'
                      : 'bg-[#1a1a20] border-[#2a2a35] text-[#888] hover:text-white hover:bg-[#22222a]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-400">2-MIN RADIO EDIT</span>
                    {mixMode === 'SHORT_EDIT' && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                  </div>
                  <span className="text-[10px] text-[#aaa] block mt-1">
                    Blends 2 minutes per track for fast-paced sets
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setMixMode('MINI_TEASER')}
                  className={`p-3 rounded border text-left transition-all ${
                    mixMode === 'MINI_TEASER'
                      ? 'bg-[#ff4e00]/15 border-[#ff4e00] text-white shadow-lg shadow-[#ff4e00]/10'
                      : 'bg-[#1a1a20] border-[#2a2a35] text-[#888] hover:text-white hover:bg-[#22222a]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-400">30S TEASER MIX</span>
                    {mixMode === 'MINI_TEASER' && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />}
                  </div>
                  <span className="text-[10px] text-[#aaa] block mt-1">
                    Quick 30-second snippet mix per track
                  </span>
                </button>
              </div>

              <button
                onClick={handleStartRender}
                className="w-full py-3.5 bg-[#ff4e00] hover:bg-[#ff5e1a] active:scale-[0.98] text-black font-mono font-bold text-sm tracking-wider uppercase rounded-sm transition-all shadow-xl shadow-[#ff4e00]/30 flex items-center justify-center gap-2"
              >
                <Zap className="w-5 h-5 fill-current stroke-[2.5]" />
                <span>CREATE FULL MIX NOW</span>
              </button>
            </div>
          )}

          {/* Rendering Progress Indicator */}
          {isRendering && (
            <div className="p-6 bg-[#131318] border border-[#ff4e00]/40 rounded-sm space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-white font-bold flex items-center gap-2">
                  <Disc className="w-4 h-4 text-[#ff4e00] animate-spin" />
                  RENDERING PRE-RECORDED SET TRANSITIONS...
                </span>
                <span className="text-[#ff4e00] font-bold text-sm">{progressPercent}%</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-3 bg-[#1a1a22] border border-[#2e2e3a] rounded-sm overflow-hidden p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-[#ff4e00] to-[#ff8700] rounded-sm transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>

              <p className="text-[#aaa] text-center text-[11px] animate-pulse">
                {statusMessage}
              </p>
            </div>
          )}

          {/* Rendered Audio Preview & Download Panel */}
          {renderedAudioUrl && (
            <div className="p-5 bg-[#131318] border border-[#00ff94]/40 rounded-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#23232c] pb-3">
                <div className="flex items-center gap-2 text-[#00ff94] font-mono font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>PRE-RECORDED SET TRANSITIONS READY</span>
                </div>
                <span className="text-xs font-mono text-[#888] flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Duration: {formatDuration(renderedDuration)}
                </span>
              </div>

              {/* Live Audio Player Element */}
              <audio
                ref={audioRef}
                src={renderedAudioUrl}
                onEnded={() => setIsPlayingPreview(false)}
                className="hidden"
              />

              <div className="p-4 bg-[#0a0a0d] border border-[#23232c] rounded-sm flex items-center justify-between gap-4">
                <button
                  onClick={togglePlayPreview}
                  className="p-3 bg-[#00ff94] hover:bg-[#33ffaa] text-black font-bold rounded-sm transition flex items-center gap-2 text-xs font-mono shrink-0 shadow-lg shadow-[#00ff94]/20"
                >
                  {isPlayingPreview ? (
                    <>
                      <Pause className="w-4 h-4 fill-current" />
                      <span>PAUSE PREVIEW</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>AUDITION CONTINUOUS SET</span>
                    </>
                  )}
                </button>

                <div className="flex-1 text-right font-mono text-xs">
                  <span className="text-[#888] block text-[10px] uppercase">Format</span>
                  <span className="text-white font-bold">16-bit PCM Uncompressed WAV</span>
                </div>
              </div>

              {/* Big Download Button */}
              <button
                onClick={handleDownloadWav}
                className="w-full py-3.5 bg-[#00ff94] hover:bg-[#33ffaa] text-black font-mono font-bold text-xs uppercase tracking-wider rounded-sm transition-all shadow-xl shadow-[#00ff94]/20 flex items-center justify-center gap-2.5"
              >
                <Download className="w-5 h-5 stroke-[2.5]" />
                <span>DOWNLOAD PRE-RECORDED SET (.WAV)</span>
              </button>

              <p className="text-[10px] text-[#777] font-mono text-center">
                The downloaded WAV file contains the complete, seamlessly blended set ready for radio broadcast, USB playback, or promotional release.
              </p>
            </div>
          )}

          {/* Sequence Preview List */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono text-[#777] uppercase tracking-wider block">
              TRANSITION SEQUENCE ORDER ({tracks.length} TRACKS)
            </span>

            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {tracks.map((track, idx) => {
                const trans = transitions[idx];
                return (
                  <div
                    key={track.id}
                    className="p-2.5 bg-[#121216] border border-[#22222a] rounded-sm flex items-center justify-between text-xs font-mono"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="w-5 text-[#666] font-bold text-right shrink-0">
                        {idx + 1}.
                      </span>
                      <span className="text-white font-bold truncate">{track.title}</span>
                      <span className="text-[#777] text-[10px]">({track.artist})</span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-cyan-400 font-bold">{track.key.code}</span>
                      <span className="text-amber-400">{track.bpm} BPM</span>
                      {trans && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-[#ff4e00]/10 border border-[#ff4e00]/30 text-[#ff4e00]">
                          {trans.type.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#2a2a32] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#1c1c22] hover:bg-[#282832] text-[#888] hover:text-white rounded-sm text-xs font-mono transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
