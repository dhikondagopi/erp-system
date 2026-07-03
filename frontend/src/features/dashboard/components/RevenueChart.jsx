import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { TrendingUp } from 'lucide-react';

const formatRevenue = (v) =>
  v >= 1_000_000
    ? `₹${(v / 1_000_000).toFixed(1)}M`
    : v >= 1_000
    ? `₹${(v / 1_000).toFixed(0)}K`
    : `₹${v}`;

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 shadow-2xl space-y-1">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      {payload.map((item, index) => (
        <p key={index} className={`text-sm font-bold ${item.dataKey === 'revenue' ? 'text-violet-300' : 'text-amber-400'}`}>
          {item.name}: {formatRevenue(item.value || 0)}
        </p>
      ))}
    </div>
  );
};

/**
 * RevenueChart — Area chart showing rolling 6-month Revenue vs Purchase Trend.
 */
const RevenueChart = ({ revenueData = [], purchaseData = [], loading }) => {
  // Merge revenue and purchase trends
  const combinedData = revenueData.map(r => {
    const p = purchaseData.find(pd => pd.month === r.month) || {};
    return {
      month: r.month,
      revenue: r.revenue || 0,
      purchase: p.spend || 0
    };
  });

  const totalRevenue = revenueData.reduce((acc, d) => acc + (d.revenue || 0), 0);
  const totalPurchase = purchaseData.reduce((acc, d) => acc + (d.spend || 0), 0);
  const hasData = combinedData.length > 0;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20">
            <TrendingUp className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <h3 className="text-white font-bold text-sm">Revenue vs Purchase Trends</h3>
            <p className="text-slate-500 text-xs">Rolling 6-month financial performance</p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="text-right">
            <p className="text-[10px] text-slate-500 uppercase font-bold">Total Revenue</p>
            <p className="text-base font-extrabold text-violet-300">{formatRevenue(totalRevenue)}</p>
          </div>
          <div className="text-right border-l border-slate-850 pl-4">
            <p className="text-[10px] text-slate-500 uppercase font-bold">Total Spends</p>
            <p className="text-base font-extrabold text-amber-400">{formatRevenue(totalPurchase)}</p>
          </div>
        </div>
      </div>

      {/* Chart */}
      {loading ? (
        <div className="h-52 bg-slate-800/40 rounded-xl animate-pulse" />
      ) : !hasData ? (
        <div className="h-52 flex items-center justify-center text-slate-600 text-sm">
          No financial trend data available yet.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={210}>
          <AreaChart data={combinedData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="purchaseGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatRevenue}
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#6d28d9', strokeWidth: 1, strokeDasharray: '4' }} />
            <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
            <Area
              type="monotone"
              name="Revenue"
              dataKey="revenue"
              stroke="#8b5cf6"
              strokeWidth={2.5}
              fill="url(#revenueGrad)"
              dot={{ fill: '#8b5cf6', r: 4, strokeWidth: 2, stroke: '#1e1b4b' }}
              activeDot={{ r: 6, fill: '#a78bfa', stroke: '#1e1b4b', strokeWidth: 2 }}
            />
            <Area
              type="monotone"
              name="Purchase Spend"
              dataKey="purchase"
              stroke="#f59e0b"
              strokeWidth={2.5}
              fill="url(#purchaseGrad)"
              dot={{ fill: '#f59e0b', r: 4, strokeWidth: 2, stroke: '#1e1b4b' }}
              activeDot={{ r: 6, fill: '#fbbf24', stroke: '#1e1b4b', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default RevenueChart;
