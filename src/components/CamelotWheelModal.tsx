import React from 'react';
import { X, Info, Zap, Sparkles } from 'lucide-react';
import { Track, TransitionAnalysis } from '../types';
import { getCamelotColor } from '../lib/camelot';

interface CamelotWheelModalProps {
  isOpen: boolean;
  onClose: () => void;
  tracks: Track[];
  transitions: TransitionAnalysis[];
}

export const CamelotWheelModal: React.FC<CamelotWheelModalProps> = ({
  isOpen,
  onClose,
  tracks,
  transitions,
}) => {
  if (!isOpen) return null;

  // 12 Camelot Positions (1 to 12 around 360 degrees)
  // Angle for each number (12 is at top 270deg or -90deg)
  const getAngle = (num: number) => ((num - 3) * 30 * Math.PI) / 180;

  // Group tracks by Camelot Code (e.g. "8A": [track1, track2])
  const tracksByKey: Record<string, Track[]> = {};
  tracks.forEach((t) => {
    const code = t.key.code;
    if (!tracksByKey[code]) tracksByKey[code] = [];
    tracksByKey[code].push(t);
  });

  const width = 440;
  const height = 440;
  const centerX = width / 2;
  const centerY = height / 2;
  const outerRadius = 180;
  const innerRadius = 120;

  // Helper to get X, Y for a Camelot Code
  const getPosition = (code: string) => {
    const num = parseInt(code, 10);
    const isMajor = code.includes('B');
    const angle = getAngle(num);
    const radius = isMajor ? outerRadius : innerRadius;

    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-100 font-mono flex items-center gap-2">
              <Zap className="w-5 h-5 text-cyan-400" />
              HARMONIC CAMELOT RADAR
            </h3>
            <p className="text-xs text-slate-400">
              Interactive 12-step wheel showing key distribution & transition trajectories
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wheel SVG Canvas */}
        <div className="flex-1 flex items-center justify-center py-4 overflow-auto">
          <svg width={width} height={height} className="overflow-visible max-w-full h-auto">
            {/* Background Radial Guides */}
            <circle cx={centerX} cy={centerY} r={outerRadius} fill="none" stroke="#1e293b" strokeWidth="2" />
            <circle cx={centerX} cy={centerY} r={innerRadius} fill="none" stroke="#1e293b" strokeWidth="2" strokeDasharray="4 4" />
            <circle cx={centerX} cy={centerY} r={50} fill="none" stroke="#0f172a" strokeWidth="2" />

            {/* Transition Arc Paths between sequence steps */}
            {tracks.map((track, idx) => {
              if (idx === tracks.length - 1) return null;
              const nextTrack = tracks[idx + 1];
              const pos1 = getPosition(track.key.code);
              const pos2 = getPosition(nextTrack.key.code);

              const trans = transitions[idx];
              let strokeColor = '#06b6d4'; // default cyan
              if (trans?.type === 'EXACT_HARMONIC') strokeColor = '#10b981'; // green
              else if (trans?.type === 'ENERGY_BOOST') strokeColor = '#f59e0b'; // amber
              else if (trans?.type === 'RELATIVE_SHIFT') strokeColor = '#8b5cf6'; // purple
              else if (trans?.type === 'HARMONIC_CLASH') strokeColor = '#ef4444'; // red

              return (
                <g key={`arc-${idx}`}>
                  <line
                    x1={pos1.x}
                    y1={pos1.y}
                    x2={pos2.x}
                    y2={pos2.y}
                    stroke={strokeColor}
                    strokeWidth="2.5"
                    strokeOpacity="0.75"
                    strokeDasharray={trans?.type === 'HARMONIC_CLASH' ? '4 4' : 'none'}
                  />
                  {/* Step number marker along midpoint */}
                  <circle
                    cx={(pos1.x + pos2.x) / 2}
                    cy={(pos1.y + pos2.y) / 2}
                    r="8"
                    fill="#0f172a"
                    stroke={strokeColor}
                    strokeWidth="1.5"
                  />
                  <text
                    x={(pos1.x + pos2.x) / 2}
                    y={(pos1.y + pos2.y) / 2 + 3}
                    textAnchor="middle"
                    fill="#e2e8f0"
                    fontSize="9"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {idx + 1}
                  </text>
                </g>
              );
            })}

            {/* 12 Outer Major Keys (1B to 12B) */}
            {Array.from({ length: 12 }).map((_, i) => {
              const num = (i + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
              const codeB = `${num}B`;
              const pos = getPosition(codeB);
              const count = tracksByKey[codeB]?.length || 0;
              const color = getCamelotColor(codeB);

              return (
                <g key={codeB} className="cursor-pointer group">
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={count > 0 ? 18 : 14}
                    fill={count > 0 ? color : '#0f172a'}
                    stroke={color}
                    strokeWidth={count > 0 ? '3' : '1.5'}
                    opacity={count > 0 ? 1 : 0.4}
                  />
                  <text
                    x={pos.x}
                    y={pos.y + 4}
                    textAnchor="middle"
                    fill={count > 0 ? '#020617' : '#94a3b8'}
                    fontSize="11"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {codeB}
                  </text>
                  {count > 0 && (
                    <text
                      x={pos.x}
                      y={pos.y - 20}
                      textAnchor="middle"
                      fill="#06b6d4"
                      fontSize="10"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {count}x
                    </text>
                  )}
                </g>
              );
            })}

            {/* 12 Inner Minor Keys (1A to 12A) */}
            {Array.from({ length: 12 }).map((_, i) => {
              const num = (i + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
              const codeA = `${num}A`;
              const pos = getPosition(codeA);
              const count = tracksByKey[codeA]?.length || 0;
              const color = getCamelotColor(codeA);

              return (
                <g key={codeA} className="cursor-pointer group">
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={count > 0 ? 18 : 13}
                    fill={count > 0 ? color : '#0f172a'}
                    stroke={color}
                    strokeWidth={count > 0 ? '3' : '1.5'}
                    opacity={count > 0 ? 1 : 0.4}
                  />
                  <text
                    x={pos.x}
                    y={pos.y + 4}
                    textAnchor="middle"
                    fill={count > 0 ? '#020617' : '#94a3b8'}
                    fontSize="11"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {codeA}
                  </text>
                  {count > 0 && (
                    <text
                      x={pos.x}
                      y={pos.y - 20}
                      textAnchor="middle"
                      fill="#06b6d4"
                      fontSize="10"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {count}x
                    </text>
                  )}
                </g>
              );
            })}

            {/* Center Label */}
            <circle cx={centerX} cy={centerY} r={32} fill="#020617" stroke="#334155" strokeWidth="2" />
            <text x={centerX} y={centerY - 4} textAnchor="middle" fill="#06b6d4" fontSize="10" fontWeight="bold" fontFamily="monospace">
              CAMELOT
            </text>
            <text x={centerX} y={centerY + 10} textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="monospace">
              12 WHEEL
            </text>
          </svg>
        </div>

        {/* Legend */}
        <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span> Exact / Smooth
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500"></span> Energy Boost (+1/+2)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-violet-500"></span> Relative Shift
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500"></span> Key Clash
            </span>
          </div>

          <span className="font-mono text-slate-500 text-[11px]">Outer = Major (B) | Inner = Minor (A)</span>
        </div>
      </div>
    </div>
  );
};
