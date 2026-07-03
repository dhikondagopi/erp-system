import React, { useEffect, useState } from 'react';
import { Layers, AlertTriangle, AlertCircle, RefreshCw, Sparkles, TrendingDown, TrendingUp } from 'lucide-react';
import aiApi from '../../../services/aiApi';

const AiInventoryInsightsPanel = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await aiApi.getInventoryInsights();
      setData(result);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load inventory insights.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-900 bg-slate-950/20 p-12 text-center flex flex-col items-center justify-center gap-4 animate-pulse">
        <RefreshCw className="w-8 h-8 text-violet-400 animate-spin" />
        <p className="text-slate-400 text-sm font-semibold">Running inventory statistics checks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-950/10 p-8 flex items-center justify-between">
        <div className="flex items-center gap-3 text-red-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>Error loading inventory insights: {error}</span>
        </div>
        <button 
          onClick={fetchInsights} 
          className="px-4 py-2 rounded-xl bg-red-900/20 border border-red-900/35 text-red-300 text-xs font-bold flex items-center gap-1.5 hover:bg-red-900/30 shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </button>
      </div>
    );
  }

  const { dead_stock_alerts = [], slow_moving_alerts = [], overstock_alerts = [], understock_alerts = [], inventory_health_score = 80 } = data || {};

  return (
    <div className="space-y-6">
      
      {/* Health Score Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Health Score Card */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/20 p-5 shadow-xl flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Inventory Health Score</p>
            <p className="text-3xl font-black text-white">{inventory_health_score}/100</p>
            <p className="text-[10px] text-slate-500 font-semibold">Turnover & Safety Stock Index</p>
          </div>
          <div className={`w-14 h-14 rounded-full border-4 flex items-center justify-center font-black text-lg ${
            inventory_health_score >= 80 
              ? 'border-emerald-500/20 text-emerald-400' 
              : inventory_health_score >= 60 
              ? 'border-amber-500/20 text-amber-400' 
              : 'border-red-500/20 text-red-400'
          }`}>
            {inventory_health_score}%
          </div>
        </div>

        {/* Warnings Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-5 shadow-xl flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Critical Anomalies</p>
            <p className="text-3xl font-black text-white">{dead_stock_alerts.length + overstock_alerts.length + understock_alerts.length}</p>
            <p className="text-[10px] text-slate-500 font-semibold">Anomalies requiring review</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Status Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-5 shadow-xl flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Slow Moving items</p>
            <p className="text-3xl font-black text-white">{slow_moving_alerts.length}</p>
            <p className="text-[10px] text-slate-500 font-semibold">Units with low demand</p>
          </div>
          <div className="p-3 rounded-xl bg-violet-500/10 text-violet-400">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Dead Stock & Slow Moving */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-5 space-y-4 shadow-xl">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <TrendingDown className="w-4 h-4 text-red-400" />
            Dead Stock & Slow Moving Items
          </h3>

          <div className="space-y-3">
            {dead_stock_alerts.map((al, i) => (
              <div key={`dead-${i}`} className="rounded-xl border border-red-500/10 bg-red-950/5 p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-bold text-white">{al.name}</h4>
                    <p className="text-[9px] font-bold text-slate-500 uppercase mt-0.5">{al.sku} • {al.qty_on_hand} items on hand</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-red-500/10 text-red-400">Dead Stock</span>
                </div>
                <p className="text-xs text-slate-400 font-semibold">{al.recommendation}</p>
              </div>
            ))}

            {slow_moving_alerts.map((al, i) => (
              <div key={`slow-${i}`} className="rounded-xl border border-slate-850 bg-slate-950/30 p-4 flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-bold text-white">{al.name}</h4>
                  <p className="text-[9px] font-bold text-slate-500 uppercase mt-0.5">{al.sku} • {al.qty_on_hand} items on hand</p>
                </div>
                <span className="text-xs font-bold text-slate-400">Sold: {al.qty_sold_60_days || 0} units</span>
              </div>
            ))}

            {dead_stock_alerts.length === 0 && slow_moving_alerts.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-12 font-semibold">No dead or slow-moving items detected.</p>
            )}
          </div>
        </div>

        {/* Overstock & Understock Alerts */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-5 space-y-4 shadow-xl">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Overstock & Understock Alerts
          </h3>

          <div className="space-y-3">
            {overstock_alerts.map((al, i) => (
              <div key={`over-${i}`} className="rounded-xl border border-amber-500/10 bg-amber-950/5 p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-bold text-white">{al.name}</h4>
                    <p className="text-[9px] font-bold text-slate-500 uppercase mt-0.5">{al.sku} • On Hand: {al.qty_on_hand} (RP: {al.reorder_point})</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-amber-500/10 text-amber-400">Overstock</span>
                </div>
                <p className="text-xs text-slate-450 font-semibold">{al.recommendation}</p>
              </div>
            ))}

            {understock_alerts.map((al, i) => (
              <div key={`under-${i}`} className="rounded-xl border border-red-500/15 bg-red-950/5 p-4 flex justify-between items-center border-dashed">
                <div>
                  <h4 className="text-xs font-bold text-white">{al.name}</h4>
                  <p className="text-[9px] font-bold text-slate-500 uppercase mt-0.5">{al.sku} • On Hand: {al.qty_on_hand}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[9px] font-bold uppercase text-red-400 bg-red-950/30 px-2 py-0.5 rounded border border-red-900/30">Understock</span>
                  <p className="text-[10px] text-slate-500 font-bold mt-1">Reorder Pt: {al.reorder_point}</p>
                </div>
              </div>
            ))}

            {overstock_alerts.length === 0 && understock_alerts.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-12 font-semibold">Inventory margins are running within safety specifications.</p>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default AiInventoryInsightsPanel;
