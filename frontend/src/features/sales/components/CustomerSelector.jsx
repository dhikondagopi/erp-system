import React from 'react';
import { useCustomersQuery } from '../../customers/hooks/useCustomers';

const CustomerSelector = ({ selectedCustomerId, onChange, error }) => {
  const { data, isLoading } = useCustomersQuery({ limit: 100 });

  return (
    <div>
      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
        Select Customer
      </label>
      {isLoading ? (
        <div className="w-full rounded-lg border border-slate-800 bg-slate-950/20 px-3 py-2 text-sm text-slate-500">
          Loading customer directory...
        </div>
      ) : (
        <select
          value={selectedCustomerId || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-slate-800 bg-slate-950/20 px-3 py-2 text-sm text-slate-200 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-all"
        >
          <option value="" disabled className="bg-slate-955">-- Choose a Customer Account --</option>
          {data?.customers?.map((cust) => (
            <option key={cust.id} value={cust.id} className="bg-slate-955">
              {cust.name} ({cust.email})
            </option>
          ))}
        </select>
      )}
      {error && <p className="mt-1.5 text-xs text-red-400 font-semibold">{error}</p>}
    </div>
  );
};

export default CustomerSelector;
