import React, { useEffect, useState } from 'react';
import { TrendingUp, RefreshCw, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import aiApi from '../../../services/aiApi';

const AiForecastingPanel = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchForecasting = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await aiApi.getForecast();
      setData(result);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load demand forecasts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecasting();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-900 bg-slate-950/20 p-12 text-center flex flex-col items-center justify-center gap-4 animate-pulse">
        <RefreshCw className="w-8 h-8 text-violet-400 animate-spin" />
        <p className="text-slate-400 text-sm font-semibold">Running statistical forecasting aggregates...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-950/10 p-8 flex items-center justify-between">
        <div className="flex items-center gap-3 text-red-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>Error loading demand forecast: {error}</span>
        </div>
        <button 
          onClick={fetchForecasting} 
          className="px-4 py-2 rounded-xl bg-red-900/20 border border-red-900/35 text-red-300 text-xs font-bold flex items-center gap-1.5 hover:bg-red-900/30 shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </button>
      </div>
    );
  }

  const { forecasts = [], analysis_summary = '' } = data || {};

  return (
    <div className="space-y-6">
      
      {/* Summary card */}
      {analysis_summary && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-5 shadow-lg">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2.5">Analysis Summary</h3>
          <p className="text-slate-200 text-sm leading-relaxed font-semibold">
            {analysis_summary}
          </p>
        </div>
      )}

      {/* Forecast list and charts */}
      <div className="space-y-6">
        {forecasts.map((item, idx) => {
          const chartData = [
            ...item.historical.map(h => ({ name: h.month, demand: h.quantity })),
            { name: `${item.forecast.month} (Forecast)`, demand: item.forecast.expected_demand }
          ];

          return (
            <div key={idx} className="rounded-2xl border border-slate-800 bg-slate-900/20 p-5 grid grid-cols-1 lg:grid-cols-5 gap-6 shadow-xl">
              
              {/* Product information left column */}
              <div className="lg:col-span-2 space-y-4">
                <div>
                  <h4 className="text-base font-extrabold text-white">{item.name}</h4>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">{item.sku}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="bg-slate-950/50 border border-slate-850 p-3 text-center">
                    <p className="text-slate-500 text-[9px] font-black uppercase">Expected Demand</p>
                    <p className="text-lg font-black text-violet-400 mt-1">{item.forecast.expected_demand}</p>
                    <p className="text-[8px] text-slate-500 mt-0.5">Next Month</p>
                  </div>

                  <div className="bg-slate-950/50 border border-slate-850 p-3 text-center">
                    <p className="text-slate-500 text-[9px] font-black uppercase">Buffer stock</p>
                    <p className="text-lg font-black text-blue-400 mt-1">{item.forecast.recommended_stock_level}</p>
                    <p className="text-[8px] text-slate-500 mt-0.5">Safety Level</p>
                  </div>

                  <div className="bg-slate-950/50 border border-slate-850 p-3 text-center">
                    <p className="text-slate-500 text-[9px] font-black uppercase">Procure Qty</p>
                    <p className="text-lg font-black text-emerald-450 mt-1">{item.forecast.recommended_procurement_qty}</p>
                    <p className="text-[8px] text-slate-500 mt-0.5">Recommended</p>
                  </div>
                </div>

                <div className="rounded-xl bg-slate-950/40 p-4 border border-slate-850 space-y-2 text-xs">
                  <p className="font-bold text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-450 animate-pulse" />
                    AI Action Directive
                  </p>
                  <p className="text-slate-400 leading-relaxed font-semibold">
                    Calculated demand spikes indicate a buffer target of **{item.forecast.recommended_stock_level}** units is needed to minimize stockout risk.
                  </p>
                </div>
              </div>

              {/* Chart right column */}
              <div className="lg:col-span-3 h-64 bg-slate-950/40 p-4 rounded-xl border border-slate-900">
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3">Historical Monthly Sales vs AI Forecast (Qty)</p>
                <ResponsiveContainer width="100%" height="85%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id={`grad-fore-${idx}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: '10px' }} />
                    <YAxis stroke="#64748b" style={{ fontSize: '10px' }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }} 
                      labelStyle={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                      itemStyle={{ color: '#a78bfa', fontSize: '11px' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="demand" 
                      stroke="#8b5cf6" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill={`url(#grad-fore-${idx})`} 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

            </div>
          );
        })}

        {forecasts.length === 0 && (
          <p className="text-xs text-slate-500 text-center py-12 font-semibold">No products registered with historical sales data to forecast.</p>
        )}
      </div>

    </div>
  );
};

export default AiForecastingPanel;
