import React, { useState, useEffect } from 'react';
import { Sparkles, Disc, CheckCircle2, RefreshCw, Lock } from 'lucide-react';
import { BlueprintType, SortingParameters } from '../types';
import { getUserSubscriptionTier, SubscriptionTier } from '../lib/rbac';

interface BlueprintSelectorProps {
  selectedBlueprint: BlueprintType;
  onSelectBlueprint: (type: BlueprintType) => void;
  params: SortingParameters;
  onChangeParams: (params: SortingParameters) => void;
  customCurve: number[];
  onChangeCustomCurve: (curve: number[]) => void;
  onRunSort: () => void;
  isSorting: boolean;
}

export const BlueprintSelector: React.FC<BlueprintSelectorProps> = ({
  onRunSort,
  isSorting,
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

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl backdrop-blur-md">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-950 to-blue-950 border border-cyan-800/80 text-cyan-400 shadow-inner">
            <Disc className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-100 font-mono tracking-wide">
                HARMONIC KEY AUTO-SORTER
              </h2>
              <span className={`px-2 py-0.5 text-[10px] font-mono font-bold border rounded-full flex items-center gap-1 ${
                userTier === 'FREE'
                  ? 'bg-amber-950/80 text-amber-300 border-amber-800/80'
                  : 'bg-cyan-950 text-cyan-400 border-cyan-800/80'
              }`}>
                <CheckCircle2 className="w-3 h-3" />
                {userTier === 'FREE' ? 'TIER 1 • EXACT MATCHES ONLY' : 'FULL CAMELOT ENGINE ACTIVE'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              {userTier === 'FREE'
                ? 'Free Tier: Sorting restricted to exact Camelot key matches only (8A → 8A). Upgrade to Pro (R179/mo) to unlock relative shifts, diagonal steps, and +2 energy boosts.'
                : 'Pro/Exec Engine: Sequences all uploaded tracks into a seamless Camelot Wheel progression (Exact matches, Relative Major/Minor shifts, ±1 steps, Diagonals, and +2 Energy Boosts).'}
            </p>
          </div>
        </div>

        <button
          onClick={onRunSort}
          disabled={isSorting}
          className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 rounded-xl transition shadow-lg shadow-cyan-500/20 font-mono whitespace-nowrap active:scale-95 disabled:opacity-50"
        >
          {isSorting ? (
            <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
          ) : (
            <Sparkles className="w-4 h-4 fill-slate-950 text-slate-950" />
          )}
          <span>{isSorting ? 'SORTING BY KEY...' : 'SORT TRACKS BY KEY'}</span>
        </button>
      </div>

      {/* Key Harmonization Rules Legend */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mt-4 pt-4 border-t border-slate-800/80 font-mono text-[11px]">
        <div className="px-2.5 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>1. Exact Key (8A → 8A)</span>
        </div>
        <div className={`px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 ${
          userTier === 'FREE' ? 'bg-slate-950/60 border-slate-800/80 text-slate-500' : 'bg-cyan-950/60 border-cyan-800/60 text-cyan-300'
        }`}>
          {userTier === 'FREE' ? <Lock className="w-3 h-3 text-amber-400" /> : <span className="w-2 h-2 rounded-full bg-cyan-400"></span>}
          <span>2. Relative Shift {userTier === 'FREE' && '(Pro)'}</span>
        </div>
        <div className={`px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 ${
          userTier === 'FREE' ? 'bg-slate-950/60 border-slate-800/80 text-slate-500' : 'bg-blue-950/60 border-blue-800/60 text-blue-300'
        }`}>
          {userTier === 'FREE' ? <Lock className="w-3 h-3 text-amber-400" /> : <span className="w-2 h-2 rounded-full bg-blue-400"></span>}
          <span>3. +1/-1 Step {userTier === 'FREE' && '(Pro)'}</span>
        </div>
        <div className={`px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 ${
          userTier === 'FREE' ? 'bg-slate-950/60 border-slate-800/80 text-slate-500' : 'bg-violet-950/60 border-violet-800/60 text-violet-300'
        }`}>
          {userTier === 'FREE' ? <Lock className="w-3 h-3 text-amber-400" /> : <span className="w-2 h-2 rounded-full bg-violet-400"></span>}
          <span>4. Diagonal {userTier === 'FREE' && '(Pro)'}</span>
        </div>
        <div className={`px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 ${
          userTier === 'FREE' ? 'bg-slate-950/60 border-slate-800/80 text-slate-500' : 'bg-amber-950/60 border-amber-800/60 text-amber-300'
        }`}>
          {userTier === 'FREE' ? <Lock className="w-3 h-3 text-amber-400" /> : <span className="w-2 h-2 rounded-full bg-amber-400"></span>}
          <span>5. +2 Energy Boost {userTier === 'FREE' && '(Pro)'}</span>
        </div>
      </div>
    </div>
  );
};
