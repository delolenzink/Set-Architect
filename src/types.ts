export type CamelotNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
export type CamelotLetter = 'A' | 'B'; // A = Minor, B = Major

export interface CamelotKey {
  code: string; // e.g. "8A", "11B"
  number: CamelotNumber;
  letter: CamelotLetter;
  musicalKey: string; // e.g. "A minor", "A Major"
}

export type TransitionType =
  | 'EXACT_HARMONIC' // Same Camelot code (8A -> 8A)
  | 'SMOOTH_HARMONIC' // Adjacent Camelot step (8A -> 9A or 7A)
  | 'RELATIVE_SHIFT' // Minor <-> Major flip (8A -> 8B)
  | 'ENERGY_BOOST' // +1 or +2 semitones boost (+7 or +2 steps)
  | 'DOMINANT_DIAGONAL' // ±1 step + letter flip (8A -> 9B or 7B)
  | 'ENERGY_DROP' // Energy cooldown transition
  | 'HARMONIC_CLASH'; // Key conflict requiring EQ/breakdown mix

export interface CuePoint {
  id: string;
  name: string; // e.g. "Intro 32", "Breakdown", "Drop", "Outro 32"
  positionSeconds: number;
  beatNumber: number;
  type: 'INTRO' | 'OUTRO' | 'BREAKDOWN' | 'DROP' | 'HOTCUE';
  color: string;
}

export interface SpectralData {
  subBassWeight: number; // 0-10 (frequencies < 100Hz)
  midRangeDensity: number; // 0-10 (300Hz - 3kHz)
  highFrequencyRatio: number; // 0-10 (> 5kHz)
  dominantFrequencyHz: number;
  percussiveDensity: number; // 0-10 (transient count per second)
  rmsDb: number; // RMS loudness in dBFS (-30 to 0)
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  genre: string;
  bpm: number;
  key: CamelotKey;
  des: number; // Dynamic Energy Score (1.0 - 10.0)
  durationSeconds: number;
  spectral: SpectralData;
  cuePoints: CuePoint[];
  fileName?: string;
  fileObject?: File;
  audioBuffer?: AudioBuffer;
  waveformPeaks?: number[]; // Normalized 0-1 array for rendering
  year?: number;
  comments?: string;
}

export type BlueprintType = 'PEAK_MOUNTAIN' | 'PROGRESSIVE_RAMP' | 'SUNSET_WARMUP' | 'CUSTOM';

export interface SetBlueprint {
  id: BlueprintType;
  name: string;
  tagline: string;
  description: string;
  targetCurve: number[]; // Array of 10 points (0-10 scale) representing energy progression
}

export interface SortingParameters {
  maxBpmDrift: number; // e.g. 3, 5, 8 BPM max jump
  keyPriorityWeight: number; // 0 to 1 (0 = prioritize energy, 1 = prioritize key match)
  avoidFrequencyClash: boolean; // avoid heavy sub-bass overlap
  allowEnergyBoosts: boolean; // allow +1 / +2 semitone jumps for peak energy
  masterBpmLock?: number; // Optional forced master tempo
  strictMode: boolean;
}

export interface TransitionAnalysis {
  fromTrackId: string;
  toTrackId: string;
  type: TransitionType;
  harmonicDistance: number; // 0 (exact), 1 (adjacent), 2 (boost/relative), >3 (clash)
  bpmDelta: number; // Absolute BPM difference
  pitchBendPercent: number; // % pitch shift needed to match BPMs
  energyDelta: number; // DES change
  subBassClashRisk: 'LOW' | 'MEDIUM' | 'HIGH'; // Sub-bass overlap risk
  spectralClashScore: number; // 0-10 score of frequency collision
  suggestedMixZone: string; // e.g. "Mix Outro A (Beat 64) with Intro B (Beat 1)"
  techniqueNote: string; // Detailed advice for DJ
  overlapDurationSec?: number; // Mandatory >= 5.0s crossfade overlap duration
  crossfadeStartSec?: number; // Crossfade start marker position in Track A (seconds)
  crossfadeEndSec?: number; // Crossfade end marker position in Track A (seconds)
}

export interface Crate {
  id: string;
  name: string;
  description: string;
  tracks: Track[];
  blueprint: BlueprintType;
  createdAt: string;
}

export type RegistrationStatus = 'PENDING' | 'APPROVED' | 'DECLINED';

export interface DJRegistration {
  id: string;
  djName: string;
  realName: string;
  email: string;
  genres: string;
  location: string;
  experience: string;
  mixUrl?: string;
  status: RegistrationStatus;
  createdAt: string;
  reviewedAt?: string;
  declineReason?: string;
  password?: string;
}
