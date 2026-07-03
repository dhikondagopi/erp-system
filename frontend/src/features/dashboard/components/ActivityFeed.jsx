import React from 'react';
import {
  ArrowUp, ArrowDown, Package, Truck, Factory,
  ShoppingCart, RefreshCw, Clock
} from 'lucide-react';

const TXN_META = {
  SALE: { icon: ShoppingCart, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Sale', dir: 'out' },
  PURCHASE_RECEIPT: { icon: Truck, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Purchase Receipt', dir: 'in' },
  MANUFACTURING_OUTPUT: { icon: Factory, color: 'text-purple-400', bg: 'bg-purple-500/10', label: 'Manufacturing', dir: 'in' },
  MANUFACTURING_CONSUMPTION: { icon: Factory, color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Consumption', dir: 'out' },
  MANUAL_ADJUSTMENT: { icon: RefreshCw, color: 'text-cyan-400', bg: 'bg-cyan-500/10', label: 'Adjustment', dir: 'neutral' },
  RETURN: { icon: Package, color: 'text-rose-400', bg: 'bg-rose-500/10', label: 'Return', dir: 'in' },
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

/**
 * ActivityFeed — Recent 10 stock ledger movements displayed as a timeline.
 */
const ActivityFeed = ({ movements = [], loading }) => {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-slate-700/40 border border-slate-700">
          <Clock className="w-4 h-4 text-slate-400" />
        </div>
        <div>
          <h3 className="text-white font-bold text-sm">Recent Inventory Activity</h3>
          <p className="text-slate-500 text-xs">Last 10 stock ledger movements</p>
        </div>
      </div>

      {/* Feed */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-9 h-9 bg-slate-800 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-slate-700 rounded w-3/4" />
                <div className="h-2.5 bg-slate-800 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : !movements.length ? (
        <div className="py-10 text-center text-slate-600 text-sm">
          No ledger activity found.
        </div>
      ) : (
        <div className="space-y-1">
          {movements.map((mov, idx) => {
            const meta = TXN_META[mov.transaction_type] || {
              icon: Package,
              color: 'text-slate-400',
              bg: 'bg-slate-700',
              label: mov.transaction_type,
              dir: 'neutral',
            };
            const Icon = meta.icon;
            const qty = mov.qty_change || 0;
            const isIn = qty > 0 || meta.dir === 'in';
            const isOut = qty < 0 || meta.dir === 'out';

            return (
              <div
                key={mov.id || idx}
                className="flex items-start gap-3 py-3 border-b border-slate-800/60 last:border-0 hover:bg-slate-800/20 rounded-xl px-2 transition-colors"
              >
                {/* Icon */}
                <div className={`flex-shrink-0 w-9 h-9 rounded-xl ${meta.bg} flex items-center justify-center mt-0.5`}>
                  <Icon className={`w-4 h-4 ${meta.color}`} />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {mov.product_name}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        <span className={`font-medium ${meta.color}`}>{meta.label}</span>
                        {' · '}
                        {mov.product_sku}
                        {mov.operator_name && ` · ${mov.operator_name}`}
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <div className="flex items-center gap-1 justify-end">
                        {isIn && !isOut && <ArrowUp className="w-3 h-3 text-emerald-400" />}
                        {isOut && !isIn && <ArrowDown className="w-3 h-3 text-red-400" />}
                        <span
                          className={`text-sm font-bold ${
                            qty > 0 ? 'text-emerald-400' : qty < 0 ? 'text-red-400' : 'text-slate-400'
                          }`}
                        >
                          {qty > 0 ? '+' : ''}{qty}
                        </span>
                        <span className="text-xs text-slate-600">units</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">{formatDate(mov.created_at)}</p>
                    </div>
                  </div>
                  {mov.reason && (
                    <p className="text-xs text-slate-600 mt-1 italic truncate">"{mov.reason}"</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ActivityFeed;
