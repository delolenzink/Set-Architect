export type SubscriptionTier = 'FREE' | 'PRO' | 'EXECUTIVE';

export type FeaturePermission =
  | 'UNLIMITED_TRACKS' // > 10 tracks per set
  | 'XML_CRATE_IMPORT' // Rekordbox XML and Serato .crate imports
  | 'FULL_CAMELOT_SORTER' // Relative shift, +1/-1, diagonal, +2 energy boost sorter
  | 'DES_PROFILING' // Dynamic Energy Curve Profiling
  | 'BPM_DRIFT_PARAMS' // BPM drift parameter controls
  | 'TRANSITION_FLOW_WARNINGS' // Detailed transition flow warnings & clash alerts
  | 'PLAYLIST_EXPORTS' // Direct M3U, Rekordbox XML, Serato Crate, CSV exports
  | 'AI_MIXER' // AI Music Mixer
  | 'AI_SUBBASS_AND_AUTO_EQ' // Sub-bass separation & automated EQ transition profiles
  | 'CLOUD_SYNC_INTEGRATION' // Direct Dropbox & Google Drive integrations
  | 'PRIORITY_BACKUPS' // Priority cloud backup
  | 'UNLIMITED_EXPORTS'; // Unlimited exports

export interface TierDetails {
  id: SubscriptionTier;
  level: number;
  name: string;
  badgeLabel: string;
  monthlyPrice: string;
  annualPrice: string;
  lifetimePrice?: string;
  tagline: string;
  maxTracksPerSet: number;
  features: string[];
  limitations: string[];
  color: string;
  borderAccent: string;
  gradient: string;
}

export const TIER_DETAILS: Record<SubscriptionTier, TierDetails> = {
  FREE: {
    id: 'FREE',
    level: 1,
    name: 'Free Starter',
    badgeLabel: 'Tier 1 • Free',
    monthlyPrice: 'R0',
    annualPrice: 'R0',
    tagline: 'Basic DJ set builder for beginners and quick practice',
    maxTracksPerSet: 10,
    features: [
      'Maximum 10 tracks per set',
      'Exact Camelot key matching (e.g. 8A -> 8A)',
      'Basic harmonic set flow & dual deck auditioning',
      'Local Web Audio API signal processing',
    ],
    limitations: [
      'Hard 10-track set size cap',
      'XML & Serato .crate imports disabled',
      'Relative shift, diagonal & energy boost sorters locked',
      'DES profiling & BPM drift sliders locked',
      'Playlist exports locked',
      'AI Mixer & Cloud sync locked',
    ],
    color: 'text-slate-400',
    borderAccent: 'border-slate-700',
    gradient: 'from-slate-800 to-slate-900',
  },
  PRO: {
    id: 'PRO',
    level: 2,
    name: 'Pro DJ',
    badgeLabel: 'Tier 2 • Pro',
    monthlyPrice: 'R179 / mo',
    annualPrice: 'R1,599 / yr',
    tagline: 'Professional set building & library imports for club DJs',
    maxTracksPerSet: Infinity,
    features: [
      'Unlimited tracks per set',
      'Full Rekordbox XML & Serato .crate import handlers',
      'Complete Camelot Auto-Sorter engine (Relative, ±1, Diagonal, +2 Boosts)',
      'Dynamic Energy Curve Profiling (DES)',
      'BPM drift parameters & transition flow warnings',
      'Direct playlist exports (M3U, Rekordbox XML, Serato Crate, CSV)',
    ],
    limitations: [
      'AI Music Mixer strictly locked',
      'Dropbox & Google Drive cloud sync locked',
    ],
    color: 'text-cyan-400',
    borderAccent: 'border-cyan-500/80',
    gradient: 'from-cyan-950 via-blue-950 to-slate-900',
  },
  EXECUTIVE: {
    id: 'EXECUTIVE',
    level: 3,
    name: 'Executive DJ Studio',
    badgeLabel: 'Tier 3 • Executive',
    monthlyPrice: 'R349 / mo',
    annualPrice: 'R3,500 / yr',
    lifetimePrice: 'R2,499 Lifetime',
    tagline: 'Ultimate studio suite with AI Music Mixer & Cloud Sync',
    maxTracksPerSet: Infinity,
    features: [
      'Unrestricted access to ALL Pro features',
      'Advanced AI Music Mixer & automated set optimizer',
      'Sub-bass frequency separation & automated EQ transition profiles',
      'Direct Dropbox & Google Drive integrations',
      'Priority automated cloud backups & unlimited exports',
      'Priority Web Audio rendering engine',
    ],
    limitations: [],
    color: 'text-amber-400',
    borderAccent: 'border-amber-500',
    gradient: 'from-amber-950 via-amber-900/60 to-slate-950',
  },
};

export interface PermissionDefinition {
  requiredTier: SubscriptionTier;
  featureName: string;
  description: string;
}

export const PERMISSION_MATRIX: Record<FeaturePermission, PermissionDefinition> = {
  UNLIMITED_TRACKS: {
    requiredTier: 'PRO',
    featureName: 'Unlimited Track Sets (> 10 Tracks)',
    description: 'Free tier is limited to a hard maximum of 10 tracks per set. Upgrade to Pro or Executive for unlimited set capacity.',
  },
  XML_CRATE_IMPORT: {
    requiredTier: 'PRO',
    featureName: 'Rekordbox XML & Serato .crate Imports',
    description: 'Importing library playlists directly from Rekordbox XML or Serato .crate files requires a Pro or Executive subscription.',
  },
  FULL_CAMELOT_SORTER: {
    requiredTier: 'PRO',
    featureName: 'Complete Camelot Auto-Sorter Engine',
    description: 'Free tier restricts key sorting to exact Camelot matches only. Upgrade to Pro to unlock relative shifts, ±1 steps, diagonal, and +2 energy boost sorters.',
  },
  DES_PROFILING: {
    requiredTier: 'PRO',
    featureName: 'Dynamic Energy Curve Profiling (DES)',
    description: 'Dynamic Energy Score analytics and target energy trajectory profiling require Pro tier or higher.',
  },
  BPM_DRIFT_PARAMS: {
    requiredTier: 'PRO',
    featureName: 'BPM Drift Parameter Adjustments',
    description: 'Customizing maximum BPM drift parameters and tempo jump thresholds requires Pro tier or higher.',
  },
  TRANSITION_FLOW_WARNINGS: {
    requiredTier: 'PRO',
    featureName: 'Transition Flow Warnings & Clash Protection',
    description: 'Detailed transition clash detection, pitch bend calculations, and sub-bass overlap warnings require Pro tier or higher.',
  },
  PLAYLIST_EXPORTS: {
    requiredTier: 'PRO',
    featureName: 'Direct Playlist & Set Exports',
    description: 'Exporting M3U, Rekordbox XML, Serato Crate, or CSV playlist files requires a Pro subscription.',
  },
  AI_MIXER: {
    requiredTier: 'EXECUTIVE',
    featureName: 'AI Music Mixer',
    description: 'The AI Music Mixer and automated set optimization engine require an Executive Studio subscription.',
  },
  AI_SUBBASS_AND_AUTO_EQ: {
    requiredTier: 'EXECUTIVE',
    featureName: 'Sub-Bass Separation & Automated EQ Profiles',
    description: 'Advanced sub-bass frequency isolation and automated EQ transition profiles require Executive tier.',
  },
  CLOUD_SYNC_INTEGRATION: {
    requiredTier: 'EXECUTIVE',
    featureName: 'Direct Google Drive & Dropbox Integration',
    description: 'Syncing crates directly to Google Drive or Dropbox cloud storage requires an Executive Studio plan.',
  },
  PRIORITY_BACKUPS: {
    requiredTier: 'EXECUTIVE',
    featureName: 'Priority Cloud Backup',
    description: 'Priority automated cloud backups require an Executive Studio subscription.',
  },
  UNLIMITED_EXPORTS: {
    requiredTier: 'EXECUTIVE',
    featureName: 'Unlimited High-Speed Exports',
    description: 'Unlimited multi-format exports with cloud sync require Executive tier.',
  },
};

const STORAGE_KEY = 'set_architect_user_subscription_tier_v1';
const ADMIN_STORAGE_KEY = 'set_architect_admin_authenticated_v1';

export function isAdminAuthenticated(): boolean {
  try {
    return localStorage.getItem(ADMIN_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setAdminAuthenticated(isAdmin: boolean): void {
  try {
    if (isAdmin) {
      localStorage.setItem(ADMIN_STORAGE_KEY, 'true');
      localStorage.setItem(STORAGE_KEY, 'EXECUTIVE');
    } else {
      localStorage.removeItem(ADMIN_STORAGE_KEY);
    }
    window.dispatchEvent(
      new CustomEvent('subscription_tier_changed', { detail: { tier: getUserSubscriptionTier() } })
    );
  } catch (err) {
    console.error('Failed to update admin authentication in localStorage:', err);
  }
}

export function getUserSubscriptionTier(): SubscriptionTier {
  try {
    if (isAdminAuthenticated()) {
      return 'EXECUTIVE';
    }
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'FREE' || saved === 'PRO' || saved === 'EXECUTIVE') {
      return saved as SubscriptionTier;
    }
  } catch (err) {
    console.error('Failed to read subscription tier from localStorage:', err);
  }
  return 'FREE';
}

export function setUserSubscriptionTier(tier: SubscriptionTier): void {
  try {
    localStorage.setItem(STORAGE_KEY, tier);
    // Dispatch event to sync state across all client components
    window.dispatchEvent(
      new CustomEvent('subscription_tier_changed', { detail: { tier } })
    );
  } catch (err) {
    console.error('Failed to save subscription tier to localStorage:', err);
  }
}

export function getTierLevel(tier: SubscriptionTier): number {
  return TIER_DETAILS[tier].level;
}

export function hasPermission(
  permission: FeaturePermission,
  userTier?: SubscriptionTier
): boolean {
  if (isAdminAuthenticated()) {
    return true; // Admin bypass for live presentation & testing
  }
  const currentTier = userTier || getUserSubscriptionTier();
  const currentLevel = getTierLevel(currentTier);
  const requiredTier = PERMISSION_MATRIX[permission].requiredTier;
  const requiredLevel = getTierLevel(requiredTier);

  return currentLevel >= requiredLevel;
}

export function checkPermissionGuard(
  permission: FeaturePermission,
  onDenied: (requiredTier: SubscriptionTier, featureName: string) => void,
  userTier?: SubscriptionTier
): boolean {
  const allowed = hasPermission(permission, userTier);
  if (!allowed) {
    const def = PERMISSION_MATRIX[permission];
    onDenied(def.requiredTier, def.featureName);
    return false;
  }
  return true;
}
