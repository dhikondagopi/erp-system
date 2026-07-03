import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Factory } from 'lucide-react';

const STATUS_COLORS = {
  DRAFT: '#6366f1',
  PLANNED: '#6366f1',
  APPROVED: '#8b5cf6',
  STAGED: '#8b5cf6',
  IN_PRODUCTION: '#3b82f6',
  QUALITY_CHECK: '#f59e0b',
  COMPLETED: '#10b981',
  CANCELLED: '#ef4444',
};

const STATUS_LABELS = {
  DRAFT: 'Draft',
  PLANNED: 'Planned',
  APPROVED: 'Approved',
  STAGED: 'Staged',
  IN_PRODUCTION: 'In Production',
  QUALITY_CHECK: 'QC',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const RADIAN = Math.PI / 180;

const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.06) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 shadow-2xl">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full" style={{ background: item.payload.fill }} />
        <p className="text-xs text-slate-300 font-semibold">
          {STATUS_LABELS[item.name] || item.name}
        </p>
      </div>
      <p className="text-xl font-bold text-white mt-1">{item.value} orders</p>
    </div>
  );
};

const CustomLegend = ({ payload }) => (
  <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-2">
    {payload?.map((entry) => (
      <div key={entry.value} className="flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full" style={{ background: entry.color }} />
        <span className="text-xs text-slate-400">{STATUS_LABELS[entry.value] || entry.value}</span>
      </div>
    ))}
  </div>
);

/**
 * ManufacturingChart — Donut pie chart of manufacturing order status distribution.
 */
const ManufacturingChart = ({ data = [], loading }) => {
  const total = data.reduce((acc, d) => acc + (d.count || 0), 0);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <Factory className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h3 className="text-white font-bold text-sm">Manufacturing Orders</h3>
            <p className="text-slate-500 text-xs">Status distribution</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">Total</p>
          <p className="text-xl font-extrabold text-white">{total}</p>
        </div>
      </div>

      {loading ? (
        <div className="h-52 bg-slate-800/40 rounded-xl animate-pulse" />
      ) : !data.length ? (
        <div className="h-52 flex items-center justify-center text-slate-600 text-sm">
          No manufacturing data yet.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="status"
              cx="50%"
              cy="48%"
              innerRadius={55}
              outerRadius={88}
              paddingAngle={3}
              labelLine={false}
              label={<CustomLabel />}
            >
              {data.map((entry) => (
                <Cell
                  key={entry.status}
                  fill={STATUS_COLORS[entry.status] || '#64748b'}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default ManufacturingChart;
