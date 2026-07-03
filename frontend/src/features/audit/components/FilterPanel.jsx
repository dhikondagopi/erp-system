import React from 'react';
import { Search, Filter, X, Calendar } from 'lucide-react';

// Available action types surfaced in the audit trail
const ACTION_OPTIONS = [
  'created',
  'updated',
  'deleted',
  'confirmed',
  'shipped',
  'cancelled',
  'received',
  'adjusted',
  'started',
  'paused',
  'completed',
  'login',
  'logout',
];

// Entity modules tracked by the audit system
const ENTITY_TYPE_OPTIONS = [
  'product',
  'inventory',
  'sales_order',
  'purchase_order',
  'manufacturing_order',
  'work_order',
  'bom',
  'customer',
  'vendor',
  'user',
];

/**
 * FilterPanel – Search bar, action filter, entity type filter, and date range inputs.
 */
const FilterPanel = ({ filters, onChange, onReset }) => {
  const handleChange = (key, value) => {
    onChange({ ...filters, [key]: value, page: 1 });
  };

  const hasActiveFilters =
    filters.search ||
    filters.action ||
    filters.entityType ||
    filters.startDate ||
    filters.endDate;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm p-5 space-y-4">
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-300 font-semibold text-sm">
          <Filter className="w-4 h-4 text-violet-400" />
          Filters
        </div>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Clear All
          </button>
        )}
      </div>

      {/* Filter Inputs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Search */}
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search user, entity ID..."
            value={filters.search || ''}
            onChange={(e) => handleChange('search', e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition"
          />
        </div>

        {/* Action Filter */}
        <div>
          <select
            value={filters.action || ''}
            onChange={(e) => handleChange('action', e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition appearance-none"
          >
            <option value="">All Actions</option>
            {ACTION_OPTIONS.map((a) => (
              <option key={a} value={a}>
                {a.charAt(0).toUpperCase() + a.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Entity Type Filter */}
        <div>
          <select
            value={filters.entityType || ''}
            onChange={(e) => handleChange('entityType', e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition appearance-none"
          >
            <option value="">All Modules</option>
            {ENTITY_TYPE_OPTIONS.map((e) => (
              <option key={e} value={e}>
                {e.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              </option>
            ))}
          </select>
        </div>

        {/* Start Date */}
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <input
            type="date"
            value={filters.startDate || ''}
            onChange={(e) => handleChange('startDate', e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition"
          />
        </div>
      </div>

      {/* End Date row (when start date chosen) */}
      {filters.startDate && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative lg:col-start-5">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <input
              type="date"
              min={filters.startDate}
              value={filters.endDate || ''}
              onChange={(e) => handleChange('endDate', e.target.value)}
              placeholder="End date"
              className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;
