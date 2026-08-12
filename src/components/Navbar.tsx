import React from 'react';
import {
  Compass,
  Download,
  FolderOpen,
  Layers,
  ListMusic,
  Plus,
  Sparkles,
  Zap,
  Wand2,
  Bot,
} from 'lucide-react';
import { Crate } from '../types';
import { Logo } from './Logo';

interface NavbarProps {
  crates: Crate[];
  activeCrateId: string;
  onSelectCrate: (id: string) => void;
  onOpenImporter: () => void;
  onOpenAddTrackModal: () => void;
  onOpenCamelotWheel: () => void;
  onOpenExportModal: () => void;
  onOpenDualDeck: () => void;
  onOpenAIMixer?: () => void;
  onRunSort: () => void;
  isSorting: boolean;
  trackCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  crates,
  activeCrateId,
  onSelectCrate,
  onOpenImporter,
  onOpenAddTrackModal,
  onOpenCamelotWheel,
  onOpenExportModal,
  onOpenDualDeck,
  onOpenAIMixer,
  onRunSort,
  isSorting,
  trackCount,
}) => {
  const activeCrate = crates.find((c) => c.id === activeCrateId);

  return (
    <header id="app-header" className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Logo & Identity */}
        <div className="flex items-center gap-3">
          <Logo size={42} showBackground={true} />

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-wider text-slate-100 font-mono">
                SET ARCHITECT
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-mono font-semibold tracking-wider text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 rounded-full">
                v1.0 EXEC
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Executive Harmonic & Dynamic Playlist Auto-Sorter
            </p>
          </div>
        </div>

        {/* Crate Selector & Quick Stats */}
        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto py-1">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300">
            <Layers className="w-4 h-4 text-cyan-400 shrink-0" />
            <select
              value={activeCrateId}
              onChange={(e) => onSelectCrate(e.target.value)}
              className="bg-transparent font-medium text-slate-200 outline-none cursor-pointer text-xs"
            >
              {crates.map((c) => (
                <option key={c.id} value={c.id} className="bg-slate-900 text-slate-200">
                  {c.name} ({c.tracks.length} tracks)
                </option>
              ))}
            </select>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 bg-slate-900/80 border border-slate-800/80 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-400">
            <ListMusic className="w-3.5 h-3.5 text-slate-400" />
            <span>{trackCount} Tracks</span>
          </div>

          <button
            onClick={onOpenAddTrackModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-[#ff4e00] hover:bg-[#ff5e1a] text-black rounded-lg transition shadow-md shadow-[#ff4e00]/20 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Add Track</span>
          </button>

          <button
            onClick={onOpenImporter}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition border border-slate-700/60 whitespace-nowrap"
          >
            <FolderOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span>Import XML / Audio</span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          {onOpenAIMixer && (
            <button
              onClick={onOpenAIMixer}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black rounded-lg transition shadow-md shadow-cyan-500/20 whitespace-nowrap"
              title="Open AI Music Mixer & Set Fit Radar"
            >
              <Bot className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>AI Music Mixer</span>
            </button>
          )}

          <button
            onClick={onOpenCamelotWheel}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-cyan-900/60 rounded-lg transition"
            title="View Camelot Key Radar & Distribution"
          >
            <Compass className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Camelot Radar</span>
          </button>

          <button
            onClick={onOpenDualDeck}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-900 hover:bg-slate-800 text-violet-400 border border-violet-900/60 rounded-lg transition"
            title="Audition transitions live with Dual Deck crossfader & EQ"
          >
            <Zap className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Dual Deck Audition</span>
          </button>

          <button
            onClick={onOpenExportModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Export</span>
          </button>

          <button
            onClick={onRunSort}
            disabled={isSorting || trackCount === 0}
            className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-lg transition shadow-md shadow-cyan-500/10 whitespace-nowrap ${
              isSorting || trackCount === 0
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : 'bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white border border-cyan-400/40'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${isSorting ? 'animate-spin' : ''}`} />
            <span>{isSorting ? 'Analyzing...' : 'Auto-Sort Set'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
