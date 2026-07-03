import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Sparkles, MessageSquare, ShoppingCart, TrendingUp, AlertTriangle, 
  Send, RefreshCw, AlertCircle, ArrowRight, Layers, CheckCircle2, ChevronRight, Activity
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  Tooltip, CartesianGrid, Legend, BarChart, Bar 
} from 'recharts';
import aiApi from '../../../services/aiApi';
import AiDiagnosticsPanel from '../../../modules/ai/components/AiDiagnosticsPanel';
import AiChatPanel from '../../../modules/ai/components/AiChatPanel';



const AiCopilotPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'chat';

  // Procurement state
  const [procurementData, setProcurementData] = useState(null);
  const [procurementLoading, setProcurementLoading] = useState(false);
  const [procurementError, setProcurementError] = useState(null);

  // Forecasting state
  const [forecastingData, setForecastingData] = useState(null);
  const [forecastingLoading, setForecastingLoading] = useState(false);
  const [forecastingError, setForecastingError] = useState(null);

  // Load appropriate data based on active tab
  useEffect(() => {
    if (activeTab === 'procurement' && !procurementData) {
      fetchProcurement();
    } else if (activeTab === 'forecast' && !forecastingData) {
      fetchForecasting();
    }
  }, [activeTab]);

  const handleTabChange = (tabName) => {
    setSearchParams({ tab: tabName });
  };

  const fetchProcurement = async () => {
    setProcurementLoading(true);
    setProcurementError(null);
    try {
      const data = await aiApi.getProcurement();
      setProcurementData(data);
    } catch (err) {
      console.error(err);
      setProcurementError('Failed to load procurement recommendations.');
    } finally {
      setProcurementLoading(false);
    }
  };

  const fetchForecasting = async () => {
    setForecastingLoading(true);
    setForecastingError(null);
    try {
      const data = await aiApi.getForecast();
      setForecastingData(data);
    } catch (err) {
      console.error(err);
      setForecastingError('Failed to load demand forecasts.');
    } finally {
      setForecastingLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20">
              <Sparkles className="w-5 h-5 text-violet-400" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">
              AI Copilot Control Panel
            </h1>
          </div>
          <p className="text-slate-400 text-sm ml-14">
            Interact with your AI Assistant, run material requirement planning (MRP), and explore demand forecasts.
          </p>
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="flex border-b border-slate-900 gap-2">
        <button
          onClick={() => handleTabChange('chat')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 text-sm font-semibold transition-all ${
            activeTab === 'chat'
              ? 'border-violet-500 text-violet-400 bg-violet-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Interactive Chat</span>
        </button>

        <button
          onClick={() => handleTabChange('procurement')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 text-sm font-semibold transition-all ${
            activeTab === 'procurement'
              ? 'border-violet-500 text-violet-400 bg-violet-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Procurement & MRP</span>
        </button>

        <button
          onClick={() => handleTabChange('forecast')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 text-sm font-semibold transition-all ${
            activeTab === 'forecast'
              ? 'border-violet-500 text-violet-400 bg-violet-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Demand Forecasting</span>
        </button>

        <button
          onClick={() => handleTabChange('diagnostics')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 text-sm font-semibold transition-all ${
            activeTab === 'diagnostics'
              ? 'border-violet-500 text-violet-400 bg-violet-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>AI Diagnostics</span>
        </button>
      </div>

      {/* ── Tab Content ── */}
      <div className="relative">
        
        {/* Tab 1: AI Chat Assistant */}
        {activeTab === 'chat' && (
          <AiChatPanel />
        )}

        {/* Tab 2: Procurement & MRP */}
        {activeTab === 'procurement' && (
          <div className="space-y-6">
            {procurementLoading ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-12 text-center flex flex-col items-center justify-center gap-4 animate-pulse">
                <RefreshCw className="w-8 h-8 text-violet-400 animate-spin" />
                <p className="text-slate-400 text-sm font-semibold">Running MRP Engine & shortage checks...</p>
              </div>
            ) : procurementError ? (
              <div className="rounded-2xl border border-red-500/20 bg-red-950/10 p-8 flex items-center justify-between">
                <div className="flex items-center gap-3 text-red-400 text-sm">
                  <AlertCircle className="w-5 h-5" />
                  <span>{procurementError}</span>
                </div>
                <button onClick={fetchProcurement} className="px-4 py-2 rounded-xl bg-red-900/20 border border-red-900/35 text-red-300 text-xs font-bold flex items-center gap-1.5 hover:bg-red-900/30">
                  <RefreshCw className="w-3.5 h-3.5" />
                  Retry
                </button>
              </div>
            ) : procurementData ? (
              <div className="space-y-6">
                
                {/* MRP Alerts & Summary */}
                {procurementData.alerts && procurementData.alerts.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {procurementData.alerts.map((al, i) => (
                      <div 
                        key={i} 
                        className={`rounded-2xl border p-4 flex items-start gap-3 backdrop-blur-xl ${
                          al.severity === 'HIGH' 
                            ? 'border-red-500/20 bg-red-950/10 text-red-300 animate-pulse'
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

                {/* Main MRP Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left Section: Shortage Analysis */}
                  <div className="lg:col-span-1 rounded-2xl border border-slate-800 bg-slate-900/20 p-5 space-y-4 shadow-xl">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Shortage Analysis</h3>
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                        {procurementData.shortages?.length || 0} breaches
                      </span>
                    </div>

                    <div className="space-y-3">
                      {procurementData.shortages?.map((sh, idx) => (
                        <div key={idx} className="rounded-xl border border-slate-850 bg-slate-950/40 p-3.5 space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-xs font-bold text-white">{sh.name}</p>
                              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">{sh.sku} • {sh.type}</p>
                            </div>
                            <span className="text-xs font-black text-red-400 bg-red-950/30 px-2 py-1 rounded-lg">
                              Shortage: {sh.shortage_qty}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-1 text-center pt-1 border-t border-slate-900 text-[10px]">
                            <div>
                              <p className="text-slate-500 font-bold">On Hand</p>
                              <p className="text-slate-300 mt-0.5 font-bold">{sh.qty_on_hand}</p>
                            </div>
                            <div>
                              <p className="text-slate-500 font-bold">Reserved</p>
                              <p className="text-slate-300 mt-0.5 font-bold">{sh.qty_reserved}</p>
                            </div>
                            <div>
                              <p className="text-slate-500 font-bold">Demand</p>
                              <p className="text-slate-300 mt-0.5 font-bold">{sh.pending_demand}</p>
                            </div>
                          </div>
                        </div>
                      ))}

                      {(!procurementData.shortages || procurementData.shortages.length === 0) && (
                        <p className="text-xs text-slate-500 text-center py-8 font-medium">No shortages calculated. Stock levels are healthy.</p>
                      )}
                    </div>
                  </div>

                  {/* Right Section: Purchase & Manufacturing recommendations */}
                  <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/20 p-5 space-y-4 shadow-xl">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Recommended Actions</h3>

                    <div className="space-y-4">
                      {procurementData.recommendations?.map((rec, idx) => (
                        <div key={idx} className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-950/40 p-5 hover:border-violet-500/35 transition-all">
                          {/* Top Tag */}
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

                            <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                              {rec.type === 'MANUFACTURE' 
                                ? `Generate Manufacturing Order draft to assemble ${rec.quantity} finished items.`
                                : `Generate Purchase Order draft to procure ${rec.quantity} raw materials from vendor '${rec.vendor_name}'.`
                              }
                            </p>

                            {/* Additional metadata for Purchase orders */}
                            {rec.type === 'PURCHASE' && (
                              <div className="grid grid-cols-3 gap-2 bg-slate-900/30 p-3 rounded-lg border border-slate-900 text-[10px] max-w-md">
                                <div>
                                  <p className="text-slate-500 font-bold">Suggested Vendor</p>
                                  <p className="text-slate-300 mt-0.5 font-extrabold truncate">{rec.vendor_name}</p>
                                </div>
                                <div>
                                  <p className="text-slate-500 font-bold">Est. Lead Time</p>
                                  <p className="text-slate-300 mt-0.5 font-extrabold">{rec.lead_time_days} days</p>
                                </div>
                                <div>
                                  <p className="text-slate-500 font-bold">Unit Cost</p>
                                  <p className="text-slate-300 mt-0.5 font-extrabold">${rec.vendor_price}</p>
                                </div>
                              </div>
                            )}

                            {/* Required materials for Manufacturing orders */}
                            {rec.type === 'MANUFACTURE' && rec.required_materials?.length > 0 && (
                              <div className="space-y-2 bg-slate-900/30 p-3 rounded-lg border border-slate-900">
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Required Raw Materials (BOM Breakout)</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                                  {rec.required_materials.map((rm, rmIdx) => (
                                    <div key={rmIdx} className="flex justify-between items-center bg-slate-950/60 px-2 py-1 rounded">
                                      <span className="text-slate-300 truncate font-medium">{rm.name}</span>
                                      <span className="text-violet-400 font-bold ml-2 shrink-0">{rm.quantity_required} units</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                          </div>
                        </div>
                      ))}

                      {(!procurementData.recommendations || procurementData.recommendations.length === 0) && (
                        <p className="text-xs text-slate-500 text-center py-12 font-medium">No actions recommended. Inventory queues are clear.</p>
                      )}
                    </div>
                  </div>

                </div>

              </div>
            ) : null}
          </div>
        )}

        {/* Tab 3: Demand Forecasting */}
        {activeTab === 'forecast' && (
          <div className="space-y-6">
            {forecastingLoading ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-12 text-center flex flex-col items-center justify-center gap-4 animate-pulse">
                <RefreshCw className="w-8 h-8 text-violet-400 animate-spin" />
                <p className="text-slate-400 text-sm font-semibold">Generating forecasting calculations...</p>
              </div>
            ) : forecastingError ? (
              <div className="rounded-2xl border border-red-500/20 bg-red-950/10 p-8 flex items-center justify-between">
                <div className="flex items-center gap-3 text-red-400 text-sm">
                  <AlertCircle className="w-5 h-5" />
                  <span>{forecastingError}</span>
                </div>
                <button onClick={fetchForecasting} className="px-4 py-2 rounded-xl bg-red-900/20 border border-red-900/35 text-red-300 text-xs font-bold flex items-center gap-1.5 hover:bg-red-900/30">
                  <RefreshCw className="w-3.5 h-3.5" />
                  Retry
                </button>
              </div>
            ) : forecastingData ? (
              <div className="space-y-6">
                
                {/* Forecasting summary card */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-5 backdrop-blur-xl shadow-lg">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Analysis Summary</h3>
                  <p className="text-slate-200 text-sm leading-relaxed font-semibold">
                    {forecastingData.analysis_summary}
                  </p>
                </div>

                {/* Forecast Chart & metrics for each product */}
                <div className="space-y-6">
                  {forecastingData.forecasts?.map((item, idx) => {
                    // Combine historical + forecast for charting
                    const chartData = [
                      ...item.historical.map(h => ({ name: h.month, demand: h.quantity, type: 'Historical' })),
                      { name: `${item.forecast.month} (Forecast)`, demand: item.forecast.expected_demand, type: 'Forecast' }
                    ];

                    return (
                      <div key={idx} className="rounded-2xl border border-slate-800 bg-slate-900/20 p-5 grid grid-cols-1 lg:grid-cols-5 gap-6 shadow-xl">
                        
                        {/* Forecast parameters left column */}
                        <div className="lg:col-span-2 space-y-4">
                          <div>
                            <h4 className="text-base font-extrabold text-white">{item.name}</h4>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">{item.sku}</p>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            <div className="bg-slate-950/50 border border-slate-850 p-3.5 rounded-xl text-center">
                              <p className="text-slate-500 text-[10px] font-black uppercase">Expected Demand</p>
                              <p className="text-xl font-extrabold text-violet-400 mt-1">{item.forecast.expected_demand}</p>
                              <p className="text-[9px] text-slate-500 mt-0.5">Next Month</p>
                            </div>

                            <div className="bg-slate-950/50 border border-slate-850 p-3.5 rounded-xl text-center">
                              <p className="text-slate-500 text-[10px] font-black uppercase">Buffer stock</p>
                              <p className="text-xl font-extrabold text-blue-400 mt-1">{item.forecast.recommended_stock_level}</p>
                              <p className="text-[9px] text-slate-500 mt-0.5">Safety Level</p>
                            </div>

                            <div className="bg-slate-950/50 border border-slate-850 p-3.5 rounded-xl text-center">
                              <p className="text-slate-500 text-[10px] font-black uppercase">Procure Qty</p>
                              <p className="text-xl font-extrabold text-emerald-400 mt-1">{item.forecast.recommended_procurement_qty}</p>
                              <p className="text-[9px] text-slate-500 mt-0.5">Recommended</p>
                            </div>
                          </div>

                          <div className="rounded-xl bg-slate-950/40 p-4 border border-slate-850 space-y-2 text-xs">
                            <p className="font-bold text-white flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              AI Scheduling Suggestion
                            </p>
                            <p className="text-slate-400 leading-relaxed font-semibold">
                              Create assembly job of **{item.forecast.recommended_procurement_qty}** units of '{item.name}' 
                              to satisfy demand spikes while holding a safety buffer.
                            </p>
                          </div>
                        </div>

                        {/* Chart right column */}
                        <div className="lg:col-span-3 h-64 bg-slate-950/40 p-4 rounded-xl border border-slate-900">
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3">Historical Sales vs Expected Forecast (Qty)</p>
                          <ResponsiveContainer width="100%" height="85%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <defs>
                                <linearGradient id={`grad-${idx}`} x1="0" y1="0" x2="0" y2="1">
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
                                fill={`url(#grad-${idx})`} 
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>

                      </div>
                    );
                  })}
                </div>

              </div>
            ) : null}
          </div>
        )}

        {/* Tab 4: AI Diagnostics */}
        {activeTab === 'diagnostics' && (
          <div className="max-w-xl">
            <AiDiagnosticsPanel />
          </div>
        )}

      </div>
    </div>
  );
};

export default AiCopilotPage;
