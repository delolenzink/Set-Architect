export interface ManualPayment {
  id: string;
  userEmail: string;
  userName: string;
  tierRequested: 'PRO' | 'EXECUTIVE';
  billingCycle: 'MONTHLY' | 'ANNUAL' | 'LIFETIME';
  amount: string;
  referenceCode: string;
  status: 'pending_verification' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt?: string;
  proofFileName?: string;
  notes?: string;
}

const STORAGE_KEY = 'set_architect_manual_payments_v1';

export const CAPITEC_EFT_DETAILS = {
  bankName: 'Capitec Bank',
  accountName: 'AfroSenses',
  accountNumber: '2516239218',
  accountType: 'Savings / Business',
  branchCode: '470010',
  emailProofTo: 'info@afrosenses.co.za',
  pricing: {
    PRO: {
      MONTHLY: 'R179',
      ANNUAL: 'R1,599',
    },
    EXECUTIVE: {
      MONTHLY: 'R349',
      ANNUAL: 'R3,500',
      LIFETIME: 'R2,499',
    },
  },
};

const INITIAL_DEMO_PAYMENTS: ManualPayment[] = [
  {
    id: 'eft-101',
    userEmail: 'dj.nkosi@afrosenses.co.za',
    userName: 'DJ Nkosi',
    tierRequested: 'PRO',
    billingCycle: 'MONTHLY',
    amount: 'R179',
    referenceCode: 'EFT-PRO-7731',
    status: 'pending_verification',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    notes: 'POP emailed to info@afrosenses.co.za from Capitec mobile app.',
  },
  {
    id: 'eft-102',
    userEmail: 'vibes@deepgrooves.co.za',
    userName: 'Deep Grooves SA',
    tierRequested: 'EXECUTIVE',
    billingCycle: 'LIFETIME',
    amount: 'R2,499',
    referenceCode: 'EFT-EXEC-9942',
    status: 'pending_verification',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    notes: 'Lifetime access EFT payment sent.',
  },
];

export function getManualPayments(): ManualPayment[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEMO_PAYMENTS));
      return INITIAL_DEMO_PAYMENTS;
    }
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading manual payments from localStorage:', err);
    return INITIAL_DEMO_PAYMENTS;
  }
}

export function createManualPayment(
  payment: Omit<ManualPayment, 'id' | 'createdAt' | 'status'>
): ManualPayment {
  const payments = getManualPayments();
  const newPayment: ManualPayment = {
    ...payment,
    id: `eft-${Date.now()}`,
    status: 'pending_verification',
    createdAt: new Date().toISOString(),
  };

  const updated = [newPayment, ...payments];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('manual_payments_changed', { detail: { updated } }));
  } catch (err) {
    console.error('Failed to save manual payment:', err);
  }
  return newPayment;
}

export function updateManualPaymentStatus(
  id: string,
  status: 'approved' | 'rejected',
  notes?: string
): ManualPayment[] {
  const payments = getManualPayments();
  const updated = payments.map((p) => {
    if (p.id === id) {
      return {
        ...p,
        status,
        updatedAt: new Date().toISOString(),
        notes: notes !== undefined ? notes : p.notes,
      };
    }
    return p;
  });

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('manual_payments_changed', { detail: { updated } }));
  } catch (err) {
    console.error('Failed to update manual payment status:', err);
  }
  return updated;
}

export function deleteManualPayment(id: string): ManualPayment[] {
  const payments = getManualPayments();
  const updated = payments.filter((p) => p.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('manual_payments_changed', { detail: { updated } }));
  } catch (err) {
    console.error('Failed to delete manual payment:', err);
  }
  return updated;
}
