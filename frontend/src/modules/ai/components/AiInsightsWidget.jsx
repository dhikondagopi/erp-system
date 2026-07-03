import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, AlertTriangle, Info, AlertCircle, RefreshCw } from 'lucide-react';
import aiApi from '../../../services/aiApi';

const AiInsightsWidget = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const insights = await aiApi.getInsights();
      setData(insights);
    } catch (err) {
      console.error('Failed to load AI insights:', err);
      setError(err.response?.data?.message || 'Could not load AI Insights.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-violet-500/10 bg-slate-900/40 p-6 animate-pulse backdrop-blur-md space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-600/20" />
          <div className="h-4 w-40 bg-slate-800 rounded" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-full bg-slate-800 rounded" />
          <div className="h-3 w-5/6 bg-slate-800 rounded" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-950/10 p-5 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3 text-red-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>Error loading AI summary: {error}</span>
        </div>
        <button 
          onClick={fetchInsights}
          className="text-xs text-red-300 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/20 border border-red-900/30 transition-all shrink-0"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  const { executive_summary, insights } = data || {};

  return (
    <div className="relative overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-r from-slate-900/60 to-violet-950/15 p-6 backdrop-blur-xl shadow-xl group">
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-violet-600/15 blur-[60px] group-hover:scale-110 transition-transform duration-500 pointer-events-none" />

      <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6 z-10">
        
        {/* Left Section: Executive Summary & Details */}
        <div className="space-y-4 max-w-3xl">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 shadow-md shadow-violet-500/20">
              <Sparkles className="w-4.5 h-4.5 text-white animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">AI Executive Summary</h3>
              <p className="text-[10px] text-violet-400 font-semibold tracking-wider uppercase">Live Database Analysis</p>
            </div>
          </div>

          {executive_summary && (
            <p className="text-slate-300 text-sm leading-relaxed font-medium">
              {executive_summary}
            </p>
          )}

          {/* Key Insights List */}
          {insights && insights.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              {insights.map((ins, idx) => {
                const isWarning = ins.severity === 'WARNING';
                const isError = ins.severity === 'ERROR';
                return (
                  <div 
                    key={idx} 
                    className={`flex items-start gap-2.5 rounded-xl border p-3 ${
                      isError 
                        ? 'border-red-500/20 bg-red-950/10 text-red-300' 
                        : isWarning 
                        ? 'border-amber-500/20 bg-amber-950/10 text-amber-300'
                        : 'border-slate-800 bg-slate-950/30 text-slate-300'
                    }`}
                  >
                    {isError ? (
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                    ) : isWarning ? (
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                    ) : (
                      <Info className="w-4 h-4 shrink-0 mt-0.5 text-violet-400" />
                    )}
                    <div className="text-xs">
                      <p className="font-bold uppercase tracking-wider text-[9px] opacity-75">{ins.category}</p>
                      <p className="mt-0.5 font-medium leading-relaxed">{ins.message}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Section: Actions Call to Action */}
        <div className="flex flex-col justify-center sm:items-start shrink-0 space-y-3">
          <button
            onClick={() => navigate('/ai-copilot')}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 active:scale-98 transition-all text-white font-bold text-xs shadow-lg shadow-violet-950/40 w-full"
          >
            <span>Ask AI Chat Copilot</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};

export default AiInsightsWidget;
