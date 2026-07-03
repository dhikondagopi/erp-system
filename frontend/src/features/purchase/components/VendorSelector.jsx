import React from 'react';
import { useVendorsQuery } from '../../vendors/hooks/useVendors';

const VendorSelector = ({ selectedVendorId, onChange, error }) => {
  const { data, isLoading } = useVendorsQuery({ limit: 100 });

  return (
    <div>
      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
        Select Vendor / Supplier
      </label>
      {isLoading ? (
        <div className="w-full rounded-lg border border-slate-800 bg-slate-950/20 px-3 py-2 text-sm text-slate-500">
          Loading suppliers directory...
        </div>
      ) : (
        <select
          value={selectedVendorId || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-slate-800 bg-slate-955/20 px-3 py-2 text-sm text-slate-200 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 transition-all"
        >
          <option value="" disabled className="bg-slate-955">-- Choose a Supplier Account --</option>
          {data?.vendors?.map((v) => (
            <option key={v.id} value={v.id} className="bg-slate-955">
              {v.name} ({v.email})
            </option>
          ))}
        </select>
      )}
      {error && <p className="mt-1.5 text-xs text-red-400 font-semibold">{error}</p>}
    </div>
  );
};

export default VendorSelector;
