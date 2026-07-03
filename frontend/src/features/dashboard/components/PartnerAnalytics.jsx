import React from 'react';
import { Users, Truck } from 'lucide-react';

const formatCurrency = (v) =>
  v >= 1_000_000
    ? `₹${(v / 1_000_000).toFixed(1)}M`
    : v >= 1_000
    ? `₹${(v / 1_000).toFixed(0)}K`
    : `₹${v}`;

const PartnerAnalytics = ({ customers = [], vendors = [], loading }) => {
  const maxCustomerSpend = customers.length > 0 ? Math.max(...customers.map(c => c.spend || 1)) : 1;
  const maxVendorSpend = vendors.length > 0 ? Math.max(...vendors.map(v => v.spend || 1)) : 1;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Top Customers Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-5">
        <div className="flex items-center gap-3 border-b border-slate-850 pb-3">
          <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-white font-bold text-sm">Top Customers</h3>
            <p className="text-slate-500 text-xs">Highest value clients by total sales spend</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(n => (
              <div key={n} className="h-10 bg-slate-800/40 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : customers.length === 0 ? (
          <div className="h-32 flex items-center justify-center text-slate-600 text-xs">
            No customer transaction records.
          </div>
        ) : (
          <div className="space-y-4">
            {customers.map((c, idx) => {
              const pct = ((c.spend || 0) / maxCustomerSpend) * 100;
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-slate-300">
                    <span className="truncate max-w-[180px]">{c.customer_name}</span>
                    <span className="font-mono text-white">{formatCurrency(c.spend)}</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-900">
                    <div
                      className="bg-gradient-to-r from-violet-600 to-indigo-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Top Vendors Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-5">
        <div className="flex items-center gap-3 border-b border-slate-850 pb-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-white font-bold text-sm">Top Vendors</h3>
            <p className="text-slate-500 text-xs">Key suppliers by procurement order volumes</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(n => (
              <div key={n} className="h-10 bg-slate-800/40 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : vendors.length === 0 ? (
          <div className="h-32 flex items-center justify-center text-slate-600 text-xs">
            No supplier procurement records.
          </div>
        ) : (
          <div className="space-y-4">
            {vendors.map((v, idx) => {
              const pct = ((v.spend || 0) / maxVendorSpend) * 100;
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-slate-300">
                    <span className="truncate max-w-[180px]">{v.vendor_name}</span>
                    <span className="font-mono text-white">{formatCurrency(v.spend)}</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-900">
                    <div
                      className="bg-gradient-to-r from-amber-600 to-orange-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PartnerAnalytics;
