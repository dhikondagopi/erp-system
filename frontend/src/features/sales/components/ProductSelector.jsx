import React, { useState } from 'react';
import { useProductsQuery } from '../../products/hooks/useProducts';
import { Plus } from 'lucide-react';

const ProductSelector = ({ onAddProduct, existingProductIds }) => {
  const [selectedProductId, setSelectedProductId] = useState('');
  const { data: prodData, isLoading } = useProductsQuery({ limit: 100 });

  // Filter out products already added
  const availableProducts = prodData?.products?.filter(
    (p) => !existingProductIds.includes(p.id)
  ) || [];

  const handleAdd = () => {
    if (!selectedProductId) return;
    const prod = prodData?.products?.find((p) => p.id === selectedProductId);
    if (prod) {
      onAddProduct(prod);
      setSelectedProductId('');
    }
  };

  return (
    <div className="rounded-xl border border-slate-900 bg-slate-955/20 p-4 space-y-4">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Add Line Item</h3>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          {isLoading ? (
            <div className="w-full rounded-lg border border-slate-800 bg-slate-950/20 px-3 py-2 text-sm text-slate-500">
              Loading products...
            </div>
          ) : (
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-955 px-3 py-2 text-sm text-slate-200 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-all"
            >
              <option value="" disabled className="bg-slate-955">-- Choose a Product --</option>
              {availableProducts.map((prod) => (
                <option key={prod.id} value={prod.id} className="bg-slate-955">
                  {prod.name} (SKU: {prod.sku}) - ₹{parseFloat(prod.unit_price).toFixed(2)}
                </option>
              ))}
            </select>
          )}
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={!selectedProductId}
          className="flex items-center justify-center space-x-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Add Item</span>
        </button>
      </div>
    </div>
  );
};

export default ProductSelector;
