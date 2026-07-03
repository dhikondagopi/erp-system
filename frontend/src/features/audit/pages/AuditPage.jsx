import React, { useState, useCallback } from 'react';
import { ShieldCheck, RefreshCw } from 'lucide-react';
import { useAuditLogsQuery } from '../hooks/useAudit';
import AuditLogsTable from '../components/AuditLogsTable';
import FilterPanel from '../components/FilterPanel';
import LogDetailsDrawer from '../components/LogDetailsDrawer';
import AuditSummaryCards from '../components/AuditSummaryCards';

const DEFAULT_FILTERS = {
  search: '',
  action: '',
  entityType: '',
  startDate: '',
  endDate: '',
  page: 1,
  limit: 25,
};

/**
 * AuditPage – System-wide audit trail with filterable, paginated log table
 * and a slide-in detail drawer for inspecting individual records.
 */
const AuditPage = () => {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [selectedLog, setSelectedLog] = useState(null);

  // Build query params from active filters
  const queryParams = {
    ...(filters.action && { action: filters.action }),
    ...(filters.entityType && { entityType: filters.entityType }),
    page: filters.page,
    limit: filters.limit,
  };

  const { data, isLoading, isFetching, isError, refetch } = useAuditLogsQuery(queryParams);

  const logs = data?.logs || [];
  const pagination = data?.pagination || {};

  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  const handleReset = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  // Client-side search on top of server-side filters
  const visibleLogs = filters.search
    ? logs.filter((log) => {
        const term = filters.search.toLowerCase();
        const userName = [log.first_name, log.last_name, log.email]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return (
          userName.includes(term) ||
          String(log.entity_id || '').toLowerCase().includes(term) ||
          String(log.ip_address || '').toLowerCase().includes(term) ||
          String(log.action || '').toLowerCase().includes(term) ||
          String(log.entity_type || '').toLowerCase().includes(term)
        );
      })
    : logs;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20">
              <ShieldCheck className="w-5 h-5 text-violet-400" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">
              System Audit Logs
            </h1>
          </div>
          <p className="text-slate-400 text-sm ml-14">
            Verify operator actions, record-state snapshots, and system changes across all modules.
          </p>
        </div>

        {/* Refresh Button */}
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="self-start sm:self-center flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-700 hover:text-white transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Summary KPI Cards */}
      <AuditSummaryCards
        logs={logs}
        totalItems={pagination.totalItems || 0}
        loading={isLoading}
      />

      {/* Filters */}
      <FilterPanel
        filters={filters}
        onChange={handleFiltersChange}
        onReset={handleReset}
      />

      {/* Error State */}
      {isError && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-center">
          <p className="text-red-400 font-medium">Failed to load audit logs.</p>
          <button
            onClick={() => refetch()}
            className="mt-3 text-sm text-red-300 hover:text-white underline transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Audit Table */}
      {!isError && (
        <AuditLogsTable
          logs={visibleLogs}
          pagination={pagination}
          page={filters.page}
          onPageChange={handlePageChange}
          onRowClick={setSelectedLog}
          loading={isLoading}
        />
      )}

      {/* Detail Drawer */}
      <LogDetailsDrawer
        log={selectedLog}
        onClose={() => setSelectedLog(null)}
      />
    </div>
  );
};

export default AuditPage;
