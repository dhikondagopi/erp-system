import React from 'react';
import { X, Layers, Settings, ShieldAlert, BadgeDollarSign, Tag, Info, Calendar } from 'lucide-react';
import { useProductDetailsQuery } from '../hooks/useProducts';

const ProductDetailsModal = ({ isOpen, onClose, productId }) => {
  const { data: product, isLoading, error } = useProductDetailsQuery(productId);

  if (!isOpen) return null;

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Box */}
      <div className="relative w-full max-w-lg border-l border-slate-900 bg-slate-950/95 h-full p-6 shadow-2xl overflow-y-auto flex flex-col justify-between z-10 animate-in slide-in-from-right duration-200">
        {/* Top bar header */}
        <div className="flex items-center justify-between border-b border-slate-900 pb-4 mb-6">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Product Profile</span>
            <h2 className="text-lg font-bold text-white mt-0.5">Details Overview</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-880 bg-slate-900/40 text-slate-400 hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Viewport */}
        <div className="flex-1 space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-blue-500"></div>
              <p className="text-xs text-slate-500 font-semibold">Loading product specifications...</p>
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-950/40 bg-red-950/20 p-4 text-center text-xs font-semibold text-red-400">
              Failed to retrieve product details.
            </div>
          ) : product ? (
            <>
              {/* Product Image Section */}
              <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-900 border border-slate-900 shadow-md">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-600 bg-slate-950 font-bold text-lg uppercase tracking-wider">
                    {product.sku.substring(0, 3)}
                  </div>
                )}
                
                <div className="absolute bottom-3 left-3 bg-slate-950/80 border border-slate-850 px-3 py-1 rounded-lg text-xs font-mono font-bold text-slate-200">
                  {product.sku}
                </div>
              </div>

              {/* Title & Category Info */}
              <div className="space-y-1">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wide">
                  {product.category || 'Uncategorized'}
                </span>
                <h3 className="text-xl font-extrabold text-white">{product.name}</h3>
                {product.description && (
                  <p className="text-xs text-slate-400 leading-relaxed pt-2">
                    {product.description}
                  </p>
                )}
              </div>

              {/* Operational Metadata Fields */}
              <div className="grid grid-cols-2 gap-4 border-t border-b border-slate-900 py-6 text-xs">
                {/* Type */}
                <div className="flex items-start space-x-3">
                  <Layers className="h-4.5 w-4.5 text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-650 uppercase tracking-wide">Product Type</p>
                    <span className={`inline-block mt-1.5 rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                      product.type === 'RAW_MATERIAL' ? 'bg-amber-950/30 text-amber-400 border border-amber-900/10' : 'bg-emerald-950/30 text-emerald-400 border border-emerald-900/10'
                    }`}>
                      {product.type === 'RAW_MATERIAL' ? 'Raw Material' : 'Finished Good'}
                    </span>
                  </div>
                </div>

                {/* Procurement */}
                <div className="flex items-start space-x-3">
                  <Settings className="h-4.5 w-4.5 text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-650 uppercase tracking-wide">Procurement Type</p>
                    <span className={`inline-block mt-1.5 rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                      product.procurement_type === 'PURCHASE' ? 'bg-blue-950/30 text-blue-400 border border-blue-900/10' : 'bg-purple-950/30 text-purple-400 border border-purple-900/10'
                    }`}>
                      {product.procurement_type === 'PURCHASE' ? 'Purchase' : 'Manufacture'}
                    </span>
                  </div>
                </div>

                {/* Replenishment */}
                <div className="flex items-start space-x-3">
                  <Info className="h-4.5 w-4.5 text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-650 uppercase tracking-wide">Replenishment Policy</p>
                    <p className="text-slate-300 font-semibold mt-1">
                      {product.replenishment_strategy.replace(/_/g, ' ')}
                    </p>
                  </div>
                </div>

                {/* UoM */}
                <div className="flex items-start space-x-3">
                  <Info className="h-4.5 w-4.5 text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-650 uppercase tracking-wide">Unit of Measure (UoM)</p>
                    <p className="text-slate-350 font-mono mt-1 font-semibold uppercase">
                      {product.uom}
                    </p>
                  </div>
                </div>
              </div>

              {/* Variant Attributes Section */}
              {product.variant_attributes && Object.entries(typeof product.variant_attributes === 'string' ? JSON.parse(product.variant_attributes) : product.variant_attributes).length > 0 && (
                <div className="space-y-2 border-b border-slate-900 pb-4">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Variant Specifications</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(typeof product.variant_attributes === 'string' ? JSON.parse(product.variant_attributes) : product.variant_attributes).map(([key, val]) => (
                      <span key={key} className="bg-slate-900 border border-slate-800 text-slate-300 px-3 py-1 rounded-lg text-xs font-medium">
                        <strong className="text-cyan-400 mr-1">{key}:</strong> {val}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Barcode & QR Code Section */}
              <div className="rounded-xl border border-slate-900 bg-slate-950/40 p-4 space-y-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Barcode & QR Scanner Codes</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Barcode Card */}
                  <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-850 text-center flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Code 128 Barcode</span>
                      <div className="bg-white p-2 rounded flex justify-center items-center min-h-[60px]">
                        <img
                          src={`https://barcodeapi.org/api/128/${product.barcode || product.sku}`}
                          alt="Code 128 Barcode"
                          className="max-h-12 w-full object-contain"
                        />
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 mt-2 block">{product.barcode || product.sku}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const win = window.open('', '_blank');
                        win.document.write(`
                          <div style="text-align:center;padding:40px;font-family:sans-serif;">
                            <h2>Shiv Furniture Works - Barcode Tag</h2>
                            <h3>Product: ${product.name} (${product.sku})</h3>
                            <img src="https://barcodeapi.org/api/128/${product.barcode || product.sku}" style="max-width:300px;" />
                            <p style="font-family:monospace;font-size:18px;margin-top:10px;">${product.barcode || product.sku}</p>
                            <script>window.onload = function() { window.print(); window.close(); }</script>
                          </div>
                        `);
                        win.document.close();
                      }}
                      className="mt-3 text-[10px] font-semibold text-cyan-400 hover:text-cyan-300 transition"
                    >
                      Print Label
                    </button>
                  </div>

                  {/* QR Code Card */}
                  <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-850 text-center flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">ERP Product Link QR</span>
                      <div className="bg-white p-2 rounded flex justify-center items-center">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(window.location.origin + '/products/' + product.id)}`}
                          alt="Product QR Link"
                          className="h-16 w-16"
                        />
                      </div>
                      <span className="text-[10px] font-mono text-slate-550 mt-2 block truncate">Scan to open detail</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const win = window.open('', '_blank');
                        win.document.write(`
                          <div style="text-align:center;padding:40px;font-family:sans-serif;">
                            <h2>Shiv Furniture Works - QR Tag</h2>
                            <h3>Product: ${product.name} (${product.sku})</h3>
                            <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.origin + '/products/' + product.id)}" />
                            <p style="font-size:12px;color:#666;margin-top:10px;">Scan to open in ERP catalog</p>
                            <script>window.onload = function() { window.print(); window.close(); }</script>
                          </div>
                        `);
                        win.document.close();
                      }}
                      className="mt-3 text-[10px] font-semibold text-cyan-400 hover:text-cyan-300 transition"
                    >
                      Print Label
                    </button>
                  </div>
                </div>
              </div>

              {/* Cost specifications */}
              <div className="rounded-xl border border-slate-900 bg-slate-950/30 p-4.5 space-y-3.5">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pricing and Reorder points</h4>
                
                <div className="grid grid-cols-3 gap-4 text-xs font-semibold">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1">
                      <BadgeDollarSign className="h-3 w-3 text-slate-500" /> Cost
                    </p>
                    <p className="font-mono text-slate-200 text-sm">{formatCurrency(product.unit_cost)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1">
                      <Tag className="h-3 w-3 text-slate-500" /> Price
                    </p>
                    <p className="font-mono text-slate-200 text-sm">{formatCurrency(product.unit_price)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1">
                      <ShieldAlert className="h-3 w-3 text-slate-550" /> Alert Level
                    </p>
                    <p className="font-mono text-slate-250 text-sm">
                      {product.reorder_point} <span className="text-[9px] text-slate-500 font-sans uppercase font-medium">{product.uom}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Audit/Time details */}
              <div className="space-y-2 pt-2 border-t border-slate-900 text-[10px] text-slate-500 font-medium">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Created: {formatDate(product.created_at)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Updated: {formatDate(product.updated_at)}</span>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsModal;
