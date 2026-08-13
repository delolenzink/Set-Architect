import { BlueprintType, SetBlueprint, SortingParameters, Track, TransitionAnalysis } from '../types';
import { analyzeTransitionType, getCamelotStepDistance } from './camelot';
import { getUserSubscriptionTier } from './rbac';

export const BLUEPRINTS: Record<BlueprintType, SetBlueprint> = {
  PEAK_MOUNTAIN: {
    id: 'PEAK_MOUNTAIN',
    name: 'Harmonic Set Flow',
    tagline: 'In-Key Camelot Wheel Progression',
    description: 'Auto-sequences tracks for smooth harmonic transitions around the Camelot Wheel.',
    targetCurve: [5, 5, 6, 7, 8, 8, 7, 6, 5, 5],
  },
  PROGRESSIVE_RAMP: {
    id: 'PROGRESSIVE_RAMP',
    name: 'Progressive Ramp',
    tagline: 'Continuous Step-by-Step Energy Escalation',
    description: 'Constant energy climb from first track to last track.',
    targetCurve: [3.5, 4.2, 5.0, 5.8, 6.5, 7.3, 8.0, 8.7, 9.3, 9.8],
  },
  SUNSET_WARMUP: {
    id: 'SUNSET_WARMUP',
    name: 'Sunset / Warm-Up',
    tagline: 'Steady Low-BPM Melodic Floor',
    description: 'Sustained mid-energy floor focusing on smooth harmonic transitions.',
    targetCurve: [4.0, 4.5, 5.0, 5.5, 6.0, 6.2, 6.0, 5.8, 5.2, 4.5],
  },
  CUSTOM: {
    id: 'CUSTOM',
    name: 'Custom Energy Blueprint',
    tagline: 'User-Defined Target Energy Arc',
    description: 'Fully customizable target energy trajectory.',
    targetCurve: [4.0, 5.0, 6.0, 7.0, 8.0, 8.0, 7.0, 6.0, 5.0, 4.0],
  },
};

/**
 * Gets interpolated target energy for track index out of N total tracks
 */
export function getTargetEnergyForStep(stepIndex: number, totalTracks: number, targetCurve: number[]): number {
  if (totalTracks <= 1) return targetCurve[0];
  const progress = stepIndex / (totalTracks - 1);
  const indexFloat = progress * (targetCurve.length - 1);
  const lowIndex = Math.floor(indexFloat);
  const highIndex = Math.min(targetCurve.length - 1, Math.ceil(indexFloat));
  const fraction = indexFloat - lowIndex;

  return targetCurve[lowIndex] * (1 - fraction) + targetCurve[highIndex] * fraction;
}

/**
 * Calculates transition penalty score between two tracks based purely on Camelot Key compatibility.
 * In-key transitions (Exact Match, Relative Major/Minor, Smooth Adjacent Camelot Step, Dominant Diagonal, Energy Boost)
 * are heavily favored, while key clashes receive massive penalties.
 * Small BPM delta serves as a smooth tie-breaker.
 */
function getHarmonicKeyPenalty(prevTrack: Track, candidate: Track, isExactOnly: boolean = false): number {
  const stepDist = getCamelotStepDistance(prevTrack.key.number, candidate.key.number);
  const sameLetter = prevTrack.key.letter === candidate.key.letter;
  const sameCode = prevTrack.key.code === candidate.key.code;

  let harmonicCost = 0;

  if (isExactOnly) {
    // Tier 1 (Free) restricts key sorting to exact Camelot matches only
    if (sameCode) {
      harmonicCost = 0; // Exact key match allowed
    } else {
      harmonicCost = 100000; // Restricted on Free tier
    }
  } else {
    if (sameCode) {
      harmonicCost = 0; // Exact key match (e.g. 8A -> 8A)
    } else if (prevTrack.key.number === candidate.key.number && !sameLetter) {
      harmonicCost = 0.5; // Relative Major / Minor shift (e.g. 8A <-> 8B)
    } else if (stepDist === 1 && sameLetter) {
      harmonicCost = 1.0; // Smooth adjacent Camelot step (e.g. 8A -> 9A or 8A -> 7A)
    } else if (stepDist === 1 && !sameLetter) {
      harmonicCost = 2.0; // Dominant diagonal (e.g. 8A -> 9B or 8A -> 7B)
    } else if (stepDist === 2 && sameLetter) {
      harmonicCost = 3.0; // Energy boost / 2-step Camelot jump (e.g. 8A -> 10A)
    } else if (stepDist === 7 && sameLetter) {
      harmonicCost = 3.5; // Semitone boost (+7 steps e.g. 8A -> 3A)
    } else if (stepDist === 2 && !sameLetter) {
      harmonicCost = 5.0; // 2-step diagonal jump
    } else {
      // HARMONIC CLASH (> 2 steps away)
      harmonicCost = 10000 + stepDist * 1000;
    }
  }

  // Smooth BPM transition tie-breaker (small penalty for tempo differences)
  const bpmDelta = Math.abs(candidate.bpm - prevTrack.bpm);
  const bpmCost = bpmDelta * 0.2;

  return harmonicCost + bpmCost;
}

interface PathCandidate {
  sequence: Track[];
  unvisitedIds: Set<string>;
  totalCost: number;
}

/**
 * Auto-sorts uploaded tracks purely according to Camelot Harmonic Key compatibility.
 * Uses Beam Search path optimization so the track sequence is guaranteed to follow
 * a seamless in-key Camelot Wheel progression.
 */
export function sortPlaylist(
  tracks: Track[],
  _blueprintType?: BlueprintType,
  _params?: SortingParameters,
  _customCurve?: number[]
): { sortedTracks: Track[]; transitions: TransitionAnalysis[] } {
  if (tracks.length <= 1) {
    return { sortedTracks: [...tracks], transitions: [] };
  }

  const N = tracks.length;
  const trackMap = new Map<string, Track>();
  tracks.forEach((t) => trackMap.set(t.id, t));

  // Initialize Beam Search paths starting from every track in the crate
  let beam: PathCandidate[] = tracks.map((startTrack) => {
    const unvisited = new Set(tracks.map((t) => t.id));
    unvisited.delete(startTrack.id);
    return {
      sequence: [startTrack],
      unvisitedIds: unvisited,
      totalCost: 0,
    };
  });

  const beamWidth = Math.min(120, Math.max(40, tracks.length * 8));

  const userTier = getUserSubscriptionTier();
  const isExactOnly = userTier === 'FREE';

  // Iteratively extend each path by picking the best in-key candidate
  for (let step = 1; step < N; step++) {
    const nextBeam: PathCandidate[] = [];

    for (const path of beam) {
      const lastTrack = path.sequence[path.sequence.length - 1];

      for (const candidateId of path.unvisitedIds) {
        const candidate = trackMap.get(candidateId)!;
        const penalty = getHarmonicKeyPenalty(lastTrack, candidate, isExactOnly);

        const newUnvisited = new Set(path.unvisitedIds);
        newUnvisited.delete(candidateId);

        nextBeam.push({
          sequence: [...path.sequence, candidate],
          unvisitedIds: newUnvisited,
          totalCost: path.totalCost + penalty,
        });
      }
    }

    // Sort paths by lowest cumulative harmonic key cost and keep top `beamWidth`
    nextBeam.sort((a, b) => a.totalCost - b.totalCost);
    beam = nextBeam.slice(0, beamWidth);
  }

  const bestPath = beam[0];
  const sorted = bestPath ? bestPath.sequence : [...tracks];

  // Generate Transition Analyses between all consecutive pairs
  const transitions: TransitionAnalysis[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const fromTrack = sorted[i];
    const toTrack = sorted[i + 1];
    transitions.push(analyzePairTransition(fromTrack, toTrack));
  }

  return { sortedTracks: sorted, transitions };
}

/**
 * Analyzes single transition pair for details & DJ technique notes
 */
export function analyzePairTransition(fromTrack: Track, toTrack: Track): TransitionAnalysis {
  const transitionInfo = analyzeTransitionType(fromTrack.key, toTrack.key, fromTrack.des, toTrack.des);
  const bpmDelta = Math.abs(toTrack.bpm - fromTrack.bpm);
  const pitchBendPercent = Number((((toTrack.bpm - fromTrack.bpm) / fromTrack.bpm) * 100).toFixed(1));
  const energyDelta = Number((toTrack.des - fromTrack.des).toFixed(1));

  // Frequency overlap evaluation
  const bothSubBass = fromTrack.spectral.subBassWeight > 7.2 && toTrack.spectral.subBassWeight > 7.2;
  const bothMidRange = fromTrack.spectral.midRangeDensity > 7.5 && toTrack.spectral.midRangeDensity > 7.5;

  let subBassClashRisk: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  if (bothSubBass) subBassClashRisk = 'HIGH';
  else if (fromTrack.spectral.subBassWeight > 6.0 && toTrack.spectral.subBassWeight > 6.0) subBassClashRisk = 'MEDIUM';

  const spectralClashScore = Number(
    Math.min(
      10,
      (fromTrack.spectral.subBassWeight * toTrack.spectral.subBassWeight) / 10 +
        (bothMidRange ? 3 : 0)
    ).toFixed(1)
  );

  let suggestedMixZone = `Mix Outro (${fromTrack.cuePoints.find((c) => c.type === 'OUTRO')?.name || '32 Beats'}) with Intro (${toTrack.cuePoints.find((c) => c.type === 'INTRO')?.name || '32 Beats'})`;
  let techniqueNote = transitionInfo.note;

  if (subBassClashRisk === 'HIGH') {
    techniqueNote += ` ⚠️ Sub-bass overlap detected (${fromTrack.spectral.subBassWeight} vs ${toTrack.spectral.subBassWeight}). Perform strict hard EQ bass swap on Beat 16 of Breakdown.`;
  }
  if (Math.abs(pitchBendPercent) > 2.5) {
    techniqueNote += ` 🎚️ Pitch shift: ${toTrack.title} requires ${pitchBendPercent > 0 ? '+' : ''}${pitchBendPercent}% pitch bend to match ${fromTrack.bpm} BPM.`;
  }

  return {
    fromTrackId: fromTrack.id,
    toTrackId: toTrack.id,
    type: transitionInfo.type,
    harmonicDistance: transitionInfo.distance,
    bpmDelta: Number(bpmDelta.toFixed(1)),
    pitchBendPercent,
    energyDelta,
    subBassClashRisk,
    spectralClashScore,
    suggestedMixZone,
    techniqueNote,
  };
}
