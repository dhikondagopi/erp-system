import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, AlertTriangle, X, RefreshCw } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useBomsQuery, useDeleteBomMutation } from '../hooks/useBom';
import BomTable from '../components/BomTable';

const BomPage = () => {
  const { hasRole } = useAuth();
  const canModify = hasRole(['Admin', 'Manufacturing User']);
  const canDelete = hasRole(['Admin']);

  // Filter & Search State
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);

  // Modal State
  const [bomToDelete, setBomToDelete] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Debounce search keystrokes to optimize database query loading
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 on new search parameter
    }, 450);

    return () => clearTimeout(handler);
  }, [search]);

  // Query Hook
  const { data, isLoading, error, refetch } = useBomsQuery({
    search: debouncedSearch,
    page,
    limit: 10
  });

  const deleteMutation = useDeleteBomMutation();

  const handleOpenDelete = (bom) => {
    setBomToDelete(bom);
    setDeleteError(null);
    setDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!bomToDelete) return;
    setDeleteError(null);
    try {
      await deleteMutation.mutateAsync(bomToDelete.id);
      setDeleteOpen(false);
      setBomToDelete(null);
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Failed to delete the BoM recipe.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Action header bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Bill of Materials (BoM)</h1>
          <p className="text-slate-400 font-medium">Build, inspect, and modify component recipe lists and material lists for finished tables.</p>
        </div>

        {canModify && (
          <Link
            to="/bom/create"
            id="create-bom-btn"
            className="flex items-center space-x-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 shadow-lg shadow-blue-900/25 active:scale-95 transition-all text-center self-start sm:self-auto shrink-0"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>Create Recipe</span>
          </Link>
        )}
      </div>

      {/* Filter panel */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/10 p-4">
        <div className="relative max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
            <Search className="h-4.5 w-4.5" />
          </span>
          <input
            type="text"
            placeholder="Search by recipe name, finished good name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-950/40 py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-350"
            >
              <X className="h-4 w-4" />
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
          <h3 className="text-sm font-bold text-red-400">Failed to load BoM recipes</h3>
          <p className="text-xs text-slate-400 mt-2">Check backend server connectivity and try reloading the page.</p>
          <button
            onClick={() => refetch()}
            className="mt-4 inline-flex items-center space-x-1.5 rounded-lg border border-slate-850 px-4 py-2 text-xs font-bold text-slate-400 hover:bg-slate-900 transition-all"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Main Listing Viewport */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-blue-500"></div>
          <p className="text-xs text-slate-500 font-semibold">Loading BoM recipes...</p>
        </div>
      ) : data?.boms?.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/10 py-20 text-center text-slate-500 font-medium">
          No BoM recipes found. Try modifying your search.
        </div>
      ) : data ? (
        <div className="space-y-6">
          <BomTable
            boms={data.boms}
            onDelete={handleOpenDelete}
          />

          {/* Pagination controls */}
          {data.pagination && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-900 pt-5 text-xs text-slate-500 font-semibold">
              <p>
                Showing Page {data.pagination.currentPage} of {data.pagination.totalPages}
              </p>
              <div className="flex space-x-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  className="rounded-lg border border-slate-850 bg-slate-950 px-4 py-2 hover:bg-slate-900 hover:text-slate-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  disabled={page >= data.pagination.totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="rounded-lg border border-slate-850 bg-slate-955 px-4 py-2 hover:bg-slate-900 hover:text-slate-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Deletion confirmation dialog */}
      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setDeleteOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-slate-850 bg-slate-900/90 backdrop-blur-xl p-6 shadow-2xl animate-in fade-in scale-in duration-200">
            <button
              onClick={() => setDeleteOpen(false)}
              disabled={deleteMutation.isLoading}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-350 disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="rounded-full bg-red-950/30 p-4 border border-red-900/30 text-red-500">
                <AlertTriangle className="h-8 w-8" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-white">Delete Recipe?</h3>
                <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                  Are you sure you want to delete <span className="font-semibold text-slate-200">"{bomToDelete?.name}"</span>? This action is permanent and will remove the recipe.
                </p>
              </div>
              <div className="flex w-full space-x-3.5 pt-4">
                <button
                  onClick={() => setDeleteOpen(false)}
                  disabled={deleteMutation.isLoading}
                  className="flex-1 px-4 py-2.5 text-xs font-bold rounded-lg border border-slate-800 bg-slate-950 text-slate-450 hover:bg-slate-900 hover:text-slate-200 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  id="confirm-delete-bom-btn"
                  disabled={deleteMutation.isLoading}
                  className="flex-1 px-4 py-2.5 text-xs font-bold rounded-lg bg-red-600 hover:bg-red-500 text-white transition-all shadow-md shadow-red-900/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleteMutation.isLoading ? 'Deleting...' : 'Delete Recipe'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Deletion Error Banner */}
      {deleteError && (
        <div className="fixed bottom-4 right-4 z-50 rounded-xl border border-red-950/40 bg-red-950/90 backdrop-blur-md p-4 text-xs font-semibold text-red-400">
          {deleteError}
        </div>
      )}
    </div>
  );
};

export default BomPage;
