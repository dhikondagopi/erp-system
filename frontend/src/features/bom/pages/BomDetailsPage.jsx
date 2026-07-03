import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useBomDetailsQuery, useDeleteBomMutation } from '../hooks/useBom';
import { useAuth } from '../../../context/AuthContext';
import CostSummaryCard from '../components/CostSummaryCard';
import { 
  ArrowLeft, Edit3, Trash2, Calendar, FileText, 
  Package, ChevronRight, AlertTriangle, X 
} from 'lucide-react';

const BomDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();

  // Role permissions
  const canModify = hasRole(['Admin', 'Manufacturing User']);
  const canDelete = hasRole(['Admin']);

  // Modal and Delete States
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Queries
  const { data: bom, isLoading, error } = useBomDetailsQuery(id);
  const deleteMutation = useDeleteBomMutation();

  const handleConfirmDelete = async () => {
    setDeleteError(null);
    try {
      await deleteMutation.mutateAsync(id);
      navigate('/bom');
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Failed to delete the BoM recipe.');
      setDeleteOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header breadcrumb bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center space-x-3.5">
          <Link
            to="/bom"
            className="rounded-lg border border-slate-800 bg-slate-900/60 p-2 text-slate-400 hover:bg-slate-850 hover:text-white transition-all shadow-sm"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </Link>
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
            <Link to="/bom" className="hover:text-slate-300">Recipe Catalog</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-slate-300">Recipe Details</span>
          </div>
        </div>

        {/* Action Triggers */}
        {!isLoading && !error && bom && (
          <div className="flex items-center space-x-3">
            {canModify && (
              <Link
                to={`/bom/edit/${bom.id}`}
                id="details-edit-bom-btn"
                className="flex items-center space-x-1.5 rounded-lg border border-slate-800 bg-slate-900 px-4.5 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
              >
                <Edit3 className="h-4 w-4" />
                <span>Edit Recipe</span>
              </Link>
            )}
            {canDelete && (
              <button
                onClick={() => setDeleteOpen(true)}
                id="details-delete-bom-btn"
                className="flex items-center space-x-1.5 rounded-lg border border-red-950 bg-red-950/20 px-4.5 py-2 text-xs font-bold text-red-400 hover:bg-red-950/45 hover:text-red-300 transition-all"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete Recipe</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-blue-500"></div>
          <p className="text-xs text-slate-500 font-semibold">Loading recipe specifications...</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-red-950/45 bg-red-950/20 p-6 text-center max-w-lg mx-auto">
          <div className="flex justify-center text-red-500 mb-2">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h3 className="text-sm font-bold text-red-400">Failed to load BoM recipe</h3>
          <p className="text-xs text-slate-400 mt-2">Check server connectivity or verify if this recipe exists in database catalog.</p>
        </div>
      )}

      {/* Main Details Viewport */}
      {!isLoading && !error && bom && (
        <div className="grid gap-6 lg:grid-cols-3">
          
          {/* Columns 1 & 2: Header Info & Components breakdown */}
          <div className="space-y-6 lg:col-span-2">
            
            {/* Header info card */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/10 p-6 space-y-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h2 className="text-2xl font-black tracking-tight text-white">{bom.name}</h2>
                    <span className="inline-flex items-center rounded-full bg-blue-400/10 px-2.5 py-0.5 text-xs font-bold text-blue-400">
                      v{bom.version}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">Recipe Ref: {bom.id}</p>
                </div>
                <div className="rounded-xl bg-blue-500/10 p-3 text-blue-400">
                  <FileText className="h-6 w-6" />
                </div>
              </div>

              <div className="grid border-t border-slate-850 pt-5 gap-4 sm:grid-cols-2 text-xs font-semibold text-slate-450">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-slate-500" />
                  <span>Created: {new Date(bom.created_at).toLocaleString()}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-slate-500" />
                  <span>Last Updated: {new Date(bom.updated_at).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Finished Good Profile card */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/10 p-6 space-y-4">
              <div className="flex items-center space-x-2.5">
                <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
                  <Package className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Target Finished Good Product</h3>
              </div>
              <div className="grid gap-4 sm:grid-cols-3 border-t border-slate-850 pt-4 text-xs">
                <div>
                  <span className="block text-slate-500 font-semibold mb-1">Product Name</span>
                  <span className="text-slate-200 font-bold text-sm">{bom.finished_good_name}</span>
                </div>
                <div>
                  <span className="block text-slate-500 font-semibold mb-1">Catalog SKU</span>
                  <span className="inline-block rounded bg-slate-800 px-2 py-0.5 font-bold text-slate-350 uppercase tracking-wide">
                    {bom.finished_good_sku}
                  </span>
                </div>
                <div>
                  <span className="block text-slate-500 font-semibold mb-1">Unit of Measure</span>
                  <span className="text-slate-200 font-bold">{bom.finished_good_uom}</span>
                </div>
              </div>
            </div>

            {/* Component Ingredients breakdown table */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/10 p-6 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Components & Raw Materials</h3>
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/20">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/40 font-bold uppercase tracking-wider text-slate-400">
                      <th className="px-5 py-3.5">Component Material</th>
                      <th className="px-5 py-3.5 text-right">Unit Cost</th>
                      <th className="px-5 py-3.5 text-center">Required Qty</th>
                      <th className="px-5 py-3.5 text-right">Material Cost Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 text-slate-350">
                    {bom.items?.map((item) => {
                      const qty = parseFloat(item.quantity_required);
                      const unitCost = parseFloat(item.unit_cost || 0);
                      const subtotal = qty * unitCost;

                      return (
                        <tr key={item.id} className="hover:bg-slate-900/20 transition-all">
                          {/* Name & SKU */}
                          <td className="px-5 py-3.5">
                            <div>
                              <span className="block font-bold text-slate-200">{item.name}</span>
                              <span className="inline-block text-[10px] font-bold text-slate-500 uppercase mt-0.5">
                                SKU: {item.sku}
                              </span>
                            </div>
                          </td>

                          {/* Unit Cost */}
                          <td className="px-5 py-3.5 text-right font-medium text-slate-300">
                            ₹{unitCost.toFixed(2)} / {item.uom}
                          </td>

                          {/* Qty required */}
                          <td className="px-5 py-3.5 text-center font-extrabold text-slate-200">
                            {qty.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} {item.uom}
                          </td>

                          {/* Subtotal */}
                          <td className="px-5 py-3.5 text-right font-black text-white">
                            ₹{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Column 3: Cost valuation cards */}
          <div className="space-y-6">
            <CostSummaryCard 
              items={bom.items}
              laborCost={bom.labor_cost}
              overheadCost={bom.overhead_cost}
              sellingPrice={bom.finished_good_price}
              title="Manufacturing Cost Analysis"
            />
          </div>

        </div>
      )}

      {/* Delete confirmation dialog */}
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
                  Are you sure you want to delete <span className="font-semibold text-slate-200">"{bom?.name}"</span>? This action is permanent and cannot be undone.
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

      {/* Floating Error Banner */}
      {deleteError && (
        <div className="fixed bottom-4 right-4 z-50 rounded-xl border border-red-950/40 bg-red-950/90 backdrop-blur-md p-4 text-xs font-semibold text-red-400">
          {deleteError}
        </div>
      )}
    </div>
  );
};

export default BomDetailsPage;
