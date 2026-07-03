import React, { useState } from 'react';
import { useProductsQuery } from '../../products/hooks/useProducts';
import { Plus } from 'lucide-react';

const MaterialSelector = ({ onAddMaterial, existingMaterialIds }) => {
  const [selectedProductId, setSelectedProductId] = useState('');
  const { data: prodData, isLoading } = useProductsQuery({ type: 'RAW_MATERIAL', limit: 100 });

  // Filter out raw materials already added to the BoM list
  const availableMaterials = prodData?.products?.filter(
    (p) => !existingMaterialIds.includes(p.id)
  ) || [];

  const handleAdd = () => {
    if (!selectedProductId) return;
    const material = prodData?.products?.find((p) => p.id === selectedProductId);
    if (material) {
      onAddMaterial(material);
      setSelectedProductId('');
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4 space-y-4">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Add Raw Material Component</h3>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          {isLoading ? (
            <div className="w-full rounded-lg border border-slate-800 bg-slate-950/20 px-3 py-2 text-sm text-slate-500">
              Loading raw materials...
            </div>
          ) : (
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-200 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-all"
            >
              <option value="" disabled className="bg-slate-900">-- Choose a Raw Material Component --</option>
              {availableMaterials.map((mat) => (
                <option key={mat.id} value={mat.id} className="bg-slate-900">
                  {mat.name} (SKU: {mat.sku}) - ₹{parseFloat(mat.unit_cost || 0).toFixed(2)} / {mat.uom}
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
          <span>Add Component</span>
        </button>
      </div>
    </div>
  );
};

export default MaterialSelector;
