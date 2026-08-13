import React, { useState } from 'react';
import {
  Download,
  FileCode,
  FileText,
  ListMusic,
  X,
  CheckCircle,
  Copy,
  Sparkles,
  Zap,
  Lock,
} from 'lucide-react';
import { Track, TransitionAnalysis } from '../types';
import {
  generateM3u8Playlist,
  generateRekordboxXml,
  generateTransitionSheet,
} from '../lib/exporters';
import { getUserSubscriptionTier, FeaturePermission } from '../lib/rbac';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tracks: Track[];
  transitions: TransitionAnalysis[];
  blueprintName: string;
  onOpenCreateTransitionsModal?: () => void;
  onTriggerUpgrade?: (feature: FeaturePermission) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  tracks,
  transitions,
  blueprintName,
  onOpenCreateTransitionsModal,
  onTriggerUpgrade,
}) => {
  const [copied, setCopied] = useState(false);
  const userTier = getUserSubscriptionTier();

  if (!isOpen) return null;

  // Trigger file download helper
  const downloadFile = (content: string, fileName: string, contentType: string) => {
    if (userTier === 'FREE') {
      if (onTriggerUpgrade) onTriggerUpgrade('PLAYLIST_EXPORTS');
      return;
    }
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportRekordboxXml = () => {
    const xmlContent = generateRekordboxXml(tracks, `Set Architect by AfroSenses - ${blueprintName}`);
    downloadFile(xmlContent, 'SetArchitect_AfroSenses_Rekordbox.xml', 'text/xml');
  };

  const handleExportM3u8 = () => {
    const m3uContent = generateM3u8Playlist(tracks);
    downloadFile(m3uContent, 'SetArchitect_Playlist.m3u8', 'audio/x-mpegurl');
  };

  const handleExportTransitionSheet = () => {
    const sheetContent = generateTransitionSheet(tracks, transitions, blueprintName);
    downloadFile(sheetContent, 'SetArchitect_Transition_Sheet.txt', 'text/plain');
  };

  const handleCopyTextSheet = () => {
    const sheetContent = generateTransitionSheet(tracks, transitions, blueprintName);
    navigator.clipboard.writeText(sheetContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-950 border border-amber-800 text-amber-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100 font-mono">
                EXPORT SET ARCHITECT BY AFROSENSES
              </h3>
              <p className="text-xs text-slate-400">
                Export sorted sequence to DJ hardware, Rekordbox, or cue sheets
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

        {/* Export Options Grid */}
        <div className="py-6 space-y-4">
          {userTier === 'FREE' && (
            <div className="p-4 rounded-xl bg-amber-950/80 border border-amber-500/80 text-amber-200 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold font-mono text-amber-300 uppercase">
                    Pro Tier Required
                  </h4>
                  <p className="text-xs text-amber-200/90 mt-0.5">
                    Direct playlist exports (M3U, Rekordbox XML, CSV) require Pro (R179/mo) or Executive tier.
                  </p>
                </div>
              </div>
              <button
                onClick={() => onTriggerUpgrade && onTriggerUpgrade('PLAYLIST_EXPORTS')}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs shrink-0"
              >
                Upgrade
              </button>
            </div>
          )}
          {/* Pre-recorded Continuous Set WAV */}
          {onOpenCreateTransitionsModal && (
            <div
              onClick={() => {
                onClose();
                onOpenCreateTransitionsModal();
              }}
              className="p-4 rounded-xl bg-gradient-to-r from-[#ff4e00]/10 to-[#ff8700]/10 border border-[#ff4e00]/50 hover:border-[#ff4e00] cursor-pointer transition flex items-center justify-between group shadow-lg shadow-[#ff4e00]/10"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-[#ff4e00]/20 border border-[#ff4e00]/50 text-[#ff4e00]">
                  <Zap className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-[#ff4e00] transition flex items-center gap-2">
                    CREATE MIX (.WAV)
                  </h4>
                  <p className="text-xs text-slate-300 font-mono">
                    Auto-sort and render continuous pre-recorded set mix with seamless crossfades
                  </p>
                </div>
              </div>
              <Sparkles className="w-5 h-5 text-[#ff4e00] group-hover:scale-110 transition-transform" />
            </div>
          )}

          {/* Rekordbox XML */}
          <div
            onClick={handleExportRekordboxXml}
            className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/80 cursor-pointer transition flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-cyan-400 group-hover:bg-cyan-950 transition">
                <FileCode className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-200 group-hover:text-cyan-400 transition">
                  Rekordbox XML Export
                </h4>
                <p className="text-xs text-slate-400 font-mono">
                  Preserved hot cues, reordered track indexes, & DES tags
                </p>
              </div>
            </div>
            <Download className="w-5 h-5 text-slate-600 group-hover:text-cyan-400 transition" />
          </div>

          {/* Standard M3U8 Playlist */}
          <div
            onClick={handleExportM3u8}
            className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-violet-500/80 cursor-pointer transition flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-violet-400 group-hover:bg-violet-950 transition">
                <ListMusic className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-200 group-hover:text-violet-400 transition">
                  Universal M3U8 Playlist
                </h4>
                <p className="text-xs text-slate-400 font-mono">
                  Compatible with Serato DJ, Traktor, Engine DJ, Virtual DJ
                </p>
              </div>
            </div>
            <Download className="w-5 h-5 text-slate-600 group-hover:text-violet-400 transition" />
          </div>

          {/* DJ Transition Master Sheet */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-amber-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-200">
                  Transition Master DJ Sheet
                </h4>
                <p className="text-xs text-slate-400 font-mono">
                  Cue timing, pitch bend % adjustments, & EQ advice
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyTextSheet}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition text-xs font-mono flex items-center gap-1"
                title="Copy to Clipboard"
              >
                {copied ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
              <button
                onClick={handleExportTransitionSheet}
                className="p-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 transition text-xs font-mono font-bold flex items-center gap-1"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
