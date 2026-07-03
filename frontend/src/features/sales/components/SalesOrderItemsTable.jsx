import React from 'react';
import { Trash2 } from 'lucide-react';

const SalesOrderItemsTable = ({ items, onUpdateQty, onUpdatePrice, onRemoveItem }) => {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/10 p-8 text-center text-slate-500 font-medium text-sm">
        No items added to this sales order draft. Use the selector above to add products.
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-900 bg-slate-955/20 backdrop-blur-md">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-slate-900 bg-slate-950/60 text-xs font-bold uppercase tracking-wider text-slate-400">
            <th className="px-6 py-4">Product Specs</th>
            <th className="px-6 py-4">Quantity</th>
            <th className="px-6 py-4">UoM</th>
            <th className="px-6 py-4">Unit Price (₹)</th>
            <th className="px-6 py-4">Total Amount (₹)</th>
            <th className="px-6 py-4 text-center">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-900 bg-transparent text-slate-350">
          {items.map((item) => {
            const subtotal = parseFloat(item.quantity || 0) * parseFloat(item.unit_price || 0);
            return (
              <tr key={item.product_id} className="hover:bg-slate-900/30 transition-colors">
                {/* Name & SKU */}
                <td className="px-6 py-3.5">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-200 text-sm">{item.name}</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">SKU: {item.sku}</span>
                  </div>
                </td>

                {/* Qty Input */}
                <td className="px-6 py-3.5 w-32">
                  <input
                    type="number"
                    min="0.01"
                    step="any"
                    value={item.quantity}
                    onChange={(e) => onUpdateQty(item.product_id, e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-955/40 px-3 py-1.5 text-sm text-slate-200 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-all font-mono"
                  />
                </td>

                {/* UOM */}
                <td className="px-6 py-3.5 text-slate-400 font-medium">
                  {item.uom}
                </td>

                {/* Unit Price Input */}
                <td className="px-6 py-3.5 w-36">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={item.unit_price}
                    onChange={(e) => onUpdatePrice(item.product_id, e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-955/40 px-3 py-1.5 text-sm text-slate-200 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-all font-mono"
                  />
                </td>

                {/* Total */}
                <td className="px-6 py-3.5 font-mono font-semibold text-slate-200">
                  ₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>

                {/* Remove Button */}
                <td className="px-6 py-3.5 text-center">
                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.product_id)}
                    className="flex h-7.5 w-7.5 items-center justify-center mx-auto rounded-md border border-slate-800 bg-slate-900/30 text-slate-400 hover:bg-red-950/20 hover:text-red-400 hover:border-red-900/30 transition-all"
                    title="Remove Item"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default SalesOrderItemsTable;
