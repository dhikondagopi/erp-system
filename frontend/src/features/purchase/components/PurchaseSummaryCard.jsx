import React from 'react';

const PurchaseSummaryCard = ({ items }) => {
  const itemCount = items.reduce((acc, item) => acc + parseFloat(item.quantity || 0), 0);
  const subtotal = items.reduce((acc, item) => acc + (parseFloat(item.quantity || 0) * parseFloat(item.unit_cost || 0)), 0);

  return (
    <div className="rounded-xl border border-slate-900 bg-slate-955/40 p-5 space-y-4 backdrop-blur-md">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-900 pb-3">
        Order Cost Valuation
      </h3>
      <div className="space-y-3.5 text-sm">
        <div className="flex justify-between text-slate-400">
          <span>Unique Products</span>
          <span className="font-semibold text-slate-200">{items.length}</span>
        </div>
        <div className="flex justify-between text-slate-400">
          <span>Total Quantities</span>
          <span className="font-mono text-slate-200">{itemCount}</span>
        </div>
        <div className="border-t border-slate-900 pt-3.5 flex justify-between font-bold text-base text-white">
          <span>Total Cost Value</span>
          <span className="font-mono text-emerald-400">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      </div>
    </div>
  );
};

export default PurchaseSummaryCard;
