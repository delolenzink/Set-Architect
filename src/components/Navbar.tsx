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

        {/* ROW 1: Branding, Subscription Badge, Crate Selector & Primary File Actions */}
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

                  {/* Tier Badge */}
                  <button
                    onClick={onOpenUpgradeModal}
                    className={`px-2 py-0.5 text-[9px] font-mono font-bold tracking-wider rounded-full border transition flex items-center gap-1 ${
                      userTier === 'EXECUTIVE'
                        ? 'bg-amber-950/80 text-amber-300 border-amber-500/80 hover:bg-amber-900/80 shadow-sm shadow-amber-500/20'
                        : userTier === 'PRO'
                        ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/80 hover:bg-cyan-900/80 shadow-sm shadow-cyan-500/20'
                        : 'bg-slate-900 text-slate-400 border-slate-700 hover:bg-slate-800'
                    }`}
                    title="Click to manage subscription plan & feature access"
                  >
                    {userTier === 'EXECUTIVE' ? (
                      <Crown className="w-3 h-3 text-amber-400" />
                    ) : userTier === 'PRO' ? (
                      <Zap className="w-3 h-3 text-cyan-400" />
                    ) : (
                      <Lock className="w-3 h-3 text-slate-500" />
                    )}
                    <span>{isAdminLoggedIn ? 'Tier 3 • Executive (Admin)' : tierDetail.badgeLabel}</span>
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
                <span className="text-xs font-sans font-semibold text-cyan-400 tracking-wide leading-tight mt-0.5">
                  by AfroSenses
                </span>
              </div>
            </div>
          </div>

          {/* Crate Selector, Track Count & Primary File Actions */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto justify-start md:justify-end">
            {/* Upgrade Button */}
            <button
              onClick={onOpenUpgradeModal}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold font-mono rounded-lg transition border bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border-amber-500/50 shadow-md shadow-amber-500/10"
              title="Manage RBAC Subscription Plan"
            >
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>{userTier === 'FREE' ? 'Upgrade Plan' : 'Manage Tier'}</span>
            </button>

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

            {/* Track Count Pill (Shows Free limit warning if near 10) */}
            <div
              className={`flex items-center gap-1.5 border rounded-lg px-2.5 py-1.5 text-xs font-mono transition ${
                userTier === 'FREE' && trackCount >= 10
                  ? 'bg-amber-950/80 border-amber-500/80 text-amber-300'
                  : 'bg-slate-900/80 border-slate-800/80 text-slate-400'
              }`}
            >
              <ListMusic className="w-3.5 h-3.5" />
              <span>
                {trackCount} {userTier === 'FREE' ? '/ 10 (Free Cap)' : 'Tracks'}
              </span>
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
              className={`flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition border whitespace-nowrap ${
                userTier === 'FREE'
                  ? 'bg-slate-900 text-slate-400 border-slate-800 hover:border-cyan-500/60'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700/60'
              }`}
              title={userTier === 'FREE' ? 'XML/Crate import requires Pro tier' : 'Import XML or Crate'}
            >
              <FolderOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span>Import XML / Crate</span>
              {userTier === 'FREE' && <Lock className="w-3 h-3 text-amber-400 ml-0.5" />}
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

          {/* Tools & Mix Controls */}
          {onOpenAIMixer && (
            <button
              onClick={onOpenAIMixer}
              className={`flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition shadow-md whitespace-nowrap w-full sm:w-auto ${
                userTier === 'EXECUTIVE'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black shadow-cyan-500/20'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
              title={userTier !== 'EXECUTIVE' ? 'AI Music Mixer requires Executive tier' : 'Open AI Music Mixer'}
            >
              <Bot className="w-3.5 h-3.5 stroke-[2.5] text-cyan-400" />
              <span>AI Music Mixer</span>
              {userTier !== 'EXECUTIVE' && <Lock className="w-3 h-3 text-amber-400 ml-0.5" />}
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
            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition whitespace-nowrap w-full sm:w-auto border ${
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

          <button
            onClick={onRunSort}
            disabled={isSorting || trackCount === 0}
            className={`flex items-center justify-center gap-2 px-4 py-1.5 text-xs font-bold rounded-lg transition shadow-md shadow-cyan-500/10 whitespace-nowrap w-full sm:w-auto ${
              isSorting || trackCount === 0
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : 'bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white border border-cyan-400/40'
            }`}
            title={userTier === 'FREE' ? 'Auto-Sorting in Exact-Match Camelot mode (Tier 1)' : 'Run harmonic auto-sort algorithm'}
          >
            <Sparkles className={`w-3.5 h-3.5 ${isSorting ? 'animate-spin' : ''}`} />
            <span>{isSorting ? 'Sorting...' : 'Auto-Sort Set'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};

