import { Track, TransitionAnalysis, CamelotKey, SetBlueprint } from '../types';
import { getCamelotStepDistance, analyzeTransitionType } from './camelot';

export interface TrackFitScore {
  trackId: string;
  overallScore: number; // 0 - 100
  bpmScore: number; // 0 - 100
  harmonicScore: number; // 0 - 100
  energyScore: number; // 0 - 100
  spectralScore: number; // 0 - 100
  bpmDelta: number;
  pitchBendPercent: number;
  harmonicRelation: string;
  subBassRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  aiInsight: string;
}

export interface SetCohesionReport {
  overallFitPercent: number;
  bpmConsistencyScore: number;
  harmonicFlowScore: number;
  energyTrajectoryScore: number;
  frequencyClashRiskScore: number;
  avgBpm: number;
  minBpm: number;
  maxBpm: number;
  keyClashCount: number;
  smoothTransitionCount: number;
  aiAdvisorSummary: string;
  keyInsights: string[];
}

/**
 * Calculates detailed AI Fit Score (0-100%) comparing a candidate track against a reference/anchor track
 */
export function calculateTrackFit(
  candidate: Track,
  referenceTrack: Track,
  targetEnergyScore?: number
): TrackFitScore {
  // 1. BPM Fit Calculation
  const bpmDelta = Math.abs(candidate.bpm - referenceTrack.bpm);
  const pitchBendPercent = Number((((candidate.bpm - referenceTrack.bpm) / referenceTrack.bpm) * 100).toFixed(1));
  let bpmScore = 100;
  if (bpmDelta === 0) {
    bpmScore = 100;
  } else if (bpmDelta <= 2) {
    bpmScore = 95 - bpmDelta * 2.5;
  } else if (bpmDelta <= 5) {
    bpmScore = 85 - (bpmDelta - 2) * 5;
  } else if (bpmDelta <= 10) {
    bpmScore = 65 - (bpmDelta - 5) * 6;
  } else {
    bpmScore = Math.max(10, 35 - (bpmDelta - 10) * 3);
  }

  // 2. Harmonic Key Fit Calculation
  const transInfo = analyzeTransitionType(
    referenceTrack.key,
    candidate.key,
    referenceTrack.des,
    candidate.des
  );

  let harmonicScore = 50;
  if (transInfo.distance === 0) {
    harmonicScore = 100; // Same key
  } else if (transInfo.distance === 1 && referenceTrack.key.letter === candidate.key.letter) {
    harmonicScore = 95; // Smooth adjacent step
  } else if (referenceTrack.key.number === candidate.key.number && referenceTrack.key.letter !== candidate.key.letter) {
    harmonicScore = 88; // Relative Major/Minor flip
  } else if (transInfo.distance === 2 && referenceTrack.key.letter === candidate.key.letter) {
    harmonicScore = 82; // Energy boost
  } else if (transInfo.distance === 1 && referenceTrack.key.letter !== candidate.key.letter) {
    harmonicScore = 78; // Dominant diagonal
  } else if (transInfo.distance === 7 && referenceTrack.key.letter === candidate.key.letter) {
    harmonicScore = 80; // Minor 3rd / +7 step boost
  } else {
    harmonicScore = Math.max(20, 60 - transInfo.distance * 8);
  }

  // 3. Energy Score Alignment
  const targetEnergy = targetEnergyScore !== undefined ? targetEnergyScore : referenceTrack.des;
  const energyDelta = Math.abs(candidate.des - targetEnergy);
  let energyScore = Math.max(10, Math.round(100 - energyDelta * 12));

  // 4. Spectral Sub-Bass & Mid-Range Separation
  const bothSubBass = (candidate.spectral?.subBassWeight || 5) > 7.0 && (referenceTrack.spectral?.subBassWeight || 5) > 7.0;
  let subBassRisk: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  let spectralScore = 95;

  if (bothSubBass) {
    subBassRisk = 'HIGH';
    spectralScore = 55;
  } else if ((candidate.spectral?.subBassWeight || 5) > 6.0 && (referenceTrack.spectral?.subBassWeight || 5) > 6.0) {
    subBassRisk = 'MEDIUM';
    spectralScore = 75;
  }

  // Overall Weighted Score Calculation
  const overallScore = Math.round(
    bpmScore * 0.35 + harmonicScore * 0.35 + energyScore * 0.18 + spectralScore * 0.12
  );

  // Generate AI Insight String
  let aiInsight = '';
  if (overallScore >= 90) {
    aiInsight = `🔥 Perfect Fit! ${candidate.bpm} BPM (${pitchBendPercent >= 0 ? '+' : ''}${pitchBendPercent}% pitch bend), harmonic key ${candidate.key.code} aligns smoothly with ${referenceTrack.key.code}.`;
  } else if (overallScore >= 75) {
    aiInsight = `✅ Great Match: ${candidate.bpm} BPM fits nicely with a small ${Math.abs(pitchBendPercent)}% pitch adjustment. ${transInfo.type.replace('_', ' ')}.`;
  } else if (overallScore >= 60) {
    aiInsight = `⚡ Moderate Match: Key shift required (${referenceTrack.key.code} → ${candidate.key.code}). Use EQ breakdown or drop-on-drop transition.`;
  } else {
    aiInsight = `⚠️ High Friction: BPM delta is ${bpmDelta.toFixed(1)} BPM and key distance is ${transInfo.distance} steps. Consider a reverb tail or loop transition.`;
  }

  return {
    trackId: candidate.id,
    overallScore,
    bpmScore: Math.round(bpmScore),
    harmonicScore: Math.round(harmonicScore),
    energyScore: Math.round(energyScore),
    spectralScore: Math.round(spectralScore),
    bpmDelta: Number(bpmDelta.toFixed(1)),
    pitchBendPercent,
    harmonicRelation: transInfo.type,
    subBassRisk,
    aiInsight,
  };
}

/**
 * Ranks all available tracks in a crate by how well they fit after a given reference track
 */
export function getRankedNextTracks(
  tracks: Track[],
  referenceTrackId: string,
  targetEnergy?: number
): { track: Track; fit: TrackFitScore }[] {
  const refTrack = tracks.find((t) => t.id === referenceTrackId);
  if (!refTrack) return [];

  const candidates = tracks.filter((t) => t.id !== referenceTrackId);

  return candidates
    .map((candidate) => ({
      track: candidate,
      fit: calculateTrackFit(candidate, refTrack, targetEnergy),
    }))
    .sort((a, b) => b.fit.overallScore - a.fit.overallScore);
}

/**
 * Analyzes an entire playlist sequence and generates a high-tech AI Cohesion Report
 */
export function evaluateSetCohesion(
  tracks: Track[],
  transitions: TransitionAnalysis[],
  targetCurve: number[]
): SetCohesionReport {
  if (tracks.length <= 1) {
    return {
      overallFitPercent: 100,
      bpmConsistencyScore: 100,
      harmonicFlowScore: 100,
      energyTrajectoryScore: 100,
      frequencyClashRiskScore: 100,
      avgBpm: tracks[0]?.bpm || 124,
      minBpm: tracks[0]?.bpm || 124,
      maxBpm: tracks[0]?.bpm || 124,
      keyClashCount: 0,
      smoothTransitionCount: 0,
      aiAdvisorSummary: 'Single track loaded. Add more tracks to compute continuous set flow analysis.',
      keyInsights: ['Load 2+ tracks to perform full BPM & harmonic set analysis.'],
    };
  }

  const bpms = tracks.map((t) => t.bpm || 124);
  const minBpm = Math.min(...bpms);
  const maxBpm = Math.max(...bpms);
  const avgBpm = Number((bpms.reduce((a, b) => a + b, 0) / bpms.length).toFixed(1));

  // 1. BPM Consistency Score
  let totalBpmDeltas = 0;
  for (let i = 0; i < bpms.length - 1; i++) {
    totalBpmDeltas += Math.abs(bpms[i + 1] - bpms[i]);
  }
  const avgBpmDelta = totalBpmDeltas / (bpms.length - 1);
  const bpmConsistencyScore = Math.max(20, Math.round(100 - avgBpmDelta * 12));

  // 2. Harmonic Flow & Key Clashes
  let keyClashCount = 0;
  let smoothTransitionCount = 0;
  let totalHarmonicScore = 0;

  transitions.forEach((t) => {
    if (t.harmonicDistance <= 1 || t.type === 'RELATIVE_SHIFT' || t.type === 'ENERGY_BOOST') {
      smoothTransitionCount++;
      totalHarmonicScore += 95;
    } else if (t.harmonicDistance === 2) {
      totalHarmonicScore += 80;
    } else {
      keyClashCount++;
      totalHarmonicScore += 40;
    }
  });

  const harmonicFlowScore = Math.round(totalHarmonicScore / transitions.length);

  // 3. Energy Trajectory Alignment
  let energyDeltaSum = 0;
  tracks.forEach((track, idx) => {
    const progress = idx / (tracks.length - 1);
    const curveIdx = Math.min(targetCurve.length - 1, Math.floor(progress * (targetCurve.length - 1)));
    const target = targetCurve[curveIdx];
    energyDeltaSum += Math.abs(track.des - target);
  });

  const avgEnergyErr = energyDeltaSum / tracks.length;
  const energyTrajectoryScore = Math.max(10, Math.round(100 - avgEnergyErr * 15));

  // 4. Frequency Clash Risk Score
  let highClashCount = 0;
  transitions.forEach((t) => {
    if (t.subBassClashRisk === 'HIGH') highClashCount++;
  });
  const frequencyClashRiskScore = Math.max(20, Math.round(100 - (highClashCount / transitions.length) * 100));

  // Overall Weighted Set Fit
  const overallFitPercent = Math.round(
    bpmConsistencyScore * 0.35 +
      harmonicFlowScore * 0.35 +
      energyTrajectoryScore * 0.2 +
      frequencyClashRiskScore * 0.1
  );

  // Key Insights Generator
  const keyInsights: string[] = [];
  keyInsights.push(
    `BPM Range: ${minBpm} - ${maxBpm} BPM (Avg: ${avgBpm} BPM, ${avgBpmDelta.toFixed(1)} avg step drift)`
  );
  keyInsights.push(
    `Harmonic Quality: ${smoothTransitionCount}/${transitions.length} seamless key transitions (${keyClashCount} key clashes)`
  );
  keyInsights.push(
    `Energy Arc Match: ${energyTrajectoryScore}% alignment with target energy curve`
  );
  if (highClashCount > 0) {
    keyInsights.push(
      `⚠️ Frequency Notice: ${highClashCount} transitions have high sub-bass overlap requiring crossover EQ filtering.`
    );
  } else {
    keyInsights.push(`✨ Frequency Balance: Excellent sub-bass separation across all transitions.`);
  }

  // AI Advisor Executive Summary
  let aiAdvisorSummary = '';
  if (overallFitPercent >= 90) {
    aiAdvisorSummary = `Masterclass Set Flow! Your playlist exhibits exceptional BPM lock (${avgBpm} BPM average) and flawless Camelot key transitions. The energy progression perfectly matches the selected blueprint.`;
  } else if (overallFitPercent >= 78) {
    aiAdvisorSummary = `Strong Performance Ready Set. BPM transitions are well within acceptable DJ pitch limits, with ${smoothTransitionCount} harmonically compatible track pairs. Minor EQ adjustments recommended on sub-bass drops.`;
  } else {
    aiAdvisorSummary = `Optimization Recommended. Your set contains ${keyClashCount} key conflicts and BPM jumps exceeding 5 BPM. Click 'AI AUTO-OPTIMIZE' to re-sequence tracks into a seamless harmonic journey.`;
  }

  return {
    overallFitPercent,
    bpmConsistencyScore,
    harmonicFlowScore,
    energyTrajectoryScore,
    frequencyClashRiskScore,
    avgBpm,
    minBpm,
    maxBpm,
    keyClashCount,
    smoothTransitionCount,
    aiAdvisorSummary,
    keyInsights,
  };
}
