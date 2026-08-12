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
  Bot,
  RefreshCw,
  UserPlus,
  LogIn,
  Shield,
  User,
  Crown,
  Building2,
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
  onOpenRegister: () => void;
  onOpenLogin: () => void;
  onOpenAdmin: () => void;
  onOpenCheckout?: () => void;
  activeDJName?: string | null;
  isAdminLoggedIn?: boolean;
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
  onOpenRegister,
  onOpenLogin,
  onOpenAdmin,
  onOpenCheckout,
  activeDJName,
  isAdminLoggedIn,
  onRunSort,
  isSorting,
  trackCount,
}) => {
  const activeCrate = crates.find((c) => c.id === activeCrateId);

  return (
    <header id="app-header" className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col gap-3 w-full">
        {/* ROW 1: Branding, Crate Selector, Track Count & Primary File Actions */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-3 w-full">
          {/* Branding Block */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-3">
              <Logo size={48} showBackground={true} />

              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-bold tracking-wider text-slate-100 font-mono leading-tight">
                    SET ARCHITECT
                  </h1>
                  <span className="px-1.5 py-0.5 text-[9px] font-mono font-semibold tracking-wider text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 rounded-full">
                    v1.0 EXEC
                  </span>
                  <button
                    onClick={() => {
                      try {
                        localStorage.clear();
                        sessionStorage.clear();
                        if (typeof caches !== 'undefined') {
                          caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))).finally(() => {
                            window.location.reload();
                          });
                        } else {
                          window.location.reload();
                        }
                      } catch {
                        window.location.reload();
                      }
                    }}
                    className="p-1 text-slate-400 hover:text-cyan-400 transition"
                    title="Sync Live App (Purge Stale Cache)"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
                <span className="text-xs font-sans font-semibold text-cyan-400 tracking-wide leading-tight mt-0.5">
                  by AfroSenses
                </span>
              </div>
            </div>
          </div>

          {/* Crate Selector, Track Count & Primary File Actions */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto justify-start md:justify-end">
            {/* Crate Selector */}
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 max-w-full">
              <Layers className="w-4 h-4 text-cyan-400 shrink-0" />
              <select
                value={activeCrateId}
                onChange={(e) => onSelectCrate(e.target.value)}
                className="bg-transparent font-medium text-slate-200 outline-none cursor-pointer text-xs truncate max-w-[180px] sm:max-w-xs"
              >
                {crates.map((c) => (
                  <option key={c.id} value={c.id} className="bg-slate-900 text-slate-200">
                    {c.name} ({c.tracks.length} tracks)
                  </option>
                ))}
              </select>
            </div>

            {/* Track Count Pill */}
            <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-800/80 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-400">
              <ListMusic className="w-3.5 h-3.5 text-slate-400" />
              <span>{trackCount} Tracks</span>
            </div>

            {/* Add Track */}
            <button
              onClick={onOpenAddTrackModal}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-[#ff4e00] hover:bg-[#ff5e1a] text-black rounded-lg transition shadow-md shadow-[#ff4e00]/20 whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Add Track</span>
            </button>

            {/* Import XML / Crate */}
            <button
              onClick={onOpenImporter}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition border border-slate-700/60 whitespace-nowrap"
            >
              <FolderOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span>Import XML / Crate</span>
            </button>
          </div>
        </div>

        {/* ROW 2: Action Control Bar */}
        <div className="flex flex-wrap items-center justify-start md:justify-end gap-2 sm:gap-3 w-full pt-2 border-t border-slate-800/60">
          {/* DJ & Admin Portals */}
          <button
            onClick={onOpenRegister}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold font-mono rounded-lg transition border whitespace-nowrap bg-gradient-to-r from-cyan-950/80 to-blue-950/80 hover:from-cyan-900/80 hover:to-blue-900/80 text-cyan-300 border-cyan-800/60 w-full sm:w-auto"
            title="Register as a DJ on AfroSenses"
          >
            <UserPlus className="w-3.5 h-3.5 text-cyan-400" />
            <span>Register</span>
          </button>

          <button
            onClick={onOpenLogin}
            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold font-mono rounded-lg transition border whitespace-nowrap w-full sm:w-auto ${
              activeDJName
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 hover:bg-emerald-900/80'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
            }`}
            title="Sign into DJ Portal or check status"
          >
            <LogIn className="w-3.5 h-3.5 text-cyan-400" />
            <span>{activeDJName ? `DJ: ${activeDJName}` : 'Login'}</span>
          </button>

          <button
            onClick={onOpenAdmin}
            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold font-mono rounded-lg transition border whitespace-nowrap w-full sm:w-auto ${
              isAdminLoggedIn
                ? 'bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/20'
                : 'bg-slate-900 hover:bg-slate-800 text-amber-400 border-amber-900/60'
            }`}
            title="Open Admin Monitoring & DJ Approval Panel"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>{isAdminLoggedIn ? 'Admin (Active)' : 'Admin'}</span>
          </button>

          {/* Pricing & Manual EFT Checkout Button */}
          {onOpenCheckout && (
            <button
              onClick={onOpenCheckout}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold font-mono rounded-lg transition border border-emerald-500/50 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 whitespace-nowrap w-full sm:w-auto shadow-sm"
              title="View Pro/Executive pricing tiers and Capitec Manual EFT payment options"
            >
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Manual EFT / Upgrade</span>
            </button>
          )}

          {/* Tools & Mix Controls */}
          {onOpenAIMixer && (
            <button
              onClick={onOpenAIMixer}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black rounded-lg transition shadow-md shadow-cyan-500/20 whitespace-nowrap w-full sm:w-auto"
              title="Open AI Music Mixer & Set Fit Radar"
            >
              <Bot className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>AI Music Mixer</span>
            </button>
          )}

          <button
            onClick={onOpenCamelotWheel}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-cyan-900/60 rounded-lg transition whitespace-nowrap w-full sm:w-auto"
            title="View Camelot Key Radar & Distribution"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Camelot Radar</span>
          </button>

          <button
            onClick={onOpenDualDeck}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-900 hover:bg-slate-800 text-violet-400 border border-violet-900/60 rounded-lg transition whitespace-nowrap w-full sm:w-auto"
            title="Audition transitions live with Dual Deck crossfader & EQ"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Dual Deck Audition</span>
          </button>

          <button
            onClick={onOpenExportModal}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition whitespace-nowrap w-full sm:w-auto"
            title="Export playlist / crate"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Export</span>
          </button>

          <button
            onClick={onRunSort}
            disabled={isSorting || trackCount === 0}
            className={`flex items-center justify-center gap-2 px-4 py-1.5 text-xs font-bold rounded-lg transition shadow-md shadow-cyan-500/10 whitespace-nowrap w-full sm:w-auto ${
              isSorting || trackCount === 0
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : 'bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white border border-cyan-400/40'
            }`}
            title="Run harmonic auto-sort algorithm on set"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isSorting ? 'animate-spin' : ''}`} />
            <span>{isSorting ? 'Sorting...' : 'Auto-Sort Set'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};

