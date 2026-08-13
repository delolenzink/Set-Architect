import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  Lock,
  User,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Users,
  Disc,
  Activity,
  FileSpreadsheet,
  Search,
  Check,
  AlertTriangle,
  LogOut,
  RefreshCw,
  Building2,
  CreditCard,
  CheckCheck,
  Crown,
  ArrowLeft,
} from 'lucide-react';
import { DJRegistration } from '../types';
import {
  getDJRegistrations,
  updateRegistrationStatus,
  deleteRegistration,
} from '../lib/djRegistrationStore';
import {
  ManualPayment,
  getManualPayments,
  updateManualPaymentStatus,
  deleteManualPayment,
} from '../lib/manualPaymentsStore';
import { setUserSubscriptionTier, setAdminAuthenticated } from '../lib/rbac';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdminAuthenticated: boolean;
  onAdminLogin: (success: boolean) => void;
  onAdminLogout: () => void;
  trackCount: number;
  crateCount: number;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  isAdminAuthenticated,
  onAdminLogin,
  onAdminLogout,
  trackCount,
  crateCount,
}) => {
  // Login Form State
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  // Admin Dashboard State
  const [registrations, setRegistrations] = useState<DJRegistration[]>([]);
  const [manualPaymentsList, setManualPaymentsList] = useState<ManualPayment[]>([]);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'DECLINED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'DJS' | 'PAYMENTS' | 'SYSTEM'>('DJS');

  // Modal for decline reason
  const [declineTargetId, setDeclineTargetId] = useState<string | null>(null);
  const [declineReasonInput, setDeclineReasonInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      setRegistrations(getDJRegistrations());
      setManualPaymentsList(getManualPayments());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const usernameClean = usernameInput.trim().toLowerCase();
    const passwordClean = passwordInput.trim();

    if (usernameClean === 'admin' && passwordClean === 'MouseNapolean2025#') {
      setAdminAuthenticated(true);
      onAdminLogin(true);
      setRegistrations(getDJRegistrations());
      setManualPaymentsList(getManualPayments());
      setUsernameInput('');
      setPasswordInput('');
    } else {
      setLoginError('Invalid Admin credentials. Access denied.');
    }
  };

  const handleApproveDJ = (id: string) => {
    const updated = updateRegistrationStatus(id, 'APPROVED');
    setRegistrations(updated);
  };

  const handleDeclineDJConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!declineTargetId) return;
    const updated = updateRegistrationStatus(
      declineTargetId,
      'DECLINED',
      declineReasonInput.trim() || 'Did not meet requirements at this time'
    );
    setRegistrations(updated);
    setDeclineTargetId(null);
    setDeclineReasonInput('');
  };

  const handleDeleteDJ = (id: string) => {
    if (window.confirm('Are you sure you want to delete this DJ registration record?')) {
      const updated = deleteRegistration(id);
      setRegistrations(updated);
    }
  };

  // Payment Verification Handlers
  const handleApprovePayment = (payment: ManualPayment) => {
    const updated = updateManualPaymentStatus(payment.id, 'approved', 'Confirmed receipt by admin');
    setManualPaymentsList(updated);
    // Instantly activate subscription tier for current session
    setUserSubscriptionTier(payment.tierRequested);
    alert(`EFT Payment verified! Activated ${payment.tierRequested} tier for ${payment.userName} (${payment.userEmail}).`);
  };

  const handleRejectPayment = (paymentId: string) => {
    const updated = updateManualPaymentStatus(paymentId, 'rejected', 'Payment not received or invalid reference');
    setManualPaymentsList(updated);
  };

  const handleDeletePayment = (paymentId: string) => {
    if (window.confirm('Delete this payment verification record?')) {
      const updated = deleteManualPayment(paymentId);
      setManualPaymentsList(updated);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Stage Name', 'Real Name', 'Email', 'Genres', 'Location', 'Experience', 'Status', 'Submitted Date'];
    const rows = registrations.map((r) => [
      `"${r.djName}"`,
      `"${r.realName}"`,
      `"${r.email}"`,
      `"${r.genres}"`,
      `"${r.location}"`,
      `"${r.experience}"`,
      `"${r.status}"`,
      `"${new Date(r.createdAt).toLocaleDateString()}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SetArchitect_DJ_Roster_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered registrations
  const filteredRegistrations = registrations.filter((r) => {
    const matchesFilter = statusFilter === 'ALL' || r.status === statusFilter;
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      r.djName.toLowerCase().includes(query) ||
      r.email.toLowerCase().includes(query) ||
      r.genres.toLowerCase().includes(query) ||
      r.location.toLowerCase().includes(query);
    return matchesFilter && matchesSearch;
  });

  const pendingCount = registrations.filter((r) => r.status === 'PENDING').length;
  const approvedCount = registrations.filter((r) => r.status === 'APPROVED').length;
  const pendingEftCount = manualPaymentsList.filter((p) => p.status === 'pending_verification').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 font-mono tracking-wide flex items-center gap-2">
                <span>AFROSENSES ADMIN CONTROL PANEL</span>
                {isAdminAuthenticated && (
                  <span className="px-2 py-0.5 text-[10px] font-sans font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full">
                    AUTHENTICATED
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                Monitor live app usage, review DJ registrations, and verify manual EFT payments
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 font-mono text-xs font-bold transition border border-slate-700 shadow-md mr-1"
              title="Return to Main Set Studio"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>← Back to Studio</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {!isAdminAuthenticated ? (
          /* Login Screen */
          <div className="p-8 max-w-md mx-auto my-auto w-full space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-1">
                <Lock className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-100 font-mono">ADMIN AUTHENTICATION</h3>
              <p className="text-xs text-slate-400">
                Please enter administrator credentials to access the DJ monitoring panel
              </p>
            </div>

            {loginError && (
              <div className="p-3 text-xs bg-red-950/70 border border-red-800/70 text-red-300 rounded-xl flex items-center gap-2 font-mono">
                <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4 font-mono">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-300 font-bold flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Username</span>
                </label>
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="Enter admin username"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-300 font-bold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Password</span>
                </label>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-mono font-bold rounded-xl transition shadow-lg shadow-amber-500/20 text-xs tracking-wider"
              >
                UNLOCK ADMIN PANEL
              </button>
            </form>
          </div>
        ) : (
          /* Authenticated Admin Panel */
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {/* Full Access Admin Mode Banner */}
            <div className="p-3 bg-gradient-to-r from-amber-950/80 via-amber-900/40 to-slate-900 border border-amber-500/50 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-300 font-mono text-xs shadow-lg">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                <span><strong>FULL APP ACCESS UNLOCKED:</strong> All Executive Tier tools, AI Mixer, unlimited sets & library exports are active.</span>
              </div>
              <span className="px-2.5 py-1 bg-amber-500 text-black font-bold text-[10px] rounded-lg tracking-wider shrink-0">
                ADMIN MODE ACTIVE
              </span>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-[10px] font-mono">
                  <span>TOTAL DJs</span>
                  <Users className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <div className="text-2xl font-bold font-mono text-slate-100 mt-1">
                  {registrations.length}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-amber-500/30 bg-amber-950/10">
                <div className="flex items-center justify-between text-amber-400 text-[10px] font-mono">
                  <span>PENDING DJs</span>
                  <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                </div>
                <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
                  {pendingCount}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-amber-500/30 bg-amber-950/20">
                <div className="flex items-center justify-between text-amber-300 text-[10px] font-mono">
                  <span>PENDING EFT PAYMENTS</span>
                  <Building2 className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                </div>
                <div className="text-2xl font-bold font-mono text-amber-300 mt-1">
                  {pendingEftCount}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/30 bg-emerald-950/10">
                <div className="flex items-center justify-between text-emerald-400 text-[10px] font-mono">
                  <span>APPROVED DJs</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                  {approvedCount}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 col-span-2 sm:col-span-1">
                <div className="flex items-center justify-between text-slate-400 text-[10px] font-mono">
                  <span>LOADED TRACKS</span>
                  <Disc className="w-3.5 h-3.5 text-violet-400" />
                </div>
                <div className="text-2xl font-bold font-mono text-slate-100 mt-1">
                  {trackCount}
                </div>
              </div>
            </div>

            {/* Navigation Tabs & Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setActiveTab('DJS')}
                  className={`px-4 py-2 text-xs font-mono font-bold rounded-xl transition flex items-center gap-2 ${
                    activeTab === 'DJS'
                      ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>DJ Roster ({registrations.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('PAYMENTS')}
                  className={`px-4 py-2 text-xs font-mono font-bold rounded-xl transition flex items-center gap-2 relative ${
                    activeTab === 'PAYMENTS'
                      ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Manual EFT Verifications ({manualPaymentsList.length})</span>
                  {pendingEftCount > 0 && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping absolute -top-1 -right-1" />
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('SYSTEM')}
                  className={`px-4 py-2 text-xs font-mono font-bold rounded-xl transition flex items-center gap-2 ${
                    activeTab === 'SYSTEM'
                      ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>App & Session Monitor</span>
                </button>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition border border-slate-700"
                  title="Export DJ Roster to CSV"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Export CSV</span>
                </button>

                <button
                  onClick={() => {
                    setAdminAuthenticated(false);
                    onAdminLogout();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono bg-red-950/60 hover:bg-red-900/80 text-red-300 rounded-xl transition border border-red-800/60"
                  title="Log out of Admin Panel"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Admin Logout</span>
                </button>
              </div>
            </div>

            {/* Tab 1: DJ Registrations Manager */}
            {activeTab === 'DJS' && (
              <div className="space-y-4">
                {/* Search & Filter Bar */}
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                  <div className="relative w-full sm:w-72">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search DJ name, email, genre..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition"
                    />
                  </div>

                  <div className="flex items-center gap-1 bg-slate-950 p-1 border border-slate-800 rounded-xl text-xs font-mono">
                    {(['ALL', 'PENDING', 'APPROVED', 'DECLINED'] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => setStatusFilter(st)}
                        className={`px-3 py-1 rounded-lg transition font-bold ${
                          statusFilter === st
                            ? st === 'PENDING'
                              ? 'bg-amber-500 text-black'
                              : st === 'APPROVED'
                              ? 'bg-emerald-500 text-black'
                              : st === 'DECLINED'
                              ? 'bg-red-500 text-black'
                              : 'bg-cyan-500 text-black'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* DJ Roster Table / List */}
                {filteredRegistrations.length === 0 ? (
                  <div className="p-8 text-center bg-slate-950 border border-slate-800 rounded-2xl text-slate-500 font-mono text-xs">
                    No DJ registrations matching filter criteria.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredRegistrations.map((dj) => (
                      <div
                        key={dj.id}
                        className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-cyan-400 font-mono font-bold text-sm">
                              {dj.djName.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold text-slate-100 font-mono">
                                  {dj.djName}
                                </h4>
                                {dj.status === 'PENDING' && (
                                  <span className="px-2 py-0.5 text-[9px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-full animate-pulse">
                                    PENDING APPROVAL
                                  </span>
                                )}
                                {dj.status === 'APPROVED' && (
                                  <span className="px-2 py-0.5 text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full">
                                    APPROVED
                                  </span>
                                )}
                                {dj.status === 'DECLINED' && (
                                  <span className="px-2 py-0.5 text-[9px] font-mono font-bold bg-red-500/20 text-red-400 border border-red-500/40 rounded-full">
                                    DECLINED
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-400 font-mono">
                                {dj.realName} • <span className="text-cyan-400">{dj.email}</span>
                              </p>
                            </div>
                          </div>

                          {/* Approve / Decline Controls */}
                          <div className="flex items-center gap-2 pt-2 sm:pt-0">
                            {dj.status !== 'APPROVED' && (
                              <button
                                onClick={() => handleApproveDJ(dj.id)}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-mono font-bold bg-emerald-500 hover:bg-emerald-400 text-black rounded-lg transition shadow-md shadow-emerald-500/20"
                                title="Approve DJ Registration"
                              >
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                <span>APPROVE</span>
                              </button>
                            )}

                            {dj.status !== 'DECLINED' && (
                              <button
                                onClick={() => {
                                  setDeclineTargetId(dj.id);
                                  setDeclineReasonInput('');
                                }}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-mono font-bold bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800/80 rounded-lg transition"
                                title="Decline DJ Registration"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>DECLINE</span>
                              </button>
                            )}

                            <button
                              onClick={() => handleDeleteDJ(dj.id)}
                              className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-900 rounded-lg transition"
                              title="Delete DJ Record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono text-slate-300 bg-slate-900/50 p-3 rounded-lg">
                          <div>
                            <span className="text-slate-500 block text-[10px]">PREFERRED GENRES:</span>
                            <span className="text-amber-400 font-bold">{dj.genres}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">LOCATION & EXPERIENCE:</span>
                            <span>{dj.location} • {dj.experience}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">SUBMISSION DATE:</span>
                            <span>{new Date(dj.createdAt).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Manual EFT Payments Manager */}
            {activeTab === 'PAYMENTS' && (
              <div className="space-y-4 font-mono text-xs">
                <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/40 text-amber-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-amber-400 shrink-0" />
                    <div>
                      <h4 className="font-bold text-amber-300">MANUAL EFT PAYMENTS COLLECTION (Capitec Bank)</h4>
                      <p className="text-[11px] text-amber-200/80">
                        Review offline Capitec Bank transfers. Confirming receipt approves the record and activates the requested subscription tier instantly.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setManualPaymentsList(getManualPayments())}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-black font-bold rounded-lg hover:bg-amber-400 transition shrink-0"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Refresh List</span>
                  </button>
                </div>

                {manualPaymentsList.length === 0 ? (
                  <div className="p-8 text-center bg-slate-950 border border-slate-800 rounded-2xl text-slate-500">
                    No manual payment verification records found in <code className="text-amber-400">manual_payments</code>.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {manualPaymentsList.map((payment) => (
                      <div
                        key={payment.id}
                        className={`p-4 rounded-xl bg-slate-950 border transition space-y-3 ${
                          payment.status === 'pending_verification'
                            ? 'border-amber-500/60 shadow-lg shadow-amber-500/10'
                            : payment.status === 'approved'
                            ? 'border-emerald-500/40'
                            : 'border-red-500/40'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-amber-400 font-bold text-sm">
                              EFT
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold text-slate-100">
                                  {payment.userName}
                                </h4>
                                {payment.status === 'pending_verification' && (
                                  <span className="px-2 py-0.5 text-[9px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-full animate-pulse">
                                    PENDING VERIFICATION
                                  </span>
                                )}
                                {payment.status === 'approved' && (
                                  <span className="px-2 py-0.5 text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full">
                                    VERIFIED & ACTIVATED
                                  </span>
                                )}
                                {payment.status === 'rejected' && (
                                  <span className="px-2 py-0.5 text-[9px] font-bold bg-red-500/20 text-red-400 border border-red-500/40 rounded-full">
                                    REJECTED
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-400">
                                {payment.userEmail} • Ref: <strong className="text-amber-300">{payment.referenceCode}</strong>
                              </p>
                            </div>
                          </div>

                          {/* Approval / Rejection Controls */}
                          <div className="flex items-center gap-2 pt-2 sm:pt-0">
                            {payment.status !== 'approved' && (
                              <button
                                onClick={() => handleApprovePayment(payment)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-black rounded-lg transition shadow-md shadow-emerald-500/20"
                                title="Confirm Receipt & Activate Tier"
                              >
                                <CheckCheck className="w-3.5 h-3.5 stroke-[3]" />
                                <span>CONFIRM & ACTIVATE</span>
                              </button>
                            )}

                            {payment.status !== 'rejected' && (
                              <button
                                onClick={() => handleRejectPayment(payment.id)}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800/80 rounded-lg transition"
                                title="Reject EFT Verification"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>REJECT</span>
                              </button>
                            )}

                            <button
                              onClick={() => handleDeletePayment(payment.id)}
                              className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-900 rounded-lg transition"
                              title="Delete Record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs text-slate-300 bg-slate-900/50 p-3 rounded-lg">
                          <div>
                            <span className="text-slate-500 block text-[10px]">REQUESTED TIER:</span>
                            <span className="text-cyan-400 font-bold">{payment.tierRequested}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">AMOUNT / CYCLE:</span>
                            <span className="text-emerald-400 font-bold">{payment.amount} ({payment.billingCycle})</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">SUBMISSION DATE:</span>
                            <span>{new Date(payment.createdAt).toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">BANK DETAILS:</span>
                            <span>Capitec (2516239218)</span>
                          </div>
                        </div>

                        {payment.notes && (
                          <div className="text-[11px] text-slate-400 bg-slate-900 p-2 rounded-lg border border-slate-800">
                            <strong>Note:</strong> {payment.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: System & Session Monitor */}
            {activeTab === 'SYSTEM' && (
              <div className="space-y-4 font-mono text-xs text-slate-300">
                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <h4 className="text-sm font-bold text-cyan-400 flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    <span>APP PERFORMANCE & ENVIRONMENT MONITOR</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Active Playlists / Crates:</span>
                        <span className="text-slate-100 font-bold">{crateCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Total Track Inventory:</span>
                        <span className="text-slate-100 font-bold">{trackCount} tracks</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Web Audio API Engine:</span>
                        <span className="text-emerald-400 font-bold">ONLINE (Ready)</span>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Camelot Harmonic Wheel:</span>
                        <span className="text-emerald-400 font-bold">ACTIVE (12-Key Matrix)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">PWA Offline Storage:</span>
                        <span className="text-cyan-400 font-bold">ENABLED (Cache Ready)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Current Server Time:</span>
                        <span className="text-slate-300">{new Date().toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/40 text-amber-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                    <span>Admin changes take effect instantly across DJ accounts in local storage.</span>
                  </div>
                  <button
                    onClick={() => setRegistrations(getDJRegistrations())}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-black font-bold rounded-lg hover:bg-amber-400 transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Refresh Roster</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Decline Reason Modal Dialog */}
        {declineTargetId && (
          <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-md w-full space-y-4 font-mono">
              <h3 className="text-sm font-bold text-slate-100">
                DECLINE DJ REGISTRATION
              </h3>
              <p className="text-xs text-slate-400">
                Specify a reason for declining this DJ application (optional):
              </p>
              <form onSubmit={handleDeclineDJConfirm} className="space-y-3">
                <textarea
                  value={declineReasonInput}
                  onChange={(e) => setDeclineReasonInput(e.target.value)}
                  placeholder="e.g. Incomplete profile or genre outside focus"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-red-500 transition h-24"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setDeclineTargetId(null)}
                    className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-bold bg-red-500 text-white rounded-lg hover:bg-red-400 transition"
                  >
                    Confirm Decline
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
