import React from 'react';
import { Layers, Boxes, ShieldAlert, BadgeDollarSign } from 'lucide-react';

const InventorySummaryCards = ({ items = [] }) => {
  // Format numbers to clean currency indicators
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val);
  };

  // Compute metrics from current items list context
  const totalOnHand = items.reduce((sum, item) => sum + parseFloat(item.qty_on_hand || 0), 0);
  const totalReserved = items.reduce((sum, item) => sum + parseFloat(item.qty_reserved || 0), 0);
  
  const totalValuation = items.reduce(
    (sum, item) => sum + parseFloat(item.qty_on_hand || 0) * parseFloat(item.unit_cost || 0), 
    0
  );

  const lowStockBreaches = items.filter(
    item => parseFloat(item.qty_on_hand || 0) + parseFloat(item.qty_incoming || 0) < parseFloat(item.reorder_point || 0)
  ).length;

  const cardData = [
    {
      name: 'Stock Valuation',
      value: formatCurrency(totalValuation),
      icon: BadgeDollarSign,
      color: 'text-blue-400',
      bgColor: 'bg-blue-950/20 border-blue-900/10'
    },
    {
      name: 'Total Units On Hand',
      value: totalOnHand.toLocaleString('en-IN'),
      icon: Boxes,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-950/20 border-emerald-900/10'
    },
    {
      name: 'Reserved Allocations',
      value: totalReserved.toLocaleString('en-IN'),
      icon: Layers,
      color: 'text-purple-400',
      bgColor: 'bg-purple-950/20 border-purple-900/10'
    },
    {
      name: 'Low Stock SKU Alerts',
      value: lowStockBreaches,
      icon: ShieldAlert,
      color: lowStockBreaches > 0 ? 'text-rose-400 animate-pulse' : 'text-slate-400',
      bgColor: lowStockBreaches > 0 ? 'bg-rose-950/25 border-rose-900/20' : 'bg-slate-950/30 border-slate-900/20'
    }
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {cardData.map((card, i) => {
        const Icon = card.icon;
        return (
          <div
            key={i}
            className={`rounded-xl border p-5 backdrop-blur-md flex items-center justify-between shadow-lg transition-all hover:scale-[1.01] ${card.bgColor}`}
          >
            <div className="space-y-1.5 text-left">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                {card.name}
              </span>
              <p className="text-xl font-extrabold text-white">{card.value}</p>
            </div>
            <div className={`rounded-lg bg-slate-900/60 p-2.5 border border-slate-850 ${card.color}`}>
              <Icon className="h-5.5 w-5.5" />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default InventorySummaryCards;
