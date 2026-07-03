import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { 
  ArrowLeftRight, 
  Plus, 
  Search, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  AlertTriangle 
} from 'lucide-react';

const TransfersPage = () => {
  const { user, hasRole } = useAuth();
  const canApprove = hasRole(['Admin', 'Business Owner']);
  const canRequest = hasRole(['Admin', 'Inventory Manager']);

  // State Management
  const [transfers, setTransfers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  // Selected Transfer Detail
  const [selectedTransfer, setSelectedTransfer] = useState(null);

  // New Transfer Request Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [sourceWhId, setSourceWhId] = useState('');
  const [destWhId, setDestWhId] = useState('');
  const [reason, setReason] = useState('');
  const [transferItems, setTransferItems] = useState([{ product_id: '', quantity: 1 }]);
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Load Data
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [transRes, whRes, prodRes] = await Promise.all([
        api.get('/transfers'),
        api.get('/warehouses'),
        api.get('/products?limit=100')
      ]);
      setTransfers(transRes.data.data.transfers || []);
      setWarehouses(whRes.data.data.warehouses.filter(w => w.is_active) || []);
      setProducts(prodRes.data.data.products || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load transfer ledger history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle items array in form
  const addTransferItemField = () => {
    setTransferItems([...transferItems, { product_id: '', quantity: 1 }]);
  };

  const removeTransferItemField = (index) => {
    const items = [...transferItems];
    items.splice(index, 1);
    setTransferItems(items);
  };

  const handleItemChange = (index, field, value) => {
    const items = [...transferItems];
    items[index][field] = value;
    setTransferItems(items);
  };

  // Submit transfer request
  const handleSubmitTransfer = async (e) => {
    e.preventDefault();
    setFormError(null);

    // Basic Validation
    if (sourceWhId === destWhId) {
      setFormError('Source and Destination Warehouses must be different.');
      return;
    }

    const invalidItem = transferItems.some(item => !item.product_id || parseFloat(item.quantity) <= 0);
    if (invalidItem) {
      setFormError('Please select valid products and enter quantities greater than 0.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/transfers', {
        source_warehouse_id: sourceWhId,
        destination_warehouse_id: destWhId,
        reason,
        items: transferItems.map(item => ({
          product_id: item.product_id,
          quantity: parseFloat(item.quantity)
        }))
      });
      setModalOpen(false);
      loadData();
      // Reset form
      setSourceWhId('');
      setDestWhId('');
      setReason('');
      setTransferItems([{ product_id: '', quantity: 1 }]);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Submission failed. Verify stock availability.');
    } finally {
      setSubmitting(false);
    }
  };

  // Status transitions
  const handleApprove = async (id) => {
    if (!window.confirm('Are you sure you want to approve this stock transfer? Inventory will move instantly.')) return;
    try {
      await api.put(`/transfers/${id}/approve`);
      loadData();
      if (selectedTransfer?.id === id) {
        const updated = await api.get(`/transfers/${id}`);
        setSelectedTransfer(updated.data.data);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Approval process failed.');
    }
  };

  const handleReject = async (id) => {
    const remarks = window.prompt('Enter rejection remarks:');
    if (remarks === null) return; // cancelled prompt
    try {
      await api.put(`/transfers/${id}/reject`, { rejection_remarks: remarks });
      loadData();
      if (selectedTransfer?.id === id) {
        const updated = await api.get(`/transfers/${id}`);
        setSelectedTransfer(updated.data.data);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Rejection failed.');
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this transfer request?')) return;
    try {
      await api.put(`/transfers/${id}/cancel`);
      loadData();
      if (selectedTransfer?.id === id) {
        const updated = await api.get(`/transfers/${id}`);
        setSelectedTransfer(updated.data.data);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Cancellation failed.');
    }
  };

  const filteredTransfers = transfers.filter(t => 
    t.transfer_number.toLowerCase().includes(search.toLowerCase()) ||
    t.source_warehouse_name.toLowerCase().includes(search.toLowerCase()) ||
    t.destination_warehouse_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <ArrowLeftRight className="text-indigo-400 h-8 w-8" />
            Stock Transfers
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Initiate, approve, and track physical inventory transfers across warehouses with dual stock-ledger audit controls.
          </p>
        </div>
        {canRequest && (
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-medium px-4 py-2 rounded-lg shadow-lg hover:shadow-indigo-500/20 transition-all duration-300 transform hover:-translate-y-0.5"
          >
            <Plus className="h-5 w-5" />
            Request Transfer
          </button>
        )}
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Transfer Requests List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-850 rounded-xl p-4 shadow-md flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-400" />
                Transfer Requests Ledger
              </h2>
              <div className="relative w-48">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="h-4 w-4 text-slate-500" />
                </span>
                <input
                  type="text"
                  placeholder="Search transfers..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-950/65 border border-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-800/80 bg-slate-950/20">
              {loading ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                </div>
              ) : error ? (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg text-sm flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  {error}
                </div>
              ) : filteredTransfers.length === 0 ? (
                <div className="text-center text-slate-500 py-12">No stock transfers found.</div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900/60 border-b border-slate-850 text-slate-400 font-semibold uppercase">
                      <th className="px-4 py-3">Req Number</th>
                      <th className="px-4 py-3">Route</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850/60 text-slate-300">
                    {filteredTransfers.map((t) => (
                      <tr 
                        key={t.id} 
                        onClick={() => setSelectedTransfer(t)}
                        className={`hover:bg-slate-900/20 transition-colors cursor-pointer ${
                          selectedTransfer?.id === t.id ? 'bg-slate-800/20 text-white' : ''
                        }`}
                      >
                        <td className="px-4 py-3 font-mono font-bold text-indigo-400">{t.transfer_number}</td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-slate-200">{t.source_warehouse_code}</span>
                          <span className="text-slate-500 mx-1.5">➔</span>
                          <span className="font-medium text-slate-200">{t.destination_warehouse_code}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            t.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            t.status === 'REJECTED' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                            t.status === 'CANCELLED' ? 'bg-slate-800 text-slate-400 border-slate-700' :
                            'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-400">
                          {new Date(t.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Selected Transfer Details Panel */}
        <div className="lg:col-span-5">
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-850 rounded-xl p-5 shadow-md h-full flex flex-col">
            <h2 className="text-base font-bold text-white mb-4">
              Transfer Request Details
            </h2>

            {selectedTransfer ? (
              <div className="space-y-5 flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  {/* Summary Info */}
                  <div className="flex justify-between items-center bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Number</span>
                      <h3 className="font-mono text-lg font-bold text-indigo-400">{selectedTransfer.transfer_number}</h3>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block text-right">Status</span>
                      <span className={`px-2.5 py-1 rounded text-xs font-semibold inline-block border mt-0.5 ${
                        selectedTransfer.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        selectedTransfer.status === 'REJECTED' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                        selectedTransfer.status === 'CANCELLED' ? 'bg-slate-800 text-slate-400 border-slate-700' :
                        'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {selectedTransfer.status}
                      </span>
                    </div>
                  </div>

                  {/* Route details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Source Warehouse</span>
                      <p className="text-sm font-medium text-white mt-0.5">{selectedTransfer.source_warehouse_name}</p>
                      <span className="text-xs text-slate-500 font-mono">({selectedTransfer.source_warehouse_code})</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Destination Warehouse</span>
                      <p className="text-sm font-medium text-white mt-0.5">{selectedTransfer.destination_warehouse_name}</p>
                      <span className="text-xs text-slate-500 font-mono">({selectedTransfer.destination_warehouse_code})</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Transfer Reason</span>
                    <p className="text-xs text-slate-200 mt-1 italic">"{selectedTransfer.reason || 'No reason specified.'}"</p>
                  </div>

                  {selectedTransfer.rejection_remarks && (
                    <div className="bg-rose-500/5 border border-rose-500/10 text-rose-400 p-3 rounded-lg text-xs">
                      <strong>Rejection Reason:</strong> {selectedTransfer.rejection_remarks}
                    </div>
                  )}

                  {/* Transfer Items */}
                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mb-2">Request Items List</span>
                    <div className="border border-slate-800/80 rounded-lg overflow-hidden bg-slate-950/20">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-900/60 border-b border-slate-850 text-slate-400 font-semibold">
                            <th className="px-3 py-2">Item SKU</th>
                            <th className="px-3 py-2">Product Name</th>
                            <th className="px-3 py-2 text-right">Transfer Qty</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850/60 text-slate-300">
                          {selectedTransfer.items?.map((item) => (
                            <tr key={item.id}>
                              <td className="px-3 py-2 font-mono font-semibold text-slate-200">{item.product_sku}</td>
                              <td className="px-3 py-2 text-slate-400">{item.product_name}</td>
                              <td className="px-3 py-2 text-right text-white font-bold">{parseFloat(item.quantity)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Workflow Actions */}
                {selectedTransfer.status === 'PENDING' && (
                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-800/60">
                    {canApprove && (
                      <>
                        <button
                          onClick={() => handleApprove(selectedTransfer.id)}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-3 rounded-lg text-xs transition"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Approve Move
                        </button>
                        <button
                          onClick={() => handleReject(selectedTransfer.id)}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold py-2 px-3 rounded-lg text-xs transition"
                        >
                          <XCircle className="h-4 w-4" />
                          Reject Request
                        </button>
                      </>
                    )}
                    {canRequest && (
                      <button
                        onClick={() => handleCancel(selectedTransfer.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2 px-3 rounded-lg text-xs border border-slate-700 transition"
                      >
                        <Clock className="h-4 w-4" />
                        Cancel Request
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-500 text-sm py-20 text-center">
                Select a transfer request from the left to view details and action authorization.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Request Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm transition-all duration-300">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-950/40 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ArrowLeftRight className="h-5 w-5 text-indigo-450" />
                Initiate Stock Transfer
              </h3>
              <button 
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white transition rounded p-1 hover:bg-slate-800"
              >
                &times;
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitTransfer}>
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                {formError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    {formError}
                  </div>
                )}

                {/* Warehouse Dropdowns */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Source Facility *
                    </label>
                    <select
                      required
                      value={sourceWhId}
                      onChange={(e) => setSourceWhId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">Select source</option>
                      {warehouses.map(w => (
                        <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Destination Facility *
                    </label>
                    <select
                      required
                      value={destWhId}
                      onChange={(e) => setDestWhId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">Select destination</option>
                      {warehouses.map(w => (
                        <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Transfer Reason *
                  </label>
                  <input
                    type="text"
                    required
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. Stock balancing / manufacturing order support"
                  />
                </div>

                {/* Items list */}
                <div className="space-y-3 pt-2">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Transfer Items List
                    </label>
                    <button
                      type="button"
                      onClick={addTransferItemField}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition"
                    >
                      + Add Item
                    </button>
                  </div>

                  {transferItems.map((item, index) => (
                    <div key={index} className="flex gap-3 items-center bg-slate-950/30 p-3 rounded-lg border border-slate-850">
                      <div className="flex-1">
                        <select
                          required
                          value={item.product_id}
                          onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                        >
                          <option value="">Select product SKU</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="w-24">
                        <input
                          type="number"
                          required
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 text-center focus:outline-none focus:border-indigo-500"
                          placeholder="Qty"
                        />
                      </div>

                      {transferItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTransferItemField(index)}
                          className="text-slate-500 hover:text-red-400 transition"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="px-6 py-4 bg-slate-950/40 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium px-4 py-2 rounded-lg text-sm transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-medium px-4 py-2 rounded-lg text-sm shadow-md transition disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransfersPage;
