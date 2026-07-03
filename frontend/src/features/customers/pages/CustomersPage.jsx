import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, X, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useCustomersQuery, useDeleteCustomerMutation } from '../hooks/useCustomers';
import CustomerTable from '../components/CustomerTable';
import CustomerDetailsModal from '../components/CustomerDetailsModal';
import DeleteModal from '../components/DeleteModal';

const CustomersPage = () => {
  const { hasRole } = useAuth();
  const canModify = hasRole(['Admin', 'Sales User']);

  // Filter & Pagination States
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);

  // Modal & Drawer States
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Debounce search input to avoid hitting backend database too frequently
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset page to 1 on new searches
    }, 450);

    return () => clearTimeout(handler);
  }, [search]);

  // Query Hook
  const { data, isLoading, error } = useCustomersQuery({
    search: debouncedSearch,
    page,
    limit: 10
  });

  const deleteMutation = useDeleteCustomerMutation();

  const handleOpenDetails = (id) => {
    setSelectedCustomerId(id);
    setDetailsOpen(true);
  };

  const handleOpenDelete = (customer) => {
    setCustomerToDelete(customer);
    setDeleteError(null);
    setDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!customerToDelete) return;
    setDeleteError(null);
    try {
      await deleteMutation.mutateAsync(customerToDelete.id);
      setDeleteOpen(false);
      setCustomerToDelete(null);
    } catch (err) {
      setDeleteError(err.response?.data?.message || err.message || 'Failed to delete the customer profile.');
    }
  };

  const clearFilters = () => {
    setSearch('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Client Management</h1>
          <p className="text-slate-400 font-medium">Add, modify, and review global customer registries and records.</p>
        </div>

        {canModify && (
          <Link
            to="/customers/create"
            className="flex items-center space-x-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 shadow-lg shadow-blue-900/25 active:scale-95 transition-all text-center self-start sm:self-auto shrink-0"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>Register Customer</span>
          </Link>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-xl border border-slate-900 bg-slate-950/40 p-5 backdrop-blur-md">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search by Name, Email, or Phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-950/60 pl-10 pr-9 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-all"
          />
          {search && (
            <button
              onClick={clearFilters}
              className="absolute right-3 top-2.5 flex h-5.5 w-5.5 items-center justify-center rounded-md text-slate-500 hover:text-slate-350 hover:bg-slate-900/60"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-red-950/45 bg-red-950/20 p-6 text-center max-w-lg mx-auto">
          <div className="flex justify-center text-red-500 mb-2">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h3 className="text-sm font-bold text-red-400">Failed to load customer listing</h3>
          <p className="text-xs text-slate-400 mt-2">Check backend server connectivity and try reloading the page.</p>
        </div>
      )}

      {/* Main Listing View */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-blue-500"></div>
          <p className="text-xs text-slate-500 font-semibold">Loading customer directory...</p>
        </div>
      ) : data?.customers?.length === 0 ? (
        <div className="rounded-xl border border-slate-900 bg-slate-950/20 py-20 text-center text-slate-550 font-medium">
          No matching customer accounts found. Try modifying your search query.
        </div>
      ) : data ? (
        <div className="space-y-6">
          <CustomerTable
            customers={data.customers}
            onViewDetails={handleOpenDetails}
            onDelete={handleOpenDelete}
            canModify={canModify}
          />

          {/* Pagination */}
          {data.pagination && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-900 pt-5 text-xs text-slate-500 font-semibold">
              <p>
                Showing Page {data.pagination.currentPage} of {data.pagination.totalPages}
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
                  disabled={page >= data.pagination.totalPages}
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

      {/* Details Slide-out Drawer */}
      <CustomerDetailsModal
        isOpen={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        customerId={selectedCustomerId}
      />

      {/* Delete Modal */}
      <DeleteModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        customerName={customerToDelete?.name}
        customerEmail={customerToDelete?.email}
        isDeleting={deleteMutation.isLoading}
      />

      {/* Delete Mutation Error Toast notification */}
      {deleteError && (
        <div className="fixed bottom-4 right-4 z-50 rounded-xl border border-red-950/40 bg-red-950/90 backdrop-blur-md p-4 text-xs font-semibold text-red-400 shadow-xl">
          {deleteError}
        </div>
      )}
    </div>
  );
};

export default CustomersPage;

