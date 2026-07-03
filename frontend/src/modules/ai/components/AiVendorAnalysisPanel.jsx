import React, { useEffect, useState } from 'react';
import { Truck, Award, AlertCircle, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';
import aiApi from '../../../services/aiApi';

const AiVendorAnalysisPanel = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchVendorAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await aiApi.getVendorAnalysis();
      setData(result);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load vendor analysis.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendorAnalysis();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-900 bg-slate-950/20 p-12 text-center flex flex-col items-center justify-center gap-4 animate-pulse">
        <RefreshCw className="w-8 h-8 text-violet-400 animate-spin" />
        <p className="text-slate-400 text-sm font-semibold">Running vendor delivery performance audits...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-950/10 p-8 flex items-center justify-between">
        <div className="flex items-center gap-3 text-red-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>Error loading vendor insights: {error}</span>
        </div>
        <button 
          onClick={fetchVendorAnalysis} 
          className="px-4 py-2 rounded-xl bg-red-900/20 border border-red-900/35 text-red-300 text-xs font-bold flex items-center gap-1.5 hover:bg-red-900/30 shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </button>
      </div>
    );
  }

  const { rankings = [], lead_time_analysis = [], recommendations = [] } = data || {};

  return (
    <div className="space-y-6">
      
      {/* Recommendations card */}
      {recommendations.length > 0 && (
        <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-r from-slate-900/60 to-violet-950/15 p-5 backdrop-blur-xl shadow-lg space-y-3">
          <h3 className="text-xs font-bold text-violet-400 uppercase tracking-widest flex items-center gap-1.5">
            <Award className="w-4 h-4" />
            AI Sourcing Directive
          </h3>
          <div className="space-y-2">
            {recommendations.map((rec, i) => (
              <p key={i} className="text-slate-200 text-sm leading-relaxed font-semibold">
                • {rec}
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Section: Delivery rankings */}
        <div className="lg:col-span-3 rounded-2xl border border-slate-800 bg-slate-900/20 p-5 space-y-4 shadow-xl">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Truck className="w-4.5 h-4.5 text-blue-400" />
            Supplier Reliability Rankings
          </h3>

          <div className="space-y-3">
            {rankings.map((vendor, i) => {
              const grade = vendor.performance_grade || 'A';
              const isTop = grade === 'A' || grade === 'B';
              return (
                <div key={i} className="rounded-xl border border-slate-850 bg-slate-950/40 p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <span className="text-sm font-black text-slate-500">#{vendor.rank}</span>
                    <div>
                      <h4 className="text-xs font-bold text-white">{vendor.vendor_name}</h4>
                      <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                        Spend: ${parseFloat(vendor.total_spend || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-5 text-right">
                    <div>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">On-Time delivery</p>
                      <p className={`text-xs font-extrabold mt-0.5 ${
                        vendor.on_time_delivery_pct >= 90 
                          ? 'text-emerald-450' 
                          : vendor.on_time_delivery_pct >= 80 
                          ? 'text-amber-400' 
                          : 'text-red-400'
                      }`}>
                        {vendor.on_time_delivery_pct}%
                      </p>
                    </div>

                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs border ${
                      isTop 
                        ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-450' 
                        : 'border-amber-500/20 bg-amber-500/10 text-amber-450'
                    }`}>
                      {grade}
                    </div>
                  </div>
                </div>
              );
            })}

            {rankings.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-12 font-semibold">No vendor purchase records to evaluate.</p>
            )}
          </div>
        </div>

        {/* Right Section: Lead time analysis */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/20 p-5 space-y-4 shadow-xl">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-violet-400" />
            Lead Time Bottlenecks
          </h3>

          <div className="space-y-3">
            {lead_time_analysis.map((item, i) => {
              const isBottleneck = item.lead_time_days > 5;
              return (
                <div key={i} className={`rounded-xl border p-3 flex justify-between items-center ${
                  isBottleneck ? 'border-amber-500/20 bg-amber-950/5' : 'border-slate-850 bg-slate-950/40'
                }`}>
                  <div className="min-w-0 flex-1 pr-2">
                    <h4 className="text-xs font-bold text-white truncate">{item.product_name}</h4>
                    <p className="text-[9px] font-bold text-slate-500 mt-0.5 truncate">Supplier: {item.vendor_name}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`text-xs font-black ${isBottleneck ? 'text-amber-400' : 'text-slate-400'}`}>
                      {item.lead_time_days} days
                    </span>
                    {isBottleneck && (
                      <p className="text-[8px] font-bold text-amber-500 uppercase tracking-wide mt-0.5">Bottleneck</p>
                    )}
                  </div>
                </div>
              );
            })}

            {lead_time_analysis.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-12 font-semibold">No vendor product lead-times registered.</p>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default AiVendorAnalysisPanel;
