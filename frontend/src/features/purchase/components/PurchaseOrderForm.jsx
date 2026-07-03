import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import VendorSelector from './VendorSelector';
import ProductSelector from './ProductSelector';
import PurchaseSummaryCard from './PurchaseSummaryCard';

const PurchaseOrderForm = ({ onSubmit, isSubmitting }) => {
  const navigate = useNavigate();
  const [vendorId, setVendorId] = useState('');
  const [items, setItems] = useState([]);
  const [errors, setErrors] = useState({});

  const handleAddProduct = (product) => {
    setItems((prev) => [
      ...prev,
      {
        product_id: product.id,
        sku: product.sku,
        name: product.name,
        uom: product.uom,
        unit_cost: parseFloat(product.unit_cost) || 0,
        quantity: 1
      }
    ]);
  };

  const handleUpdateQty = (productId, qtyValue) => {
    setItems((prev) =>
      prev.map((item) =>
        item.product_id === productId ? { ...item, quantity: qtyValue } : item
      )
    );
  };

  const handleUpdateCost = (productId, costValue) => {
    setItems((prev) =>
      prev.map((item) =>
        item.product_id === productId ? { ...item, unit_cost: costValue } : item
      )
    );
  };

  const handleRemoveItem = (productId) => {
    setItems((prev) => prev.filter((item) => item.product_id !== productId));
  };

  const validate = () => {
    const tempErrors = {};
    if (!vendorId) {
      tempErrors.vendorId = 'Please select a supplier account.';
    }

    if (items.length === 0) {
      tempErrors.items = 'Please add at least one product line item.';
    } else {
      const invalidQty = items.some((item) => !item.quantity || parseFloat(item.quantity) <= 0);
      const invalidCost = items.some((item) => item.unit_cost === '' || parseFloat(item.unit_cost) < 0);

      if (invalidQty) {
        tempErrors.items = 'All items must have a positive, non-zero quantity.';
      } else if (invalidCost) {
        tempErrors.items = 'Product unit costs cannot be negative values.';
      }
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      vendor_id: vendorId,
      items: items.map((item) => ({
        product_id: item.product_id,
        quantity: parseFloat(item.quantity),
        unit_cost: parseFloat(item.unit_cost)
      }))
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main form section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Vendor Selection */}
          <div className="rounded-xl border border-slate-900 bg-slate-955/40 p-6 backdrop-blur-md">
            <VendorSelector
              selectedVendorId={vendorId}
              onChange={setVendorId}
              error={errors.vendorId}
            />
          </div>

          {/* Product Selector */}
          <ProductSelector
            onAddProduct={handleAddProduct}
            existingProductIds={items.map((item) => item.product_id)}
          />

          {/* Line items table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Line Items</h3>
              {errors.items && <p className="text-xs text-red-400 font-semibold">{errors.items}</p>}
            </div>

            {items.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/10 p-8 text-center text-slate-500 font-medium text-sm">
                No items added to this purchase order draft. Use the selector above to add products.
              </div>
            ) : (
              <div className="w-full overflow-x-auto rounded-xl border border-slate-900 bg-slate-955/20 backdrop-blur-md">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-900 bg-slate-950/60 text-xs font-bold uppercase tracking-wider text-slate-400">
                      <th className="px-6 py-4">Product Specs</th>
                      <th className="px-6 py-4">Quantity</th>
                      <th className="px-6 py-4">UoM</th>
                      <th className="px-6 py-4">Unit Cost (₹)</th>
                      <th className="px-6 py-4">Total Cost (₹)</th>
                      <th className="px-6 py-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900 bg-transparent text-slate-350">
                    {items.map((item) => {
                      const totalCost = parseFloat(item.quantity || 0) * parseFloat(item.unit_cost || 0);
                      return (
                        <tr key={item.product_id} className="hover:bg-slate-900/30 transition-colors">
                          <td className="px-6 py-3.5">
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-200 text-sm">{item.name}</span>
                              <span className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">SKU: {item.sku}</span>
                            </div>
                          </td>
                          <td className="px-6 py-3.5 w-32">
                            <input
                              type="number"
                              min="0.01"
                              step="any"
                              value={item.quantity}
                              onChange={(e) => handleUpdateQty(item.product_id, e.target.value)}
                              className="w-full rounded-lg border border-slate-800 bg-slate-955/40 px-3 py-1.5 text-sm text-slate-200 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 transition-all font-mono"
                            />
                          </td>
                          <td className="px-6 py-3.5 text-slate-400 font-medium">
                            {item.uom}
                          </td>
                          <td className="px-6 py-3.5 w-36">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={item.unit_cost}
                              onChange={(e) => handleUpdateCost(item.product_id, e.target.value)}
                              className="w-full rounded-lg border border-slate-800 bg-slate-955/40 px-3 py-1.5 text-sm text-slate-200 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 transition-all font-mono"
                            />
                          </td>
                          <td className="px-6 py-3.5 font-mono font-semibold text-slate-250">
                            ₹{totalCost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-3.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.product_id)}
                              className="flex h-7.5 w-7.5 items-center justify-center mx-auto rounded-md border border-slate-800 bg-slate-900/30 text-slate-400 hover:bg-red-955/20 hover:text-red-400 hover:border-red-900/30 transition-all"
                              title="Remove Item"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Summary & Submit */}
        <div className="space-y-6">
          <PurchaseSummaryCard items={items} />

          <div className="rounded-xl border border-slate-900 bg-slate-955/40 p-5 space-y-4 backdrop-blur-md">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-500 transition-all active:scale-95 shadow-md shadow-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating draft PO...' : 'Create Purchase Draft'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/purchase-orders')}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 py-3 text-sm font-semibold text-slate-400 hover:bg-slate-900 hover:text-slate-200 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default PurchaseOrderForm;
