import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProductsQuery } from '../../products/hooks/useProducts';
import { useBomsQuery } from '../hooks/useBom';
import MaterialSelector from './MaterialSelector';
import CostSummaryCard from './CostSummaryCard';
import { Trash2, AlertCircle, Save, ArrowLeft } from 'lucide-react';

const BomForm = ({ onSubmit, initialData = null, isSubmitting = false }) => {
  const navigate = useNavigate();
  const isEditMode = !!initialData;

  // Form States
  const [name, setName] = useState('');
  const [version, setVersion] = useState('1.0');
  const [finishedGoodId, setFinishedGoodId] = useState('');
  const [laborCost, setLaborCost] = useState(0.00);
  const [overheadCost, setOverheadCost] = useState(0.00);
  const [items, setItems] = useState([]); // Array of { id, name, sku, uom, unit_cost, quantity_required }
  const [errors, setErrors] = useState({});

  // Queries for selectors
  const { data: finishedGoodsData, isLoading: isLoadingFinishedGoods } = useProductsQuery({
    type: 'FINISHED_GOOD',
    limit: 100
  });

  const { data: bomsData } = useBomsQuery({ limit: 100 });

  // Load initialData when editing
  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setVersion(initialData.version || '1.0');
      setFinishedGoodId(initialData.finished_good_id || '');
      setLaborCost(initialData.labor_cost !== undefined ? Number(initialData.labor_cost) : 0.00);
      setOverheadCost(initialData.overhead_cost !== undefined ? Number(initialData.overhead_cost) : 0.00);
      
      const mappedItems = (initialData.items || []).map(item => ({
        id: item.raw_material_id,
        name: item.name,
        sku: item.sku,
        uom: item.uom,
        unit_cost: parseFloat(item.unit_cost || 0),
        quantity_required: parseFloat(item.quantity_required)
      }));
      setItems(mappedItems);
    }
  }, [initialData]);

  const existingBomProductIds = bomsData?.boms?.map(b => b.finished_good_id) || [];
  
  const availableFinishedGoods = finishedGoodsData?.products?.filter(p => {
    if (isEditMode && p.id === initialData?.finished_good_id) return true;
    return !existingBomProductIds.includes(p.id);
  }) || [];

  const handleAddMaterial = (material) => {
    const newItem = {
      id: material.id,
      name: material.name,
      sku: material.sku,
      uom: material.uom,
      unit_cost: parseFloat(material.unit_cost || 0),
      quantity_required: 1.0
    };
    setItems(prev => [...prev, newItem]);
    
    if (errors.items) {
      setErrors(prev => ({ ...prev, items: null }));
    }
  };

  const handleRemoveItem = (id) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleQuantityChange = (id, val) => {
    const qty = parseFloat(val);
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, quantity_required: isNaN(qty) ? '' : qty };
      }
      return item;
    }));
  };

  const validateForm = () => {
    const formErrors = {};

    if (!name.trim()) {
      formErrors.name = 'Recipe name is required.';
    }

    if (!version.trim()) {
      formErrors.version = 'Version string is required.';
    }

    if (!finishedGoodId) {
      formErrors.finished_good_id = 'Finished good target product is required.';
    }

    if (laborCost < 0) {
      formErrors.labor_cost = 'Labor cost cannot be negative.';
    }

    if (overheadCost < 0) {
      formErrors.overhead_cost = 'Overhead cost cannot be negative.';
    }

    if (items.length === 0) {
      formErrors.items = 'At least one raw material component is required.';
    } else {
      const itemErrors = {};
      items.forEach((item) => {
        if (item.quantity_required === '' || parseFloat(item.quantity_required) <= 0) {
          itemErrors[item.id] = 'Quantity must be greater than 0';
        }
      });
      if (Object.keys(itemErrors).length > 0) {
        formErrors.itemQuantities = itemErrors;
      }
    }

    setErrors(formErrors);
    return Object.keys(formErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const submissionItems = items.map(item => ({
      raw_material_id: item.id,
      quantity_required: parseFloat(item.quantity_required)
    }));

    const payload = {
      name: name.trim(),
      version: version.trim(),
      labor_cost: parseFloat(laborCost) || 0.00,
      overhead_cost: parseFloat(overheadCost) || 0.00,
      items: submissionItems
    };

    if (!isEditMode) {
      payload.finished_good_id = finishedGoodId;
    }

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Left Column: Form Fields */}
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/10 p-6 space-y-6">
            <h2 className="text-lg font-bold text-white">
              {isEditMode ? 'Modify Recipe Header' : 'New Recipe Specifications'}
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Finished Good Product */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Finished Product Target *
                </label>
                {isLoadingFinishedGoods ? (
                  <div className="w-full rounded-lg border border-slate-800 bg-slate-950/20 px-3 py-2.5 text-sm text-slate-500">
                    Loading finished products catalog...
                  </div>
                ) : (
                  <select
                    value={finishedGoodId}
                    onChange={(e) => {
                      setFinishedGoodId(e.target.value);
                      if (errors.finished_good_id) {
                        setErrors(prev => ({ ...prev, finished_good_id: null }));
                      }
                    }}
                    disabled={isEditMode}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950/20 px-3 py-2.5 text-sm text-slate-200 focus:border-blue-600 focus:outline-none"
                  >
                    <option value="" disabled className="bg-slate-900">-- Choose Finished Product --</option>
                    {availableFinishedGoods.map((prod) => (
                      <option key={prod.id} value={prod.id} className="bg-slate-900">
                        {prod.name} (SKU: {prod.sku}) — Price: Rs {parseFloat(prod.unit_price).toFixed(2)}
                      </option>
                    ))}
                  </select>
                )}
                {errors.finished_good_id && (
                  <p className="mt-1.5 text-xs text-red-400 font-semibold">{errors.finished_good_id}</p>
                )}
              </div>

              {/* Recipe Name */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Recipe Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Wooden Table Classic Version"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) {
                      setErrors(prev => ({ ...prev, name: null }));
                    }
                  }}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950/20 px-3 py-2 text-sm text-slate-200 focus:border-blue-600 focus:outline-none"
                />
                {errors.name && (
                  <p className="mt-1.5 text-xs text-red-400 font-semibold">{errors.name}</p>
                )}
              </div>

              {/* Version Code */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Version *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1.0"
                  value={version}
                  onChange={(e) => {
                    setVersion(e.target.value);
                    if (errors.version) {
                      setErrors(prev => ({ ...prev, version: null }));
                    }
                  }}
                  className="w-full rounded-lg border border-slate-800 bg-slate-955 px-3 py-2 text-sm text-slate-200 focus:border-blue-600 focus:outline-none"
                />
                {errors.version && (
                  <p className="mt-1.5 text-xs text-red-400 font-semibold">{errors.version}</p>
                )}
              </div>

              {/* Labor Cost */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Direct Labor Cost (INR)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={laborCost}
                  onChange={(e) => {
                    setLaborCost(e.target.value);
                    if (errors.labor_cost) {
                      setErrors(prev => ({ ...prev, labor_cost: null }));
                    }
                  }}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950/20 px-3 py-2 text-sm text-slate-200 focus:border-blue-600 focus:outline-none"
                />
                {errors.labor_cost && (
                  <p className="mt-1.5 text-xs text-red-400 font-semibold">{errors.labor_cost}</p>
                )}
              </div>

              {/* Overhead Cost */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Factory Overhead Cost (INR)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={overheadCost}
                  onChange={(e) => {
                    setOverheadCost(e.target.value);
                    if (errors.overhead_cost) {
                      setErrors(prev => ({ ...prev, overhead_cost: null }));
                    }
                  }}
                  className="w-full rounded-lg border border-slate-800 bg-slate-955 px-3 py-2 text-sm text-slate-200 focus:border-blue-600 focus:outline-none"
                />
                {errors.overhead_cost && (
                  <p className="mt-1.5 text-xs text-red-400 font-semibold">{errors.overhead_cost}</p>
                )}
              </div>
            </div>
          </div>

          {/* Raw Materials Grid Section */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/10 p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Component Recipe Ingredients</h2>
              <span className="text-xs font-bold bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                {items.length} Component(s)
              </span>
            </div>

            <MaterialSelector
              onAddMaterial={handleAddMaterial}
              existingMaterialIds={items.map(item => item.id)}
            />

            {errors.items && (
              <div className="flex items-center space-x-2 text-red-400 bg-red-950/20 border border-red-950/40 p-3 rounded-lg text-xs font-semibold">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errors.items}</span>
              </div>
            )}

            {items.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-955/20">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/40 font-bold uppercase tracking-wider text-slate-400">
                      <th className="px-4 py-3">Material Component</th>
                      <th className="px-4 py-3 text-right">Unit Cost</th>
                      <th className="px-4 py-3 text-center" style={{ width: '120px' }}>Quantity</th>
                      <th className="px-4 py-3 text-right">Line Subtotal</th>
                      <th className="px-4 py-3 text-center" style={{ width: '60px' }}>Remove</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 text-slate-350">
                    {items.map((item) => {
                      const qty = parseFloat(item.quantity_required);
                      const unitCost = parseFloat(item.unit_cost || 0);
                      const subtotal = isNaN(qty) ? 0 : qty * unitCost;

                      return (
                        <tr key={item.id} className="hover:bg-slate-900/40 transition-all">
                          <td className="px-4 py-3">
                            <div>
                              <span className="block font-semibold text-slate-200">{item.name}</span>
                              <span className="inline-block text-[10px] font-bold text-slate-500 uppercase mt-0.5">
                                SKU: {item.sku}
                              </span>
                            </div>
                          </td>

                          <td className="px-4 py-3 text-right font-medium text-slate-300">
                            ₹{unitCost.toFixed(2)} / {item.uom}
                          </td>

                          <td className="px-4 py-3 text-center">
                            <div>
                              <input
                                type="number"
                                step="any"
                                min="0.01"
                                value={item.quantity_required}
                                onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                className="w-full text-center rounded border border-slate-800 bg-slate-950 px-2 py-1 text-xs font-bold text-white focus:border-blue-600 focus:outline-none"
                              />
                              {errors.itemQuantities && errors.itemQuantities[item.id] && (
                                <span className="block mt-1 text-[9px] text-red-400 font-bold">
                                  {errors.itemQuantities[item.id]}
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-3 text-right font-bold text-white">
                            ₹{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>

                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              className="rounded p-1 text-slate-500 hover:bg-red-950/20 hover:text-red-400 transition-all"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/10 py-10 text-center text-xs text-slate-500 font-semibold">
                No raw material ingredients selected yet. Use the component selector above to build the recipe grid.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Cost Card & Submit */}
        <div className="space-y-6">
          <CostSummaryCard 
            items={items} 
            laborCost={laborCost} 
            overheadCost={overheadCost}
            sellingPrice={
              isEditMode 
                ? initialData?.finished_good_price 
                : (availableFinishedGoods.find(g => g.id === finishedGoodId)?.unit_price || 0.00)
            }
          />

          <div className="rounded-2xl border border-slate-800 bg-slate-900/10 p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</h3>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center space-x-2 rounded-lg bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-500 shadow-lg shadow-blue-900/25 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  <span>Saving Recipe...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>{isEditMode ? 'Update Recipe' : 'Publish Recipe'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => navigate('/bom')}
              className="flex w-full items-center justify-center space-x-2 rounded-lg border border-slate-800 bg-slate-955 py-3 text-sm font-semibold text-slate-450 hover:bg-slate-900 hover:text-white transition-all"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Cancel</span>
            </button>
          </div>
        </div>

      </div>
    </form>
  );
};

export default BomForm;
