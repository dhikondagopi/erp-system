import React from 'react';
import {
  TrendingUp, Calendar, Layers, AlertTriangle,
  ShoppingCart, Factory, ArrowUpRight, ArrowDownRight
} from 'lucide-react';

const fmt = (n) =>
  n >= 1_000_000
    ? `₹${(n / 1_000_000).toFixed(2)}M`
    : n >= 1_000
    ? `₹${(n / 1_000).toFixed(1)}K`
    : `₹${Number(n).toFixed(2)}`;

const fmtCount = (n) => Number(n).toLocaleString();

const CARDS = [
  {
    key: 'revenue_today',
    label: 'Revenue Today',
    icon: TrendingUp,
    format: fmt,
    gradient: 'from-violet-600/20 to-purple-600/20',
    border: 'border-violet-500/20',
    iconBg: 'bg-violet-500/10',
    iconColor: 'text-violet-400',
    trend: '+',
    trendLabel: 'vs yesterday',
    trendUp: true,
  },
  {
    key: 'revenue_month',
    label: 'Revenue This Month',
    icon: Calendar,
    format: fmt,
    gradient: 'from-blue-600/20 to-cyan-600/20',
    border: 'border-blue-500/20',
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-400',
    trend: '+',
    trendLabel: 'vs last month',
    trendUp: true,
  },
  {
    key: 'inventory_value',
    label: 'Inventory Value',
    icon: Layers,
    format: fmt,
    gradient: 'from-emerald-600/20 to-teal-600/20',
    border: 'border-emerald-500/20',
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-400',
    trend: null,
    trendLabel: 'Total cost valuation',
    trendUp: null,
  },
  {
    key: 'low_stock_products_count',
    label: 'Low Stock Products',
    icon: AlertTriangle,
    format: fmtCount,
    gradient: 'from-red-600/20 to-orange-600/20',
    border: 'border-red-500/20',
    iconBg: 'bg-red-500/10',
    iconColor: 'text-red-400',
    trend: null,
    trendLabel: 'Require restock',
    trendUp: false,
  },
  {
    key: 'pending_purchase_orders_count',
    label: 'Pending Purchase Orders',
    icon: ShoppingCart,
    format: fmtCount,
    gradient: 'from-amber-600/20 to-yellow-600/20',
    border: 'border-amber-500/20',
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-400',
    trend: null,
    trendLabel: 'Draft + Sent',
    trendUp: null,
  },
  {
    key: 'pending_manufacturing_orders_count',
    label: 'Active Manufacturing',
    icon: Factory,
    format: fmtCount,
    gradient: 'from-indigo-600/20 to-violet-600/20',
    border: 'border-indigo-500/20',
    iconBg: 'bg-indigo-500/10',
    iconColor: 'text-indigo-400',
    trend: null,
    trendLabel: 'Planned + In Progress',
    trendUp: null,
  },
];

/** Single KPI card skeleton while loading */
const KPISkeleton = () => (
  <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 animate-pulse space-y-4">
    <div className="flex justify-between">
      <div className="h-3 w-28 bg-slate-700 rounded" />
      <div className="w-9 h-9 bg-slate-800 rounded-xl" />
    </div>
    <div className="h-9 w-32 bg-slate-700 rounded" />
    <div className="h-3 w-20 bg-slate-800 rounded" />
  </div>
);

/**
 * KPICards — Six top-level metric cards for the ERP dashboard.
 */
const KPICards = ({ kpis, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => <KPISkeleton key={i} />)}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {CARDS.map((card) => {
        const Icon = card.icon;
        const value = kpis?.[card.key] ?? 0;
        return (
          <div
            key={card.key}
            className={`group relative rounded-2xl border ${card.border} bg-gradient-to-br ${card.gradient} p-5 overflow-hidden hover:scale-[1.02] transition-transform duration-200`}
          >
            {/* Background glow */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/[0.02] rounded-2xl" />

            <div className="relative space-y-3">
              {/* Label + Icon Row */}
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-semibold text-slate-400 leading-snug">{card.label}</p>
                <div className={`flex-shrink-0 p-2.5 rounded-xl ${card.iconBg}`}>
                  <Icon className={`w-4 h-4 ${card.iconColor}`} />
                </div>
              </div>

              {/* Value */}
              <p className="text-2xl font-extrabold text-white tracking-tight">
                {card.format(value)}
              </p>

              {/* Trend / Sub-label */}
              <div className="flex items-center gap-1">
                {card.trendUp === true && (
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                )}
                {card.trendUp === false && card.key === 'low_stock_products_count' && Number(value) > 0 && (
                  <ArrowDownRight className="w-3.5 h-3.5 text-red-400" />
                )}
                <span className="text-xs text-slate-500">{card.trendLabel}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KPICards;
