import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Layers } from 'lucide-react';

const COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

const formatValuation = (v) =>
  v >= 1_000_000
    ? `₹${(v / 1_000_000).toFixed(1)}M`
    : v >= 1_000
    ? `₹${(v / 1_000).toFixed(0)}K`
    : `₹${v}`;

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 shadow-2xl">
      <p className="text-xs text-slate-400 mb-1">{data.category}</p>
      <p className="text-sm font-bold text-violet-300">
        {formatValuation(data.valuation || 0)}
      </p>
    </div>
  );
};

const InventoryValuationChart = ({ data = [], loading }) => {
  const hasData = data.length > 0;
  const totalValuation = data.reduce((acc, curr) => acc + (curr.valuation || 0), 0);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-white font-bold text-sm">Stock Valuation by Category</h3>
            <p className="text-slate-500 text-xs">Valuation share across categories</p>
          </div>
        </div>
      </div>

      {/* Chart */}
      {loading ? (
        <div className="h-52 bg-slate-800/40 rounded-xl animate-pulse" />
      ) : !hasData ? (
        <div className="h-52 flex items-center justify-center text-slate-600 text-sm">
          No stock valuation data.
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center justify-around gap-4">
          <ResponsiveContainer width={160} height={160}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={4}
                dataKey="valuation"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#0f172a" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Legend and stats */}
          <div className="flex-1 space-y-2.5 max-w-[200px]">
            {data.slice(0, 5).map((item, index) => {
              const percentage = totalValuation > 0 ? ((item.valuation || 0) / totalValuation) * 100 : 0;
              return (
                <div key={item.category} className="flex items-center justify-between gap-4 text-xs font-semibold text-slate-300">
                  <div className="flex items-center space-x-2 truncate">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="truncate">{item.category}</span>
                  </div>
                  <span className="font-mono text-slate-400">{percentage.toFixed(0)}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryValuationChart;
