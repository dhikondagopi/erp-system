import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomerSelector from './CustomerSelector';
import ProductSelector from './ProductSelector';
import SalesOrderItemsTable from './SalesOrderItemsTable';
import OrderSummaryCard from './OrderSummaryCard';

const SalesOrderForm = ({ onSubmit, isSubmitting }) => {
  const navigate = useNavigate();
  const [customerId, setCustomerId] = useState('');
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
        unit_price: parseFloat(product.unit_price) || 0,
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

  const handleUpdatePrice = (productId, priceValue) => {
    setItems((prev) =>
      prev.map((item) =>
        item.product_id === productId ? { ...item, unit_price: priceValue } : item
      )
    );
  };

  const handleRemoveItem = (productId) => {
    setItems((prev) => prev.filter((item) => item.product_id !== productId));
  };

  const validate = () => {
    const tempErrors = {};
    if (!customerId) {
      tempErrors.customerId = 'Please select a customer account.';
    }

    if (items.length === 0) {
      tempErrors.items = 'Please add at least one product line item.';
    } else {
      const invalidQty = items.some((item) => !item.quantity || parseFloat(item.quantity) <= 0);
      const invalidPrice = items.some((item) => item.unit_price === '' || parseFloat(item.unit_price) < 0);

      if (invalidQty) {
        tempErrors.items = 'All items must have a positive, non-zero quantity.';
      } else if (invalidPrice) {
        tempErrors.items = 'Product unit prices cannot be negative values.';
      }
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      customer_id: customerId,
      items: items.map((item) => ({
        product_id: item.product_id,
        quantity: parseFloat(item.quantity),
        unit_price: parseFloat(item.unit_price)
      }))
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main form section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Selection */}
          <div className="rounded-xl border border-slate-900 bg-slate-950/40 p-6 backdrop-blur-md">
            <CustomerSelector
              selectedCustomerId={customerId}
              onChange={setCustomerId}
              error={errors.customerId}
            />
          </div>

          {/* Product selector widget */}
          <ProductSelector
            onAddProduct={handleAddProduct}
            existingProductIds={items.map((item) => item.product_id)}
          />

          {/* Lines Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Line Items</h3>
              {errors.items && <p className="text-xs text-red-400 font-semibold">{errors.items}</p>}
            </div>
            <SalesOrderItemsTable
              items={items}
              onUpdateQty={handleUpdateQty}
              onUpdatePrice={handleUpdatePrice}
              onRemoveItem={handleRemoveItem}
            />
          </div>
        </div>

        {/* Sidebar Summary & Submit */}
        <div className="space-y-6">
          <OrderSummaryCard items={items} />

          <div className="rounded-xl border border-slate-900 bg-slate-955/40 p-5 space-y-4 backdrop-blur-md">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-500 transition-all active:scale-95 shadow-md shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating order draft...' : 'Create Order Draft'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/sales-orders')}
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

export default SalesOrderForm;
