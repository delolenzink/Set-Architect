import { BlueprintType, SetBlueprint, SortingParameters, Track, TransitionAnalysis } from '../types';
import { analyzeTransitionType, getCamelotStepDistance } from './camelot';

export const BLUEPRINTS: Record<BlueprintType, SetBlueprint> = {
  PEAK_MOUNTAIN: {
    id: 'PEAK_MOUNTAIN',
    name: 'Peak-Hour Mountain',
    tagline: 'Build → High-Energy Peak → Cooldown',
    description: 'Low/Mid Start (4-5) → Progressive Rise → Peak Energy (9-10) → Atmospheric Cooldown (5-6). Perfect for peak hour club sets.',
    targetCurve: [4.2, 5.0, 6.2, 7.5, 8.8, 9.8, 9.2, 7.8, 6.2, 5.0],
  },
  PROGRESSIVE_RAMP: {
    id: 'PROGRESSIVE_RAMP',
    name: 'Progressive Ramp',
    tagline: 'Continuous Step-by-Step Energy Escalation',
    description: 'Constant energy climb from first track to last track (3.5 to 9.8). Drives unrelenting dancefloor momentum.',
    targetCurve: [3.5, 4.2, 5.0, 5.8, 6.5, 7.3, 8.0, 8.7, 9.3, 9.8],
  },
  SUNSET_WARMUP: {
    id: 'SUNSET_WARMUP',
    name: 'Sunset / Warm-Up',
    tagline: 'Steady Low-BPM Melodic Floor with Smooth Modulations',
    description: 'Sustained mid-energy floor (4.0 to 6.5) focusing on smooth harmonic transitions and lush soundscapes.',
    targetCurve: [4.0, 4.5, 5.0, 5.5, 6.0, 6.2, 6.0, 5.8, 5.2, 4.5],
  },
  CUSTOM: {
    id: 'CUSTOM',
    name: 'Custom Energy Blueprint',
    tagline: 'User-Defined Target Energy Arc',
    description: 'Fully customizable 10-point target energy trajectory designed by the DJ.',
    targetCurve: [4.0, 5.0, 6.0, 7.0, 8.0, 8.0, 7.0, 6.0, 5.0, 4.0],
  },
};

/**
 * Gets interpolated target energy for track index out of N total tracks
 */
export function getTargetEnergyForStep(stepIndex: number, totalTracks: number, targetCurve: number[]): number {
  if (totalTracks <= 1) return targetCurve[0];
  const progress = stepIndex / (totalTracks - 1); // 0.0 to 1.0
  const indexFloat = progress * (targetCurve.length - 1);
  const lowIndex = Math.floor(indexFloat);
  const highIndex = Math.min(targetCurve.length - 1, Math.ceil(indexFloat));
  const fraction = indexFloat - lowIndex;

  return targetCurve[lowIndex] * (1 - fraction) + targetCurve[highIndex] * fraction;
}

/**
 * Auto-sorts a track array to align with chosen Set Blueprint & Sorting Parameters
 */
export function sortPlaylist(
  tracks: Track[],
  blueprintType: BlueprintType,
  params: SortingParameters,
  customCurve?: number[]
): { sortedTracks: Track[]; transitions: TransitionAnalysis[] } {
  if (tracks.length <= 1) {
    return { sortedTracks: [...tracks], transitions: [] };
  }

  const blueprint = BLUEPRINTS[blueprintType];
  const targetCurve = customCurve || blueprint.targetCurve;
  const N = tracks.length;

  // Beam search / greedy route optimizer
  const unvisited = [...tracks];
  const sorted: Track[] = [];

  // Pick the best starting track (closest DES to targetCurve[0] & moderate BPM)
  const targetStartEnergy = targetCurve[0];
  unvisited.sort((a, b) => {
    const diffA = Math.abs(a.des - targetStartEnergy);
    const diffB = Math.abs(b.des - targetStartEnergy);
    return diffA - diffB;
  });

  // Take the best starter track
  const startTrack = unvisited.shift()!;
  sorted.push(startTrack);

  // Iteratively select the next best track
  while (unvisited.length > 0) {
    const prevTrack = sorted[sorted.length - 1];
    const currentStep = sorted.length;
    const targetEnergy = getTargetEnergyForStep(currentStep, N, targetCurve);

    let bestScore = Infinity;
    let bestIndex = 0;

    for (let i = 0; i < unvisited.length; i++) {
      const candidate = unvisited[i];

      // 1. Energy Match Cost
      const energyDelta = Math.abs(candidate.des - targetEnergy);
      const energyCost = energyDelta * (1 - params.keyPriorityWeight) * 2.5;

      // 2. Harmonic Distance Cost
      const stepDist = getCamelotStepDistance(prevTrack.key.number, candidate.key.number);
      const sameLetter = prevTrack.key.letter === candidate.key.letter;
      let harmonicCost = 0;

      if (prevTrack.key.code === candidate.key.code) {
        harmonicCost = 0;
      } else if (stepDist === 1 && sameLetter) {
        harmonicCost = 0.5;
      } else if (prevTrack.key.number === candidate.key.number && !sameLetter) {
        harmonicCost = 0.8; // Relative major/minor
      } else if ((stepDist === 2 || stepDist === 7) && sameLetter && params.allowEnergyBoosts) {
        harmonicCost = 1.2; // Energy boost
      } else if (stepDist === 1 && !sameLetter) {
        harmonicCost = 1.5; // Dominant diagonal
      } else {
        harmonicCost = 4.5 + stepDist * 1.5; // Clash penalty
      }

      const keyCost = harmonicCost * params.keyPriorityWeight * 3.0;

      // 3. BPM Drift Cost
      const bpmDelta = Math.abs(candidate.bpm - prevTrack.bpm);
      let bpmCost = 0;
      if (bpmDelta > params.maxBpmDrift) {
        bpmCost = Math.pow(bpmDelta - params.maxBpmDrift, 2) * 1.8;
      } else {
        bpmCost = bpmDelta * 0.3;
      }

      // 4. Sub-bass / Spectral Frequency Overlap Penalty
      let frequencyClashPenalty = 0;
      if (params.avoidFrequencyClash) {
        if (prevTrack.spectral.subBassWeight > 7.0 && candidate.spectral.subBassWeight > 7.0) {
          frequencyClashPenalty = 4.0; // Two heavy sub-bass tracks back to back
        }
      }

      const totalScore = energyCost + keyCost + bpmCost + frequencyClashPenalty;

      if (totalScore < bestScore) {
        bestScore = totalScore;
        bestIndex = i;
      }
    }

    const [selected] = unvisited.splice(bestIndex, 1);
    sorted.push(selected);
  }

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
