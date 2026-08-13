import React, { useState } from 'react';
import {
  X,
  Download,
  FileSpreadsheet,
  Disc,
  Code,
  Copy,
  Check,
  Sparkles,
  Lock,
  HardDrive,
  FileText,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { Track, TransitionAnalysis } from '../types';
import {
  getUserSubscriptionTier,
  hasPermission,
  FeaturePermission,
} from '../lib/rbac';
import {
  exportToM3U8,
  exportToCSV,
  exportToRekordboxXmlFormat,
  generateAfroSensesPortalEmbedSnippet,
  downloadPlaylistFile,
} from '../utils/exportPlaylist';

interface ExportSetModalProps {
  isOpen: boolean;
  onClose: () => void;
  tracks: Track[];
  transitions?: TransitionAnalysis[];
  blueprintName?: string;
  onTriggerUpgrade?: (feature: FeaturePermission) => void;
}

export const ExportSetModal: React.FC<ExportSetModalProps> = ({
  isOpen,
  onClose,
  tracks,
  transitions = [],
  blueprintName = 'Harmonic Set Sequence',
  onTriggerUpgrade,
}) => {
  const [activeTab, setActiveTab] = useState<'M3U8' | 'CSV' | 'REKORDBOX' | 'PORTAL_EMBED'>('M3U8');
  const [playlistTitle, setPlaylistTitle] = useState('SetArchitect_Harmonic_Master');
  const [copied, setCopied] = useState(false);
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentTier = getUserSubscriptionTier();
  const isExportAllowed = hasPermission('PLAYLIST_EXPORTS');

  const m3u8Content = exportToM3U8(tracks, { playlistName: playlistTitle });
  const csvContent = exportToCSV(tracks, transitions);
  const xmlContent = exportToRekordboxXmlFormat(tracks, playlistTitle);
  const embedSnippet = generateAfroSensesPortalEmbedSnippet();

  const handleDownload = (type: 'M3U8' | 'CSV' | 'REKORDBOX') => {
    if (!isExportAllowed) {
      if (onTriggerUpgrade) {
        onTriggerUpgrade('PLAYLIST_EXPORTS');
      }
      return;
    }

    const timestamp = new Date().toISOString().slice(0, 10);
    const sanitizedTitle = playlistTitle.replace(/[^a-zA-Z0-9_-]/g, '_');

    if (type === 'M3U8') {
      downloadPlaylistFile(m3u8Content, `${sanitizedTitle}_${timestamp}.m3u8`, 'audio/x-mpegurl');
      setDownloadSuccessMessage('Downloaded .m3u8 playlist file (compatible with Rekordbox, Serato, Traktor & USB drives)!');
    } else if (type === 'CSV') {
      downloadPlaylistFile(csvContent, `${sanitizedTitle}_SetBlueprint_${timestamp}.csv`, 'text/csv');
      setDownloadSuccessMessage('Downloaded detailed CSV Set Blueprint spreadsheet!');
    } else if (type === 'REKORDBOX') {
      downloadPlaylistFile(xmlContent, `${sanitizedTitle}_Rekordbox_${timestamp}.xml`, 'application/xml');
      setDownloadSuccessMessage('Downloaded Rekordbox DJ XML library structure!');
    }

    setTimeout(() => {
      setDownloadSuccessMessage(null);
    }, 3000);
  };

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full p-6 shadow-2xl relative my-8 overflow-hidden">
        {/* Top Accent Gradient */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-amber-500" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-1.5 mb-6">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-800 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> MULTI-FORMAT EXPORT ENGINE
            </span>
            <span className="text-xs text-slate-500 font-mono">
              • {tracks.length} Tracks in Sequence
            </span>
          </div>
          <h2 className="text-2xl font-bold font-mono text-white tracking-wide">
            EXPORT HARMONIC SET BLUEPRINT
          </h2>
          <p className="text-xs text-slate-400">
            Export your auto-sorted tracklist in DJ hardware and portal formats: standard .m3u8, Rekordbox XML, Serato crates, CSV set blueprints, or portal embed tiles.
          </p>
        </div>

        {/* Tier Guard Alert if on Free Tier */}
        {!isExportAllowed && (
          <div className="mb-6 p-4 rounded-xl bg-amber-950/60 border border-amber-500/80 text-amber-200 flex items-start gap-3 shadow-lg">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-xs font-bold font-mono tracking-wide text-amber-300 uppercase">
                TIER 2 (PRO) REQUIRED FOR DIRECT EXPORTS
              </h4>
              <p className="text-xs text-amber-200/90 mt-1">
                Free Tier allows previewing set sequence. Upgrade to Pro (R179/mo) or Executive to download .m3u8 playlists, CSV blueprints, and XML library files directly to your USB drive or DJ software.
              </p>
            </div>
            <button
              onClick={() => onTriggerUpgrade && onTriggerUpgrade('PLAYLIST_EXPORTS')}
              className="px-3 py-1.5 bg-amber-500 text-black font-mono font-bold text-xs rounded-lg hover:bg-amber-400 transition shrink-0 flex items-center gap-1 shadow-md"
            >
              <span>UPGRADE TO PRO</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Success Alert */}
        {downloadSuccessMessage && (
          <div className="mb-6 p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-200 flex items-center gap-3 font-mono text-xs animate-bounce">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-bold">{downloadSuccessMessage}</span>
          </div>
        )}

        {/* Playlist Name Input */}
        <div className="mb-6 space-y-1.5 font-mono">
          <label className="text-xs text-slate-300 font-bold flex items-center justify-between">
            <span>EXPORT PLAYLIST FILE NAME</span>
            <span className="text-[10px] text-slate-500">Current Blueprint: {blueprintName}</span>
          </label>
          <input
            type="text"
            value={playlistTitle}
            onChange={(e) => setPlaylistTitle(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 transition"
            placeholder="Enter playlist title"
          />
        </div>

        {/* Format Selection Tabs */}
        <div className="flex flex-wrap items-center gap-2 p-1 bg-slate-950 border border-slate-800 rounded-xl mb-6 font-mono text-xs">
          <button
            onClick={() => setActiveTab('M3U8')}
            className={`flex-1 py-2 px-3 rounded-lg font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'M3U8'
                ? 'bg-cyan-500 text-black shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>.m3u8 Playlist</span>
          </button>

          <button
            onClick={() => setActiveTab('CSV')}
            className={`flex-1 py-2 px-3 rounded-lg font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'CSV'
                ? 'bg-cyan-500 text-black shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>CSV Set Blueprint</span>
          </button>

          <button
            onClick={() => setActiveTab('REKORDBOX')}
            className={`flex-1 py-2 px-3 rounded-lg font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'REKORDBOX'
                ? 'bg-cyan-500 text-black shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Disc className="w-3.5 h-3.5" />
            <span>Rekordbox XML</span>
          </button>

          <button
            onClick={() => setActiveTab('PORTAL_EMBED')}
            className={`flex-1 py-2 px-3 rounded-lg font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'PORTAL_EMBED'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>AfroSenses Tile Embed</span>
          </button>
        </div>

        {/* Tab 1: .M3U8 Export */}
        {activeTab === 'M3U8' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between text-slate-300">
                <span className="font-bold text-cyan-400">UNIVERSAL .M3U8 FORMAT</span>
                <span className="text-[10px] text-emerald-400">Fully Compatible: Rekordbox, Serato, Traktor, Engine DJ & USB Drives</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Includes extended metadata tags (#EXTINF, #EXTBPM, #EXTKEY, #EXTREM) preserving the harmonic Camelot wheel sequence and BPM order.
              </p>
            </div>

            <div className="relative">
              <textarea
                readOnly
                value={m3u8Content}
                className="w-full h-48 bg-slate-950 border border-slate-800 rounded-xl p-4 text-[11px] font-mono text-slate-300 focus:outline-none resize-none"
              />
              <button
                onClick={() => handleCopyCode(m3u8Content)}
                className="absolute top-3 right-3 px-2.5 py-1 text-[10px] font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg flex items-center gap-1 border border-slate-700"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy M3U8'}</span>
              </button>
            </div>

            <button
              onClick={() => handleDownload('M3U8')}
              className={`w-full py-3 rounded-xl font-mono text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg ${
                isExportAllowed
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold shadow-cyan-500/20'
                  : 'bg-amber-950/80 text-amber-300 border border-amber-800 hover:bg-amber-900'
              }`}
            >
              {isExportAllowed ? (
                <>
                  <Download className="w-4 h-4" />
                  <span>DOWNLOAD .M3U8 PLAYLIST FILE</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>PRO TIER REQUIRED • CLICK TO UNLOCK EXPORTS</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Tab 2: CSV Set Blueprint Export */}
        {activeTab === 'CSV' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between text-slate-300">
                <span className="font-bold text-cyan-400">DETAILED CSV BLUEPRINT SPREADSHEET</span>
                <span className="text-[10px] text-cyan-400">Excel, Google Sheets & Print Ready</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Contains position markers, Camelot keys, tonalities, energy scores, transition compatibility ratings, BPM deltas, and recommended mix points for gig preparation.
              </p>
            </div>

            <div className="relative">
              <textarea
                readOnly
                value={csvContent}
                className="w-full h-48 bg-slate-950 border border-slate-800 rounded-xl p-4 text-[11px] font-mono text-slate-300 focus:outline-none resize-none whitespace-pre"
              />
              <button
                onClick={() => handleCopyCode(csvContent)}
                className="absolute top-3 right-3 px-2.5 py-1 text-[10px] font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg flex items-center gap-1 border border-slate-700"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy CSV'}</span>
              </button>
            </div>

            <button
              onClick={() => handleDownload('CSV')}
              className={`w-full py-3 rounded-xl font-mono text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg ${
                isExportAllowed
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold shadow-cyan-500/20'
                  : 'bg-amber-950/80 text-amber-300 border border-amber-800 hover:bg-amber-900'
              }`}
            >
              {isExportAllowed ? (
                <>
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>DOWNLOAD CSV SET BLUEPRINT</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>PRO TIER REQUIRED • CLICK TO UNLOCK EXPORTS</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Tab 3: Rekordbox XML Export */}
        {activeTab === 'REKORDBOX' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between text-slate-300">
                <span className="font-bold text-cyan-400">PIONEER REKORDBOX DJ XML SPEC</span>
                <span className="text-[10px] text-amber-400">Pioneer CDJ / Rekordbox Library Format</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Directly importable into Pioneer Rekordbox XML Bridge to create hot cues, tonality tags, and structured playlists for CDJ-3000s and Opus Quad setups.
              </p>
            </div>

            <div className="relative">
              <textarea
                readOnly
                value={xmlContent}
                className="w-full h-48 bg-slate-950 border border-slate-800 rounded-xl p-4 text-[11px] font-mono text-slate-300 focus:outline-none resize-none"
              />
              <button
                onClick={() => handleCopyCode(xmlContent)}
                className="absolute top-3 right-3 px-2.5 py-1 text-[10px] font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg flex items-center gap-1 border border-slate-700"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy XML'}</span>
              </button>
            </div>

            <button
              onClick={() => handleDownload('REKORDBOX')}
              className={`w-full py-3 rounded-xl font-mono text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg ${
                isExportAllowed
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold shadow-cyan-500/20'
                  : 'bg-amber-950/80 text-amber-300 border border-amber-800 hover:bg-amber-900'
              }`}
            >
              {isExportAllowed ? (
                <>
                  <Disc className="w-4 h-4" />
                  <span>DOWNLOAD REKORDBOX .XML FILE</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>PRO TIER REQUIRED • CLICK TO UNLOCK EXPORTS</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Tab 4: AfroSenses Portal Embed Tile */}
        {activeTab === 'PORTAL_EMBED' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between text-amber-400 font-bold">
                <span>AFROSENSES MAIN PORTAL EMBED TILE</span>
                <span className="text-[10px] text-slate-400">Launch Directly From Portal</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Copy this HTML/CSS embed snippet to embed Set Architect as an interactive launcher tile directly within the AfroSenses portal or your personal DJ portfolio website.
              </p>
            </div>

            <div className="relative">
              <textarea
                readOnly
                value={embedSnippet}
                className="w-full h-48 bg-slate-950 border border-slate-800 rounded-xl p-4 text-[11px] font-mono text-slate-300 focus:outline-none resize-none"
              />
              <button
                onClick={() => handleCopyCode(embedSnippet)}
                className="absolute top-3 right-3 px-2.5 py-1 text-[10px] font-mono bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg flex items-center gap-1 shadow-md"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-950" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy Tile Code'}</span>
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between font-mono text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-cyan-400" />
                <span>AfroSenses Main Portal Direct URL:</span>
                <span className="text-cyan-400 font-bold underline">afrosenses.co.za/apps/set-architect</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold">
                TILE ACTIVE
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
