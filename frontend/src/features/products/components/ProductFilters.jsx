import React from 'react';
import { Search, X, Layers, Settings, Grid, List } from 'lucide-react';

const ProductFilters = ({
  search,
  setSearch,
  type,
  setType,
  procurementType,
  setProcurementType,
  viewMode,
  setViewMode,
  clearFilters
}) => {
  return (
    <div className="rounded-xl border border-slate-900 bg-slate-950/40 p-5 backdrop-blur-md space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search by SKU, Name, or Category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-950/60 pl-10 pr-9 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-2.5 flex h-5.5 w-5.5 items-center justify-center rounded-md text-slate-500 hover:text-slate-300 hover:bg-slate-900/60"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Dynamic Filters and Layout Mode */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Product Type Filter */}
          <div className="flex items-center space-x-2">
            <Layers className="h-4 w-4 text-slate-500" />
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-300 focus:border-blue-600 focus:outline-none"
            >
              <option value="">All Types</option>
              <option value="RAW_MATERIAL">Raw Material</option>
              <option value="FINISHED_GOOD">Finished Good</option>
            </select>
          </div>

          {/* Procurement Type Filter */}
          <div className="flex items-center space-x-2">
            <Settings className="h-4 w-4 text-slate-500" />
            <select
              value={procurementType}
              onChange={(e) => setProcurementType(e.target.value)}
              className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-300 focus:border-blue-600 focus:outline-none"
            >
              <option value="">All Procurement</option>
              <option value="PURCHASE">Purchase</option>
              <option value="MANUFACTURE">Manufacture</option>
            </select>
          </div>

          {/* Reset Filters Trigger */}
          {(search || type || procurementType) && (
            <button
              onClick={clearFilters}
              className="rounded-lg border border-slate-800 hover:bg-slate-900/60 px-3.5 py-2 text-xs font-bold text-slate-400 hover:text-slate-200 transition-all"
            >
              Clear Filters
            </button>
          )}

          {/* Table/Card View Selector Toggle */}
          <div className="flex items-center rounded-lg border border-slate-800 bg-slate-950 p-0.5 ml-2.5">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === 'table' ? 'bg-slate-900 text-blue-400' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Table View"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === 'grid' ? 'bg-slate-900 text-blue-400' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Grid Card View"
            >
              <Grid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductFilters;
