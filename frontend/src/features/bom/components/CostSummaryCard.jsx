import React from 'react';
import { 
  Layers, 
  Weight, 
  Wrench, 
  Factory, 
  DollarSign, 
  TrendingUp, 
  Percent 
} from 'lucide-react';

const CostSummaryCard = ({ 
  items = [], 
  laborCost = 0.00, 
  overheadCost = 0.00, 
  sellingPrice = 0.00, 
  title = "Manufacturing Cost Analysis" 
}) => {
  // Calculations
  const uniqueItemsCount = items.length;
  
  const totalQuantity = items.reduce((sum, item) => {
    const qty = parseFloat(item.quantity_required || 0);
    return sum + (isNaN(qty) ? 0 : qty);
  }, 0);

  const materialCost = items.reduce((sum, item) => {
    const qty = parseFloat(item.quantity_required || 0);
    const cost = parseFloat(item.unit_cost || 0);
    return sum + (isNaN(qty) || isNaN(cost) ? 0 : qty * cost);
  }, 0);

  const labor = parseFloat(laborCost || 0);
  const overhead = parseFloat(overheadCost || 0);
  const productionCost = materialCost + labor + overhead;
  const price = parseFloat(sellingPrice || 0);
  const profit = price - productionCost;
  const profitMargin = price > 0 ? (profit / price) * 100 : 0;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md shadow-2xl space-y-5">
      {/* Absolute background decoration glows */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-blue-600/10 blur-xl"></div>
      <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-24 w-24 rounded-full bg-cyan-600/10 blur-xl"></div>

      <h3 className="text-sm font-bold text-slate-350 tracking-wide uppercase">
        {title}
      </h3>

      <div className="space-y-3 text-xs">
        {/* Component Types */}
        <div className="flex items-center justify-between border-b border-slate-850/60 pb-2.5">
          <div className="flex items-center space-x-2.5">
            <div className="rounded-lg bg-blue-500/10 p-2 text-blue-400">
              <Layers className="h-4 w-4" />
            </div>
            <span className="font-semibold text-slate-400">Component Types</span>
          </div>
          <span className="font-bold text-white">{uniqueItemsCount} materials</span>
        </div>

        {/* Total Quantity */}
        <div className="flex items-center justify-between border-b border-slate-850/60 pb-2.5">
          <div className="flex items-center space-x-2.5">
            <div className="rounded-lg bg-purple-500/10 p-2 text-purple-400">
              <Weight className="h-4 w-4" />
            </div>
            <span className="font-semibold text-slate-400">Required Components Qty</span>
          </div>
          <span className="font-bold text-white">
            {totalQuantity.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} units
          </span>
        </div>

        {/* Material Cost */}
        <div className="flex items-center justify-between border-b border-slate-850/60 pb-2.5">
          <div className="flex items-center space-x-2.5">
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400 font-bold">
              ₹
            </div>
            <span className="font-semibold text-slate-400">Total Material Cost</span>
          </div>
          <span className="font-mono font-bold text-slate-200">
            ₹{materialCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* Labor Cost */}
        <div className="flex items-center justify-between border-b border-slate-850/60 pb-2.5">
          <div className="flex items-center space-x-2.5">
            <div className="rounded-lg bg-yellow-500/10 p-2 text-yellow-400">
              <Wrench className="h-4 w-4" />
            </div>
            <span className="font-semibold text-slate-400">Labor Cost</span>
          </div>
          <span className="font-mono font-bold text-slate-200">
            ₹{labor.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* Overhead Cost */}
        <div className="flex items-center justify-between border-b border-slate-850/60 pb-2.5">
          <div className="flex items-center space-x-2.5">
            <div className="rounded-lg bg-slate-800 p-2 text-slate-400">
              <Factory className="h-4 w-4" />
            </div>
            <span className="font-semibold text-slate-400">Factory Overhead</span>
          </div>
          <span className="font-mono font-bold text-slate-200">
            ₹{overhead.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* Total Production Cost */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 pt-1">
          <div className="flex items-center space-x-2.5">
            <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-400">
              <span className="text-xs font-black">Σ</span>
            </div>
            <span className="font-bold text-slate-300">Total Production Cost</span>
          </div>
          <span className="font-mono font-extrabold text-indigo-400 text-sm">
            ₹{productionCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* Selling Price */}
        <div className="flex items-center justify-between border-b border-slate-850/60 pb-2.5">
          <div className="flex items-center space-x-2.5">
            <div className="rounded-lg bg-cyan-500/10 p-2 text-cyan-400">
              <DollarSign className="h-4 w-4" />
            </div>
            <span className="font-semibold text-slate-400">Catalog Selling Price</span>
          </div>
          <span className="font-mono font-bold text-slate-200">
            ₹{price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* Net Profit */}
        <div className="flex items-center justify-between border-b border-slate-850/60 pb-2.5">
          <div className="flex items-center space-x-2.5">
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
              <TrendingUp className="h-4 w-4" />
            </div>
            <span className="font-semibold text-slate-450">Estimated Unit Profit</span>
          </div>
          <span className={`font-mono font-extrabold text-sm ${profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            ₹{profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* Profit Margin */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center space-x-2.5">
            <div className="rounded-lg bg-blue-500/10 p-2 text-blue-400">
              <Percent className="h-4 w-4" />
            </div>
            <span className="font-semibold text-slate-450">Profit Margin</span>
          </div>
          <span className={`text-base font-black ${profitMargin >= 20 ? 'text-emerald-400' : profitMargin >= 5 ? 'text-amber-400' : 'text-rose-455'}`}>
            {profitMargin.toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default CostSummaryCard;
