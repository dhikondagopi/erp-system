import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, RefreshCw, Database, Sparkles, ExternalLink } from 'lucide-react';
import aiApi from '../../../services/aiApi';

const StatusBadge = ({ status }) => {
  const config = {
    OK: { color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10', icon: CheckCircle2, label: 'Online' },
    ERROR: { color: 'text-red-400 border-red-500/30 bg-red-500/10', icon: XCircle, label: 'Error' },
    NOT_CONFIGURED: { color: 'text-amber-400 border-amber-500/30 bg-amber-500/10', icon: AlertTriangle, label: 'Not Configured' },
    HEALTHY: { color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10', icon: CheckCircle2, label: 'Healthy' },
    DEGRADED: { color: 'text-amber-400 border-amber-500/30 bg-amber-500/10', icon: AlertTriangle, label: 'Degraded' },
  };

  const { color, icon: Icon, label } = config[status] || config.ERROR;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold ${color}`}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </span>
  );
};

const AiDiagnosticsPanel = () => {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState(null);

  const checkHealth = async () => {
    setLoading(true);
    try {
      const data = await aiApi.getHealth();
      setHealth(data);
    } catch (err) {
      setHealth({
        overall: 'ERROR',
        database: { status: 'ERROR', error: 'Cannot reach backend.' },
        gemini: { status: 'ERROR', configured: false, error: 'Cannot reach backend.' },
      });
    } finally {
      setLoading(false);
      setLastChecked(new Date());
    }
  };

  useEffect(() => {
    checkHealth();
    // Re-check every 60 seconds
    const interval = setInterval(checkHealth, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/30 backdrop-blur-xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white tracking-wide">AI System Diagnostics</h3>
            {lastChecked && (
              <p className="text-[10px] text-slate-500 mt-0.5">
                Last checked: {lastChecked.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={checkHealth}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950/40 text-slate-400 hover:text-white text-xs font-semibold transition-all disabled:opacity-40"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {loading && !health ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-14 bg-slate-800/60 rounded-xl" />
          <div className="h-14 bg-slate-800/60 rounded-xl" />
        </div>
      ) : health ? (
        <div className="space-y-3">
          {/* Overall Status */}
          <div className={`flex items-center justify-between p-3 rounded-xl border ${
            health.overall === 'HEALTHY'
              ? 'border-emerald-500/20 bg-emerald-950/10'
              : 'border-amber-500/20 bg-amber-950/10'
          }`}>
            <span className="text-xs font-bold text-slate-300">Overall System Status</span>
            <StatusBadge status={health.overall} />
          </div>

          {/* Database */}
          <div className="flex items-start justify-between p-3 rounded-xl border border-slate-800 bg-slate-950/30">
            <div className="flex items-center gap-2.5">
              <Database className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-white">PostgreSQL Database</p>
                {health.database?.error && (
                  <p className="text-[10px] text-red-400 mt-0.5 font-medium">{health.database.error}</p>
                )}
              </div>
            </div>
            <StatusBadge status={health.database?.status} />
          </div>

          {/* Gemini AI */}
          <div className="flex items-start justify-between p-3 rounded-xl border border-slate-800 bg-slate-950/30">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-violet-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-white">
                  Google Gemini AI
                  {health.gemini?.model && (
                    <span className="text-[10px] text-slate-500 font-normal ml-2">({health.gemini.model})</span>
                  )}
                </p>
                {health.gemini?.error && (
                  <p className="text-[10px] text-amber-400 mt-0.5 font-medium leading-relaxed max-w-xs">
                    {health.gemini.error}
                  </p>
                )}
              </div>
            </div>
            <StatusBadge status={health.gemini?.status} />
          </div>

          {/* Setup Guide if Gemini not configured */}
          {(health.gemini?.status === 'NOT_CONFIGURED' || !health.gemini) && (
            <div className="rounded-xl border border-violet-500/20 bg-violet-950/10 p-4 space-y-2">
              <p className="text-xs font-bold text-violet-300">🔑 Setup Required — Add Gemini API Key (Free)</p>
              <ol className="text-[11px] text-slate-400 space-y-1.5 pl-4 list-decimal font-medium">
                <li>
                  Visit{' '}
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-violet-400 hover:text-violet-300 underline inline-flex items-center gap-1"
                  >
                    Google AI Studio <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                  {' '}— sign up free, no credit card.
                </li>
                <li>Click <strong className="text-white">"Get API key"</strong> or <strong className="text-white">"Create API Key"</strong></li>
                <li>Copy the key.</li>
                <li>Open <code className="bg-slate-800 px-1 rounded text-slate-300">backend/.env</code></li>
                <li>Set: <code className="bg-slate-800 px-1 rounded text-slate-300">GEMINI_API_KEY=your_key_here</code></li>
                <li>Restart the backend server.</li>
              </ol>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default AiDiagnosticsPanel;
