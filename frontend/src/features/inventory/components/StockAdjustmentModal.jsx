import React, { useState, useEffect } from 'react';
import { X, Settings2, Info } from 'lucide-react';

const StockAdjustmentModal = ({ isOpen, onClose, onSubmit, product, isSubmitting }) => {
  const [qtyChange, setQtyChange] = useState('');
  const [referenceType, setReferenceType] = useState('MANUAL');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setQtyChange('');
      setReferenceType('MANUAL');
      setReason('');
      setNotes('');
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen || !product) return null;

  const currentOnHand = parseFloat(product.qty_on_hand || 0);
  const currentReserved = parseFloat(product.qty_reserved || 0);
  const maxDeduction = currentOnHand - currentReserved;

  const handleQtyChange = (e) => {
    const value = e.target.value;
    setQtyChange(value);
    setError(null);
  };

  const validate = () => {
    const change = parseFloat(qtyChange);
    if (isNaN(change) || change === 0) {
      setError('Quantity change must be a non-zero decimal number.');
      return false;
    }

    if (change < 0 && Math.abs(change) > maxDeduction) {
      setError(
        `Insufficient stock: Deduction of ${Math.abs(
          change
        )} exceeds maximum available stock to adjust (${maxDeduction} units).`
      );
      return false;
    }

    if (!reason || reason.trim() === '') {
      setError('Reason description is required to document stock adjustments.');
      return false;
    }

    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      product_id: product.product_id,
      qty_change: parseFloat(qtyChange),
      reference_type: referenceType,
      reason: reason.trim(),
      notes: notes.trim() || null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-900 bg-slate-900/90 backdrop-blur-xl p-6 shadow-2xl animate-in fade-in scale-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3.5 mb-5">
          <div className="flex items-center space-x-2.5 text-white">
            <Settings2 className="h-5 w-5 text-blue-500" />
            <h3 className="text-base font-bold">Manual Stock Adjustment</h3>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-500 hover:text-slate-350 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {/* Product Overview Profile */}
          <div className="rounded-lg bg-slate-950/40 p-4 border border-slate-850 space-y-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Target Product</p>
            <div className="flex justify-between items-baseline">
              <span className="text-sm font-semibold text-slate-200">{product.name}</span>
              <span className="font-mono text-xs text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-850">{product.sku}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs pt-2 border-t border-slate-900 mt-2 font-medium text-slate-450">
              <div>On Hand: <span className="font-mono text-slate-200 font-semibold">{currentOnHand}</span></div>
              <div>Reserved: <span className="font-mono text-slate-200 font-semibold">{currentReserved}</span></div>
              <div>Available: <span className="font-mono text-emerald-400 font-semibold">{maxDeduction}</span></div>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-950/40 bg-red-950/20 p-3 text-xs font-semibold text-red-400">
              {error}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Quantity Change Input */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Quantity Change (+/-)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={qtyChange}
                onChange={handleQtyChange}
                placeholder="e.g. +10 or -5"
                className="w-full rounded-lg border border-slate-800 bg-slate-950/20 px-3 py-2 text-sm text-slate-200 focus:border-blue-600 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Specify prefix: + (receive), - (deduct)</span>
            </div>

            {/* Reference Type Select */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Reference Type
              </label>
              <select
                value={referenceType}
                onChange={(e) => setReferenceType(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950/20 px-3 py-2 text-sm text-slate-350 focus:border-blue-600 focus:outline-none"
              >
                <option value="MANUAL">MANUAL (Cycle Count)</option>
                <option value="SALES_ORDER">SALES ORDER</option>
                <option value="PURCHASE_ORDER">PURCHASE ORDER</option>
                <option value="MANUFACTURING_ORDER">MANUFACTURING ORDER</option>
              </select>
            </div>
          </div>

          {/* Reason Input */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Adjustment Reason
            </label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError(null);
              }}
              placeholder="e.g. Stock damage write-off, manual inventory correction"
              className="w-full rounded-lg border border-slate-800 bg-slate-950/20 px-3 py-2 text-sm text-slate-200 focus:border-blue-600 focus:outline-none"
            />
          </div>

          {/* Notes Input */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Notes
            </label>
            <textarea
              rows="2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional references, batch serial numbers, etc..."
              className="w-full rounded-lg border border-slate-800 bg-slate-950/20 px-3 py-2 text-sm text-slate-200 focus:border-blue-600 focus:outline-none"
            />
          </div>

          {/* Action buttons */}
          <div className="flex w-full space-x-3.5 pt-4 border-t border-slate-850 mt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 text-xs font-bold rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-900 hover:text-slate-200 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md shadow-blue-900/25 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting Adjustment...' : 'Record Adjustment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockAdjustmentModal;
