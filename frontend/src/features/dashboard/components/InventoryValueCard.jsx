import React from 'react';
import { Layers, AlertTriangle, ShoppingCart, ArrowUpRight } from 'lucide-react';

const fmt = (n) =>
  n >= 1_000_000
    ? `₹${(n / 1_000_000).toFixed(2)}M`
    : n >= 1_000
    ? `₹${(n / 1_000).toFixed(1)}K`
    : `₹${Number(n || 0).toFixed(2)}`;

/**
 * InventoryValueCard — Inventory + procurement summary panel with three stat cells.
 */
const InventoryValueCard = ({ kpis, loading }) => {
  const stats = [
    {
      label: 'Stock Valuation',
      value: fmt(kpis?.inventory_value || 0),
      icon: Layers,
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-400',
      sub: 'Cost-weighted on-hand stock',
      highlight: true,
    },
    {
      label: 'Low Stock Alerts',
      value: Number(kpis?.low_stock_products_count || 0),
      icon: AlertTriangle,
      iconBg: 'bg-red-500/10',
      iconColor: 'text-red-400',
      sub: 'Products below reorder point',
      highlight: false,
      alert: Number(kpis?.low_stock_products_count || 0) > 0,
    },
    {
      label: 'Open Purchase Orders',
      value: Number(kpis?.pending_purchase_orders_count || 0),
      icon: ShoppingCart,
      iconBg: 'bg-amber-500/10',
      iconColor: 'text-amber-400',
      sub: 'Draft & Sent POs pending',
      highlight: false,
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-bold text-sm">Inventory & Procurement</h3>
          <p className="text-slate-500 text-xs mt-0.5">Stock health and procurement status</p>
        </div>
        <div className="flex items-center gap-1 text-xs text-emerald-400 font-semibold">
          <ArrowUpRight className="w-3.5 h-3.5" />
          Live
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className={`rounded-xl p-4 space-y-2 ${
                s.alert
                  ? 'border border-red-500/20 bg-red-500/5'
                  : 'border border-slate-800 bg-slate-800/30'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg ${s.iconBg} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${s.iconColor}`} />
              </div>
              {loading ? (
                <div className="h-7 w-16 bg-slate-700 rounded animate-pulse" />
              ) : (
                <p className={`text-2xl font-extrabold ${s.alert ? 'text-red-400' : 'text-white'}`}>
                  {s.value}
                </p>
              )}
              <div>
                <p className="text-xs font-semibold text-slate-300">{s.label}</p>
                <p className="text-xs text-slate-600 mt-0.5">{s.sub}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InventoryValueCard;
