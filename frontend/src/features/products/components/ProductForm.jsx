import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';

const ProductForm = ({ initialValues, onSubmit, isSubmitting, isEdit = false }) => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    sku: '',
    name: '',
    description: '',
    type: 'RAW_MATERIAL',
    procurement_type: 'PURCHASE',
    replenishment_strategy: 'MAKE_TO_STOCK',
    category: '',
    uom: 'pcs',
    unit_cost: 0.00,
    unit_price: 0.00,
    reorder_point: 0.00,
    image_url: '',
    parent_template_id: '',
    barcode: '',
    color: '',
    size: ''
  });

  const [templates, setTemplates] = useState([]);
  const [errors, setErrors] = useState({});

  // Fetch templates list
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await api.get('/products/templates/list');
        setTemplates(res.data.data || []);
      } catch (err) {
        console.error('Failed to load product templates:', err);
      }
    };
    fetchTemplates();
  }, []);

  // Sync initial values when pre-fetching completes (Edit mode)
  useEffect(() => {
    if (initialValues) {
      const attrs = typeof initialValues.variant_attributes === 'string' 
        ? JSON.parse(initialValues.variant_attributes) 
        : (initialValues.variant_attributes || {});

      setForm({
        sku: initialValues.sku || '',
        name: initialValues.name || '',
        description: initialValues.description || '',
        type: initialValues.type || 'RAW_MATERIAL',
        procurement_type: initialValues.procurement_type || 'PURCHASE',
        replenishment_strategy: initialValues.replenishment_strategy || 'MAKE_TO_STOCK',
        category: initialValues.category || '',
        uom: initialValues.uom || 'pcs',
        unit_cost: initialValues.unit_cost !== undefined ? Number(initialValues.unit_cost) : 0.00,
        unit_price: initialValues.unit_price !== undefined ? Number(initialValues.unit_price) : 0.00,
        reorder_point: initialValues.reorder_point !== undefined ? Number(initialValues.reorder_point) : 0.00,
        image_url: initialValues.image_url || '',
        parent_template_id: initialValues.parent_template_id || '',
        barcode: initialValues.barcode || '',
        color: attrs.Color || '',
        size: attrs.Size || ''
      });
    }
  }, [initialValues]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const tempErrors = {};
    if (!isEdit && (!form.sku || form.sku.trim() === '')) {
      tempErrors.sku = 'SKU identifier is required.';
    } else if (!isEdit && form.sku.length > 100) {
      tempErrors.sku = 'SKU cannot exceed 100 characters.';
    }

    if (!form.name || form.name.trim() === '') {
      tempErrors.name = 'Product name is required.';
    }

    if (!form.uom || form.uom.trim() === '') {
      tempErrors.uom = 'Unit of Measure (UoM) is required.';
    }

    if (form.unit_cost < 0) {
      tempErrors.unit_cost = 'Cost cannot be negative.';
    }

    if (form.unit_price < 0) {
      tempErrors.unit_price = 'Price cannot be negative.';
    }

    if (form.reorder_point < 0) {
      tempErrors.reorder_point = 'Reorder point cannot be negative.';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    // Build variant attributes JSON
    const variant_attributes = {};
    if (form.color) variant_attributes.Color = form.color;
    if (form.size) variant_attributes.Size = form.size;

    const sanitizedData = {
      sku: form.sku,
      name: form.name,
      description: form.description,
      type: form.type,
      procurement_type: form.procurement_type,
      replenishment_strategy: form.replenishment_strategy,
      category: form.category,
      uom: form.uom,
      image_url: form.image_url,
      unit_cost: parseFloat(form.unit_cost) || 0.00,
      unit_price: parseFloat(form.unit_price) || 0.00,
      reorder_point: parseFloat(form.reorder_point) || 0.00,
      parent_template_id: form.parent_template_id || null,
      barcode: form.barcode || null,
      variant_attributes
    };

    onSubmit(sanitizedData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto rounded-xl border border-slate-900 bg-slate-950/40 p-6 backdrop-blur-md">
      <div className="grid gap-6 md:grid-cols-2">
        {/* SKU (Locked in edit mode) */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">SKU / Code *</label>
          <input
            type="text"
            name="sku"
            disabled={isEdit}
            value={form.sku}
            onChange={handleChange}
            placeholder="e.g. WOOD-LEG-101"
            className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-200 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-all ${
              isEdit ? 'bg-slate-950/60 border-slate-900 text-slate-500 cursor-not-allowed font-mono' : 'bg-slate-950/20 border-slate-800'
            }`}
          />
          {errors.sku && <p className="mt-1.5 text-xs text-red-400 font-semibold">{errors.sku}</p>}
        </div>

        {/* Product Name */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Product Name *</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="e.g. Hardwood Dining Table Leg"
            className="w-full rounded-lg border border-slate-800 bg-slate-950/20 px-3 py-2 text-sm text-slate-200 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-all"
          />
          {errors.name && <p className="mt-1.5 text-xs text-red-400 font-semibold">{errors.name}</p>}
        </div>

        {/* Product Type (Locked in edit mode) */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Product Type *</label>
          <select
            name="type"
            disabled={isEdit}
            value={form.type}
            onChange={handleChange}
            className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-300 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-all ${
              isEdit ? 'bg-slate-950/60 border-slate-900 text-slate-500 cursor-not-allowed' : 'bg-slate-950/20 border-slate-800'
            }`}
          >
            <option value="RAW_MATERIAL">Raw Material</option>
            <option value="FINISHED_GOOD">Finished Good</option>
          </select>
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Category</label>
          <input
            type="text"
            name="category"
            value={form.category}
            onChange={handleChange}
            placeholder="e.g. Components, Furniture, Hardware"
            className="w-full rounded-lg border border-slate-800 bg-slate-950/20 px-3 py-2 text-sm text-slate-200 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-all"
          />
        </div>

        {/* Procurement Type */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Procurement Type</label>
          <select
            name="procurement_type"
            value={form.procurement_type}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-800 bg-slate-950/20 px-3 py-2 text-sm text-slate-350 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-all"
          >
            <option value="PURCHASE">Purchase (Supplier Procured)</option>
            <option value="MANUFACTURE">Manufacture (In-House Build)</option>
          </select>
        </div>

        {/* Replenishment Strategy */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Replenishment Strategy</label>
          <select
            name="replenishment_strategy"
            value={form.replenishment_strategy}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-800 bg-slate-950/20 px-3 py-2 text-sm text-slate-350 focus:border-blue-600 focus:outline-none"
          >
            <option value="MAKE_TO_STOCK">Make To Stock (Reorder Point driven)</option>
            <option value="MAKE_TO_ORDER">Make To Order (Sales shortages driven)</option>
          </select>
        </div>

        {/* UoM (Unit of Measure) */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Unit of Measure (UoM) *</label>
          <input
            type="text"
            name="uom"
            value={form.uom}
            onChange={handleChange}
            placeholder="e.g. pcs, kg, box, sets"
            className="w-full rounded-lg border border-slate-800 bg-slate-950/20 px-3 py-2 text-sm text-slate-200 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-all"
          />
          {errors.uom && <p className="mt-1.5 text-xs text-red-400 font-semibold">{errors.uom}</p>}
        </div>

        {/* Reorder Point */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Reorder Point</label>
          <input
            type="number"
            name="reorder_point"
            step="0.01"
            value={form.reorder_point}
            onChange={handleChange}
            placeholder="0.00"
            className="w-full rounded-lg border border-slate-800 bg-slate-950/20 px-3 py-2 text-sm text-slate-200 focus:border-blue-600 focus:outline-none"
          />
          {errors.reorder_point && <p className="mt-1.5 text-xs text-red-400 font-semibold">{errors.reorder_point}</p>}
        </div>

        {/* Unit Cost */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Unit Cost (INR)</label>
          <input
            type="number"
            name="unit_cost"
            step="0.01"
            value={form.unit_cost}
            onChange={handleChange}
            placeholder="0.00"
            className="w-full rounded-lg border border-slate-800 bg-slate-950/20 px-3 py-2 text-sm text-slate-200 focus:border-blue-600 focus:outline-none"
          />
          {errors.unit_cost && <p className="mt-1.5 text-xs text-red-400 font-semibold">{errors.unit_cost}</p>}
        </div>

        {/* Unit Price */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Unit Price (INR)</label>
          <input
            type="number"
            name="unit_price"
            step="0.01"
            value={form.unit_price}
            onChange={handleChange}
            placeholder="0.00"
            className="w-full rounded-lg border border-slate-800 bg-slate-950/20 px-3 py-2 text-sm text-slate-200 focus:border-blue-600 focus:outline-none"
          />
          {errors.unit_price && <p className="mt-1.5 text-xs text-red-400 font-semibold">{errors.unit_price}</p>}
        </div>
      </div>

      {/* ── Enterprise Product Templates, Barcodes & Variants ── */}
      <div className="border-t border-slate-900 pt-6 space-y-6">
        <h4 className="text-sm font-bold text-blue-400 uppercase tracking-wider">Enterprise Configuration</h4>
        
        <div className="grid gap-6 md:grid-cols-2">
          {/* Base Template */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Base Product Template</label>
            <select
              name="parent_template_id"
              value={form.parent_template_id}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-800 bg-slate-950/20 px-3 py-2 text-sm text-slate-300 focus:border-blue-600 focus:outline-none transition-all"
            >
              <option value="">Create or Auto-resolve template by name</option>
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.type})</option>
              ))}
            </select>
          </div>

          {/* Barcode */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Barcode Code</label>
            <input
              type="text"
              name="barcode"
              value={form.barcode}
              onChange={handleChange}
              placeholder="e.g. 890100200300 (defaults to SKU if empty)"
              className="w-full rounded-lg border border-slate-800 bg-slate-950/20 px-3 py-2 text-sm text-slate-200 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-all font-mono"
            />
          </div>

          {/* Color Attribute */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Color Attribute</label>
            <select
              name="color"
              value={form.color}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-800 bg-slate-950/20 px-3 py-2 text-sm text-slate-300 focus:border-blue-600 focus:outline-none transition-all"
            >
              <option value="">None (Generic)</option>
              <option value="Black">Black</option>
              <option value="Brown">Brown</option>
              <option value="White">White</option>
              <option value="Beige">Beige</option>
              <option value="Grey">Grey</option>
              <option value="Natural Wood">Natural Wood</option>
            </select>
          </div>

          {/* Size Attribute */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Size Attribute</label>
            <select
              name="size"
              value={form.size}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-800 bg-slate-950/20 px-3 py-2 text-sm text-slate-300 focus:border-blue-600 focus:outline-none transition-all"
            >
              <option value="">None (Generic)</option>
              <option value="Small">Small</option>
              <option value="Medium">Medium</option>
              <option value="Large">Large</option>
              <option value="Standard">Standard</option>
              <option value="King Size">King Size</option>
              <option value="Queen Size">Queen Size</option>
            </select>
          </div>
        </div>
      </div>

      {/* Product Image URL */}
      <div className="pt-4 border-t border-slate-900">
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Image URL</label>
        <input
          type="url"
          name="image_url"
          value={form.image_url}
          onChange={handleChange}
          placeholder="https://example.com/image.jpg"
          className="w-full rounded-lg border border-slate-800 bg-slate-950/20 px-3 py-2 text-sm text-slate-200 focus:border-blue-600 focus:outline-none"
        />
        {form.image_url && (
          <div className="mt-3.5 h-28 w-28 overflow-hidden rounded-lg border border-slate-800 bg-slate-950">
            <img src={form.image_url} alt="Form preview" className="h-full w-full object-cover" onError={(e) => e.target.style.display = 'none'} />
          </div>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description</label>
        <textarea
          name="description"
          rows="3"
          value={form.description}
          onChange={handleChange}
          placeholder="Enter item details, supplier specifications, etc..."
          className="w-full rounded-lg border border-slate-800 bg-slate-950/20 px-3 py-2 text-sm text-slate-200 focus:border-blue-600 focus:outline-none"
        />
      </div>

      {/* Submit Buttons */}
      <div className="flex justify-end space-x-3.5 pt-4 border-t border-slate-900">
        <button
          type="button"
          onClick={() => navigate('/products')}
          className="px-5 py-2 rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-900 hover:text-slate-200 transition-all font-semibold text-sm active:scale-95"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 font-semibold text-sm shadow-md shadow-blue-900/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving changes...' : isEdit ? 'Update Product' : 'Create Product'}
        </button>
      </div>
    </form>
  );
};

export default ProductForm;
