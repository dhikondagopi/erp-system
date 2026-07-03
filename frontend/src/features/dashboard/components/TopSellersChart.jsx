import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Package } from 'lucide-react';

const COLORS = [
  '#8b5cf6', '#6366f1', '#3b82f6', '#06b6d4', '#10b981'
];

const formatRevenue = (v) =>
  v >= 1_000_000
    ? `₹${(v / 1_000_000).toFixed(1)}M`
    : v >= 1_000
    ? `₹${(v / 1_000).toFixed(0)}K`
    : `₹${v}`;

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const item = payload[0]?.payload;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 shadow-2xl space-y-1 min-w-[160px]">
      <p className="text-xs font-semibold text-white">{item?.name}</p>
      <p className="text-xs text-slate-400">SKU: <span className="text-slate-200">{item?.sku}</span></p>
      <p className="text-sm font-bold text-violet-300">{formatRevenue(item?.revenue_generated || 0)}</p>
      <p className="text-xs text-slate-500">{Number(item?.units_sold || 0).toFixed(0)} units sold</p>
    </div>
  );
};

/**
 * TopSellersChart — Horizontal bar chart of top 5 products by revenue.
 */
const TopSellersChart = ({ data = [], loading }) => {
  // Truncate long names for axis labels
  const chartData = data.map((d) => ({
    ...d,
    shortName: d.name?.length > 16 ? d.name.slice(0, 14) + '…' : d.name,
  }));

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <Package className="w-4 h-4 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-white font-bold text-sm">Top Selling Products</h3>
          <p className="text-slate-500 text-xs">By revenue generated (all time)</p>
        </div>
      </div>

      {loading ? (
        <div className="h-52 bg-slate-800/40 rounded-xl animate-pulse" />
      ) : !data.length ? (
        <div className="h-52 flex items-center justify-center text-slate-600 text-sm">
          No sales data available yet.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
            <XAxis
              type="number"
              tickFormatter={formatRevenue}
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="shortName"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={90}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar dataKey="revenue_generated" radius={[0, 6, 6, 0]} maxBarSize={22}>
              {chartData.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default TopSellersChart;
