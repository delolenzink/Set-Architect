import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { BlueprintType, SetBlueprint, Track, TransitionAnalysis } from '../types';
import { BLUEPRINTS, getTargetEnergyForStep } from '../lib/sortingAlgorithm';
import { Activity } from 'lucide-react';

interface EnergyTrajectoryChartProps {
  tracks: Track[];
  transitions: TransitionAnalysis[];
  blueprintType: BlueprintType;
  customCurve?: number[];
}

export const EnergyTrajectoryChart: React.FC<EnergyTrajectoryChartProps> = ({
  tracks,
  transitions,
  blueprintType,
  customCurve,
}) => {
  const blueprint = BLUEPRINTS[blueprintType];
  const targetCurve = customCurve || blueprint.targetCurve;

  // Build chart dataset
  const data = tracks.map((track, idx) => {
    const targetEnergy = Number(getTargetEnergyForStep(idx, tracks.length, targetCurve).toFixed(1));
    const transition = transitions[idx - 1]; // transition leading into this track

    return {
      step: idx + 1,
      title: track.title,
      artist: track.artist,
      bpm: track.bpm,
      key: track.key.code,
      actualDES: track.des,
      targetDES: targetEnergy,
      subBass: track.spectral.subBassWeight,
      transitionType: transition?.type || 'START',
    };
  });

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl backdrop-blur-md">
      {/* Chart Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-violet-950/80 border border-violet-800/60 text-violet-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono">
              HARMONIC & ENERGY SEQUENCE PROFILE
            </h3>
            <p className="text-xs text-slate-400">
              Energy trajectory across the auto-sorted harmonic key sequence
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-cyan-400 border-b border-dashed border-cyan-400"></span>
            <span className="text-slate-400">Target Blueprint ({blueprint.name})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-2 rounded bg-violet-500"></span>
            <span className="text-slate-200">Track Energy (DES)</span>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-56 w-full pt-2">
        {tracks.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono">
            No tracks in playlist. Import or select a crate to generate trajectory.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="step"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                fontFamily="monospace"
                tickFormatter={(val) => `#${val}`}
              />
              <YAxis
                domain={[1, 10]}
                ticks={[2, 4, 6, 8, 10]}
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                fontFamily="monospace"
              />

              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    return (
                      <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 shadow-2xl text-xs font-mono max-w-xs z-50">
                        <div className="font-bold text-cyan-400 mb-1">
                          #{item.step} {item.title}
                        </div>
                        <div className="text-slate-400 mb-2">{item.artist}</div>
                        <div className="grid grid-cols-2 gap-[2px] text-[11px] text-slate-300 border-t border-slate-800 pt-1.5">
                          <div>
                            BPM: <span className="text-amber-400">{item.bpm}</span>
                          </div>
                          <div>
                            Key: <span className="text-cyan-400">{item.key}</span>
                          </div>
                          <div>
                            DES Rating: <span className="text-violet-400">{item.actualDES}</span>
                          </div>
                          <div>
                            Target DES: <span className="text-slate-400">{item.targetDES}</span>
                          </div>
                          <div className="col-span-2 pt-1 text-emerald-400 text-[10px]">
                            Sub-Bass Weight: {item.subBass}/10
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              {/* Peak Energy Reference Line */}
              <ReferenceLine y={8.5} stroke="#f59e0b" strokeDasharray="2 2" label={{ value: 'PEAK ZONE', fill: '#f59e0b', fontSize: 9, position: 'insideTopRight' }} />

              {/* Target Curve */}
              <Area
                type="monotone"
                dataKey="targetDES"
                stroke="#06b6d4"
                strokeWidth={2}
                strokeDasharray="4 4"
                fillOpacity={1}
                fill="url(#colorTarget)"
              />

              {/* Actual Track DES Curve */}
              <Area
                type="monotone"
                dataKey="actualDES"
                stroke="#8b5cf6"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorActual)"
                activeDot={{ r: 6, fill: '#06b6d4', stroke: '#ffffff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
