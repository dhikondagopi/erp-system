import React, { useState } from 'react';
import { Sparkles, ClipboardList, RefreshCw, AlertTriangle, Search, X, Filter } from 'lucide-react';
import AiManufacturingPlannerPanel from '../../../modules/ai/components/AiManufacturingPlannerPanel';
import ProductionQueueTable from '../components/ProductionQueueTable';
import { useManufacturingOrdersQuery, useUpdateMoStatusMutation } from '../hooks/useManufacturing';

const ManufacturingPage = () => {
  const [activeTab, setActiveTab] = useState('queue'); // 'queue' | 'ai-planner'

  // Filter state for production queue
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [actionError, setActionError] = useState(null);

  // Data queries
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useManufacturingOrdersQuery({
    status: statusFilter || undefined,
    page,
    limit: 15,
  });

  const updateStatusMutation = useUpdateMoStatusMutation();

  const handleUpdateStatus = async (id, status) => {
    setActionError(null);
    try {
      await updateStatusMutation.mutateAsync({ id, status });
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to update manufacturing order status.');
      setTimeout(() => setActionError(null), 5000);
    }
  };

  // Compute KPI stats
  const orders = data?.orders || [];
  const kpi = {
    planned: orders.filter((o) => o.status === 'DRAFT').length,
    staged: orders.filter((o) => o.status === 'APPROVED').length,
    inProduction: orders.filter((o) => o.status === 'IN_PRODUCTION').length,
    completed: orders.filter((o) => o.status === 'COMPLETED').length,
    cancelled: orders.filter((o) => o.status === 'CANCELLED').length,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Manufacturing Orders</h1>
        <p className="text-slate-400 font-medium">Coordinate manufacturing queues, allocate assembly parts, and complete production operations.</p>
      </div>

      {/* Tabs Selector Navigation Header */}
      <div className="flex border-b border-slate-900 bg-slate-950/20 backdrop-blur-md p-1 rounded-xl w-fit border">
        <button
          onClick={() => setActiveTab('queue')}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'queue'
              ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20 shadow-md shadow-blue-900/5'
              : 'text-slate-400 hover:text-slate-200 border border-transparent'
          }`}
        >
          <ClipboardList className="h-4.5 w-4.5" />
          <span>Production Queue</span>
        </button>
        <button
          onClick={() => setActiveTab('ai-planner')}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'ai-planner'
              ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20 shadow-md shadow-blue-900/5'
              : 'text-slate-400 hover:text-slate-200 border border-transparent'
          }`}
        >
          <Sparkles className="h-4.5 w-4.5 text-violet-400 animate-pulse" />
          <span>AI Production Planner Wizard</span>
        </button>
      </div>

      {activeTab === 'queue' ? (
        <div className="space-y-6">
          {/* KPI Summary Row */}
          {!error && (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                { label: 'Planned', value: isLoading ? '...' : kpi.planned, color: 'text-slate-400', bg: 'bg-slate-800', border: 'border-slate-800' },
                { label: 'Staged', value: isLoading ? '...' : kpi.staged, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
                { label: 'In Production', value: isLoading ? '...' : kpi.inProduction, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
                { label: 'Completed', value: isLoading ? '...' : kpi.completed, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
                { label: 'Cancelled', value: isLoading ? '...' : kpi.cancelled, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
              ].map(({ label, value, color, bg, border }) => (
                <div key={label} className={`rounded-2xl border ${border} bg-slate-900/20 p-4 flex items-center space-x-3.5 shadow-sm`}>
                  <div className={`rounded-xl ${bg} border ${border} p-2.5 ${color}`}>
                    <ClipboardList className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">{label}</span>
                    <span className={`text-lg font-black ${color}`}>{value}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Filter & Refresh toolbar */}
          <div className="rounded-xl border border-slate-900 bg-slate-950/40 p-4 flex flex-wrap items-center gap-4 justify-between">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-slate-500" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Filter by Status</span>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-350 focus:border-blue-600 focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="APPROVED">Approved</option>
                <option value="IN_PRODUCTION">In Production</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              {statusFilter && (
                <button
                  onClick={() => { setStatusFilter(''); setPage(1); }}
                  className="text-[10px] font-bold text-slate-500 hover:text-slate-200 transition-all flex items-center gap-1"
                >
                  <X className="h-3 w-3" />
                  Clear
                </button>
              )}
            </div>
            <button
              onClick={() => refetch()}
              className="flex items-center space-x-1.5 rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-bold text-slate-350 hover:bg-slate-800 hover:text-white transition-all"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          {/* Error state */}
          {error && (
            <div className="rounded-xl border border-red-950/45 bg-red-950/20 p-6 text-center max-w-lg mx-auto">
              <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-red-400">Failed to load production queue</h3>
              <p className="text-xs text-slate-400 mt-2">Check backend server connectivity and reload.</p>
              <button
                onClick={() => refetch()}
                className="mt-4 px-4 py-2 text-xs font-bold rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-900 hover:text-slate-200"
              >
                Retry
              </button>
            </div>
          )}

          {/* Action error toast */}
          {actionError && (
            <div className="fixed bottom-4 right-4 z-50 flex items-center space-x-2.5 rounded-xl border border-red-950/40 bg-red-950/95 backdrop-blur-md p-4 text-xs font-bold text-red-400 shadow-2xl animate-in fade-in duration-150">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          {/* Loading spinner */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-blue-500"></div>
              <p className="text-xs text-slate-500 font-semibold">Loading production queue...</p>
            </div>
          ) : !error ? (
            <div className="space-y-6">
              <ProductionQueueTable
                orders={data?.orders || []}
                onUpdateStatus={handleUpdateStatus}
                isLoading={updateStatusMutation.isLoading}
              />

              {/* Pagination */}
              {data?.pagination && data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-900 pt-5 text-xs text-slate-500 font-semibold">
                  <p>Page {data.pagination.currentPage} of {data.pagination.totalPages}</p>
                  <div className="flex space-x-2">
                    <button
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                      className="rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 hover:bg-slate-900 hover:text-slate-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      disabled={page >= data.pagination.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                      className="rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 hover:bg-slate-900 hover:text-slate-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      ) : (
        <AiManufacturingPlannerPanel />
      )}
    </div>
  );
};

export default ManufacturingPage;
