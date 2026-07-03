import React from 'react';
import { ArrowUpRight, ArrowDownLeft, Sliders, Lock, Unlock } from 'lucide-react';

const StockLedgerTable = ({ entries }) => {
  // Format numbers to clean currency indicators
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Helper to color-code transaction logs
  const getTxBadgeDetails = (type) => {
    const types = {
      'RECEIPT': {
        label: 'Receipt',
        styles: 'bg-emerald-950/30 text-emerald-400 border-emerald-900/20',
        icon: ArrowUpRight
      },
      'ISSUE': {
        label: 'Issue',
        styles: 'bg-rose-950/30 text-rose-400 border-rose-900/20',
        icon: ArrowDownLeft
      },
      'ADJUSTMENT': {
        label: 'Adjustment',
        styles: 'bg-blue-950/30 text-blue-400 border-blue-900/20',
        icon: Sliders
      },
      'ALLOCATION': {
        label: 'Reserve Allocation',
        styles: 'bg-purple-950/30 text-purple-400 border-purple-900/20',
        icon: Lock
      },
      'DEALLOCATION': {
        label: 'Reserve Released',
        styles: 'bg-amber-955/30 text-amber-400 border-amber-900/20',
        icon: Unlock
      }
    };
    return types[type] || { label: type, styles: 'bg-slate-900 text-slate-400 border-slate-800', icon: Sliders };
  };

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-900 bg-slate-950/20 backdrop-blur-md">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-slate-900 bg-slate-950/60 text-xs font-bold uppercase tracking-wider text-slate-400">
            <th className="px-6 py-4">Timestamp</th>
            <th className="px-6 py-4">Product Details</th>
            <th className="px-6 py-4">Transaction Type</th>
            <th className="px-6 py-4">Warehouse</th>
            <th className="px-6 py-4 text-right">Prev Qty</th>
            <th className="px-6 py-4 text-right">Qty Changed</th>
            <th className="px-6 py-4 text-right">New Qty</th>
            <th className="px-6 py-4 text-right">Unit Cost</th>
            <th className="px-6 py-4">Operator</th>
            <th className="px-6 py-4">Ref Number</th>
            <th className="px-6 py-4">Remarks</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-900 bg-transparent text-slate-355">
          {entries.map((entry) => {
            const { label, styles, icon: Icon } = getTxBadgeDetails(entry.transaction_type);
            const qty = parseFloat(entry.qty_change || 0);

            return (
              <tr key={entry.id} className="hover:bg-slate-900/30 transition-colors">
                {/* Timestamp */}
                <td className="px-6 py-4 text-slate-400 font-medium whitespace-nowrap text-xs">
                  {formatDate(entry.created_at)}
                </td>

                {/* Product Name & SKU */}
                <td className="px-6 py-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-200 text-xs truncate max-w-xs">{entry.product_name}</p>
                    <p className="font-mono text-[10px] text-slate-500 mt-0.5 tracking-wider">{entry.product_sku}</p>
                  </div>
                </td>

                {/* Transaction Type */}
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center space-x-1 rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wide uppercase border ${styles}`}>
                    <Icon className="h-3 w-3 shrink-0" />
                    <span>{label}</span>
                  </span>
                </td>

                {/* Warehouse Location */}
                <td className="px-6 py-4 text-slate-305 font-medium text-xs whitespace-nowrap">
                  {entry.location || 'Main Warehouse'}
                </td>

                {/* Previous Qty */}
                <td className="px-6 py-4 text-right font-mono text-xs text-slate-400">
                  {parseFloat(entry.qty_previous || 0)}
                </td>

                {/* Quantity Change */}
                <td className={`px-6 py-4 text-right font-mono text-xs font-bold ${
                  qty > 0 ? 'text-emerald-400' : qty < 0 ? 'text-rose-400' : 'text-slate-400'
                }`}>
                  {qty > 0 ? `+${qty}` : qty}
                </td>

                {/* New Qty */}
                <td className="px-6 py-4 text-right font-mono text-xs text-slate-200">
                  {parseFloat(entry.qty_new || 0)}
                </td>

                {/* Cost */}
                <td className="px-6 py-4 text-right font-mono text-xs text-slate-300">
                  {formatCurrency(entry.unit_cost)}
                </td>

                {/* Operator Name */}
                <td className="px-6 py-4 text-slate-400 font-medium text-xs whitespace-nowrap">
                  {entry.first_name ? `${entry.first_name} ${entry.last_name}` : 'System Engine'}
                </td>

                {/* Reference Number */}
                <td className="px-6 py-4 text-slate-400 font-mono text-xs whitespace-nowrap">
                  {entry.reference_number || (entry.reference_type ? `${entry.reference_type} (${entry.reference_id?.slice(0,8)})` : 'Manual')}
                </td>

                {/* Remarks & Notes */}
                <td className="px-6 py-4 max-w-sm">
                  <p className="text-xs text-slate-300 truncate font-medium" title={entry.reason}>
                    {entry.reason}
                  </p>
                  {entry.notes && (
                    <p className="text-[10px] text-slate-500 italic mt-0.5 truncate max-w-xs" title={entry.notes}>
                      {entry.notes}
                    </p>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default StockLedgerTable;
