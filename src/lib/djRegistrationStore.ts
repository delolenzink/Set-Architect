import { DJRegistration } from '../types';

const STORAGE_KEY = 'set_architect_dj_registrations_v1';

const DEFAULT_REGISTRATIONS: DJRegistration[] = [
  {
    id: 'dj-reg-1',
    djName: 'DJ AfroBeats',
    realName: 'Kwame Mensah',
    email: 'afrobeats@afrosenses.com',
    genres: 'Afro House, Amapiano, Deep House',
    location: 'Lagos, Nigeria',
    experience: 'Club & Festival DJ (8+ Years)',
    mixUrl: 'https://mixcloud.com/djafrobeats',
    status: 'APPROVED',
    createdAt: '2026-08-10T14:30:00.000Z',
    reviewedAt: '2026-08-10T15:00:00.000Z',
  },
  {
    id: 'dj-reg-2',
    djName: 'DJ Horizon',
    realName: 'Elena Rostova',
    email: 'elena@horizonbeats.io',
    genres: 'Melodic Techno, Progressive',
    location: 'Berlin, Germany',
    experience: 'Resident DJ (5 Years)',
    mixUrl: 'https://soundcloud.com/dj-horizon-official',
    status: 'APPROVED',
    createdAt: '2026-08-11T09:15:00.000Z',
    reviewedAt: '2026-08-11T10:00:00.000Z',
  },
  {
    id: 'dj-reg-3',
    djName: 'DJ RhythmPulse',
    realName: 'Marcus Vance',
    email: 'marcus@rhythmpulse.com',
    genres: 'Tech House, Tribal, Minimal',
    location: 'London, UK',
    experience: 'Event & Club DJ (3 Years)',
    status: 'PENDING',
    createdAt: '2026-08-12T08:20:00.000Z',
  },
  {
    id: 'dj-reg-4',
    djName: 'DJ SunSet Groove',
    realName: 'Sophia Lin',
    email: 'sophia@sunsetgrooves.net',
    genres: 'Organic House, Downtempo, Chill',
    location: 'Ibiza, Spain',
    experience: 'Beach Club DJ (4 Years)',
    status: 'PENDING',
    createdAt: '2026-08-12T10:00:00.000Z',
  },
];

export function getDJRegistrations(): DJRegistration[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_REGISTRATIONS));
      return DEFAULT_REGISTRATIONS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse DJ registrations:', err);
    return DEFAULT_REGISTRATIONS;
  }
}

export function saveDJRegistrations(registrations: DJRegistration[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(registrations));
  } catch (err) {
    console.error('Failed to save DJ registrations:', err);
  }
}

export function registerDJ(newDJ: Omit<DJRegistration, 'id' | 'status' | 'createdAt'>): DJRegistration {
  const current = getDJRegistrations();
  
  // Check if email or djName already exists
  const existing = current.find(
    (d) => d.email.toLowerCase() === newDJ.email.toLowerCase() || d.djName.toLowerCase() === newDJ.djName.toLowerCase()
  );

  if (existing) {
    return existing;
  }

  const registration: DJRegistration = {
    ...newDJ,
    id: `dj-reg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  };

  const updated = [registration, ...current];
  saveDJRegistrations(updated);
  return registration;
}

export function updateRegistrationStatus(
  id: string,
  status: 'APPROVED' | 'DECLINED',
  declineReason?: string
): DJRegistration[] {
  const current = getDJRegistrations();
  const updated = current.map((item) => {
    if (item.id === id) {
      return {
        ...item,
        status,
        reviewedAt: new Date().toISOString(),
        declineReason: status === 'DECLINED' ? (declineReason || 'Did not meet requirements at this time') : undefined,
      };
    }
    return item;
  });

  saveDJRegistrations(updated);
  return updated;
}

export function deleteRegistration(id: string): DJRegistration[] {
  const current = getDJRegistrations();
  const updated = current.filter((item) => item.id !== id);
  saveDJRegistrations(updated);
  return updated;
}
