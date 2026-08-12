import React, { useState } from 'react';
import {
  X,
  UserPlus,
  CheckCircle2,
  Clock,
  XCircle,
  Disc,
  Globe,
  Mail,
  User,
  Music2,
  ShieldCheck,
  LogIn,
  Send,
  Lock,
} from 'lucide-react';
import { DJRegistration } from '../types';
import { registerDJ, getDJRegistrations } from '../lib/djRegistrationStore';

interface DJRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDJLoginSuccess?: (dj: DJRegistration) => void;
  initialTab?: 'REGISTER' | 'STATUS';
}

export const DJRegistrationModal: React.FC<DJRegistrationModalProps> = ({
  isOpen,
  onClose,
  onDJLoginSuccess,
  initialTab = 'REGISTER',
}) => {
  const [activeTab, setActiveTab] = useState<'REGISTER' | 'STATUS'>(initialTab);

  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Registration Form State
  const [djName, setDjName] = useState('');
  const [realName, setRealName] = useState('');
  const [email, setEmail] = useState('');
  const [genres, setGenres] = useState('');
  const [location, setLocation] = useState('');
  const [experience, setExperience] = useState('Club DJ (1-3 Years)');
  const [mixUrl, setMixUrl] = useState('');
  const [password, setPassword] = useState('');

  const [submittedDJ, setSubmittedDJ] = useState<DJRegistration | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Status Check / Login State
  const [checkEmail, setCheckEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [foundDJ, setFoundDJ] = useState<DJRegistration | null>(null);
  const [loginError, setLoginError] = useState('');
  const [statusSearched, setStatusSearched] = useState(false);

  if (!isOpen) return null;

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!djName.trim() || !email.trim() || !genres.trim()) {
      setErrorMsg('Please fill in Stage Name, Email, and Preferred Genres.');
      return;
    }

    const reg = registerDJ({
      djName: djName.trim(),
      realName: realName.trim() || djName.trim(),
      email: email.trim(),
      genres: genres.trim(),
      location: location.trim() || 'Global',
      experience,
      mixUrl: mixUrl.trim() || undefined,
      password: password.trim() || undefined,
    });

    setSubmittedDJ(reg);
    if (onDJLoginSuccess && reg.status === 'APPROVED') {
      onDJLoginSuccess(reg);
    }
  };

  const handleCheckStatus = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusSearched(true);
    setLoginError('');
    if (!checkEmail.trim()) return;

    const list = getDJRegistrations();
    const match = list.find((d) => d.email.toLowerCase() === checkEmail.trim().toLowerCase());
    
    if (match) {
      if (match.password && loginPassword.trim() && match.password !== loginPassword.trim()) {
        setLoginError('Invalid password. Please check your password and try again.');
        setFoundDJ(null);
        return;
      }
      setFoundDJ(match);
      if (onDJLoginSuccess && match.status === 'APPROVED') {
        onDJLoginSuccess(match);
      }
    } else {
      setFoundDJ(null);
      setLoginError('No DJ registration found matching that email address.');
    }
  };

  const resetForm = () => {
    setSubmittedDJ(null);
    setErrorMsg('');
    setDjName('');
    setRealName('');
    setEmail('');
    setGenres('');
    setLocation('');
    setMixUrl('');
    setPassword('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 text-cyan-400">
              <Disc className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 font-mono tracking-wide">
                DJ PORTAL & REGISTRATION
              </h2>
              <p className="text-xs text-slate-400">
                Register as an official DJ with AfroSenses or check your approval status
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

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-5 pt-3 gap-3">
          <button
            onClick={() => {
              setActiveTab('REGISTER');
              resetForm();
            }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono font-bold rounded-t-lg transition border-b-2 ${
              activeTab === 'REGISTER'
                ? 'border-cyan-400 text-cyan-400 bg-cyan-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>NEW DJ REGISTRATION</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('STATUS');
              setFoundDJ(null);
              setStatusSearched(false);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono font-bold rounded-t-lg transition border-b-2 ${
              activeTab === 'STATUS'
                ? 'border-cyan-400 text-cyan-400 bg-cyan-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>CHECK STATUS / LOGIN</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {activeTab === 'REGISTER' && (
            <>
              {submittedDJ ? (
                <div className="space-y-5 py-4 text-center">
                  <div className="inline-flex items-center justify-center p-4 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-2">
                    <Clock className="w-10 h-10 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-100 font-mono">
                      REGISTRATION SUBMITTED!
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
                      Thank you, <span className="text-cyan-400 font-bold">{submittedDJ.djName}</span>. Your application is currently under review by the <strong className="text-slate-200">AfroSenses Admin Panel</strong>.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-left space-y-2 text-xs text-slate-300 max-w-md mx-auto font-mono">
                    <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                      <span className="text-slate-500">Stage Name:</span>
                      <span className="text-slate-100 font-bold">{submittedDJ.djName}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                      <span className="text-slate-500">Email:</span>
                      <span className="text-slate-100">{submittedDJ.email}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                      <span className="text-slate-500">Primary Genres:</span>
                      <span className="text-cyan-400">{submittedDJ.genres}</span>
                    </div>
                    <div className="flex justify-between pt-0.5">
                      <span className="text-slate-500">Status:</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/40 font-bold">
                        PENDING APPROVAL
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500">
                    You can check your status anytime under the <strong className="text-slate-400">Check Status / Login</strong> tab using <span className="text-cyan-400">{submittedDJ.email}</span>.
                  </p>

                  <div className="flex justify-center gap-3 pt-2">
                    <button
                      onClick={resetForm}
                      className="px-4 py-2 text-xs font-mono font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition border border-slate-700"
                    >
                      Register Another DJ
                    </button>
                    <button
                      onClick={onClose}
                      className="px-5 py-2 text-xs font-mono font-bold bg-cyan-500 hover:bg-cyan-400 text-black rounded-xl transition shadow-lg shadow-cyan-500/20"
                    >
                      Close Portal
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  {errorMsg && (
                    <div className="p-3 text-xs bg-red-950/60 border border-red-800/60 text-red-300 rounded-xl flex items-center gap-2 font-mono">
                      <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Stage Name */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                        <Music2 className="w-3.5 h-3.5 text-cyan-400" />
                        <span>DJ / Stage Name *</span>
                      </label>
                      <input
                        type="text"
                        value={djName}
                        onChange={(e) => setDjName(e.target.value)}
                        placeholder="e.g. DJ AfroSenses"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition"
                        required
                      />
                    </div>

                    {/* Real Name */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>Real Name</span>
                      </label>
                      <input
                        type="text"
                        value={realName}
                        onChange={(e) => setRealName(e.target.value)}
                        placeholder="e.g. Alex Afro"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition"
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Email Address *</span>
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="dj@example.com"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition"
                        required
                      />
                    </div>

                    {/* Location */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-slate-400" />
                        <span>City / Country</span>
                      </label>
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g. London, UK or Lagos, Nigeria"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition"
                      />
                    </div>

                    {/* Preferred Genres */}
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                        <Disc className="w-3.5 h-3.5 text-amber-400" />
                        <span>Preferred Genres & Musical Styles *</span>
                      </label>
                      <input
                        type="text"
                        value={genres}
                        onChange={(e) => setGenres(e.target.value)}
                        placeholder="e.g. Afro House, Amapiano, Deep House, Melodic Techno"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition"
                        required
                      />
                    </div>

                    {/* Experience Level */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-violet-400" />
                        <span>Experience Level</span>
                      </label>
                      <select
                        value={experience}
                        onChange={(e) => setExperience(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 transition"
                      >
                        <option value="Bedroom / Passion DJ">Bedroom / Passion DJ</option>
                        <option value="Club DJ (1-3 Years)">Club DJ (1-3 Years)</option>
                        <option value="Resident DJ (3-5 Years)">Resident DJ (3-5 Years)</option>
                        <option value="Festival & Touring DJ (5+ Years)">Festival & Touring DJ (5+ Years)</option>
                        <option value="Radio Host / Producer">Radio Host / Producer</option>
                      </select>
                    </div>

                    {/* Mixcloud / Soundcloud URL */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Mixcloud / Soundcloud Link</span>
                      </label>
                      <input
                        type="url"
                        value={mixUrl}
                        onChange={(e) => setMixUrl(e.target.value)}
                        placeholder="https://mixcloud.com/your-profile"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition"
                      />
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Portal Password (for status check / DJ login)</span>
                      </label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Create a password to log into your DJ profile"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition"
                      />
                    </div>
                  </div>

                  <div className="pt-3 flex justify-end gap-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-xs font-mono text-slate-400 hover:text-slate-200 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex items-center gap-2 px-6 py-2.5 text-xs font-mono font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black rounded-xl transition shadow-lg shadow-cyan-500/20"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>SUBMIT REGISTRATION</span>
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

          {activeTab === 'STATUS' && (
            <div className="space-y-5">
              <form onSubmit={handleCheckStatus} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold text-slate-300 block">
                    REGISTERED EMAIL ADDRESS
                  </label>
                  <input
                    type="email"
                    value={checkEmail}
                    onChange={(e) => setCheckEmail(e.target.value)}
                    placeholder="Enter email used during DJ registration"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold text-slate-300 block flex justify-between">
                    <span>PASSWORD (OPTIONAL / IF SET)</span>
                    <span className="text-slate-500 font-normal">Leave blank if no password was created</span>
                  </label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter password (optional)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition font-mono"
                  />
                </div>

                {loginError && (
                  <div className="p-3 bg-red-950/80 border border-red-800/80 rounded-xl text-xs font-mono text-red-300 flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-mono font-bold bg-cyan-500 hover:bg-cyan-400 text-black rounded-xl transition shadow-md shadow-cyan-500/20"
                >
                  <LogIn className="w-4 h-4" />
                  <span>SIGN IN / CHECK REGISTRATION STATUS</span>
                </button>
              </form>

              {statusSearched && (
                <div>
                  {foundDJ ? (
                    <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                        <div>
                          <h4 className="text-base font-bold text-slate-100 font-mono">
                            {foundDJ.djName}
                          </h4>
                          <p className="text-xs text-slate-400">{foundDJ.email}</p>
                        </div>
                        <div>
                          {foundDJ.status === 'APPROVED' && (
                            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>APPROVED</span>
                            </span>
                          )}
                          {foundDJ.status === 'PENDING' && (
                            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                              <Clock className="w-4 h-4 animate-pulse" />
                              <span>PENDING APPROVAL</span>
                            </span>
                          )}
                          {foundDJ.status === 'DECLINED' && (
                            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-red-500/20 text-red-400 border border-red-500/40">
                              <XCircle className="w-4 h-4" />
                              <span>DECLINED</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs font-mono text-slate-300">
                        <div>
                          <span className="text-slate-500 block">Genres:</span>
                          <span className="text-cyan-400 font-bold">{foundDJ.genres}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Location:</span>
                          <span>{foundDJ.location}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Experience:</span>
                          <span>{foundDJ.experience}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Submitted On:</span>
                          <span>{new Date(foundDJ.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {foundDJ.status === 'DECLINED' && foundDJ.declineReason && (
                        <div className="p-3 bg-red-950/40 border border-red-800/40 rounded-xl text-xs text-red-300">
                          <strong>Decline Reason:</strong> {foundDJ.declineReason}
                        </div>
                      )}

                      {foundDJ.status === 'APPROVED' && (
                        <div className="p-3 bg-emerald-950/40 border border-emerald-800/40 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
                          <span>Verified DJ Member of AfroSenses Set Architect platform.</span>
                          <button
                            onClick={() => {
                              if (onDJLoginSuccess) onDJLoginSuccess(foundDJ);
                              onClose();
                            }}
                            className="px-3 py-1 bg-emerald-500 text-black font-mono font-bold rounded-lg hover:bg-emerald-400 transition"
                          >
                            Enter DJ Workspace
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-6 text-center bg-slate-950 border border-slate-800 rounded-2xl text-slate-400 text-xs font-mono space-y-2">
                      <XCircle className="w-8 h-8 text-slate-600 mx-auto" />
                      <p>No DJ registration found for <span className="text-slate-200">{checkEmail}</span>.</p>
                      <button
                        onClick={() => {
                          setActiveTab('REGISTER');
                          setEmail(checkEmail);
                        }}
                        className="text-cyan-400 underline font-bold hover:text-cyan-300"
                      >
                        Register new DJ profile now
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
