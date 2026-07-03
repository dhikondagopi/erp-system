import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  Boxes,
  Clipboard,
  Truck,
  ArrowRight,
  Sparkles,
  LogIn,
} from 'lucide-react';

/* ── Animated background dots ─────────────────────────────────────────────── */
const AnimatedOrb = ({ className }) => (
  <div className={`absolute rounded-full blur-[80px] pointer-events-none animate-pulse ${className}`} />
);

/* ── Floating feature badge ───────────────────────────────────────────────── */
const FeatureBadge = ({ icon: Icon, label, delay = '0s' }) => (
  <div
    className="flex items-center gap-2.5 bg-slate-900/80 border border-slate-700/60 rounded-full px-4 py-2.5 text-xs text-slate-300 font-medium shadow-lg backdrop-blur-sm"
    style={{ animationDelay: delay, animation: 'floatBadge 6s ease-in-out infinite' }}
  >
    <Icon className="w-3.5 h-3.5 text-violet-400 shrink-0" />
    {label}
  </div>
);

const LoginPage = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [focused, setFocused] = useState(null);

  const from = location.state?.from?.pathname || '/products';

  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true });
  }, [isAuthenticated, navigate, from]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes floatBadge {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-24px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(24px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .panel-left { animation: slideInLeft 0.6s ease forwards; }
        .panel-right { animation: slideInRight 0.6s ease forwards; }
        .form-row { animation: fadeInUp 0.5s ease forwards; }
        .animated-gradient {
          background: linear-gradient(135deg, #4f46e5, #7c3aed, #0ea5e9, #4f46e5);
          background-size: 300% 300%;
          animation: gradientShift 8s ease infinite;
        }
        .input-focus-ring:focus-within {
          box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.4);
        }
      `}</style>

      <div className="flex min-h-screen bg-slate-950 overflow-hidden">

        {/* ── Left Panel: Branding ───────────────────────────────────────── */}
        <div className="hidden lg:flex lg:w-[52%] relative flex-col justify-between p-12 overflow-hidden panel-left">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-[#0d0b1e] to-slate-950" />
          <AnimatedOrb className="top-[-10%] left-[-10%] w-[480px] h-[480px] bg-violet-700/12" />
          <AnimatedOrb className="bottom-[-5%] right-[-5%] w-[400px] h-[400px] bg-indigo-600/10" style={{ animationDelay: '1.5s' }} />
          <AnimatedOrb className="top-[40%] right-[10%] w-[200px] h-[200px] bg-cyan-500/8" style={{ animationDelay: '3s' }} />

          {/* Grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)`,
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

          {/* Hero Text */}
          <div className="relative z-10 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/25 bg-violet-500/8 px-4 py-1.5 text-xs text-violet-400 font-semibold tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              Enterprise Operations Platform
            </div>

            <h1 className="text-5xl font-black tracking-tight leading-[1.1] text-white">
              The Digital Backbone
              <br />
              for{' '}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: 'linear-gradient(135deg, #a78bfa, #818cf8, #38bdf8)',
                }}
              >
                Premium Craft
              </span>
            </h1>

            <p className="text-slate-400 text-base leading-relaxed max-w-sm">
              Manage multi-level BOMs, track stock valuations, auto-route procurement, and orchestrate shop floor work orders — all in one platform.
            </p>

            {/* Feature Badges */}
            <div className="flex flex-wrap gap-3 pt-2">
              <FeatureBadge icon={Boxes} label="Inventory & Stock" delay="0s" />
              <FeatureBadge icon={Clipboard} label="BOM Control" delay="0.8s" />
              <FeatureBadge icon={Truck} label="Smart Procurement" delay="1.6s" />
            </div>
          </div>

          {/* Stats Row */}
          <div className="relative z-10 grid grid-cols-3 gap-4">
            {[
              { value: '100%', label: 'Traceability' },
              { value: 'Real-time', label: 'Stock Valuation' },
              { value: 'Multi-level', label: 'BOM Support' },
            ].map(({ value, label }) => (
              <div key={label} className="rounded-xl border border-slate-800/70 bg-slate-900/40 p-4 backdrop-blur-sm">
                <p className="text-lg font-black text-white">{value}</p>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right Panel: Form ──────────────────────────────────────────── */}
        <div className="flex flex-1 items-center justify-center px-6 py-16 relative panel-right">
          {/* Mobile BG orbs */}
          <AnimatedOrb className="top-0 right-0 w-72 h-72 bg-violet-600/8 lg:hidden" />
          <AnimatedOrb className="bottom-0 left-0 w-72 h-72 bg-indigo-600/8 lg:hidden" />

          <div className="w-full max-w-md z-10">

            {/* Mobile logo */}
            <div className="flex justify-center mb-8 lg:hidden">
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

            {/* Header */}
            <div className="mb-8 form-row" style={{ animationDelay: '0.1s' }}>
              <h2 className="text-3xl font-black text-white tracking-tight">Welcome back</h2>
              <p className="text-slate-400 text-sm mt-1.5">Sign in to your ERP console</p>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-red-900/50 bg-red-950/25 p-4 text-sm text-red-400 mb-6 form-row">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-300">Authentication Failed</p>
                  <p className="mt-0.5 text-xs">{error}</p>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Email */}
              <div className="form-row" style={{ animationDelay: '0.15s' }}>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                  Email Address
                </label>
                <div
                  className={`relative flex items-center rounded-xl border transition-all duration-200 input-focus-ring ${
                    focused === 'email'
                      ? 'border-violet-500 bg-slate-900'
                      : 'border-slate-800 bg-slate-900/60'
                  }`}
                >
                  <Mail className="absolute left-4 w-4 h-4 text-slate-500 pointer-events-none" />
                  <input
                    id="login-email"
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
              <div className="form-row" style={{ animationDelay: '0.2s' }}>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                  Password
                </label>
                <div
                  className={`relative flex items-center rounded-xl border transition-all duration-200 input-focus-ring ${
                    focused === 'password'
                      ? 'border-violet-500 bg-slate-900'
                      : 'border-slate-800 bg-slate-900/60'
                  }`}
                >
                  <Lock className="absolute left-4 w-4 h-4 text-slate-500 pointer-events-none" />
                  <input
                    id="login-password"
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

              {/* Submit */}
              <div className="form-row pt-2" style={{ animationDelay: '0.25s' }}>
                <button
                  id="login-submit"
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-violet-950/40 animated-gradient hover:opacity-90"
                >
                  {isLoading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      Access ERP Console
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Divider */}
            <div className="relative my-7 form-row" style={{ animationDelay: '0.3s' }}>
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-slate-950 px-4 text-xs text-slate-600 font-medium">New to the platform?</span>
              </div>
            </div>

            {/* Sign Up CTA */}
            <div className="form-row" style={{ animationDelay: '0.35s' }}>
              <button
                id="goto-register"
                onClick={() => navigate('/register')}
                className="w-full py-3.5 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-800/60 hover:border-slate-700 transition-all duration-200 text-slate-300 font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                Create an Account
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <p className="text-center text-xs text-slate-600 mt-8 form-row" style={{ animationDelay: '0.4s' }}>
              © 2026 Shiv Furniture Works · All rights reserved
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
