import React from 'react';
import { Sliders, Sparkles, TrendingUp, ShieldAlert, Zap, Layers, RefreshCw } from 'lucide-react';
import { BlueprintType, SetBlueprint, SortingParameters } from '../types';
import { BLUEPRINTS } from '../lib/sortingAlgorithm';

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
  selectedBlueprint,
  onSelectBlueprint,
  params,
  onChangeParams,
  customCurve,
  onChangeCustomCurve,
  onRunSort,
  isSorting,
}) => {
  const currentBlueprint = BLUEPRINTS[selectedBlueprint];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-800/60 text-cyan-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono">
              SET BLUEPRINT & PARAMETERS
            </h2>
            <p className="text-xs text-slate-400">
              Select energy trajectory blueprint and key routing constraints
            </p>
          </div>
        </div>

        <button
          onClick={onRunSort}
          disabled={isSorting}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg transition shadow-md shadow-cyan-500/10 font-mono"
        >
          <Sparkles className={`w-3.5 h-3.5 ${isSorting ? 'animate-spin' : ''}`} />
          <span>RUN AUTO-SORT</span>
        </button>
      </div>

      {/* Blueprint Preset Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {(Object.keys(BLUEPRINTS) as BlueprintType[]).map((type) => {
          const bp = BLUEPRINTS[type];
          const isSelected = selectedBlueprint === type;

          return (
            <div
              key={type}
              onClick={() => onSelectBlueprint(type)}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-gradient-to-br from-slate-850 to-slate-800 border-cyan-500/80 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/50'
                  : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-xs font-bold font-mono ${isSelected ? 'text-cyan-400' : 'text-slate-200'}`}>
                    {bp.name}
                  </span>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-snug line-clamp-2 mb-2">
                  {bp.tagline}
                </p>
              </div>

              {/* Mini Sparkline Preview */}
              <div className="flex items-end gap-1 h-5 pt-1 border-t border-slate-800/60">
                {bp.targetCurve.map((val, idx) => (
                  <div
                    key={idx}
                    className={`flex-1 rounded-t-sm transition-all ${
                      isSelected ? 'bg-cyan-400' : 'bg-slate-700'
                    }`}
                    style={{ height: `${(val / 10) * 100}%` }}
                  ></div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Parameter Controls Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800/80">
        {/* Max BPM Drift */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium font-mono flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
              MAX BPM DRIFT
            </span>
            <span className="font-mono text-cyan-400 font-bold">±{params.maxBpmDrift} BPM</span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            step="1"
            value={params.maxBpmDrift}
            onChange={(e) =>
              onChangeParams({ ...params, maxBpmDrift: parseInt(e.target.value, 10) })
            }
            className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
          />
          <p className="text-[10px] text-slate-500">Maximum BPM stretch allowed between tracks</p>
        </div>

        {/* Key Priority vs Energy Weight */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium font-mono flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-violet-400" />
              KEY VS ENERGY
            </span>
            <span className="font-mono text-cyan-400 font-bold">
              {Math.round(params.keyPriorityWeight * 100)}% Key
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={params.keyPriorityWeight}
            onChange={(e) =>
              onChangeParams({ ...params, keyPriorityWeight: parseFloat(e.target.value) })
            }
            className="w-full accent-violet-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
          />
          <p className="text-[10px] text-slate-500">
            0% = Strict Energy Arc | 100% = Strict Harmonic Match
          </p>
        </div>

        {/* Sub-bass Frequency Protection */}
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800">
          <div className="space-y-0.5">
            <span className="text-xs font-mono font-medium text-slate-200 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
              BASS OVERLAP AI
            </span>
            <p className="text-[10px] text-slate-500">Prevent heavy sub-bass clashes</p>
          </div>
          <button
            onClick={() =>
              onChangeParams({
                ...params,
                avoidFrequencyClash: !params.avoidFrequencyClash,
              })
            }
            className={`w-9 h-5 rounded-full transition-colors relative flex items-center ${
              params.avoidFrequencyClash ? 'bg-cyan-500' : 'bg-slate-800'
            }`}
          >
            <span
              className={`w-3.5 h-3.5 rounded-full bg-slate-950 transition-transform ${
                params.avoidFrequencyClash ? 'translate-x-4.5' : 'translate-x-1'
              }`}
            ></span>
          </button>
        </div>

        {/* Energy Boost Toggle */}
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800">
          <div className="space-y-0.5">
            <span className="text-xs font-mono font-medium text-slate-200 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              ENERGY BOOSTS
            </span>
            <p className="text-[10px] text-slate-500">Allow +1/+2 semitone jumps</p>
          </div>
          <button
            onClick={() =>
              onChangeParams({
                ...params,
                allowEnergyBoosts: !params.allowEnergyBoosts,
              })
            }
            className={`w-9 h-5 rounded-full transition-colors relative flex items-center ${
              params.allowEnergyBoosts ? 'bg-cyan-500' : 'bg-slate-800'
            }`}
          >
            <span
              className={`w-3.5 h-3.5 rounded-full bg-slate-950 transition-transform ${
                params.allowEnergyBoosts ? 'translate-x-4.5' : 'translate-x-1'
              }`}
            ></span>
          </button>
        </div>
      </div>
    </div>
  );
};
