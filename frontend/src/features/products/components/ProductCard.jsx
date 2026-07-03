import React from 'react';
import { Link } from 'react-router-dom';
import { Eye, Edit2, Trash2, Tag } from 'lucide-react';

const ProductCard = ({ product, onViewDetails, onDelete, canModify, canDelete }) => {
  // Format numbers to clean currency indicators
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val);
  };

  return (
    <div className="group relative rounded-xl border border-slate-900 bg-slate-950/40 backdrop-blur-md overflow-hidden flex flex-col hover:border-slate-800/80 transition-all duration-300">
      {/* Product Image Preview Section */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-900 border-b border-slate-900/60">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-700 bg-slate-950 font-bold text-sm tracking-wider uppercase">
            {product.sku.substring(0, 3)}
          </div>
        )}
        
        {/* Badges Overlay */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {/* Product Type (Raw vs Finished) */}
          <span className={`inline-block px-2.5 py-0.5 rounded text-[9px] font-bold tracking-wide uppercase shadow-md ${
            product.type === 'RAW_MATERIAL'
              ? 'bg-amber-900/90 text-amber-100 border border-amber-800/20'
              : 'bg-emerald-900/90 text-emerald-100 border border-emerald-800/20'
          }`}>
            {product.type === 'RAW_MATERIAL' ? 'Raw Material' : 'Finished Good'}
          </span>
        </div>

        {/* Currency Tags Overlay */}
        <div className="absolute bottom-3 right-3">
          <span className="flex items-center space-x-1.5 rounded-lg bg-slate-950/80 px-2.5 py-1 text-xs font-bold text-blue-400 border border-slate-850 shadow-md">
            <Tag className="h-3 w-3" />
            <span>{formatCurrency(product.unit_price)}</span>
          </span>
        </div>
      </div>

      {/* Card Details Section */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div className="space-y-2">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              {product.category || 'Uncategorized'}
            </span>
            <span className="font-mono text-[10px] text-slate-400 font-semibold bg-slate-900 px-2 py-0.5 rounded">
              {product.sku}
            </span>
          </div>
          <h3 className="text-sm font-bold text-slate-200 line-clamp-1 group-hover:text-white transition-colors">
            {product.name}
          </h3>
          {product.description && (
            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          )}
        </div>

        {/* Technical/Procurement cost specs */}
        <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-900/60 text-xs font-medium text-slate-400">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">Unit Cost</span>
            <span className="font-mono text-slate-350 mt-0.5">{formatCurrency(product.unit_cost)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">Reorder Level</span>
            <span className="font-mono text-slate-350 mt-0.5">{product.reorder_point} {product.uom}</span>
          </div>
        </div>

        {/* Actions bar */}
        <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-900/40">
          {/* Procurement Strategy */}
          <span className="text-[10px] font-bold tracking-wide uppercase text-slate-500">
            {product.procurement_type} ({product.replenishment_strategy.replace('MAKE_TO_', '')})
          </span>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onViewDetails(product.id)}
              className="flex h-7.5 w-7.5 items-center justify-center rounded-md border border-slate-800 bg-slate-900/20 text-slate-400 hover:bg-slate-900 hover:text-slate-200 active:scale-90 transition-all animate-none"
              title="View Details"
            >
              <Eye className="h-4 w-4" />
            </button>

            {canModify && (
              <Link
                to={`/products/edit/${product.id}`}
                className="flex h-7.5 w-7.5 items-center justify-center rounded-md border border-slate-800 bg-slate-900/20 text-slate-400 hover:bg-slate-900 hover:text-blue-400 active:scale-90 transition-all animate-none"
                title="Edit Product"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </Link>
            )}

            {canDelete && (
              <button
                onClick={() => onDelete(product)}
                className="flex h-7.5 w-7.5 items-center justify-center rounded-md border border-slate-800 bg-slate-900/20 text-slate-400 hover:bg-red-950/20 hover:text-red-400 hover:border-red-900/30 active:scale-90 transition-all animate-none"
                title="Delete Product"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
