export type SubscriptionTier = 'free' | 'pro' | 'executive' | 'lifetime';
export type PaymentStatus = 'pending_verification' | 'verified' | 'rejected';
export type BillingCycle = 'monthly' | 'annual' | 'one_time';

export interface ManualPaymentRecord {
  id: string;
  userId: string;
  userEmail?: string;
  plan: 'pro' | 'executive' | 'lifetime';
  billingCycle: BillingCycle;
  amountDisplay: string;
  popReference: string;
  timestamp: string;
  status: PaymentStatus;
  reviewedAt?: string;
  adminNotes?: string;
}

export interface UserSubscription {
  userId: string;
  tier: SubscriptionTier;
  status: 'inactive' | 'pending_verification' | 'active';
  billingCycle?: BillingCycle;
  lastPaymentId?: string;
  updatedAt: string;
}

const STORAGE_KEY_PAYMENTS = 'afrosenses_manual_payments_v1';
const STORAGE_KEY_SUBSCRIPTIONS = 'afrosenses_user_subscriptions_v1';

// Pre-seeded initial demo payments for realistic admin preview if empty
const INITIAL_DEMO_PAYMENTS: ManualPaymentRecord[] = [
  {
    id: 'eft-1723450001',
    userId: 'DJ_AfroPulse',
    userEmail: 'afropulse@dj.co.za',
    plan: 'pro',
    billingCycle: 'monthly',
    amountDisplay: 'R179/mo',
    popReference: 'POP_CAPITEC_2516239218_AFROPULSE.pdf',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    status: 'pending_verification',
  },
  {
    id: 'eft-1723450002',
    userId: 'GrooveMaster_SA',
    userEmail: 'info@groovemaster.co.za',
    plan: 'executive',
    billingCycle: 'annual',
    amountDisplay: 'R3,199/yr',
    popReference: 'REF-CAPITEC-882910-GROOVEMASTER',
    timestamp: new Date(Date.now() - 3600000 * 18).toISOString(),
    status: 'pending_verification',
  },
  {
    id: 'eft-1723450003',
    userId: 'Sipho_K',
    userEmail: 'sipho.keys@gmail.com',
    plan: 'lifetime',
    billingCycle: 'one_time',
    amountDisplay: 'R2,499',
    popReference: 'PROOF_EFT_2499_SIPHO.pdf',
    timestamp: new Date(Date.now() - 3600000 * 48).toISOString(),
    status: 'verified',
    reviewedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    adminNotes: 'Verified receipt in Capitec account #2516239218',
  },
];

const INITIAL_DEMO_SUBSCRIPTIONS: Record<string, UserSubscription> = {
  'Sipho_K': {
    userId: 'Sipho_K',
    tier: 'lifetime',
    status: 'active',
    billingCycle: 'one_time',
    lastPaymentId: 'eft-1723450003',
    updatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  'DJ_AfroPulse': {
    userId: 'DJ_AfroPulse',
    tier: 'free',
    status: 'pending_verification',
    billingCycle: 'monthly',
    lastPaymentId: 'eft-1723450001',
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  'GrooveMaster_SA': {
    userId: 'GrooveMaster_SA',
    tier: 'free',
    status: 'pending_verification',
    billingCycle: 'annual',
    lastPaymentId: 'eft-1723450002',
    updatedAt: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
};

export function getManualPaymentsFromStorage(): ManualPaymentRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PAYMENTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_PAYMENTS, JSON.stringify(INITIAL_DEMO_PAYMENTS));
      return INITIAL_DEMO_PAYMENTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_DEMO_PAYMENTS;
  }
}

export function saveManualPaymentsToStorage(payments: ManualPaymentRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_PAYMENTS, JSON.stringify(payments));
  } catch (err) {
    console.warn('Failed to save manual payments:', err);
  }
}

export function getSubscriptionsFromStorage(): Record<string, UserSubscription> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SUBSCRIPTIONS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_SUBSCRIPTIONS, JSON.stringify(INITIAL_DEMO_SUBSCRIPTIONS));
      return INITIAL_DEMO_SUBSCRIPTIONS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_DEMO_SUBSCRIPTIONS;
  }
}

export function saveSubscriptionsToStorage(subs: Record<string, UserSubscription>): void {
  try {
    localStorage.setItem(STORAGE_KEY_SUBSCRIPTIONS, JSON.stringify(subs));
  } catch (err) {
    console.warn('Failed to save subscriptions:', err);
  }
}

export function getUserSubscription(userId: string): UserSubscription {
  const subs = getSubscriptionsFromStorage();
  if (subs[userId]) {
    return subs[userId];
  }
  return {
    userId,
    tier: 'free',
    status: 'inactive',
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Submit a manual EFT Payment
 */
export async function submitManualEFT(data: {
  userId: string;
  userEmail?: string;
  plan: 'pro' | 'executive' | 'lifetime';
  billingCycle: BillingCycle;
  amountDisplay: string;
  popReference: string;
  timestamp?: string;
}): Promise<{ success: boolean; payment: ManualPaymentRecord; message: string }> {
  const newRecord: ManualPaymentRecord = {
    id: `eft-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    userId: data.userId.trim(),
    userEmail: data.userEmail?.trim() || data.userId.trim(),
    plan: data.plan,
    billingCycle: data.billingCycle,
    amountDisplay: data.amountDisplay,
    popReference: data.popReference.trim(),
    timestamp: data.timestamp || new Date().toISOString(),
    status: 'pending_verification',
  };

  // Try calling server API if running
  try {
    const res = await fetch('/api/billing/manual-eft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRecord),
    });
    if (res.ok) {
      const result = await res.json();
      if (result.success && result.payment) {
        // Sync to client storage as well
        const localList = getManualPaymentsFromStorage();
        saveManualPaymentsToStorage([result.payment, ...localList.filter((p) => p.id !== result.payment.id)]);
        return result;
      }
    }
  } catch {
    // API network fallback to local storage
  }

  // Client-side fallback storage
  const payments = getManualPaymentsFromStorage();
  const updatedPayments = [newRecord, ...payments];
  saveManualPaymentsToStorage(updatedPayments);

  // Update user subscription state to pending_verification
  const subs = getSubscriptionsFromStorage();
  subs[newRecord.userId] = {
    userId: newRecord.userId,
    tier: subs[newRecord.userId]?.tier || 'free',
    status: 'pending_verification',
    billingCycle: newRecord.billingCycle,
    lastPaymentId: newRecord.id,
    updatedAt: new Date().toISOString(),
  };
  saveSubscriptionsToStorage(subs);

  return {
    success: true,
    payment: newRecord,
    message: 'Manual EFT payment notice submitted successfully. Status set to pending_verification.',
  };
}

/**
 * Admin action: Confirm/Verify or Reject Manual EFT Payment
 * Flips user subscription.tier to chosen tier and subscription.status to active!
 */
export async function verifyManualEFT(
  paymentId: string,
  action: 'VERIFY' | 'REJECT',
  adminNotes?: string
): Promise<{ success: boolean; payment?: ManualPaymentRecord; subscription?: UserSubscription; message: string }> {
  // Try server API first
  try {
    const res = await fetch('/api/admin/verify-eft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId, action, adminNotes }),
    });
    if (res.ok) {
      const result = await res.json();
      if (result.success) {
        // Sync local storage
        if (result.payment) {
          const payments = getManualPaymentsFromStorage();
          const updated = payments.map((p) => (p.id === result.payment.id ? result.payment : p));
          saveManualPaymentsToStorage(updated);
        }
        if (result.subscription) {
          const subs = getSubscriptionsFromStorage();
          subs[result.subscription.userId] = result.subscription;
          saveSubscriptionsToStorage(subs);
        }
        return result;
      }
    }
  } catch {
    // Fallback to local storage
  }

  const payments = getManualPaymentsFromStorage();
  const targetPayment = payments.find((p) => p.id === paymentId);

  if (!targetPayment) {
    return { success: false, message: 'Payment record not found.' };
  }

  const isVerify = action === 'VERIFY';
  targetPayment.status = isVerify ? 'verified' : 'rejected';
  targetPayment.reviewedAt = new Date().toISOString();
  targetPayment.adminNotes = adminNotes || (isVerify ? 'Confirmed against Capitec Account #2516239218' : 'Payment proof not verified');

  saveManualPaymentsToStorage(payments);

  // Single database/store update: flip subscription.tier to chosen plan & subscription.status to active
  const subs = getSubscriptionsFromStorage();
  const userSub: UserSubscription = {
    userId: targetPayment.userId,
    tier: isVerify ? targetPayment.plan : (subs[targetPayment.userId]?.tier || 'free'),
    status: isVerify ? 'active' : 'inactive',
    billingCycle: targetPayment.billingCycle,
    lastPaymentId: targetPayment.id,
    updatedAt: new Date().toISOString(),
  };

  subs[targetPayment.userId] = userSub;
  saveSubscriptionsToStorage(subs);

  return {
    success: true,
    payment: targetPayment,
    subscription: userSub,
    message: isVerify
      ? `Payment verified! User ${targetPayment.userId} upgraded to ${targetPayment.plan.toUpperCase()} tier (status: active).`
      : `Payment marked as rejected.`,
  };
}
