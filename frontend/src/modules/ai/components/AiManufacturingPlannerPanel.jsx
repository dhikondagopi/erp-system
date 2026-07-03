import React, { useEffect, useState } from 'react';
import { Sparkles, Play, AlertCircle, RefreshCw, Layers, CheckCircle2 } from 'lucide-react';
import aiApi from '../../../services/aiApi';
import api from '../../../services/api';

const AiManufacturingPlannerPanel = () => {
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('10');
  
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    const fetchFinishedGoods = async () => {
      setProductsLoading(true);
      setError(null);
      try {
        const res = await api.get('/products', { params: { type: 'FINISHED_GOOD', limit: 100 } });
        const list = res.data?.data?.products || [];
        setProducts(list);
        if (list.length > 0) {
          setSelectedProductId(list[0].id);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load finished goods directory.');
      } finally {
        setProductsLoading(false);
      }
    };
    fetchFinishedGoods();
  }, []);

  const handleGeneratePlan = async (e) => {
    e.preventDefault();
    if (!selectedProductId || !quantity || parseInt(quantity) <= 0) return;
    
    setLoading(true);
    setSubmitError(null);
    setPlan(null);
    try {
      const planData = await aiApi.generateProductionPlan(selectedProductId, parseInt(quantity));
      setPlan(planData);
    } catch (err) {
      console.error(err);
      setSubmitError(err.response?.data?.message || 'Failed to generate manufacturing plan.');
    } finally {
      setLoading(false);
    }
  };

  if (productsLoading) {
    return (
      <div className="rounded-2xl border border-slate-900 bg-slate-950/20 py-12 text-center flex flex-col items-center justify-center gap-4 animate-pulse">
        <RefreshCw className="w-6 h-6 text-violet-400 animate-spin" />
        <p className="text-slate-500 text-xs font-semibold">Loading manufacturing items...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Configuration Form card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-5 backdrop-blur-xl shadow-xl">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Production Capacity Configurator</h3>

        {error && (
          <div className="text-red-400 text-xs flex items-center gap-2 mb-3 bg-red-950/10 border border-red-900/30 p-3 rounded-lg">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleGeneratePlan} className="flex flex-col sm:flex-row items-end gap-4">
          <div className="flex-1 space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Finished Good Product</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-350 focus:border-blue-600 focus:outline-none"
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
              ))}
            </select>
          </div>

          <div className="w-32 space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Required Quantity</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="e.g. 50"
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-350 focus:border-blue-600 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !selectedProductId}
            className="flex items-center justify-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs h-[38px] active:scale-95 transition-all shadow shadow-violet-900/30 disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            <span>Generate Production Plan</span>
          </button>
        </form>
      </div>

      {/* Submission Errors */}
      {submitError && (
        <div className="rounded-xl border border-red-500/20 bg-red-950/15 p-4 flex items-center gap-3 text-xs text-red-400">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>Failed to run capacity analysis: {submitError}</span>
        </div>
      )}

      {/* Display computed plan details */}
      {plan && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          
          {/* Plan parameters left column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-5 space-y-4 shadow-xl">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Plan Estimations</h3>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-slate-950/50 border border-slate-850 p-4 rounded-xl">
                  <p className="text-slate-500 text-[10px] font-black uppercase">Est. Total Cost</p>
                  <p className="text-xl font-extrabold text-violet-400 mt-1">₹{Number(plan.estimated_cost).toLocaleString()}</p>
                  <p className="text-[9px] text-slate-500 mt-0.5">Labor + Materials</p>
                </div>

                <div className="bg-slate-950/50 border border-slate-850 p-4 rounded-xl">
                  <p className="text-slate-500 text-[10px] font-black uppercase">Est. Cycle Time</p>
                  <p className="text-xl font-extrabold text-blue-400 mt-1">{plan.estimated_duration_days} days</p>
                  <p className="text-[9px] text-slate-500 mt-0.5">Assembly & Finishing</p>
                </div>
              </div>

              {/* Staging Risks */}
              {plan.risks?.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-900/60">
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Shop Floor Risks</p>
                  <div className="space-y-1.5">
                    {plan.risks.map((r, i) => (
                      <div key={i} className="flex items-start gap-2 text-[11px] text-amber-300 font-semibold bg-amber-950/15 p-2 rounded border border-amber-900/20">
                        <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-400" />
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* BOM required list right column */}
          <div className="lg:col-span-3 rounded-2xl border border-slate-800 bg-slate-900/20 p-5 space-y-4 shadow-xl">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Required Raw Materials & Shortages</h3>

            <div className="overflow-x-auto rounded-lg border border-slate-900">
              <table className="min-w-full divide-y divide-slate-900 text-left text-xs bg-slate-950/20">
                <thead className="bg-slate-900/80 font-bold text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Material SKU</th>
                    <th className="px-4 py-3">Material Name</th>
                    <th className="px-4 py-3 text-right">Required</th>
                    <th className="px-4 py-3 text-right">Available</th>
                    <th className="px-4 py-3 text-right">Shortage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 text-slate-300">
                  {plan.required_materials?.map((rm, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/10">
                      <td className="px-4 py-3 font-semibold text-slate-400">{rm.sku}</td>
                      <td className="px-4 py-3">{rm.name}</td>
                      <td className="px-4 py-3 text-right font-semibold">{rm.quantity_required}</td>
                      <td className="px-4 py-3 text-right">{rm.qty_on_hand}</td>
                      <td className="px-4 py-3 text-right">
                        {rm.shortage > 0 ? (
                          <span className="text-red-400 font-extrabold bg-red-950/30 px-2 py-0.5 rounded border border-red-900/20">
                            {rm.shortage}
                          </span>
                        ) : (
                          <span className="text-emerald-450 font-bold flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-450 inline" />
                            OK
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}

                  {(!plan.required_materials || plan.required_materials.length === 0) && (
                    <tr>
                      <td colSpan="5" className="px-4 py-8 text-center text-slate-500">No raw material calculations compiled.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

export default AiManufacturingPlannerPanel;
