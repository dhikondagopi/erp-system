import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Edit2, Trash2, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';

const ProductTable = ({ products, onViewDetails, onDelete, canModify, canDelete }) => {
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');

  // Format numbers to clean currency indicators
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortedProducts = () => {
    if (!sortField) return products;

    return [...products].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (sortField === 'name') {
        aVal = a.name;
        bVal = b.name;
      }

      // Handle strings
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal || '').toLowerCase();
      } else {
        aVal = parseFloat(aVal) || 0;
        bVal = parseFloat(bVal) || 0;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const sortedProducts = getSortedProducts();

  const SortHeaderLeft = ({ field, label, className = '' }) => {
    const isSorted = sortField === field;
    return (
      <th 
        onClick={() => handleSort(field)}
        className={`px-6 py-4 cursor-pointer hover:text-slate-200 hover:bg-slate-900/30 transition-all select-none bg-slate-950/90 ${className}`}
      >
        <div className="flex items-center space-x-1.5 justify-start">
          <span>{label}</span>
          {isSorted ? (
            sortDirection === 'asc' ? <ChevronUp className="h-3.5 w-3.5 text-blue-400" /> : <ChevronDown className="h-3.5 w-3.5 text-blue-400" />
          ) : (
            <ArrowUpDown className="h-3.5 w-3.5 text-slate-500 opacity-60" />
          )}
        </div>
      </th>
    );
  };

  const SortHeaderRight = ({ field, label, className = '' }) => {
    const isSorted = sortField === field;
    return (
      <th 
        onClick={() => handleSort(field)}
        className={`px-6 py-4 cursor-pointer hover:text-slate-200 hover:bg-slate-900/30 transition-all select-none bg-slate-950/90 ${className}`}
      >
        <div className="flex items-center space-x-1.5 justify-end">
          <span>{label}</span>
          {isSorted ? (
            sortDirection === 'asc' ? <ChevronUp className="h-3.5 w-3.5 text-blue-400" /> : <ChevronDown className="h-3.5 w-3.5 text-blue-400" />
          ) : (
            <ArrowUpDown className="h-3.5 w-3.5 text-slate-500 opacity-60" />
          )}
        </div>
      </th>
    );
  };

  return (
    <div className="w-full max-h-[calc(100vh-280px)] overflow-y-auto rounded-xl border border-slate-900 bg-slate-950/20 backdrop-blur-md scrollbar-thin">
      <table className="w-full border-collapse text-left text-sm relative">
        <thead>
          <tr className="border-b border-slate-900 bg-slate-950 text-xs font-bold uppercase tracking-wider text-slate-400 sticky top-0 z-10">
            <SortHeaderLeft field="name" label="Product Info" />
            <SortHeaderLeft field="category" label="Category" />
            <SortHeaderLeft field="type" label="Type" />
            <SortHeaderLeft field="procurement_type" label="Procurement" />
            <SortHeaderRight field="unit_cost" label="Unit Cost" />
            <SortHeaderRight field="unit_price" label="Unit Price" />
            <SortHeaderRight field="reorder_point" label="Reorder Pt" />
            <th className="px-6 py-4 text-center bg-slate-950/90 select-none">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-900 bg-transparent text-slate-300">
          {sortedProducts.map((product) => (
            <tr key={product.id} className="hover:bg-slate-900/30 transition-colors">
              {/* Product Info (Image, Name, SKU) */}
              <td className="px-6 py-4.5">
                <div className="flex items-center space-x-3.5">
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-slate-800 bg-slate-900">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-slate-900 text-slate-600 font-bold text-xs uppercase">
                        {product.sku.substring(0, 2)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-200">{product.name}</p>
                    <p className="font-mono text-xs text-slate-500 mt-0.5 tracking-wider">{product.sku}</p>
                  </div>
                </div>
              </td>

              {/* Category */}
              <td className="px-6 py-4.5">
                <span className="text-xs font-medium text-slate-400">
                  {product.category || 'Uncategorized'}
                </span>
              </td>

              {/* Product Type (Raw vs Finished) */}
              <td className="px-6 py-4.5">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase ${
                    product.type === 'RAW_MATERIAL'
                      ? 'bg-amber-950/30 text-amber-400 border border-amber-900/20'
                      : 'bg-emerald-950/30 text-emerald-400 border border-emerald-900/20'
                  }`}
                >
                  {product.type === 'RAW_MATERIAL' ? 'Raw Material' : 'Finished Good'}
                </span>
              </td>

              {/* Procurement Type (Purchase vs Manufacture) */}
              <td className="px-6 py-4.5">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase ${
                    product.procurement_type === 'PURCHASE'
                      ? 'bg-blue-950/30 text-blue-400 border border-blue-900/20'
                      : 'bg-purple-950/30 text-purple-400 border border-purple-900/20'
                  }`}
                >
                  {product.procurement_type === 'PURCHASE' ? 'Purchase' : 'Manufacture'}
                </span>
              </td>

              {/* Unit Cost */}
              <td className="px-6 py-4.5 text-right font-mono text-slate-200">
                {formatCurrency(product.unit_cost)}
              </td>

              {/* Unit Price */}
              <td className="px-6 py-4.5 text-right font-mono text-slate-200">
                {formatCurrency(product.unit_price)}
              </td>

              {/* Reorder Point */}
              <td className="px-6 py-4.5 text-right font-mono text-slate-400">
                {parseFloat(product.reorder_point).toFixed(2)}
              </td>

              {/* Actions */}
              <td className="px-6 py-4.5 text-center">
                <div className="flex items-center justify-center space-x-2">
                  <button
                    onClick={() => onViewDetails(product.id)}
                    className="flex h-7.5 w-7.5 items-center justify-center rounded-md border border-slate-800 bg-slate-900 text-slate-400 hover:text-white transition-all active:scale-95"
                    title="View details"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  {canModify && (
                    <Link
                      to={`/products/edit/${product.id}`}
                      className="flex h-7.5 w-7.5 items-center justify-center rounded-md border border-slate-800 bg-slate-900 text-slate-400 hover:text-white transition-all active:scale-95"
                      title="Edit product"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Link>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => onDelete(product)}
                      className="flex h-7.5 w-7.5 items-center justify-center rounded-md border border-red-950/50 bg-red-950/10 text-red-400 hover:bg-red-950/20 hover:text-red-300 transition-all active:scale-95"
                      title="Delete product"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProductTable;
