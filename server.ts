import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

interface ManualPaymentRecord {
  id: string;
  userId: string;
  userEmail?: string;
  plan: 'pro' | 'executive' | 'lifetime';
  billingCycle: 'monthly' | 'annual' | 'one_time';
  amountDisplay: string;
  popReference: string;
  timestamp: string;
  status: 'pending_verification' | 'verified' | 'rejected';
  reviewedAt?: string;
  adminNotes?: string;
}

interface UserSubscription {
  userId: string;
  tier: 'free' | 'pro' | 'executive' | 'lifetime';
  status: 'inactive' | 'pending_verification' | 'active';
  billingCycle?: 'monthly' | 'annual' | 'one_time';
  lastPaymentId?: string;
  updatedAt: string;
}

// In-memory Database for Manual Payments and Subscriptions
const manualPaymentsDB: ManualPaymentRecord[] = [
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

const subscriptionsDB: Record<string, UserSubscription> = {
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

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Health Endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'Set Architect Billing API' });
  });

  // 1. Submit Manual EFT Payment Endpoint (/api/billing/manual-eft)
  app.post('/api/billing/manual-eft', (req, res) => {
    const { userId, userEmail, plan, billingCycle, amountDisplay, popReference, timestamp } = req.body;

    if (!userId || !plan || !popReference) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: userId, plan, and popReference are required.',
      });
    }

    // Determine normalized pricing display if omitted
    let computedAmount = amountDisplay;
    if (!computedAmount) {
      if (plan === 'pro') computedAmount = billingCycle === 'annual' ? 'R1,599/yr' : 'R179/mo';
      else if (plan === 'executive') computedAmount = billingCycle === 'annual' ? 'R3,199/yr' : 'R349/mo';
      else if (plan === 'lifetime') computedAmount = 'R2,499';
    }

    const newPayment: ManualPaymentRecord = {
      id: req.body.id || `eft-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: userId.trim(),
      userEmail: userEmail?.trim() || userId.trim(),
      plan: plan,
      billingCycle: billingCycle || (plan === 'lifetime' ? 'one_time' : 'monthly'),
      amountDisplay: computedAmount,
      popReference: popReference.trim(),
      timestamp: timestamp || new Date().toISOString(),
      status: 'pending_verification',
    };

    manualPaymentsDB.unshift(newPayment);

    // Update user subscription state to pending_verification
    subscriptionsDB[newPayment.userId] = {
      userId: newPayment.userId,
      tier: subscriptionsDB[newPayment.userId]?.tier || 'free',
      status: 'pending_verification',
      billingCycle: newPayment.billingCycle,
      lastPaymentId: newPayment.id,
      updatedAt: new Date().toISOString(),
    };

    console.log(`[EFT API] Received manual payment ${newPayment.id} for user ${newPayment.userId} (${newPayment.plan})`);

    return res.json({
      success: true,
      payment: newPayment,
      message: 'EFT manual payment submitted successfully. Status set to pending_verification.',
    });
  });

  // GET Manual Payments for User or All
  app.get('/api/billing/manual-eft', (req, res) => {
    const userId = req.query.userId as string;
    if (userId) {
      const userPayments = manualPaymentsDB.filter((p) => p.userId === userId || p.userEmail === userId);
      return res.json({ success: true, payments: userPayments });
    }
    res.json({ success: true, payments: manualPaymentsDB });
  });

  // 2. Admin Endpoint to Get All Manual Payments (/api/admin/manual-payments)
  app.get('/api/admin/manual-payments', (req, res) => {
    res.json({
      success: true,
      payments: manualPaymentsDB,
      pendingCount: manualPaymentsDB.filter((p) => p.status === 'pending_verification').length,
    });
  });

  // 3. Admin Endpoint to Verify / Confirm Manual EFT Payment (/api/admin/verify-eft)
  app.post('/api/admin/verify-eft', (req, res) => {
    const { paymentId, action, adminNotes } = req.body;

    if (!paymentId || !action) {
      return res.status(400).json({
        success: false,
        error: 'Missing paymentId or action (VERIFY or REJECT)',
      });
    }

    const targetPayment = manualPaymentsDB.find((p) => p.id === paymentId);
    if (!targetPayment) {
      return res.status(404).json({
        success: false,
        error: `Manual payment with ID ${paymentId} not found.`,
      });
    }

    const isVerify = action === 'VERIFY';
    targetPayment.status = isVerify ? 'verified' : 'rejected';
    targetPayment.reviewedAt = new Date().toISOString();
    targetPayment.adminNotes = adminNotes || (isVerify ? 'Confirmed receipt against Capitec Account #2516239218' : 'Proof rejected');

    // Single database update: flip subscription.tier to chosen tier and subscription.status to active
    const userSub: UserSubscription = {
      userId: targetPayment.userId,
      tier: isVerify ? targetPayment.plan : (subscriptionsDB[targetPayment.userId]?.tier || 'free'),
      status: isVerify ? 'active' : 'inactive',
      billingCycle: targetPayment.billingCycle,
      lastPaymentId: targetPayment.id,
      updatedAt: new Date().toISOString(),
    };

    subscriptionsDB[targetPayment.userId] = userSub;

    console.log(`[EFT API] Admin ${action} payment ${paymentId} for user ${targetPayment.userId}. Tier set to ${userSub.tier}, status: ${userSub.status}`);

    return res.json({
      success: true,
      payment: targetPayment,
      subscription: userSub,
      message: isVerify
        ? `Payment verified! User ${targetPayment.userId} subscription tier set to ${targetPayment.plan.toUpperCase()} and status set to active.`
        : `Payment marked as rejected.`,
    });
  });

  // Mount Vite middleware in development mode
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
