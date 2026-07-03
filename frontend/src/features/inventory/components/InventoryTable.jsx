import React from 'react';
import { Settings2, AlertTriangle, ArrowRight } from 'lucide-react';

const InventoryTable = ({ items, onAdjust, canAdjust }) => {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-900 bg-slate-950/20 backdrop-blur-md">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-slate-900 bg-slate-950/60 text-xs font-bold uppercase tracking-wider text-slate-400">
            <th className="px-6 py-4">Product Details</th>
            <th className="px-6 py-4">Warehouse Location</th>
            <th className="px-6 py-4 text-right">Physical On Hand</th>
            <th className="px-6 py-4 text-right">Reserved Allocations</th>
            <th className="px-6 py-4 text-right">Incoming (PO/MO)</th>
            <th className="px-6 py-4 text-right">Net Available</th>
            <th className="px-6 py-4 text-center">Alerts</th>
            {canAdjust && <th className="px-6 py-4 text-center">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-900 bg-transparent text-slate-300">
          {items.map((item) => {
            const onHand = parseFloat(item.qty_on_hand || 0);
            const reserved = parseFloat(item.qty_reserved || 0);
            const incoming = parseFloat(item.qty_incoming || 0);
            const available = onHand - reserved;
            const reorderPoint = parseFloat(item.reorder_point || 0);
            
            const isLowStock = onHand + incoming < reorderPoint;

            return (
              <tr key={item.id} className="hover:bg-slate-900/30 transition-colors">
                {/* Product details */}
                <td className="px-6 py-4.5">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-200 text-sm">{item.name}</p>
                    <p className="font-mono text-xs text-slate-500 mt-0.5 tracking-wider">{item.sku}</p>
                  </div>
                </td>

                {/* Location */}
                <td className="px-6 py-4.5 text-slate-400">
                  <span className="text-xs font-medium">{item.location || 'Main Warehouse'}</span>
                </td>

                {/* On Hand */}
                <td className="px-6 py-4.5 text-right font-mono text-slate-200 font-semibold">
                  {item.qty_on_hand} <span className="text-[10px] text-slate-650 font-sans font-medium uppercase">{item.uom}</span>
                </td>

                {/* Reserved */}
                <td className="px-6 py-4.5 text-right font-mono text-slate-450">
                  {item.qty_reserved} <span className="text-[10px] text-slate-650 font-sans font-medium uppercase">{item.uom}</span>
                </td>

                {/* Incoming */}
                <td className="px-6 py-4.5 text-right font-mono text-blue-450">
                  {item.qty_incoming} <span className="text-[10px] text-slate-650 font-sans font-medium uppercase">{item.uom}</span>
                </td>

                {/* Net Available */}
                <td className="px-6 py-4.5 text-right font-mono text-emerald-400 font-semibold">
                  {available} <span className="text-[10px] text-slate-650 font-sans font-medium uppercase">{item.uom}</span>
                </td>

                {/* Low Stock Indicator Alerts */}
                <td className="px-6 py-4.5 text-center">
                  {isLowStock ? (
                    <span className="inline-flex items-center space-x-1 rounded-full bg-rose-950/30 px-2 py-0.5 text-[10px] font-bold text-rose-400 border border-rose-900/10">
                      <AlertTriangle className="h-3 w-3 shrink-0" />
                      <span>Reorder ({reorderPoint})</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 rounded-full bg-slate-900/50 px-2 py-0.5 text-[10px] font-bold text-slate-500 border border-slate-850">
                      <span>Normal</span>
                    </span>
                  )}
                </td>

                {/* Action - Manual Adjust (RBAC) */}
                {canAdjust && (
                  <td className="px-6 py-4.5 text-center">
                    <button
                      onClick={() => onAdjust(item)}
                      className="inline-flex items-center space-x-1.5 rounded-lg border border-slate-800 bg-slate-900/30 hover:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-all active:scale-95"
                    >
                      <Settings2 className="h-3.5 w-3.5" />
                      <span>Adjust</span>
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default InventoryTable;
