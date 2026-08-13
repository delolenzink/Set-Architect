import React, { useState } from 'react';
import {
  X,
  Lock,
  Check,
  Zap,
  Crown,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Bot,
  Cloud,
  Layers,
  Building2,
  Mail,
  Copy,
  Clock,
  Send,
  CreditCard,
} from 'lucide-react';
import {
  SubscriptionTier,
  TIER_DETAILS,
  getUserSubscriptionTier,
  setUserSubscriptionTier,
  PERMISSION_MATRIX,
  FeaturePermission,
} from '../lib/rbac';
import {
  CAPITEC_EFT_DETAILS,
  createManualPayment,
} from '../lib/manualPaymentsStore';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  requiredFeature?: FeaturePermission | null;
  onTierChanged?: (newTier: SubscriptionTier) => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  requiredFeature,
  onTierChanged,
}) => {
  const currentTier = getUserSubscriptionTier();
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');
  const [paymentTab, setPaymentTab] = useState<'INSTANT' | 'EFT_CAPITEC'>('INSTANT');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // EFT Form State
  const [eftTier, setEftTier] = useState<'PRO' | 'EXECUTIVE'>('PRO');
  const [eftName, setEftName] = useState('');
  const [eftEmail, setEftEmail] = useState('');
  const [eftRefCode, setEftRefCode] = useState(`EFT-${Math.floor(1000 + Math.random() * 9000)}`);
  const [eftCopiedField, setEftCopiedField] = useState<string | null>(null);
  const [eftSubmittedMessage, setEftSubmittedMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const featureDef = requiredFeature ? PERMISSION_MATRIX[requiredFeature] : null;

  const handleSelectTierInstant = (tier: SubscriptionTier) => {
    setUserSubscriptionTier(tier);
    if (onTierChanged) onTierChanged(tier);
    setSuccessMessage(`Subscription upgraded to ${TIER_DETAILS[tier].name}! All permissions unlocked.`);
    setTimeout(() => {
      setSuccessMessage(null);
      onClose();
    }, 1400);
  };

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setEftCopiedField(label);
    setTimeout(() => setEftCopiedField(null), 2000);
  };

  const handleEftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eftName.trim() || !eftEmail.trim()) return;

    let amount = 'R179';
    if (eftTier === 'PRO') {
      amount = billingCycle === 'MONTHLY' ? CAPITEC_EFT_DETAILS.pricing.PRO.MONTHLY : CAPITEC_EFT_DETAILS.pricing.PRO.ANNUAL;
    } else {
      amount = billingCycle === 'MONTHLY' ? CAPITEC_EFT_DETAILS.pricing.EXECUTIVE.MONTHLY : CAPITEC_EFT_DETAILS.pricing.EXECUTIVE.ANNUAL;
    }

    createManualPayment({
      userEmail: eftEmail.trim(),
      userName: eftName.trim(),
      tierRequested: eftTier,
      billingCycle,
      amount,
      referenceCode: eftRefCode,
      notes: `Proof of payment to be emailed to ${CAPITEC_EFT_DETAILS.emailProofTo}`,
    });

    setEftSubmittedMessage(
      `EFT Payment logged (Ref: ${eftRefCode})! Status set to 'pending_verification'. Please email proof of payment to ${CAPITEC_EFT_DETAILS.emailProofTo} for instant admin activation.`
    );

    setTimeout(() => {
      setEftSubmittedMessage(null);
      setEftName('');
      setEftEmail('');
    }, 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-5xl w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden my-8">
        {/* Top Decorative Gradient */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-slate-700 via-cyan-500 to-amber-500" />

        {/* Header Close */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Notification Banner when opened via feature guard */}
        {featureDef && (
          <div className="mb-6 p-4 rounded-xl bg-amber-950/60 border border-amber-500/80 text-amber-200 flex items-start gap-3 shadow-lg">
            <ShieldAlert className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold font-mono tracking-wide text-amber-300 uppercase">
                {featureDef.requiredTier} TIER REQUIRED: {featureDef.featureName}
              </h4>
              <p className="text-xs text-amber-200/90 mt-1">
                {featureDef.description}
              </p>
            </div>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-200 flex items-center gap-3 font-mono text-xs animate-bounce">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-bold">{successMessage}</span>
          </div>
        )}

        {/* Title Block */}
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800 text-cyan-400 font-mono text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>SET ARCHITECT SUBSCRIPTION & EFT CHECKOUT</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-wide">
            UNLOCK EXECUTIVE DJ CAPABILITIES
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto">
            Choose instant activation or pay offline via direct Electronic Funds Transfer (EFT) to Capitec Bank.
          </p>

          {/* Payment Method Selector & Billing Cycle Toggle */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-3 font-mono text-xs">
            {/* Payment Method Tabs */}
            <div className="inline-flex bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setPaymentTab('INSTANT')}
                className={`px-4 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                  paymentTab === 'INSTANT'
                    ? 'bg-cyan-500 text-black shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Instant Card / Demo Activation</span>
              </button>
              <button
                onClick={() => setPaymentTab('EFT_CAPITEC')}
                className={`px-4 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                  paymentTab === 'EFT_CAPITEC'
                    ? 'bg-amber-500 text-black shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>EFT Payment (Capitec Bank)</span>
              </button>
            </div>

            {/* Billing Cycle Toggle */}
            <div className="inline-flex bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setBillingCycle('MONTHLY')}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${
                  billingCycle === 'MONTHLY'
                    ? 'bg-slate-800 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('ANNUAL')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 ${
                  billingCycle === 'ANNUAL'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>Annual</span>
                <span className="px-1 py-0.2 text-[8px] bg-black/40 text-amber-300 rounded">
                  25% OFF
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* TAB 1: INSTANT CARD / DEMO ACTIVATION MATRIX */}
        {paymentTab === 'INSTANT' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {/* TIER 1: FREE */}
            <div
              className={`rounded-2xl border p-6 flex flex-col justify-between transition-all bg-slate-950/60 relative ${
                currentTier === 'FREE'
                  ? 'border-slate-500/80 ring-1 ring-slate-500/50'
                  : 'border-slate-800/80 hover:border-slate-700'
              }`}
            >
              {currentTier === 'FREE' && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-slate-800 border border-slate-600 text-[10px] font-mono font-bold text-slate-300 uppercase tracking-wider">
                  Current Plan
                </span>
              )}

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Layers className="w-5 h-5 text-slate-400" />
                  <h3 className="text-lg font-bold font-mono text-slate-200">
                    {TIER_DETAILS.FREE.name}
                  </h3>
                </div>
                <p className="text-xs text-slate-400 min-h-[36px]">
                  {TIER_DETAILS.FREE.tagline}
                </p>

                <div className="my-4">
                  <span className="text-3xl font-extrabold font-mono text-white">
                    R0
                  </span>
                  <span className="text-xs text-slate-500 font-mono ml-1">/ forever</span>
                </div>

                <div className="space-y-2.5 pt-4 border-t border-slate-800 text-xs">
                  {TIER_DETAILS.FREE.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-slate-300">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                  {TIER_DETAILS.FREE.limitations.map((lim, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-slate-500">
                      <Lock className="w-3.5 h-3.5 text-slate-600 shrink-0 mt-0.5" />
                      <span>{lim}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => handleSelectTierInstant('FREE')}
                disabled={currentTier === 'FREE'}
                className={`w-full mt-6 py-2.5 px-4 rounded-xl font-mono text-xs font-bold transition flex items-center justify-center gap-2 ${
                  currentTier === 'FREE'
                    ? 'bg-slate-800 text-slate-500 cursor-default border border-slate-700'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600'
                }`}
              >
                <span>{currentTier === 'FREE' ? 'Active Tier 1' : 'Switch to Free'}</span>
              </button>
            </div>

            {/* TIER 2: PRO */}
            <div
              className={`rounded-2xl border p-6 flex flex-col justify-between transition-all bg-gradient-to-b from-cyan-950/40 via-slate-900 to-slate-950 relative ${
                featureDef?.requiredTier === 'PRO'
                  ? 'border-cyan-400 ring-2 ring-cyan-500/50 shadow-2xl shadow-cyan-500/20'
                  : currentTier === 'PRO'
                  ? 'border-cyan-500/80 ring-1 ring-cyan-500/50'
                  : 'border-cyan-900/60 hover:border-cyan-700/80'
              }`}
            >
              {currentTier === 'PRO' && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-cyan-950 border border-cyan-500 text-[10px] font-mono font-bold text-cyan-300 uppercase tracking-wider">
                  Current Plan
                </span>
              )}
              {featureDef?.requiredTier === 'PRO' && currentTier !== 'PRO' && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-amber-500 text-black text-[10px] font-mono font-bold uppercase tracking-wider">
                  Required for {featureDef.featureName}
                </span>
              )}

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-lg font-bold font-mono text-cyan-300">
                    {TIER_DETAILS.PRO.name}
                  </h3>
                </div>
                <p className="text-xs text-slate-300 min-h-[36px]">
                  {TIER_DETAILS.PRO.tagline}
                </p>

                <div className="my-4">
                  <span className="text-3xl font-extrabold font-mono text-white">
                    {billingCycle === 'MONTHLY' ? 'R179' : 'R1,599'}
                  </span>
                  <span className="text-xs text-slate-400 font-mono ml-1">
                    {billingCycle === 'MONTHLY' ? '/ month' : '/ year'}
                  </span>
                </div>

                <div className="space-y-2.5 pt-4 border-t border-cyan-900/60 text-xs">
                  {TIER_DETAILS.PRO.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-slate-200">
                      <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span className="font-medium">{feat}</span>
                    </div>
                  ))}
                  {TIER_DETAILS.PRO.limitations.map((lim, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-slate-500">
                      <Lock className="w-3.5 h-3.5 text-slate-600 shrink-0 mt-0.5" />
                      <span>{lim}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => handleSelectTierInstant('PRO')}
                disabled={currentTier === 'PRO'}
                className={`w-full mt-6 py-2.5 px-4 rounded-xl font-mono text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg ${
                  currentTier === 'PRO'
                    ? 'bg-cyan-950 text-cyan-500 border border-cyan-800 cursor-default'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold shadow-cyan-500/20'
                }`}
              >
                <span>{currentTier === 'PRO' ? 'Active Tier 2' : 'Upgrade to Pro (R179/mo)'}</span>
                {currentTier !== 'PRO' && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>

            {/* TIER 3: EXECUTIVE */}
            <div
              className={`rounded-2xl border p-6 flex flex-col justify-between transition-all bg-gradient-to-b from-amber-950/40 via-slate-900 to-slate-950 relative ${
                featureDef?.requiredTier === 'EXECUTIVE'
                  ? 'border-amber-400 ring-2 ring-amber-500/50 shadow-2xl shadow-amber-500/20'
                  : currentTier === 'EXECUTIVE'
                  ? 'border-amber-500/80 ring-1 ring-amber-500/50'
                  : 'border-amber-900/60 hover:border-amber-700/80'
              }`}
            >
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-black text-[10px] font-mono font-extrabold uppercase tracking-wider shadow-md">
                {currentTier === 'EXECUTIVE' ? 'Current Plan' : 'ULTIMATE EXECUTIVE SUITE'}
              </span>

              <div>
                <div className="flex items-center gap-2 mb-2 mt-1">
                  <Crown className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg font-bold font-mono text-amber-300">
                    {TIER_DETAILS.EXECUTIVE.name}
                  </h3>
                </div>
                <p className="text-xs text-slate-300 min-h-[36px]">
                  {TIER_DETAILS.EXECUTIVE.tagline}
                </p>

                <div className="my-4">
                  <span className="text-3xl font-extrabold font-mono text-white">
                    {billingCycle === 'MONTHLY' ? 'R349' : 'R3,199'}
                  </span>
                  <span className="text-xs text-slate-400 font-mono ml-1">
                    {billingCycle === 'MONTHLY' ? '/ month' : '/ year'}
                  </span>
                  <div className="text-[10px] text-amber-400 font-mono mt-1">
                    Or R2,499 Lifetime Access Pass
                  </div>
                </div>

                <div className="space-y-2.5 pt-4 border-t border-amber-900/60 text-xs">
                  {TIER_DETAILS.EXECUTIVE.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-slate-100">
                      <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span className="font-semibold">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => handleSelectTierInstant('EXECUTIVE')}
                disabled={currentTier === 'EXECUTIVE'}
                className={`w-full mt-6 py-2.5 px-4 rounded-xl font-mono text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg ${
                  currentTier === 'EXECUTIVE'
                    ? 'bg-amber-950 text-amber-400 border border-amber-800 cursor-default'
                    : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-black font-extrabold shadow-amber-500/20'
                }`}
              >
                <Crown className="w-4 h-4" />
                <span>
                  {currentTier === 'EXECUTIVE'
                    ? 'Active Tier 3 (Executive)'
                    : 'Unlock Executive (R349/mo)'}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: ELECTRONIC FUNDS TRANSFER (EFT) CAPITEC BANK CHECKOUT */}
        {paymentTab === 'EFT_CAPITEC' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start font-mono text-xs">
            {/* Left: Capitec Bank Details & Instructions */}
            <div className="p-6 rounded-2xl bg-slate-950 border border-amber-500/40 space-y-4">
              <div className="flex items-center gap-2 text-amber-400 font-bold border-b border-slate-800 pb-3">
                <Building2 className="w-5 h-5 text-amber-400 shrink-0" />
                <span className="text-sm">CAPITEC BANK EFT DETAILS</span>
              </div>

              <div className="space-y-3 text-slate-200">
                <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-400">Account Name:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-amber-300">{CAPITEC_EFT_DETAILS.accountName}</span>
                    <button
                      onClick={() => handleCopyText(CAPITEC_EFT_DETAILS.accountName, 'accName')}
                      className="p-1 rounded text-slate-400 hover:text-slate-100 bg-slate-800"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-400">Account Number:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-cyan-400 text-sm">{CAPITEC_EFT_DETAILS.accountNumber}</span>
                    <button
                      onClick={() => handleCopyText(CAPITEC_EFT_DETAILS.accountNumber, 'accNum')}
                      className="p-1 rounded text-slate-400 hover:text-slate-100 bg-slate-800"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-400">Bank Name:</span>
                  <span className="font-bold text-slate-200">{CAPITEC_EFT_DETAILS.bankName}</span>
                </div>

                <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-400">Branch Code:</span>
                  <span className="font-bold text-slate-200">{CAPITEC_EFT_DETAILS.branchCode}</span>
                </div>

                <div className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-800/60 text-cyan-200 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-cyan-400">
                    <Mail className="w-4 h-4" />
                    <span>PROOF OF PAYMENT EMAIL</span>
                  </div>
                  <p className="text-[11px] text-cyan-300/90 leading-relaxed">
                    Please email your EFT deposit slip or proof of payment to:{' '}
                    <strong className="text-white underline">{CAPITEC_EFT_DETAILS.emailProofTo}</strong>
                  </p>
                </div>
              </div>

              {eftCopiedField && (
                <div className="text-[10px] text-emerald-400 text-center font-bold animate-fadeIn">
                  Copied to clipboard!
                </div>
              )}
            </div>

            {/* Right: EFT Payment Logger Form */}
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Send className="w-4 h-4 text-cyan-400" />
                  <span>LOG EFT PAYMENT FOR VERIFICATION</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">
                  Submitting logs a <code className="text-amber-400">pending_verification</code> record in the manual_payments collection until admin confirms receipt.
                </p>
              </div>

              {eftSubmittedMessage && (
                <div className="p-3.5 rounded-xl bg-amber-950/80 border border-amber-500 text-amber-200 text-xs flex items-start gap-2 font-mono">
                  <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>{eftSubmittedMessage}</span>
                </div>
              )}

              <form onSubmit={handleEftSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Select Tier to Unlock:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEftTier('PRO')}
                      className={`p-2 rounded-xl font-bold border transition ${
                        eftTier === 'PRO'
                          ? 'bg-cyan-950 border-cyan-500 text-cyan-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      Pro DJ (R179/mo)
                    </button>
                    <button
                      type="button"
                      onClick={() => setEftTier('EXECUTIVE')}
                      className={`p-2 rounded-xl font-bold border transition ${
                        eftTier === 'EXECUTIVE'
                          ? 'bg-amber-950 border-amber-500 text-amber-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      Executive (R349/mo)
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Your Stage / Real Name:</label>
                  <input
                    type="text"
                    required
                    value={eftName}
                    onChange={(e) => setEftName(e.target.value)}
                    placeholder="e.g. DJ Nkosi"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Your Email Address:</label>
                  <input
                    type="email"
                    required
                    value={eftEmail}
                    onChange={(e) => setEftEmail(e.target.value)}
                    placeholder="e.g. dj.nkosi@afrosenses.co.za"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">EFT Payment Reference Code:</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={eftRefCode}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-amber-400 font-bold focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopyText(eftRefCode, 'refCode')}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 shrink-0"
                    >
                      Copy Ref
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500">Please use this reference when making your Capitec EFT transfer.</p>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-bold rounded-xl transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>LOG EFT PAYMENT FOR VERIFICATION</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Feature Comparison Reference Footnote */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-cyan-400" />
            <span>AI Music Mixer & Sub-bass Separation: <strong>Executive Only</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <Cloud className="w-4 h-4 text-amber-400" />
            <span>Google Drive & Dropbox Integrations: <strong>Executive Only</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
