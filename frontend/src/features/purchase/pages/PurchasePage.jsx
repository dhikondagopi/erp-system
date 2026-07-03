import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, AlertTriangle, Sparkles, FileText } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { usePurchaseOrdersQuery } from '../hooks/usePurchase';
import { useVendorsQuery } from '../../vendors/hooks/useVendors';
import PurchaseOrderTable from '../components/PurchaseOrderTable';
import AiProcurementPanel from '../../../modules/ai/components/AiProcurementPanel';

const PurchasePage = () => {
  const { hasRole } = useAuth();
  const canModify = hasRole(['Admin', 'Purchase User']);

  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'ai-procurement'

  // Filter States
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [page, setPage] = useState(1);

  // Queries
  const { data: vendorData } = useVendorsQuery({ limit: 100 });
  const { data: purchaseData, isLoading, error } = usePurchaseOrdersQuery({
    vendorId: selectedVendorId || undefined,
    status: selectedStatus || undefined,
    page,
    limit: 10
  });

  const clearFilters = () => {
    setSelectedVendorId('');
    setSelectedStatus('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Purchase Orders</h1>
          <p className="text-slate-400 font-medium">Create PO drafts, request parts from suppliers, track incoming components, and receive inventory.</p>
        </div>

        {canModify && (
          <Link
            to="/purchase-orders/create"
            className="flex items-center space-x-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 shadow-lg shadow-emerald-900/25 active:scale-95 transition-all text-center self-start sm:self-auto shrink-0"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>Create Purchase Order</span>
          </Link>
        )}
      </div>

      {/* Tabs Selector Navigation Header */}
      <div className="flex border-b border-slate-900 bg-slate-950/20 backdrop-blur-md p-1 rounded-xl w-fit border">
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'orders'
              ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-600/20 shadow-md shadow-emerald-900/5'
              : 'text-slate-400 hover:text-slate-200 border border-transparent'
          }`}
        >
          <FileText className="h-4.5 w-4.5" />
          <span>PO List</span>
        </button>
        <button
          onClick={() => setActiveTab('ai-procurement')}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'ai-procurement'
              ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-600/20 shadow-md shadow-emerald-900/5'
              : 'text-slate-400 hover:text-slate-200 border border-transparent'
          }`}
        >
          <Sparkles className="h-4.5 w-4.5 text-violet-400 animate-pulse" />
          <span>AI Procurement Recommendations</span>
        </button>
      </div>

      {activeTab === 'orders' ? (
        <>
          {/* Filters Area */}
          <div className="rounded-xl border border-slate-900 bg-slate-950/40 p-5 backdrop-blur-md">
            <div className="flex flex-wrap gap-4 items-center">
              {/* Vendor Filter */}
              <div className="flex flex-col space-y-1 w-64">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Filter by Supplier</span>
                <select
                  value={selectedVendorId}
                  onChange={(e) => {
                    setSelectedVendorId(e.target.value);
                    setPage(1);
                  }}
                  className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs font-semibold text-slate-355 focus:border-emerald-650 focus:outline-none"
                >
                  <option value="">All Suppliers</option>
                  {vendorData?.vendors?.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
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
                  className="rounded-lg border border-slate-800 bg-slate-955/60 px-3 py-2 text-xs font-semibold text-slate-355 focus:border-emerald-655 focus:outline-none"
                >
                  <option value="">All Statuses</option>
                  <option value="DRAFT">Draft</option>
                  <option value="PENDING_APPROVAL">Pending Approval</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="RECEIVED">Received</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              {/* Reset button */}
              {(selectedVendorId || selectedStatus) && (
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
              <h3 className="text-sm font-bold text-red-400">Failed to load purchase orders</h3>
              <p className="text-xs text-slate-400 mt-2">Check backend server connectivity and try reloading the page.</p>
            </div>
          )}

          {/* Main Grid View */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-emerald-500"></div>
              <p className="text-xs text-slate-500 font-semibold">Loading purchase orders directory...</p>
            </div>
          ) : purchaseData?.orders?.length === 0 ? (
            <div className="rounded-xl border border-slate-900 bg-slate-950/20 py-20 text-center text-slate-550 font-medium">
              No matching purchase orders found. Try adjusting the query filters.
            </div>
          ) : purchaseData ? (
            <div className="space-y-6">
              <PurchaseOrderTable orders={purchaseData.orders} />

              {/* Pagination */}
              {purchaseData.pagination && purchaseData.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-900 pt-5 text-xs text-slate-500 font-semibold">
                  <p>
                    Showing Page {purchaseData.pagination.currentPage} of {purchaseData.pagination.totalPages}
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
                      disabled={page >= purchaseData.pagination.totalPages}
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
        </>
      ) : (
        <AiProcurementPanel />
      )}
    </div>
  );
};

export default PurchasePage;

