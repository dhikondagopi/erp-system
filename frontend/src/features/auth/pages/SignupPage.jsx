import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import {
  ShieldCheck,
  User,
  Mail,
  Lock,
  UserPlus,
  AlertCircle,
  Eye,
  EyeOff,
  ChevronDown,
  ArrowLeft,
  CheckCircle2,
  Hammer,
  DollarSign,
  Sparkles,
} from 'lucide-react';

/* ── Animated orb ─────────────────────────────────────────────────────────── */
const AnimatedOrb = ({ className }) => (
  <div className={`absolute rounded-full blur-[80px] pointer-events-none animate-pulse ${className}`} />
);

/* ── Role definition with icon + color ───────────────────────────────────── */
const ROLES = [
  { value: 'Sales User',           label: 'Sales User',           desc: 'Manage orders & customers' },
  { value: 'Purchase User',        label: 'Purchase User',        desc: 'Vendor & procurement ops' },
  { value: 'Manufacturing User',   label: 'Manufacturing User',   desc: 'Work orders & shop floor' },
  { value: 'Inventory Manager',    label: 'Inventory Manager',    desc: 'Stock & warehouse control' },
  { value: 'Business Owner',       label: 'Business Owner',       desc: 'Financial overview & KPIs' },
  { value: 'Admin',                label: 'Admin',                desc: 'Full system control' },
];

const PERKS = [
  { icon: CheckCircle2, text: 'Role-based access control' },
  { icon: CheckCircle2, text: 'Real-time stock visibility' },
  { icon: CheckCircle2, text: 'Multi-level BOM management' },
  { icon: CheckCircle2, text: 'Automated procurement drafts' },
];

const SignupPage = () => {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [firstName, setFirstName]   = useState('');
  const [lastName, setLastName]     = useState('');
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole]             = useState('Sales User');
  const [error, setError]           = useState(null);
  const [isLoading, setIsLoading]   = useState(false);
  const [focused, setFocused]       = useState(null);

  useEffect(() => {
    if (isAuthenticated) navigate('/products', { replace: true });
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await register(email, password, firstName, lastName, role);
      navigate('/products', { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your inputs.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = (field) =>
    `relative flex items-center rounded-xl border transition-all duration-200 ${
      focused === field
        ? 'border-violet-500 bg-slate-900'
        : 'border-slate-800 bg-slate-900/60'
    }`;

  return (
    <>
      <style>{`
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50%       { background-position: 100% 50%; }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .panel-left  { animation: slideInLeft  0.6s ease forwards; }
        .panel-right { animation: slideInRight 0.6s ease forwards; }
        .form-row    { opacity: 0; animation: fadeInUp 0.5s ease forwards; }
        .animated-gradient {
          background: linear-gradient(135deg, #4f46e5, #7c3aed, #0ea5e9, #4f46e5);
          background-size: 300% 300%;
          animation: gradientShift 8s ease infinite;
        }
        .input-focus-ring:focus-within {
          box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.35);
        }
        .role-select {
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;
        }
      `}</style>

      <div className="flex min-h-screen bg-slate-950 overflow-hidden">

        {/* ── Left Panel: Branding ───────────────────────────────────────── */}
        <div className="hidden lg:flex lg:w-[48%] relative flex-col justify-between p-12 overflow-hidden panel-left">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0d0b1e] via-slate-950 to-[#07080f]" />
          <AnimatedOrb className="top-[-15%] left-[-15%] w-[500px] h-[500px] bg-violet-600/12" />
          <AnimatedOrb className="bottom-0 right-[-10%]  w-[380px] h-[380px] bg-indigo-700/10" />
          <AnimatedOrb className="top-[55%] left-[30%]   w-[180px] h-[180px] bg-cyan-500/8" />

          {/* Grid */}
          <div
            className="absolute inset-0 opacity-[0.022]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
              backgroundSize: '40px 40px',
            }}
          />

          {/* Logo */}
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl animated-gradient flex items-center justify-center shadow-xl shadow-violet-950/60">
                <span className="text-white font-black text-sm tracking-widest">SF</span>
              </div>
              <div>
                <p className="text-white font-bold text-sm tracking-wide">Shiv Furniture Works</p>
                <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-widest">ERP Console</p>
              </div>
            </div>
          </div>

          {/* Headline */}
          <div className="relative z-10 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/8 px-4 py-1.5 text-xs text-emerald-400 font-semibold tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              Join the Platform
            </div>

            <h1 className="text-5xl font-black tracking-tight leading-[1.1] text-white">
              Start Managing
              <br />
              Operations{' '}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(135deg, #a78bfa, #818cf8, #38bdf8)' }}
              >
                Smarter
              </span>
            </h1>

            <p className="text-slate-400 text-base leading-relaxed max-w-sm">
              Create your account and get instant access to your assigned ERP modules — no configuration required.
            </p>

            {/* Perks */}
            <ul className="space-y-3">
              {PERKS.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-sm text-slate-300">
                  <div className="w-5 h-5 rounded-full bg-violet-500/15 border border-violet-500/30 flex items-center justify-center shrink-0">
                    <Icon className="w-3 h-3 text-violet-400" />
                  </div>
                  {text}
                </li>
              ))}
            </ul>
          </div>

          {/* Bottom modules */}
          <div className="relative z-10 grid grid-cols-2 gap-3">
            {[
              { icon: Hammer,     label: 'Manufacturing',   color: 'text-blue-400',    bg: 'bg-blue-500/8 border-blue-500/15' },
              { icon: DollarSign, label: 'Sales & Billing', color: 'text-emerald-400', bg: 'bg-emerald-500/8 border-emerald-500/15' },
            ].map(({ icon: Icon, label, color, bg }) => (
              <div key={label} className={`rounded-xl border ${bg} p-4 flex items-center gap-3`}>
                <Icon className={`w-4 h-4 ${color}`} />
                <span className="text-xs font-semibold text-slate-300">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right Panel: Form ──────────────────────────────────────────── */}
        <div className="flex flex-1 items-center justify-center px-6 py-10 relative panel-right overflow-y-auto">
          <AnimatedOrb className="top-0 right-0 w-72 h-72 bg-violet-600/8 lg:hidden" />
          <AnimatedOrb className="bottom-0 left-0 w-72 h-72 bg-indigo-600/8 lg:hidden" />

          <div className="w-full max-w-md z-10 py-4">

            {/* Mobile logo */}
            <div className="flex justify-center mb-6 lg:hidden">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl animated-gradient flex items-center justify-center shadow-xl">
                  <span className="text-white font-black text-sm">SF</span>
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Shiv Furniture Works</p>
                  <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-widest">ERP Console</p>
                </div>
              </div>
            </div>

            {/* Back link */}
            <div className="form-row mb-6" style={{ animationDelay: '0.05s' }}>
              <button
                onClick={() => navigate('/login')}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Sign In
              </button>
            </div>

            {/* Header */}
            <div className="mb-7 form-row" style={{ animationDelay: '0.1s' }}>
              <h2 className="text-3xl font-black text-white tracking-tight">Create your account</h2>
              <p className="text-slate-400 text-sm mt-1.5">Fill in your details to get started</p>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-red-900/50 bg-red-950/25 p-4 text-sm text-red-400 mb-5 form-row">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-300">Registration Failed</p>
                  <p className="mt-0.5 text-xs">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* First + Last Name */}
              <div className="grid grid-cols-2 gap-3 form-row" style={{ animationDelay: '0.15s' }}>
                {[
                  { id: 'firstName', label: 'First Name', value: firstName, setter: setFirstName, placeholder: 'John' },
                  { id: 'lastName',  label: 'Last Name',  value: lastName,  setter: setLastName,  placeholder: 'Doe'  },
                ].map(({ id, label, value, setter, placeholder }) => (
                  <div key={id}>
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">{label}</label>
                    <div className={`${inputClass(id)} input-focus-ring`}>
                      <User className="absolute left-3.5 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                      <input
                        id={`signup-${id}`}
                        type="text"
                        required
                        value={value}
                        onChange={(e) => setter(e.target.value)}
                        onFocus={() => setFocused(id)}
                        onBlur={() => setFocused(null)}
                        placeholder={placeholder}
                        className="w-full pl-10 pr-3 py-3 bg-transparent text-white placeholder-slate-600 text-sm focus:outline-none rounded-xl"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Email */}
              <div className="form-row" style={{ animationDelay: '0.2s' }}>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Email Address</label>
                <div className={`${inputClass('email')} input-focus-ring`}>
                  <Mail className="absolute left-4 w-4 h-4 text-slate-500 pointer-events-none" />
                  <input
                    id="signup-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocused('email')}
                    onBlur={() => setFocused(null)}
                    placeholder="name@company.com"
                    className="w-full pl-11 pr-4 py-3.5 bg-transparent text-white placeholder-slate-600 text-sm focus:outline-none rounded-xl"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="form-row" style={{ animationDelay: '0.25s' }}>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Password</label>
                <div className={`${inputClass('password')} input-focus-ring`}>
                  <Lock className="absolute left-4 w-4 h-4 text-slate-500 pointer-events-none" />
                  <input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocused('password')}
                    onBlur={() => setFocused(null)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-12 py-3.5 bg-transparent text-white placeholder-slate-600 text-sm focus:outline-none rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-4 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Role */}
              <div className="form-row" style={{ animationDelay: '0.3s' }}>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Assigned ERP Role</label>
                <div className="relative">
                  <select
                    id="signup-role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="role-select w-full px-4 py-3.5 rounded-xl border border-slate-800 bg-slate-900/60 text-white text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30 transition-all cursor-pointer pr-10"
                  >
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value} className="bg-slate-900">
                        {r.label} — {r.desc}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                </div>
              </div>

              {/* Submit */}
              <div className="form-row pt-1" style={{ animationDelay: '0.35s' }}>
                <button
                  id="signup-submit"
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-violet-950/40 animated-gradient hover:opacity-90"
                >
                  {isLoading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Create Account
                    </>
                  )}
                </button>
              </div>
            </form>

            <p className="text-center text-xs text-slate-600 mt-7 form-row" style={{ animationDelay: '0.4s' }}>
              © 2026 Shiv Furniture Works · All rights reserved
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default SignupPage;
