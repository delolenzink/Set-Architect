import React from 'react';
import { Sparkles, Disc, CheckCircle2, RefreshCw } from 'lucide-react';
import { BlueprintType, SortingParameters } from '../types';

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
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-800/80 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> CAMELOT WHEEL ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Sequences all uploaded tracks into a seamless, harmonically aligned Camelot Wheel progression (Exact Key matches, Relative Major/Minor shifts, and smooth adjacent modulations).
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
        <div className="px-2.5 py-1.5 rounded-lg bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
          <span>2. Relative Shift (8A ↔ 8B)</span>
        </div>
        <div className="px-2.5 py-1.5 rounded-lg bg-blue-950/60 border border-blue-800/60 text-blue-300 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-400"></span>
          <span>3. +1/-1 Step (8A → 9A)</span>
        </div>
        <div className="px-2.5 py-1.5 rounded-lg bg-violet-950/60 border border-violet-800/60 text-violet-300 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-violet-400"></span>
          <span>4. Diagonal (8A → 9B)</span>
        </div>
        <div className="px-2.5 py-1.5 rounded-lg bg-amber-950/60 border border-amber-800/60 text-amber-300 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          <span>5. Energy Boost (+2 Steps)</span>
        </div>
      </div>
    </div>
  );
};
