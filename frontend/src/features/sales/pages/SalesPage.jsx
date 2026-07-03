import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, X, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useSalesOrdersQuery } from '../hooks/useSales';
import { useCustomersQuery } from '../../customers/hooks/useCustomers';
import SalesOrderTable from '../components/SalesOrderTable';

const SalesPage = () => {
  const { hasRole } = useAuth();
  const canModify = hasRole(['Admin', 'Sales User']);

  // Filter States
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [page, setPage] = useState(1);

  // Queries
  const { data: customerData } = useCustomersQuery({ limit: 100 });
  const { data: salesData, isLoading, error } = useSalesOrdersQuery({
    customerId: selectedCustomerId || undefined,
    status: selectedStatus || undefined,
    page,
    limit: 10
  });

  const clearFilters = () => {
    setSelectedCustomerId('');
    setSelectedStatus('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Sales Orders</h1>
          <p className="text-slate-400 font-medium">Verify customer purchases, validate allocations, ship order batches, or record cancellations.</p>
        </div>

        {canModify && (
          <Link
            to="/sales-orders/create"
            className="flex items-center space-x-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 shadow-lg shadow-blue-900/25 active:scale-95 transition-all text-center self-start sm:self-auto shrink-0"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>Create Sales Order</span>
          </Link>
        )}
      </div>

      {/* Filters Area */}
      <div className="rounded-xl border border-slate-900 bg-slate-950/40 p-5 backdrop-blur-md">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Customer Filter */}
          <div className="flex flex-col space-y-1 w-64">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Filter by Customer</span>
            <select
              value={selectedCustomerId}
              onChange={(e) => {
                setSelectedCustomerId(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs font-semibold text-slate-350 focus:border-blue-650 focus:outline-none"
            >
              <option value="">All Customers</option>
              {customerData?.customers?.map((cust) => (
                <option key={cust.id} value={cust.id}>
                  {cust.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex flex-col space-y-1 w-48">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Filter by Status</span>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-slate-800 bg-slate-955/60 px-3 py-2 text-xs font-semibold text-slate-355 focus:border-blue-655 focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="APPROVED">Approved</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Reset button */}
          {(selectedCustomerId || selectedStatus) && (
            <button
              onClick={clearFilters}
              className="rounded-lg border border-slate-800 hover:bg-slate-900/60 px-3.5 py-2 text-xs font-bold text-slate-400 hover:text-slate-200 transition-all self-end"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-red-955/45 bg-red-955/20 p-6 text-center max-w-lg mx-auto">
          <div className="flex justify-center text-red-500 mb-2">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h3 className="text-sm font-bold text-red-400">Failed to load sales orders</h3>
          <p className="text-xs text-slate-400 mt-2">Check backend server connectivity and try reloading the page.</p>
        </div>
      )}

      {/* Main Grid View */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-blue-500"></div>
          <p className="text-xs text-slate-500 font-semibold">Loading sales orders directory...</p>
        </div>
      ) : salesData?.orders?.length === 0 ? (
        <div className="rounded-xl border border-slate-900 bg-slate-950/20 py-20 text-center text-slate-550 font-medium">
          No matching sales orders found. Try adjusting the query filters.
        </div>
      ) : salesData ? (
        <div className="space-y-6">
          <SalesOrderTable orders={salesData.orders} />

          {/* Pagination */}
          {salesData.pagination && salesData.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-900 pt-5 text-xs text-slate-500 font-semibold">
              <p>
                Showing Page {salesData.pagination.currentPage} of {salesData.pagination.totalPages}
              </p>
              <div className="flex space-x-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  className="rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 hover:bg-slate-900 hover:text-slate-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  disabled={page >= salesData.pagination.totalPages}
                  onClick={() => setPage(p => p + 1)}
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
  );
};

export default SalesPage;

