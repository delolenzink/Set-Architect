import React, { useState } from 'react';
import {
  X,
  CreditCard,
  Building2,
  Mail,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Send,
  ShieldCheck,
  Clock,
  Sparkles,
  Zap,
  Crown,
  FileCheck,
} from 'lucide-react';
import { submitManualEFT, getUserSubscription, UserSubscription } from '../lib/manualPaymentStore';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeDJName?: string | null;
  activeDJEmail?: string | null;
  onSubscriptionUpdated?: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  activeDJName,
  activeDJEmail,
  onSubscriptionUpdated,
}) => {
  // Plan selection: 'pro' | 'executive' | 'lifetime'
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'executive' | 'lifetime'>('pro');
  // Billing cycle for pro & executive: 'monthly' | 'annual'
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  // Payment method: 'EFT' | 'CARD'
  const [paymentMethod, setPaymentMethod] = useState<'EFT' | 'CARD'>('EFT');

  // Form inputs
  const defaultUserId = activeDJName || activeDJEmail || '';
  const [userIdInput, setUserIdInput] = useState(defaultUserId);
  const [userEmailInput, setUserEmailInput] = useState(activeDJEmail || defaultUserId);
  const [popReferenceInput, setPopReferenceInput] = useState('');

  // Status & UI feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState('');
  const [submittedSuccess, setSubmittedSuccess] = useState<boolean>(false);
  const [submittedRecord, setSubmittedRecord] = useState<any>(null);

  if (!isOpen) return null;

  // Calculate pricing string
  const getPriceDisplay = () => {
    if (selectedPlan === 'pro') {
      return billingCycle === 'annual' ? 'R1,599/yr' : 'R179/mo';
    } else if (selectedPlan === 'executive') {
      return billingCycle === 'annual' ? 'R3,199/yr' : 'R349/mo';
    } else {
      return 'R2,499 (One-Time Lifetime)';
    }
  };

  const handleCopyText = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleEFTSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!userIdInput.trim()) {
      setSubmitError('Please enter your Registered Email or User ID / DJ Name.');
      return;
    }

    if (!popReferenceInput.trim()) {
      setSubmitError('Please enter your Proof of Payment (POP) Reference Number or Filename.');
      return;
    }

    setIsSubmitting(true);

    try {
      const amountStr = getPriceDisplay();
      const res = await submitManualEFT({
        userId: userIdInput.trim(),
        userEmail: userEmailInput.trim() || userIdInput.trim(),
        plan: selectedPlan,
        billingCycle: selectedPlan === 'lifetime' ? 'one_time' : billingCycle,
        amountDisplay: amountStr,
        popReference: popReferenceInput.trim(),
        timestamp: new Date().toISOString(),
      });

      setIsSubmitting(false);

      if (res.success) {
        setSubmittedSuccess(true);
        setSubmittedRecord(res.payment);
        if (onSubscriptionUpdated) {
          onSubscriptionUpdated();
        }
      } else {
        setSubmitError(res.message || 'Failed to submit EFT payment notice.');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setSubmitError(err.message || 'An unexpected error occurred while submitting.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 font-mono tracking-wide flex items-center gap-2">
                <span>AFROSENSES PRO CHECKOUT</span>
                <span className="px-2 py-0.5 text-[10px] font-sans font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-full">
                  MANUAL EFT AVAILABLE
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Choose your tier, view Capitec bank details, and submit payment proof
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {submittedSuccess ? (
            /* Submission Confirmation View */
            <div className="p-8 max-w-xl mx-auto text-center space-y-6 bg-slate-950 border border-slate-800 rounded-2xl">
              <div className="inline-flex items-center justify-center p-4 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400">
                <Clock className="w-10 h-10 animate-pulse" />
              </div>

              <div className="space-y-2">
                <span className="px-3 py-1 text-xs font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-full">
                  PAYMENT STATUS: PENDING VERIFICATION
                </span>
                <h3 className="text-xl font-bold text-slate-100 font-mono mt-3">
                  MANUAL EFT NOTICE SUBMITTED
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Thank you! Your payment notice for the{' '}
                  <strong className="text-cyan-400 uppercase">{selectedPlan} TIER ({getPriceDisplay()})</strong> has been received and queued in our verification store.
                </p>
              </div>

              {/* Transaction Summary Card */}
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-left font-mono text-xs space-y-2 text-slate-300">
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-500">Payment Reference ID:</span>
                  <span className="text-amber-400 font-bold">{submittedRecord?.id}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-500">Registered User / Reference:</span>
                  <span className="text-slate-200">{submittedRecord?.userId}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-500">POP Reference / File:</span>
                  <span className="text-slate-200">{submittedRecord?.popReference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Destination Account:</span>
                  <span className="text-cyan-400">Capitec Bank #2516239218</span>
                </div>
              </div>

              {/* POP Email Instructions Reminder */}
              <div className="p-4 bg-cyan-950/40 border border-cyan-800/60 rounded-xl text-left space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs font-mono">
                  <Mail className="w-4 h-4 shrink-0" />
                  <span>REMINDER: EMAIL PROOF OF PAYMENT</span>
                </div>
                <p className="text-xs text-slate-300">
                  Please ensure you email your Proof of Payment (POP) to{' '}
                  <strong className="text-cyan-300">info@afrosenses.co.za</strong> with your reference{' '}
                  <strong className="text-amber-300">{userIdInput}</strong>. Once verified against our Capitec account, your subscription will flip to active!
                </p>
              </div>

              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    setSubmittedSuccess(false);
                    onClose();
                  }}
                  className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-mono font-bold rounded-xl transition shadow-lg shadow-cyan-500/20 text-xs"
                >
                  RETURN TO APP
                </button>
              </div>
            </div>
          ) : (
            /* Primary Checkout Form */
            <div className="space-y-6">
              {/* STEP 1: Plan Selector Cards */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono font-bold text-slate-300 flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-400" />
                    <span>SELECT SUBSCRIPTION TIER</span>
                  </h3>

                  {/* Monthly / Annual Toggle */}
                  <div className="flex items-center bg-slate-950 p-1 border border-slate-800 rounded-xl text-xs font-mono">
                    <button
                      type="button"
                      onClick={() => setBillingCycle('monthly')}
                      className={`px-3 py-1 rounded-lg transition ${
                        billingCycle === 'monthly'
                          ? 'bg-cyan-500 text-black font-bold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      type="button"
                      onClick={() => setBillingCycle('annual')}
                      className={`px-3 py-1 rounded-lg transition flex items-center gap-1 ${
                        billingCycle === 'annual'
                          ? 'bg-cyan-500 text-black font-bold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>Annual</span>
                      <span className="text-[9px] px-1 py-0.2 bg-amber-400 text-black rounded font-bold">
                        SAVE 25%
                      </span>
                    </button>
                  </div>
                </div>

                {/* Tiers Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Tier 1: Pro */}
                  <div
                    onClick={() => setSelectedPlan('pro')}
                    className={`p-4 rounded-xl border transition cursor-pointer relative flex flex-col justify-between ${
                      selectedPlan === 'pro'
                        ? 'bg-cyan-950/30 border-cyan-500 ring-2 ring-cyan-500/30'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-cyan-400">PRO TIER</span>
                        {selectedPlan === 'pro' && (
                          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                        )}
                      </div>
                      <div className="mt-2 text-2xl font-bold font-mono text-slate-100">
                        {billingCycle === 'annual' ? 'R1,599' : 'R179'}
                        <span className="text-xs text-slate-400 font-normal">
                          {billingCycle === 'annual' ? '/year' : '/month'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Full harmonic auto-sorting, dual deck practice, and rekordbox export.
                      </p>
                    </div>
                  </div>

                  {/* Tier 2: Executive */}
                  <div
                    onClick={() => setSelectedPlan('executive')}
                    className={`p-4 rounded-xl border transition cursor-pointer relative flex flex-col justify-between ${
                      selectedPlan === 'executive'
                        ? 'bg-amber-950/30 border-amber-500 ring-2 ring-amber-500/30'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="absolute -top-2.5 right-3 px-2 py-0.5 text-[9px] font-mono font-bold bg-amber-500 text-black rounded-full shadow">
                      MOST POPULAR
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-amber-400">EXECUTIVE TIER</span>
                        {selectedPlan === 'executive' && (
                          <CheckCircle2 className="w-4 h-4 text-amber-400" />
                        )}
                      </div>
                      <div className="mt-2 text-2xl font-bold font-mono text-slate-100">
                        {billingCycle === 'annual' ? 'R3,199' : 'R349'}
                        <span className="text-xs text-slate-400 font-normal">
                          {billingCycle === 'annual' ? '/year' : '/month'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        AI Music Mixer, stems mashup renderer, sub-bass clash detection, & VIP support.
                      </p>
                    </div>
                  </div>

                  {/* Tier 3: Lifetime */}
                  <div
                    onClick={() => setSelectedPlan('lifetime')}
                    className={`p-4 rounded-xl border transition cursor-pointer relative flex flex-col justify-between ${
                      selectedPlan === 'lifetime'
                        ? 'bg-violet-950/30 border-violet-500 ring-2 ring-violet-500/30'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-violet-400">LIFETIME ACCESS</span>
                        {selectedPlan === 'lifetime' && (
                          <CheckCircle2 className="w-4 h-4 text-violet-400" />
                        )}
                      </div>
                      <div className="mt-2 text-2xl font-bold font-mono text-slate-100">
                        R2,499
                        <span className="text-xs text-slate-400 font-normal"> one-time</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Never pay again. Permanent VIP Executive access & all future updates.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* STEP 2: Payment Method Selection */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <h3 className="text-xs font-mono font-bold text-slate-300 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-cyan-400" />
                  <span>SELECT PAYMENT METHOD</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Manual EFT (Active Focus) */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('EFT')}
                    className={`p-3.5 rounded-xl border text-left flex items-center justify-between font-mono transition ${
                      paymentMethod === 'EFT'
                        ? 'bg-emerald-950/30 border-emerald-500 ring-1 ring-emerald-500/40 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-100">
                          Capitec Bank Manual EFT
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Direct Bank Transfer / Proof of Payment (POP)
                        </div>
                      </div>
                    </div>
                    {paymentMethod === 'EFT' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  </button>

                  {/* Card Payment (Online Instant) */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CARD')}
                    className={`p-3.5 rounded-xl border text-left flex items-center justify-between font-mono transition ${
                      paymentMethod === 'CARD'
                        ? 'bg-cyan-950/30 border-cyan-500 ring-1 ring-cyan-500/40 text-cyan-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-100">
                          Debit / Credit Card
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Instant card processing gateway
                        </div>
                      </div>
                    </div>
                    {paymentMethod === 'CARD' && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                  </button>
                </div>
              </div>

              {/* STEP 3A: Manual EFT Bank Details & Submission Form */}
              {paymentMethod === 'EFT' && (
                <div className="space-y-4 bg-slate-950 p-5 rounded-2xl border border-slate-800 animate-fadeIn">
                  {/* Capitec Bank Details Box */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 to-slate-950 border border-emerald-500/30 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-mono font-bold text-slate-100">
                          CAPITEC BANK TRANSFER DETAILS
                        </span>
                      </div>
                      <span className="px-2 py-0.5 text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full font-bold">
                        VERIFIED ACCOUNT
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                      <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 flex justify-between items-center">
                        <div>
                          <span className="text-slate-500 block text-[10px]">BANK NAME</span>
                          <span className="text-slate-100 font-bold">Capitec Bank</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyText('Capitec Bank', 'bank')}
                          className="p-1 text-slate-400 hover:text-cyan-400"
                          title="Copy Bank Name"
                        >
                          {copiedField === 'bank' ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 flex justify-between items-center">
                        <div>
                          <span className="text-slate-500 block text-[10px]">ACCOUNT NAME</span>
                          <span className="text-amber-400 font-bold">AfroSenses</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyText('AfroSenses', 'name')}
                          className="p-1 text-slate-400 hover:text-cyan-400"
                          title="Copy Account Name"
                        >
                          {copiedField === 'name' ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 flex justify-between items-center col-span-1 sm:col-span-2">
                        <div>
                          <span className="text-slate-500 block text-[10px]">ACCOUNT NUMBER</span>
                          <span className="text-2xl font-bold font-mono text-emerald-400 tracking-widest">
                            2516239218
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyText('2516239218', 'account')}
                          className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-lg text-xs font-bold hover:bg-emerald-500 hover:text-black transition flex items-center gap-1"
                        >
                          {copiedField === 'account' ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>COPIED</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>COPY ACC NUMBER</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Strict Email POP Instructions Box */}
                  <div className="p-4 bg-amber-950/30 border border-amber-500/40 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-xs font-mono">
                      <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                      <span>STRICT PROOF OF PAYMENT (POP) INSTRUCTION</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Please email your Proof of Payment (POP) receipt to{' '}
                      <strong className="text-cyan-300 font-mono">info@afrosenses.co.za</strong> using your{' '}
                      <strong className="text-amber-300 font-mono">Registered Email or User ID</strong> as the transfer reference.
                    </p>
                  </div>

                  {/* Error Banner */}
                  {submitError && (
                    <div className="p-3 bg-red-950/80 border border-red-800 text-red-300 text-xs font-mono rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  {/* Form Inputs for Manual EFT Submission */}
                  <form onSubmit={handleEFTSubmit} className="space-y-4 font-mono text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-slate-300 font-bold block">
                          Registered Email or User ID / DJ Name <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={userIdInput}
                          onChange={(e) => setUserIdInput(e.target.value)}
                          placeholder="e.g. DJ_AfroPulse or user@email.com"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition"
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-slate-300 font-bold block">
                          POP Reference / Filename <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={popReferenceInput}
                          onChange={(e) => setPopReferenceInput(e.target.value)}
                          placeholder="e.g. POP_2516239218_AfroSenses.pdf or REF-8829"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`w-full py-3.5 font-mono font-bold rounded-xl transition shadow-lg flex items-center justify-center gap-2 text-xs tracking-wider ${
                        isSubmitting
                          ? 'bg-slate-800 text-slate-500 cursor-wait'
                          : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black shadow-emerald-500/20'
                      }`}
                    >
                      <Send className={`w-4 h-4 ${isSubmitting ? 'animate-spin' : ''}`} />
                      <span>
                        {isSubmitting
                          ? 'SUBMITTING PAYMENT NOTICE...'
                          : `SUBMIT EFT NOTICE FOR ${selectedPlan.toUpperCase()} TIER (${getPriceDisplay()})`}
                      </span>
                    </button>
                  </form>
                </div>
              )}

              {/* STEP 3B: Simulated Card Payment Form */}
              {paymentMethod === 'CARD' && (
                <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-4 font-mono text-xs">
                  <div className="p-3 bg-cyan-950/30 border border-cyan-800 rounded-xl text-cyan-300 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Card payments process instantly via 256-bit encrypted gateway.</span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-slate-300 font-bold block mb-1">Cardholder Name</label>
                      <input
                        type="text"
                        placeholder="Name on card"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition"
                      />
                    </div>

                    <div>
                      <label className="text-slate-300 font-bold block mb-1">Card Number</label>
                      <input
                        type="text"
                        placeholder="4000 0000 0000 0000"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-slate-300 font-bold block mb-1">Expiry Date</label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition"
                        />
                      </div>
                      <div>
                        <label className="text-slate-300 font-bold block mb-1">CVC / CVV</label>
                        <input
                          type="password"
                          placeholder="123"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        alert('Card processing simulated! For manual EFT transfers, please use the Capitec Manual EFT option.');
                      }}
                      className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-mono font-bold rounded-xl transition shadow-lg shadow-cyan-500/20 text-xs tracking-wider"
                    >
                      PAY {getPriceDisplay()} NOW
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
