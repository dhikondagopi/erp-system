import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import {
  ShieldCheck,
  Boxes,
  Clipboard,
  Truck,
  Hammer,
  DollarSign,
  History,
  ArrowRight,
  ExternalLink,
  Sparkles,
  BarChart2,
  Cpu,
  Globe,
  Layers,
  Zap,
  Lock,
  ChevronRight,
  Factory,
  Users,
  Package,
  FileText,
  Warehouse,
  Search,
  Bot,
  TrendingUp,
  CheckCircle2,
  ArrowUpRight,
  Play,
  Star,
  Quote,
  Menu,
  X,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════
   ANIMATED BACKGROUND COMPONENTS
   ═══════════════════════════════════════════════════════════════════════════ */

const FloatingOrb = ({ className, style }) => (
  <div
    className={`absolute rounded-full pointer-events-none ${className}`}
    style={style}
  />
);

const GridOverlay = () => (
  <div
    className="absolute inset-0 opacity-[0.02]"
    style={{
      backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
      backgroundSize: '60px 60px',
    }}
  />
);

/* ═══════════════════════════════════════════════════════════════════════════
   COUNTER ANIMATION HOOK
   ═══════════════════════════════════════════════════════════════════════════ */
const useCountUp = (end, duration = 2000, startOnView = true) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    if (!startOnView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const startTime = performance.now();
          const step = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * end));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration, startOnView]);

  return [count, ref];
};

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION REVEAL HOOK
   ═══════════════════════════════════════════════════════════════════════════ */
const useReveal = () => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return [ref, visible];
};

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN LANDING PAGE COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
const LandingPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handlePrimaryClick = () => {
    navigate(isAuthenticated ? '/dashboard' : '/login');
  };

  const handleSecondaryClick = () => {
    navigate('/register');
  };

  /* ─── Feature data ─────────────────────────────────────────────────── */
  const features = [
    {
      icon: Boxes,
      title: 'Inventory & Stock Control',
      desc: 'Real-time cumulative cost valuation with multi-warehouse routing, automated reorder thresholds, and physical stock reconciliation.',
      color: 'text-violet-400',
      border: 'border-violet-500/15',
      glow: 'from-violet-500/10 to-violet-600/5',
      iconBg: 'bg-violet-500/10',
    },
    {
      icon: Clipboard,
      title: 'Bill of Materials (BOM)',
      desc: 'Multi-level recipe version control with raw material mapping, assembly cost roll-ups, and revision history tracking.',
      color: 'text-indigo-400',
      border: 'border-indigo-500/15',
      glow: 'from-indigo-500/10 to-indigo-600/5',
      iconBg: 'bg-indigo-500/10',
    },
    {
      icon: Truck,
      title: 'Smart Procurement',
      desc: 'Intelligent replenishment algorithms auto-generating drafts, routing vendor POs, and tracking lead-time SLAs.',
      color: 'text-cyan-400',
      border: 'border-cyan-500/15',
      glow: 'from-cyan-500/10 to-cyan-600/5',
      iconBg: 'bg-cyan-500/10',
    },
    {
      icon: Factory,
      title: 'Manufacturing Orders',
      desc: 'Full production lifecycle from planned through staged, in-production, to completed — with material consumption tracking.',
      color: 'text-blue-400',
      border: 'border-blue-500/15',
      glow: 'from-blue-500/10 to-blue-600/5',
      iconBg: 'bg-blue-500/10',
    },
    {
      icon: Hammer,
      title: 'Work Order Management',
      desc: 'Kanban-style shop floor tracking with operation assignments, time logging, and real-time status visibility.',
      color: 'text-emerald-400',
      border: 'border-emerald-500/15',
      glow: 'from-emerald-500/10 to-emerald-600/5',
      iconBg: 'bg-emerald-500/10',
    },
    {
      icon: DollarSign,
      title: 'Sales & Invoicing',
      desc: 'Complete order-to-cash workflow with automatic inventory allocation, invoice generation, and payment tracking.',
      color: 'text-amber-400',
      border: 'border-amber-500/15',
      glow: 'from-amber-500/10 to-amber-600/5',
      iconBg: 'bg-amber-500/10',
    },
    {
      icon: Bot,
      title: 'AI Copilot',
      desc: 'Intelligent business assistant providing demand forecasting, vendor scoring, anomaly detection, and actionable insights.',
      color: 'text-purple-400',
      border: 'border-purple-500/15',
      glow: 'from-purple-500/10 to-purple-600/5',
      iconBg: 'bg-purple-500/10',
    },
    {
      icon: History,
      title: 'Audit Trail',
      desc: 'Granular, database-enforced transactional logs documenting every state transition with user attribution.',
      color: 'text-rose-400',
      border: 'border-rose-500/15',
      glow: 'from-rose-500/10 to-rose-600/5',
      iconBg: 'bg-rose-500/10',
    },
    {
      icon: BarChart2,
      title: 'Executive Dashboard',
      desc: 'KPI panorama with revenue trends, production volumes, partner analytics, inventory valuations, and AI forecasting.',
      color: 'text-teal-400',
      border: 'border-teal-500/15',
      glow: 'from-teal-500/10 to-teal-600/5',
      iconBg: 'bg-teal-500/10',
    },
  ];

  /* ─── Workflow steps ───────────────────────────────────────────────── */
  const workflowSteps = [
    { icon: Package, label: 'Product Catalog', desc: 'Define products, raw materials, costs & pricing' },
    { icon: Clipboard, label: 'Create BOM', desc: 'Map multi-level material requirements' },
    { icon: FileText, label: 'Sales Order', desc: 'Receive customer orders & allocate stock' },
    { icon: Factory, label: 'Manufacturing', desc: 'Auto-generate production orders from BOMs' },
    { icon: Truck, label: 'Procurement', desc: 'Smart vendor routing & PO auto-generation' },
    { icon: CheckCircle2, label: 'Fulfillment', desc: 'Ship orders & generate invoices' },
  ];

  /* ─── Stats with count-up ──────────────────────────────────────────── */
  const [modulesCount, modulesRef] = useCountUp(17, 1800);
  const [rolesCount, rolesRef] = useCountUp(6, 1500);
  const [tablesCount, tablesRef] = useCountUp(16, 2000);

  /* ─── Section reveals ──────────────────────────────────────────────── */
  const [featRef, featVisible] = useReveal();
  const [workflowRef, workflowVisible] = useReveal();
  const [statsRef, statsVisible] = useReveal();
  const [ctaRef, ctaVisible] = useReveal();

  return (
    <>
      <style>{`
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-12px) rotate(1deg); }
          66% { transform: translateY(6px) rotate(-1deg); }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes tickerScroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @keyframes shimmer {
          from { background-position: -200% center; }
          to { background-position: 200% center; }
        }
        .animated-gradient-text {
          background: linear-gradient(135deg, #a78bfa, #818cf8, #38bdf8, #a78bfa);
          background-size: 300% 300%;
          animation: gradientShift 6s ease infinite;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .animated-gradient-bg {
          background: linear-gradient(135deg, #4f46e5, #7c3aed, #0ea5e9, #4f46e5);
          background-size: 300% 300%;
          animation: gradientShift 8s ease infinite;
        }
        .glass-card {
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }
        .reveal-up {
          animation: slideUp 0.7s ease forwards;
        }
        .reveal-in {
          animation: slideIn 0.6s ease forwards;
        }
        .ticker-track {
          animation: tickerScroll 30s linear infinite;
        }
        .shimmer-line {
          background: linear-gradient(90deg, transparent 0%, rgba(139,92,246,0.15) 50%, transparent 100%);
          background-size: 200% 100%;
          animation: shimmer 3s ease infinite;
        }
        .nav-blur {
          backdrop-filter: blur(20px) saturate(1.4);
          -webkit-backdrop-filter: blur(20px) saturate(1.4);
        }
      `}</style>

      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-hidden font-sans">
        {/* Background Orbs */}
        <FloatingOrb
          className="w-[700px] h-[700px] bg-violet-600/[0.07] blur-[150px]"
          style={{ top: '-10%', left: '-10%', animation: 'float 20s ease-in-out infinite' }}
        />
        <FloatingOrb
          className="w-[500px] h-[500px] bg-indigo-600/[0.06] blur-[130px]"
          style={{ bottom: '10%', right: '-5%', animation: 'float 25s ease-in-out infinite 2s' }}
        />
        <FloatingOrb
          className="w-[400px] h-[400px] bg-cyan-500/[0.04] blur-[100px]"
          style={{ top: '40%', left: '50%', animation: 'float 18s ease-in-out infinite 4s' }}
        />
        <GridOverlay />

        {/* ═══════════════════════════════════════════════════════════════════
            1. NAVIGATION
            ═══════════════════════════════════════════════════════════════════ */}
        <header
          className={`fixed top-0 w-full z-50 transition-all duration-300 ${
            scrolled
              ? 'nav-blur bg-slate-950/70 border-b border-slate-800/60 shadow-xl shadow-black/20'
              : 'bg-transparent'
          }`}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between px-6 lg:px-12 h-[72px]">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl animated-gradient-bg flex items-center justify-center shadow-lg shadow-violet-950/60">
                <span className="text-white font-black text-sm tracking-widest">SF</span>
              </div>
              <div>
                <h2 className="text-sm font-bold text-white tracking-wide">Shiv Furniture Works</h2>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                  ERP Console
                </p>
              </div>
            </div>

            {/* Desktop Nav Links */}
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-xs font-semibold text-slate-400 hover:text-white transition-colors">
                Features
              </a>
              <a href="#workflow" className="text-xs font-semibold text-slate-400 hover:text-white transition-colors">
                Workflow
              </a>
              <a href="#stats" className="text-xs font-semibold text-slate-400 hover:text-white transition-colors">
                Architecture
              </a>
            </nav>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center gap-3">
              {!isAuthenticated && (
                <button
                  onClick={handleSecondaryClick}
                  className="text-xs font-semibold text-slate-400 hover:text-white transition-colors px-4 py-2"
                >
                  Sign Up
                </button>
              )}
              <button
                onClick={handlePrimaryClick}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all duration-200 active:scale-[0.97] animated-gradient-bg hover:opacity-90 shadow-lg shadow-violet-950/40"
              >
                {isAuthenticated ? 'Enter Console' : 'Access Portal'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden text-slate-400 hover:text-white transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden nav-blur bg-slate-950/90 border-t border-slate-800/60 px-6 py-6 space-y-4">
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-semibold text-slate-300 hover:text-white">Features</a>
              <a href="#workflow" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-semibold text-slate-300 hover:text-white">Workflow</a>
              <a href="#stats" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-semibold text-slate-300 hover:text-white">Architecture</a>
              <div className="pt-4 border-t border-slate-800 flex flex-col gap-3">
                {!isAuthenticated && (
                  <button onClick={handleSecondaryClick} className="w-full py-3 rounded-xl border border-slate-800 bg-slate-900/40 text-sm font-semibold text-slate-300">
                    Create Account
                  </button>
                )}
                <button onClick={handlePrimaryClick} className="w-full py-3 rounded-xl animated-gradient-bg text-sm font-bold text-white">
                  {isAuthenticated ? 'Enter Console' : 'Access Portal'}
                </button>
              </div>
            </div>
          )}
        </header>

        {/* ═══════════════════════════════════════════════════════════════════
            2. HERO SECTION
            ═══════════════════════════════════════════════════════════════════ */}
        <section className="relative pt-36 pb-20 lg:pt-44 lg:pb-28 px-6 lg:px-12">
          <div className="max-w-5xl mx-auto text-center space-y-8 z-10 relative">
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/[0.06] px-5 py-2 text-xs text-violet-400 font-semibold tracking-wide"
              style={{ animation: 'fadeIn 0.6s ease forwards' }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Next-Generation Manufacturing ERP
            </div>

            {/* Headline */}
            <h1
              className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tight leading-[1.1]"
              style={{ animation: 'slideUp 0.8s ease forwards' }}
            >
              <span className="text-white">The Complete Digital</span>
              <br />
              <span className="text-white">Backbone for </span>
              <span className="animated-gradient-text">
                Premium Craft
              </span>
            </h1>

            {/* Sub-headline */}
            <p
              className="text-slate-400 text-base lg:text-lg max-w-2xl mx-auto leading-relaxed"
              style={{ animation: 'slideUp 0.8s ease 0.15s forwards', opacity: 0 }}
            >
              Integrated resource planning engine for Shiv Furniture Works.
              Manage multi-level BOMs, track real-time inventory valuations, auto-route procurement,
              and orchestrate shop floor operations — powered by AI intelligence.
            </p>

            {/* CTA Buttons */}
            <div
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
              style={{ animation: 'slideUp 0.8s ease 0.3s forwards', opacity: 0 }}
            >
              <button
                onClick={handlePrimaryClick}
                className="group w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 animated-gradient-bg hover:opacity-90 active:scale-[0.97] transition-all text-white font-bold rounded-2xl text-sm shadow-2xl shadow-violet-950/50"
              >
                <span>{isAuthenticated ? 'Open ERP Dashboard' : 'Access ERP Portal'}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
              {!isAuthenticated && (
                <button
                  onClick={handleSecondaryClick}
                  className="group w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-slate-900/60 border border-slate-800 hover:bg-slate-800/60 hover:border-slate-700 active:scale-[0.97] transition-all text-slate-200 font-bold rounded-2xl text-sm"
                >
                  Create Free Account
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
              )}
            </div>

            {/* Trust badges */}
            <div
              className="flex flex-wrap items-center justify-center gap-6 pt-6 text-xs text-slate-500"
              style={{ animation: 'fadeIn 1s ease 0.6s forwards', opacity: 0 }}
            >
              <div className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-500" />
                <span>Role-Based Access</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Full Audit Trail</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-emerald-500" />
                <span>Real-time Analytics</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-emerald-500" />
                <span>AI-Powered Insights</span>
              </div>
            </div>
          </div>

          {/* Hero bottom shimmer line */}
          <div className="absolute bottom-0 left-0 right-0 h-px shimmer-line" />
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            3. MODULE TICKER
            ═══════════════════════════════════════════════════════════════════ */}
        <section className="relative py-6 border-y border-slate-800/40 overflow-hidden bg-slate-950/50">
          <div className="flex ticker-track whitespace-nowrap">
            {[...Array(2)].map((_, setIdx) => (
              <div key={setIdx} className="flex items-center gap-8 px-4">
                {[
                  { icon: BarChart2, label: 'Dashboard' },
                  { icon: Package, label: 'Products' },
                  { icon: Boxes, label: 'Inventory' },
                  { icon: Warehouse, label: 'Warehouses' },
                  { icon: Clipboard, label: 'BOM' },
                  { icon: Factory, label: 'Manufacturing' },
                  { icon: Hammer, label: 'Work Orders' },
                  { icon: DollarSign, label: 'Sales Orders' },
                  { icon: Truck, label: 'Purchase Orders' },
                  { icon: FileText, label: 'Invoices' },
                  { icon: Users, label: 'Customers' },
                  { icon: Globe, label: 'Vendors' },
                  { icon: Bot, label: 'AI Copilot' },
                  { icon: History, label: 'Audit Logs' },
                  { icon: TrendingUp, label: 'Reports' },
                  { icon: Search, label: 'Global Search' },
                ].map(({ icon: Icon, label }, i) => (
                  <div key={`${setIdx}-${i}`} className="flex items-center gap-2 text-slate-500">
                    <Icon className="w-4 h-4 text-slate-600" />
                    <span className="text-xs font-semibold tracking-wide">{label}</span>
                    <span className="text-slate-800">·</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            4. FEATURES GRID
            ═══════════════════════════════════════════════════════════════════ */}
        <section id="features" className="relative py-24 px-6 lg:px-12" ref={featRef}>
          <div className="max-w-7xl mx-auto">
            {/* Section Header */}
            <div
              className={`text-center space-y-4 mb-16 transition-all duration-700 ${
                featVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-4 py-1.5 text-xs text-slate-400 font-semibold">
                <Layers className="w-3.5 h-3.5 text-violet-400" />
                Enterprise Modules
              </div>
              <h2 className="text-3xl lg:text-4xl font-black tracking-tight text-white">
                Everything You Need to Run
                <br />
                <span className="animated-gradient-text">Your Manufacturing Business</span>
              </h2>
              <p className="text-slate-500 text-sm max-w-lg mx-auto">
                Nine integrated modules covering the entire manufacturing value chain — from raw material procurement to finished goods fulfillment.
              </p>
            </div>

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {features.map((feat, idx) => {
                const Icon = feat.icon;
                return (
                  <div
                    key={feat.title}
                    className={`group relative rounded-2xl border ${feat.border} bg-gradient-to-br ${feat.glow} p-6 space-y-4 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-violet-950/20 cursor-default ${
                      featVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                    }`}
                    style={{ transitionDelay: featVisible ? `${idx * 80}ms` : '0ms' }}
                  >
                    <div className="glass-card absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative z-10 space-y-4">
                      <div className={`p-3 rounded-xl ${feat.iconBg} border border-slate-800/50 w-fit`}>
                        <Icon className={`w-5 h-5 ${feat.color} group-hover:scale-110 transition-transform duration-300`} />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                          {feat.title}
                          <ChevronRight className="w-3.5 h-3.5 text-slate-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-300" />
                        </h3>
                        <p className="text-xs text-slate-400 leading-relaxed">{feat.desc}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            5. WORKFLOW VISUALIZATION
            ═══════════════════════════════════════════════════════════════════ */}
        <section id="workflow" className="relative py-24 px-6 lg:px-12" ref={workflowRef}>
          {/* Background accent */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-950/[0.03] to-transparent" />

          <div className="max-w-6xl mx-auto relative z-10">
            {/* Section Header */}
            <div
              className={`text-center space-y-4 mb-16 transition-all duration-700 ${
                workflowVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-4 py-1.5 text-xs text-slate-400 font-semibold">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                End-to-End Operations
              </div>
              <h2 className="text-3xl lg:text-4xl font-black tracking-tight text-white">
                From Order to Delivery,
                <br />
                <span className="animated-gradient-text">Fully Orchestrated</span>
              </h2>
              <p className="text-slate-500 text-sm max-w-lg mx-auto">
                A seamless flow connecting every department — sales, production, procurement, and fulfillment.
              </p>
            </div>

            {/* Workflow Steps */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-3">
              {workflowSteps.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.label}
                    className={`relative group transition-all duration-500 ${
                      workflowVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                    }`}
                    style={{ transitionDelay: workflowVisible ? `${idx * 120}ms` : '0ms' }}
                  >
                    {/* Connector line */}
                    {idx < workflowSteps.length - 1 && (
                      <div className="hidden lg:block absolute top-8 -right-[10px] w-5 h-px bg-gradient-to-r from-slate-700 to-slate-800" />
                    )}

                    <div className="flex flex-col items-center text-center p-5 rounded-2xl border border-slate-800/50 bg-slate-900/30 hover:bg-slate-900/60 hover:border-slate-700/50 transition-all duration-300 group-hover:scale-[1.03]">
                      {/* Step number */}
                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[9px] font-bold text-violet-400 tracking-wider">
                        {String(idx + 1).padStart(2, '0')}
                      </div>

                      <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/30 mb-3 group-hover:bg-violet-500/10 group-hover:border-violet-500/20 transition-all duration-300">
                        <Icon className="w-5 h-5 text-slate-400 group-hover:text-violet-400 transition-colors duration-300" />
                      </div>
                      <h4 className="text-xs font-bold text-white mb-1">{step.label}</h4>
                      <p className="text-[10px] text-slate-500 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            6. ARCHITECTURE STATS
            ═══════════════════════════════════════════════════════════════════ */}
        <section id="stats" className="relative py-24 px-6 lg:px-12" ref={statsRef}>
          <div className="max-w-5xl mx-auto">
            {/* Section Header */}
            <div
              className={`text-center space-y-4 mb-16 transition-all duration-700 ${
                statsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-4 py-1.5 text-xs text-slate-400 font-semibold">
                <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                Built for Scale
              </div>
              <h2 className="text-3xl lg:text-4xl font-black tracking-tight text-white">
                Enterprise Architecture,
                <br />
                <span className="animated-gradient-text">Purpose-Built</span>
              </h2>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  ref: modulesRef,
                  count: modulesCount,
                  suffix: '',
                  label: 'Feature Modules',
                  desc: 'Dashboard, Products, Inventory, Warehouses, BOM, Manufacturing, Work Orders, Sales, Purchase, Invoices, Payments, Customers, Vendors, AI Copilot, Audit, Reports, Search',
                  icon: Layers,
                  color: 'text-violet-400',
                  border: 'border-violet-500/20',
                  glow: 'from-violet-500/8',
                },
                {
                  ref: rolesRef,
                  count: rolesCount,
                  suffix: '',
                  label: 'User Roles',
                  desc: 'Admin, Sales User, Purchase User, Manufacturing User, Inventory Manager, Business Owner — each with granular route-level permissions',
                  icon: Users,
                  color: 'text-cyan-400',
                  border: 'border-cyan-500/20',
                  glow: 'from-cyan-500/8',
                },
                {
                  ref: tablesRef,
                  count: tablesCount,
                  suffix: '',
                  label: 'Database Tables',
                  desc: 'Normalized relational schema with UUID keys, constraint-enforced integrity, trigger-maintained timestamps, and indexed query paths',
                  icon: Layers,
                  color: 'text-emerald-400',
                  border: 'border-emerald-500/20',
                  glow: 'from-emerald-500/8',
                },
              ].map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.label}
                    ref={stat.ref}
                    className={`relative group rounded-2xl border ${stat.border} bg-gradient-to-br ${stat.glow} to-transparent p-8 text-center transition-all duration-500 hover:scale-[1.02] ${
                      statsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                    }`}
                    style={{ transitionDelay: statsVisible ? `${idx * 150}ms` : '0ms' }}
                  >
                    <div className={`inline-flex p-3 rounded-xl bg-slate-900/80 border border-slate-800 mb-4`}>
                      <Icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                    <h3 className="text-5xl font-black text-white mb-1">
                      {stat.count}
                      {stat.suffix}
                    </h3>
                    <p className="text-sm font-bold text-slate-300 mb-3">{stat.label}</p>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{stat.desc}</p>
                  </div>
                );
              })}
            </div>

            {/* Tech Stack Row */}
            <div
              className={`mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 transition-all duration-700 delay-300 ${
                statsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              {[
                { label: 'React 19', sub: 'Frontend Framework' },
                { label: 'Node.js', sub: 'Backend Runtime' },
                { label: 'PostgreSQL', sub: 'Database Engine' },
                { label: 'Tailwind CSS', sub: 'Design System' },
              ].map((tech) => (
                <div
                  key={tech.label}
                  className="rounded-xl border border-slate-800/50 bg-slate-900/30 p-4 text-center hover:border-slate-700/60 hover:bg-slate-900/50 transition-all duration-300"
                >
                  <p className="text-sm font-bold text-white">{tech.label}</p>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">{tech.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            7. CALL TO ACTION
            ═══════════════════════════════════════════════════════════════════ */}
        <section className="relative py-24 px-6 lg:px-12" ref={ctaRef}>
          <div
            className={`max-w-4xl mx-auto relative z-10 transition-all duration-700 ${
              ctaVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <div className="relative overflow-hidden rounded-3xl border border-slate-800/60">
              {/* CTA Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-violet-950/40 via-slate-900/80 to-indigo-950/40" />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-950/60" />
              <FloatingOrb
                className="w-[300px] h-[300px] bg-violet-500/10 blur-[80px]"
                style={{ top: '-20%', right: '-10%' }}
              />
              <FloatingOrb
                className="w-[250px] h-[250px] bg-indigo-500/10 blur-[80px]"
                style={{ bottom: '-20%', left: '-10%' }}
              />

              <div className="relative z-10 p-10 lg:p-16 text-center space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/25 bg-violet-500/[0.08] px-4 py-1.5 text-xs text-violet-400 font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  Get Started Today
                </div>

                <h2 className="text-3xl lg:text-4xl font-black tracking-tight text-white">
                  Ready to Transform Your
                  <br />
                  <span className="animated-gradient-text">Manufacturing Operations?</span>
                </h2>

                <p className="text-slate-400 text-sm max-w-lg mx-auto">
                  Join the platform that brings inventory, production, procurement, and sales
                  into one unified command center.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                  <button
                    onClick={handlePrimaryClick}
                    className="group w-full sm:w-auto flex items-center justify-center gap-2.5 px-10 py-4 animated-gradient-bg hover:opacity-90 active:scale-[0.97] transition-all text-white font-bold rounded-2xl text-sm shadow-2xl shadow-violet-950/50"
                  >
                    {isAuthenticated ? 'Open Dashboard' : 'Access ERP Portal'}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                  {!isAuthenticated && (
                    <button
                      onClick={handleSecondaryClick}
                      className="w-full sm:w-auto px-10 py-4 rounded-2xl border border-slate-700 bg-slate-900/40 hover:bg-slate-800/60 hover:border-slate-600 active:scale-[0.97] transition-all text-slate-200 font-bold text-sm"
                    >
                      Create Account
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            8. FOOTER
            ═══════════════════════════════════════════════════════════════════ */}
        <footer className="relative border-t border-slate-800/50 bg-slate-950">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              {/* Footer Logo */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg animated-gradient-bg flex items-center justify-center">
                  <span className="text-white font-black text-[10px] tracking-widest">SF</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-300">Shiv Furniture Works</p>
                  <p className="text-[9px] text-slate-600 font-medium">Enterprise Resource Planning</p>
                </div>
              </div>

              {/* Footer Info */}
              <div className="flex items-center gap-6 text-xs text-slate-600">
                <p>© 2026 All rights reserved</p>
                <div className="flex items-center gap-1.5">
                  <span>System Status</span>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default LandingPage;
