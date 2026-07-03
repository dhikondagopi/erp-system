import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Hammer } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 shadow-2xl">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className="text-sm font-bold text-cyan-400">
        Quantity Produced: {Number(payload[0].value).toLocaleString()} units
      </p>
    </div>
  );
};

/**
 * ProductionVolumeChart — Monthly finished goods production quantities.
 */
const ProductionVolumeChart = ({ data = [], loading }) => {
  const totalProduced = data.reduce((acc, d) => acc + (d.quantity || 0), 0);
  const hasData = data.length > 0;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
            <Hammer className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-white font-bold text-sm">Monthly Production Volumes</h3>
            <p className="text-slate-500 text-xs">Finished goods units completed</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-slate-500 uppercase font-bold">Total Completed</p>
          <p className="text-lg font-extrabold text-cyan-400">{Number(totalProduced).toLocaleString()} units</p>
        </div>
      </div>

      {/* Chart */}
      {loading ? (
        <div className="h-52 bg-slate-800/40 rounded-xl animate-pulse" />
      ) : !hasData ? (
        <div className="h-52 flex items-center justify-center text-slate-600 text-sm">
          No historical production completion data available.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={210}>
          <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
            <Bar
              dataKey="quantity"
              name="Production"
              fill="#06b6d4"
              radius={[4, 4, 0, 0]}
              maxBarSize={45}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default ProductionVolumeChart;
