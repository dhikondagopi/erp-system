import React, { useEffect, useState } from 'react';
import { ShoppingCart, AlertTriangle, AlertCircle, RefreshCw, Layers, CheckCircle2 } from 'lucide-react';
import aiApi from '../../../services/aiApi';

const AiProcurementPanel = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProcurement = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await aiApi.getProcurement();
      setData(result);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load procurement recommendations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProcurement();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-900 bg-slate-950/20 p-12 text-center flex flex-col items-center justify-center gap-4 animate-pulse">
        <RefreshCw className="w-8 h-8 text-violet-400 animate-spin" />
        <p className="text-slate-400 text-sm font-semibold">Running MRP Engine & shortage checks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-950/10 p-8 flex items-center justify-between">
        <div className="flex items-center gap-3 text-red-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>Error loading AI recommendations: {error}</span>
        </div>
        <button 
          onClick={fetchProcurement} 
          className="px-4 py-2 rounded-xl bg-red-900/20 border border-red-900/35 text-red-300 text-xs font-bold flex items-center gap-1.5 hover:bg-red-900/30 shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </button>
      </div>
    );
  }

  const { shortages = [], recommendations = [], alerts = [] } = data || {};

  return (
    <div className="space-y-6">
      
      {/* 1. Procurement Alerts */}
      {alerts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {alerts.map((al, i) => (
            <div 
              key={i} 
              className={`rounded-2xl border p-4 flex items-start gap-3 backdrop-blur-xl ${
                al.severity === 'HIGH' 
                  ? 'border-red-500/20 bg-red-950/10 text-red-300'
                  : al.severity === 'MEDIUM'
                  ? 'border-amber-500/20 bg-amber-950/10 text-amber-300'
                  : 'border-slate-800 bg-slate-900/40 text-slate-300'
              }`}
            >
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold uppercase tracking-widest text-[9px] opacity-75">Procurement Risk Alert</p>
                <p className="text-xs mt-1 font-semibold leading-relaxed">{al.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. Shortages vs Recommendations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Shortages */}
        <div className="lg:col-span-1 rounded-2xl border border-slate-800 bg-slate-900/20 p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Shortage Analysis</h3>
            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
              {shortages.length} Breaches
            </span>
          </div>

          <div className="space-y-3">
            {shortages.map((sh, idx) => (
              <div key={idx} className="rounded-xl border border-slate-850 bg-slate-950/40 p-3.5 space-y-2">
                <div className="flex justify-between items-start">
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="text-xs font-bold text-white truncate">{sh.name}</p>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">{sh.sku} • {sh.type}</p>
                  </div>
                  <span className="text-xs font-black text-red-400 bg-red-950/30 px-2 py-1 rounded-lg shrink-0">
                    Shortage: {sh.shortage_qty}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1 text-center pt-1 border-t border-slate-900/60 text-[10px]">
                  <div>
                    <p className="text-slate-500 font-semibold">On Hand</p>
                    <p className="text-slate-300 mt-0.5 font-extrabold">{sh.qty_on_hand}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 font-semibold">Reserved</p>
                    <p className="text-slate-300 mt-0.5 font-extrabold">{sh.qty_reserved}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 font-semibold">Pending demand</p>
                    <p className="text-slate-300 mt-0.5 font-extrabold">{sh.pending_demand}</p>
                  </div>
                </div>
              </div>
            ))}

            {shortages.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-8 font-semibold">No stockout shortages detected.</p>
            )}
          </div>
        </div>

        {/* Right Column: Recommendations */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/20 p-5 space-y-4 shadow-xl">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">AI Procurement Suggestions</h3>

          <div className="space-y-4">
            {recommendations.map((rec, idx) => (
              <div key={idx} className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-950/40 p-5 hover:border-violet-500/35 transition-all">
                <div className="absolute top-0 right-0 px-3 py-1 text-[9px] font-black uppercase tracking-wider rounded-bl-lg bg-slate-900 text-slate-400">
                  Confidence: {rec.confidence_score}%
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wide ${
                      rec.type === 'MANUFACTURE' 
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {rec.type === 'MANUFACTURE' ? 'MAKE ORDER' : 'BUY ORDER'}
                    </span>
                    <div>
                      <h4 className="text-xs font-black text-white">{rec.name}</h4>
                      <p className="text-[9px] font-bold text-slate-500 mt-0.5">{rec.sku}</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-350 leading-relaxed font-semibold">
                    {rec.type === 'MANUFACTURE' 
                      ? `Generate Manufacturing Order draft to assemble ${rec.quantity} items.`
                      : `Generate Purchase Order draft to procure ${rec.quantity} units.`
                    }
                  </p>

                  {/* Purchase order vendor options */}
                  {rec.type === 'PURCHASE' && rec.vendor_name && (
                    <div className="grid grid-cols-3 gap-2 bg-slate-900/30 p-3 rounded-lg border border-slate-900 text-[10px] max-w-md">
                      <div>
                        <p className="text-slate-500 font-bold">Suggested Vendor</p>
                        <p className="text-slate-300 mt-0.5 font-extrabold truncate">{rec.vendor_name}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 font-bold">Lead Time</p>
                        <p className="text-slate-300 mt-0.5 font-extrabold">{rec.lead_time_days} days</p>
                      </div>
                      <div>
                        <p className="text-slate-500 font-bold">Unit Price</p>
                        <p className="text-slate-300 mt-0.5 font-extrabold">${rec.vendor_price}</p>
                      </div>
                    </div>
                  )}

                  {/* Required materials */}
                  {rec.type === 'MANUFACTURE' && rec.required_materials?.length > 0 && (
                    <div className="space-y-2 bg-slate-900/30 p-3 rounded-lg border border-slate-900">
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Required Raw Materials (BOM Breakout)</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                        {rec.required_materials.map((rm, rmIdx) => (
                          <div key={rmIdx} className="flex justify-between items-center bg-slate-950/60 px-2 py-1 rounded">
                            <span className="text-slate-300 truncate font-semibold">{rm.name}</span>
                            <span className="text-violet-400 font-black ml-2 shrink-0">{rm.quantity_required} units</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            ))}

            {recommendations.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-12 font-semibold">No procurement recommendations computed.</p>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default AiProcurementPanel;
