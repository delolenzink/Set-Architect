import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
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
  Crown,
  Lock,
} from 'lucide-react';
import { Crate } from '../types';
import { Logo } from './Logo';
import { getUserSubscriptionTier, TIER_DETAILS, SubscriptionTier } from '../lib/rbac';

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
  onOpenUpgradeModal: () => void;
  activeDJName?: string | null;
  isAdminLoggedIn?: boolean;
  onRunSort: () => void;
  isSorting: boolean;
  trackCount: number;
  hasActiveModal?: boolean;
  activeModalTitle?: string | null;
  onBackToStudio?: () => void;
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
  onOpenUpgradeModal,
  activeDJName,
  isAdminLoggedIn,
  onRunSort,
  isSorting,
  trackCount,
  hasActiveModal,
  activeModalTitle,
  onBackToStudio,
}) => {
  const [userTier, setUserTier] = useState<SubscriptionTier>(getUserSubscriptionTier());

  useEffect(() => {
    const handleTierChange = () => {
      setUserTier(getUserSubscriptionTier());
    };
    window.addEventListener('subscription_tier_changed', handleTierChange);
    return () => {
      window.removeEventListener('subscription_tier_changed', handleTierChange);
    };
  }, []);

  const tierDetail = TIER_DETAILS[userTier];

  return (
    <header id="app-header" className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col gap-3 w-full">
        {/* Active View Back Navigation Banner */}
        {hasActiveModal && onBackToStudio && (
          <div className="flex items-center justify-between p-2.5 bg-gradient-to-r from-cyan-950/90 via-slate-900 to-slate-950 border border-cyan-500/50 rounded-xl shadow-lg font-mono text-xs text-cyan-300">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>ACTIVE VIEW: <strong>{activeModalTitle || 'Modal View'}</strong></span>
            </div>
            <button
              onClick={onBackToStudio}
              className="flex items-center gap-1.5 px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold rounded-lg transition shadow-md shadow-cyan-500/20"
              title="Return to Main Set Studio"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>← BACK TO MAIN STUDIO</span>
            </button>
          </div>
        )}

        {/* ROW 1: Branding & Horizontal Top Toolbar Row */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-2 sm:gap-3 w-full">
          {/* Branding Block */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-3">
              <Logo size={44} showBackground={true} />

              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <h1 className="text-sm sm:text-lg font-bold tracking-wider text-slate-100 font-mono leading-tight">
                    SET ARCHITECT
                  </h1>

                  {/* Tier Badge */}
                  <button
                    onClick={onOpenUpgradeModal}
                    className={`px-1.5 sm:px-2 py-0.5 text-[9px] font-mono font-bold tracking-wider rounded-full border transition flex items-center gap-1 shrink-0 ${
                      userTier === 'EXECUTIVE'
                        ? 'bg-amber-950/80 text-amber-300 border-amber-500/80 hover:bg-amber-900/80 shadow-sm shadow-amber-500/20'
                        : userTier === 'PRO'
                        ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/80 hover:bg-cyan-900/80 shadow-sm shadow-cyan-500/20'
                        : 'bg-slate-900 text-slate-400 border-slate-700 hover:bg-slate-800'
                    }`}
                    title="Click to manage subscription plan & feature access"
                  >
                    {userTier === 'EXECUTIVE' ? (
                      <Crown className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400" />
                    ) : userTier === 'PRO' ? (
                      <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-cyan-400" />
                    ) : (
                      <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-500" />
                    )}
                    <span>{isAdminLoggedIn ? 'Tier 3 • Exec' : tierDetail.badgeLabel}</span>
                  </button>

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
                <span className="text-[10px] sm:text-xs font-sans font-semibold text-cyan-400 tracking-wide leading-tight">
                  by AfroSenses
                </span>
              </div>
            </div>
          </div>

          {/* Top Toolbar Items: Horizontal Flex Row */}
          <div className="flex flex-row items-center gap-1.5 sm:gap-2 w-full md:w-auto overflow-x-auto py-0.5 scrollbar-none justify-between md:justify-end">
            {/* Upgrade Button */}
            <button
              onClick={onOpenUpgradeModal}
              className="flex items-center justify-center gap-1 px-2.5 py-1.5 text-[0.75rem] font-bold font-mono rounded-lg transition border bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border-amber-500/50 shadow-md shadow-amber-500/10 shrink-0 whitespace-nowrap"
              title="Manage RBAC Subscription Plan"
            >
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>{userTier === 'FREE' ? 'Upgrade Plan' : 'Manage Tier'}</span>
            </button>

            {/* My Mix Set / Crate Selector */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[0.75rem] text-slate-300 shrink-0 max-w-[170px] sm:max-w-xs">
              <Layers className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="text-[10px] text-cyan-400 font-mono font-bold shrink-0 hidden xs:inline">Set:</span>
              <select
                value={activeCrateId}
                onChange={(e) => onSelectCrate(e.target.value)}
                className="bg-transparent font-medium text-slate-200 outline-none cursor-pointer text-[0.75rem] truncate w-full"
              >
                {crates.map((c) => (
                  <option key={c.id} value={c.id} className="bg-slate-900 text-slate-200">
                    {c.name} ({c.tracks.length} tracks)
                  </option>
                ))}
              </select>
            </div>

            {/* Track Count Pill */}
            <div
              className={`flex items-center gap-1 border rounded-lg px-2 py-1.5 text-[0.75rem] font-mono transition shrink-0 ${
                userTier === 'FREE' && trackCount >= 10
                  ? 'bg-amber-950/80 border-amber-500/80 text-amber-300'
                  : 'bg-slate-900/80 border-slate-800/80 text-slate-400'
              }`}
            >
              <ListMusic className="w-3.5 h-3.5" />
              <span>
                {trackCount} {userTier === 'FREE' ? '/ 10' : 'Tracks'}
              </span>
            </div>

            {/* Add Track */}
            <button
              onClick={onOpenAddTrackModal}
              className="flex items-center justify-center gap-1 px-2.5 py-1.5 text-[0.75rem] font-bold bg-[#ff4e00] hover:bg-[#ff5e1a] text-black rounded-lg transition shadow-md shadow-[#ff4e00]/20 whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Add Track</span>
            </button>
          </div>
        </div>

        {/* ROW 2: Compact 3-Column Grid for Core Actions (Register, Login, Admin, Import XML, Auto-Sort, AI Mixer) */}
        <div className="w-full pt-2 border-t border-slate-800/60">
          <div className="grid grid-cols-3 gap-1.5 w-full md:flex md:flex-wrap md:items-center md:justify-end md:gap-2">
            {/* 1. Register */}
            <button
              onClick={onOpenRegister}
              className="flex items-center justify-center gap-1 py-2 px-1 text-[0.75rem] font-bold font-mono rounded-lg transition border whitespace-nowrap bg-gradient-to-r from-cyan-950/80 to-blue-950/80 hover:from-cyan-900/80 hover:to-blue-900/80 text-cyan-300 border-cyan-800/60 w-full md:w-auto md:px-3"
              title="Register as a DJ on AfroSenses"
            >
              <UserPlus className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="truncate">Register</span>
            </button>

            {/* 2. Login */}
            <button
              onClick={onOpenLogin}
              className={`flex items-center justify-center gap-1 py-2 px-1 text-[0.75rem] font-bold font-mono rounded-lg transition border whitespace-nowrap w-full md:w-auto md:px-3 ${
                activeDJName
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 hover:bg-emerald-900/80'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
              }`}
              title="Sign into DJ Portal or check status"
            >
              <LogIn className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="truncate">{activeDJName ? `DJ: ${activeDJName}` : 'Login'}</span>
            </button>

            {/* 3. Admin */}
            <button
              onClick={onOpenAdmin}
              className={`flex items-center justify-center gap-1 py-2 px-1 text-[0.75rem] font-bold font-mono rounded-lg transition border whitespace-nowrap w-full md:w-auto md:px-3 ${
                isAdminLoggedIn
                  ? 'bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/20'
                  : 'bg-slate-900 hover:bg-slate-800 text-amber-400 border-amber-900/60'
              }`}
              title="Open Admin Monitoring & DJ Approval Panel"
            >
              <Shield className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{isAdminLoggedIn ? 'Admin' : 'Admin'}</span>
            </button>

            {/* 4. Import XML */}
            <button
              onClick={onOpenImporter}
              className={`flex items-center justify-center gap-1 py-2 px-1 text-[0.75rem] font-bold font-mono rounded-lg transition border whitespace-nowrap w-full md:w-auto md:px-3 ${
                userTier === 'FREE'
                  ? 'bg-slate-900 text-slate-400 border-slate-800 hover:border-cyan-500/60'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700/60'
              }`}
              title={userTier === 'FREE' ? 'XML/Crate import requires Pro tier' : 'Import XML or Crate'}
            >
              <FolderOpen className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="truncate">Import XML</span>
              {userTier === 'FREE' && <Lock className="w-3 h-3 text-amber-400 shrink-0" />}
            </button>

            {/* 5. Auto-Sort */}
            <button
              onClick={onRunSort}
              disabled={isSorting || trackCount === 0}
              className={`flex items-center justify-center gap-1 py-2 px-1 text-[0.75rem] font-bold font-mono rounded-lg transition shadow-md shadow-cyan-500/10 whitespace-nowrap w-full md:w-auto md:px-3.5 ${
                isSorting || trackCount === 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white border border-cyan-400/40'
              }`}
              title={userTier === 'FREE' ? 'Auto-Sorting in Exact-Match Camelot mode (Tier 1)' : 'Run harmonic auto-sort algorithm'}
            >
              <Sparkles className={`w-3.5 h-3.5 shrink-0 ${isSorting ? 'animate-spin' : ''}`} />
              <span className="truncate">{isSorting ? 'Sorting...' : 'Auto-Sort'}</span>
            </button>

            {/* 6. AI Mixer */}
            {onOpenAIMixer && (
              <button
                onClick={onOpenAIMixer}
                className={`flex items-center justify-center gap-1 py-2 px-1 text-[0.75rem] font-bold font-mono rounded-lg transition shadow-md whitespace-nowrap w-full md:w-auto md:px-3 ${
                  userTier === 'EXECUTIVE'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black shadow-cyan-500/20'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
                title={userTier !== 'EXECUTIVE' ? 'AI Music Mixer requires Executive tier' : 'Open AI Music Mixer'}
              >
                <Bot className="w-3.5 h-3.5 stroke-[2.5] text-cyan-400 shrink-0" />
                <span className="truncate">AI Mixer</span>
                {userTier !== 'EXECUTIVE' && <Lock className="w-3 h-3 text-amber-400 shrink-0" />}
              </button>
            )}

            {/* Redundant Inline Links: Hidden on mobile (< md) as primary navigation is handled by sticky bottom bar */}
            <button
              onClick={onOpenCamelotWheel}
              className="hidden md:flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-cyan-900/60 rounded-lg transition whitespace-nowrap"
              title="View Camelot Key Radar & Distribution"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Camelot Radar</span>
            </button>

            <button
              onClick={onOpenDualDeck}
              className="hidden md:flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-slate-900 hover:bg-slate-800 text-violet-400 border border-violet-900/60 rounded-lg transition whitespace-nowrap"
              title="Audition transitions live with Dual Deck crossfader & EQ"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Dual Deck Audition</span>
            </button>

            <button
              onClick={onOpenExportModal}
              className={`hidden md:flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition whitespace-nowrap border ${
                userTier === 'FREE'
                  ? 'bg-slate-900 text-slate-400 border-slate-800'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
              title={userTier === 'FREE' ? 'Exports require Pro tier' : 'Export playlist / crate'}
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Export</span>
              {userTier === 'FREE' && <Lock className="w-3 h-3 text-amber-400 ml-0.5" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

