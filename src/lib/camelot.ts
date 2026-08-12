import { CamelotKey, CamelotLetter, CamelotNumber, TransitionType } from '../types';

// Map of standard musical keys to Camelot notation
const MUSICAL_KEY_TO_CAMELOT: Record<string, { number: CamelotNumber; letter: CamelotLetter }> = {
  // Minor Keys (A)
  'A minor': { number: 8, letter: 'A' },
  'Am': { number: 8, letter: 'A' },
  'E minor': { number: 9, letter: 'A' },
  'Em': { number: 9, letter: 'A' },
  'B minor': { number: 10, letter: 'A' },
  'Bm': { number: 10, letter: 'A' },
  'F# minor': { number: 11, letter: 'A' },
  'F#m': { number: 11, letter: 'A' },
  'G#m': { number: 12, letter: 'A' },
  'Abm': { number: 12, letter: 'A' },
  'D#m': { number: 1, letter: 'A' },
  'Ebm': { number: 1, letter: 'A' },
  'A#m': { number: 2, letter: 'A' },
  'Bbm': { number: 2, letter: 'A' },
  'F minor': { number: 3, letter: 'A' },
  'Fm': { number: 3, letter: 'A' },
  'C minor': { number: 4, letter: 'A' },
  'Cm': { number: 4, letter: 'A' },
  'G minor': { number: 5, letter: 'A' },
  'Gm': { number: 5, letter: 'A' },
  'D minor': { number: 6, letter: 'A' },
  'Dm': { number: 6, letter: 'A' },
  'A minor / C': { number: 8, letter: 'A' },

  // Major Keys (B)
  'C Major': { number: 8, letter: 'B' },
  'C': { number: 8, letter: 'B' },
  'G Major': { number: 9, letter: 'B' },
  'G': { number: 9, letter: 'B' },
  'D Major': { number: 10, letter: 'B' },
  'D': { number: 10, letter: 'B' },
  'A Major': { number: 11, letter: 'B' },
  'E Major': { number: 12, letter: 'B' },
  'E': { number: 12, letter: 'B' },
  'B Major': { number: 1, letter: 'B' },
  'B': { number: 1, letter: 'B' },
  'F# Major': { number: 2, letter: 'B' },
  'F#': { number: 2, letter: 'B' },
  'Gb': { number: 2, letter: 'B' },
  'Db Major': { number: 3, letter: 'B' },
  'Db': { number: 3, letter: 'B' },
  'C#': { number: 3, letter: 'B' },
  'Ab Major': { number: 4, letter: 'B' },
  'Ab': { number: 4, letter: 'B' },
  'Eb Major': { number: 5, letter: 'B' },
  'Eb': { number: 5, letter: 'B' },
  'Bb Major': { number: 6, letter: 'B' },
  'Bb': { number: 6, letter: 'B' },
  'F Major': { number: 7, letter: 'B' },
  'F': { number: 7, letter: 'B' },
};

const CAMELOT_TO_MUSICAL: Record<string, string> = {
  '1A': 'G#m / Ebm',
  '2A': 'A#m / Bbm',
  '3A': 'Fm',
  '4A': 'Cm',
  '5A': 'Gm',
  '6A': 'Dm',
  '7A': 'Am',
  '8A': 'Am / C',
  '9A': 'Em',
  '10A': 'Bm',
  '11A': 'F#m',
  '12A': 'C#m',
  '1B': 'B Major',
  '2B': 'F# / Gb Major',
  '3B': 'Db Major',
  '4B': 'Ab Major',
  '5B': 'Eb Major',
  '6B': 'Bb Major',
  '7B': 'F Major',
  '8B': 'C Major',
  '9B': 'G Major',
  '10B': 'D Major',
  '11B': 'A Major',
  '12B': 'E Major',
};

/**
 * Normalizes any key string into standard CamelotKey object
 */
export function parseCamelotKey(rawKey: string): CamelotKey {
  if (!rawKey) {
    return { code: '8A', number: 8, letter: 'A', musicalKey: 'A minor' };
  }

  const cleaned = rawKey.trim();
  // Check if it's already in format like "8A", "11B", "8a"
  const camelotMatch = cleaned.match(/^([1-9]|1[0-2])([a-bA-B])$/);
  if (camelotMatch) {
    const num = parseInt(camelotMatch[1], 10) as CamelotNumber;
    const letter = camelotMatch[2].toUpperCase() as CamelotLetter;
    const code = `${num}${letter}`;
    return {
      code,
      number: num,
      letter,
      musicalKey: CAMELOT_TO_MUSICAL[code] || 'Unknown Key',
    };
  }

  // Look up in musical key map
  const found = MUSICAL_KEY_TO_CAMELOT[cleaned];
  if (found) {
    const code = `${found.number}${found.letter}`;
    return {
      code,
      number: found.number,
      letter: found.letter,
      musicalKey: cleaned,
    };
  }

  // Fallback
  return { code: '8A', number: 8, letter: 'A', musicalKey: rawKey };
}

/**
 * Calculates step distance on the 12-point Camelot Wheel
 */
export function getCamelotStepDistance(num1: CamelotNumber, num2: CamelotNumber): number {
  const diff = Math.abs(num1 - num2);
  return Math.min(diff, 12 - diff);
}

/**
 * Determines transition type between two Camelot keys and DES energy shift
 */
export function analyzeTransitionType(
  key1: CamelotKey,
  key2: CamelotKey,
  des1: number,
  des2: number
): { type: TransitionType; distance: number; note: string } {
  const stepDist = getCamelotStepDistance(key1.number, key2.number);
  const sameLetter = key1.letter === key2.letter;
  const desJump = des2 - des1;

  // Exact match (8A -> 8A)
  if (key1.code === key2.code) {
    return {
      type: 'EXACT_HARMONIC',
      distance: 0,
      note: 'Perfect harmonic match. Seamless long blend with EQ swapping.',
    };
  }

  // Relative Major / Minor (8A -> 8B or 8B -> 8A)
  if (key1.number === key2.number && !sameLetter) {
    const direction = key2.letter === 'B' ? 'Minor to Major' : 'Major to Minor';
    return {
      type: 'RELATIVE_SHIFT',
      distance: 1,
      note: `Relative ${direction} modulation. Shifts emotional color while maintaining bass fundamental compatibility.`,
    };
  }

  // Smooth Harmonic (+1 or -1 Camelot step, same scale letter)
  if (stepDist === 1 && sameLetter) {
    return {
      type: 'SMOOTH_HARMONIC',
      distance: 1,
      note: 'Adjacent Camelot step. Smooth key modulation ideal for building harmonic momentum.',
    };
  }

  // Energy Boost (+2 semitones or +7 Camelot steps, or +2 Camelot steps)
  // +7 Camelot steps = +1 semitone energy boost; +2 steps = harmonic lift
  if ((stepDist === 2 && sameLetter) || (stepDist === 7 && sameLetter)) {
    if (desJump > 0.8) {
      return {
        type: 'ENERGY_BOOST',
        distance: 2,
        note: 'Energy boost modulation (+1/+2 semitones). Creates immediate surge on the floor.',
      };
    }
    return {
      type: 'SMOOTH_HARMONIC',
      distance: 2,
      note: '2-step Camelot modulation. Clean harmonic transition.',
    };
  }

  // Dominant Diagonal (8A -> 9B or 7B)
  if (stepDist === 1 && !sameLetter) {
    return {
      type: 'DOMINANT_DIAGONAL',
      distance: 2,
      note: 'Dominant diagonal transition. High energy brightness change; best mixed during percussion breakdown.',
    };
  }

  // Energy Drop
  if (desJump < -2.0) {
    return {
      type: 'ENERGY_DROP',
      distance: stepDist,
      note: 'Significant energy drop (cooldown). Mix during extended ambient outro.',
    };
  }

  // Clash (>2 steps distance without harmonic link)
  return {
    type: 'HARMONIC_CLASH',
    distance: stepDist,
    note: 'Harmonic distance clash. Recommended: Use percussion breakdown or echo-out effect before drop.',
  };
}

/**
 * Returns color code associated with Camelot Key for UI visualizer
 */
export function getCamelotColor(code: string): string {
  const number = parseInt(code, 10);
  const isA = code.includes('A');
  // 12-hue rainbow wheel
  const hues: Record<number, number> = {
    1: 0, // Red
    2: 30, // Orange
    3: 50, // Gold
    4: 80, // Lime
    5: 140, // Green
    6: 170, // Mint
    7: 195, // Cyan
    8: 220, // Sky Blue
    9: 250, // Indigo
    10: 280, // Violet
    11: 310, // Purple
    12: 335, // Pink
  };
  const hue = hues[number] ?? 200;
  const sat = isA ? 75 : 90;
  const light = isA ? 55 : 65;
  return `hsl(${hue}, ${sat}%, ${light}%)`;
}
