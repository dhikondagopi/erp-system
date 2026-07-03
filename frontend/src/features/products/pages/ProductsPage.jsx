import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ListFilter, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useProductsQuery, useDeleteProductMutation } from '../hooks/useProducts';
import ProductFilters from '../components/ProductFilters';
import ProductTable from '../components/ProductTable';
import ProductCard from '../components/ProductCard';
import ProductDetailsModal from '../components/ProductDetailsModal';
import DeleteModal from '../components/DeleteModal';
import { TableSkeleton } from '../../../components/Skeleton';
import EmptyState from '../../../components/EmptyState';

const ProductsPage = () => {
  const { hasRole } = useAuth();
  const canModify = hasRole(['Admin', 'Inventory Manager']);
  const canDelete = hasRole(['Admin']);

  // Filter States
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [type, setType] = useState('');
  const [procurementType, setProcurementType] = useState('');
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState('table');

  // Modal / Drawer States
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Debounce search keystrokes to optimize database loads
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 on new search parameter
    }, 450);

    return () => clearTimeout(handler);
  }, [search]);

  // Reset page index on filter change
  useEffect(() => {
    setPage(1);
  }, [type, procurementType]);

  // Query Hook Call
  const { data, isLoading, error } = useProductsQuery({
    search: debouncedSearch,
    type,
    procurement_type: procurementType,
    page,
    limit: 12 // Cards display well in grids of 3 or 4
  });

  const deleteMutation = useDeleteProductMutation();

  const handleOpenDetails = (id) => {
    setSelectedProductId(id);
    setDetailsOpen(true);
  };

  const handleOpenDelete = (product) => {
    setProductToDelete(product);
    setDeleteError(null);
    setDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    setDeleteError(null);
    try {
      await deleteMutation.mutateAsync(productToDelete.id);
      setDeleteOpen(false);
      setProductToDelete(null);
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Failed to delete the product catalog item.');
    }
  };

  const clearFilters = () => {
    setSearch('');
    setType('');
    setProcurementType('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Top action header bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Product Catalog</h1>
          <p className="text-slate-400 font-medium">Verify structural stock specifications, cost valuations, and reorder alerts.</p>
        </div>

        {canModify && (
          <Link
            to="/products/create"
            className="flex items-center space-x-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 shadow-lg shadow-blue-900/25 active:scale-95 transition-all text-center self-start sm:self-auto shrink-0"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>Create Product</span>
          </Link>
        )}
      </div>

      {/* Filter panel */}
      <ProductFilters
        search={search}
        setSearch={setSearch}
        type={type}
        setType={setType}
        procurementType={procurementType}
        setProcurementType={setProcurementType}
        viewMode={viewMode}
        setViewMode={setViewMode}
        clearFilters={clearFilters}
      />

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-red-955/45 bg-red-955/20 p-6 text-center max-w-lg mx-auto">
          <div className="flex justify-center text-red-500 mb-2">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h3 className="text-sm font-bold text-red-400">Failed to load product listing</h3>
          <p className="text-xs text-slate-405 mt-2">Check backend server connectivity and try reloading the page.</p>
        </div>
      )}

      {/* Main Listing Viewport */}
      {isLoading ? (
        <TableSkeleton rows={6} cols={6} />
      ) : data?.products?.length === 0 ? (
        <EmptyState 
          title="No Products Found" 
          description="Try adjusting your filters or search query to find products in the catalog." 
          actionButton={
            <button 
              onClick={clearFilters}
              className="px-4 py-2 rounded-lg border border-slate-800 bg-slate-900 text-xs font-semibold text-slate-300 hover:text-white"
            >
              Reset Filters
            </button>
          }
        />
      ) : data ? (
        <div className="space-y-6">
          {viewMode === 'table' ? (
            <ProductTable
              products={data.products}
              onViewDetails={handleOpenDetails}
              onDelete={handleOpenDelete}
              canModify={canModify}
              canDelete={canDelete}
            />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {data.products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onViewDetails={handleOpenDetails}
                  onDelete={handleOpenDelete}
                  canModify={canModify}
                  canDelete={canDelete}
                />
              ))}
            </div>
          )}

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
      <ProductDetailsModal
        isOpen={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        productId={selectedProductId}
      />

      {/* Deletion confirmation dialog */}
      <DeleteModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        productName={productToDelete?.name}
        productSku={productToDelete?.sku}
        isDeleting={deleteMutation.isLoading}
      />
      {deleteError && (
        <div className="fixed bottom-4 right-4 z-50 rounded-xl border border-red-950/40 bg-red-950/90 backdrop-blur-md p-4 text-xs font-semibold text-red-400">
          {deleteError}
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
