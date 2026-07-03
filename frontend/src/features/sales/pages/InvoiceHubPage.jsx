import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { 
  Receipt, 
  Plus, 
  Search, 
  FileDown, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock,
  ExternalLink 
} from 'lucide-react';

const InvoiceHubPage = () => {
  const { hasRole } = useAuth();
  const isSales = hasRole(['Admin', 'Sales User', 'Business Owner']);
  const isPurchase = hasRole(['Admin', 'Purchase User', 'Business Owner']);

  // Tab State
  const [activeTab, setActiveTab] = useState('sales'); // 'sales' | 'purchase'

  // Lists Data
  const [salesInvoices, setSalesInvoices] = useState([]);
  const [purchaseInvoices, setPurchaseInvoices] = useState([]);
  const [orders, setOrders] = useState([]); // List of orders to generate invoice for
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  // Invoice Generation Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [taxRate, setTaxRate] = useState(18.00);
  const [discountAmount, setDiscountAmount] = useState(0.00);
  const [dueDate, setDueDate] = useState('');
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch Invoices
  const fetchInvoices = async () => {
    setLoading(true);
    setError(null);
    try {
      const [salesRes, purchRes] = await Promise.all([
        api.get('/invoices/sales'),
        api.get('/invoices/purchase')
      ]);
      setSalesInvoices(salesRes.data.data.invoices || []);
      setPurchaseInvoices(purchRes.data.data.invoices || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to retrieve invoice histories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  // Fetch Approved Orders when modal opens
  const handleOpenGenerate = async () => {
    setFormError(null);
    setSelectedOrderId('');
    setTaxRate(18.00);
    setDiscountAmount(0.00);
    
    // Set default due date to 30 days from now
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 30);
    setDueDate(nextMonth.toISOString().slice(0, 10));

    try {
      if (activeTab === 'sales') {
        const res = await api.get('/sales-orders?limit=100');
        // Filter Sales Orders that are APPROVED or COMPLETED and do not have an invoice
        // For simplicity, let's allow selecting any APPROVED sales orders
        const approvedOrders = res.data.data.salesOrders.filter(so => so.status === 'APPROVED') || [];
        setOrders(approvedOrders);
      } else {
        const res = await api.get('/purchase-orders?limit=100');
        // Filter Purchase Orders that are RECEIVED
        const approvedOrders = res.data.data.purchaseOrders.filter(po => po.status === 'RECEIVED') || [];
        setOrders(approvedOrders);
      }
      setModalOpen(true);
    } catch (err) {
      alert('Failed to load eligible orders: ' + (err.response?.data?.message || err.message));
    }
  };

  // Submit invoice generation
  const handleSubmitInvoice = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedOrderId) {
      setFormError('Please select a reference order.');
      return;
    }

    setSubmitting(true);
    try {
      if (activeTab === 'sales') {
        await api.post('/invoices/sales', {
          sales_order_id: selectedOrderId,
          tax_rate: parseFloat(taxRate),
          discount_amount: parseFloat(discountAmount),
          due_date: dueDate
        });
      } else {
        await api.post('/invoices/purchase', {
          purchase_order_id: selectedOrderId,
          tax_rate: parseFloat(taxRate),
          discount_amount: parseFloat(discountAmount),
          due_date: dueDate
        });
      }
      setModalOpen(false);
      fetchInvoices();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Invoice generation failed. Verify if invoice already exists.');
    } finally {
      setSubmitting(false);
    }
  };

  // Trigger Backend PDF download
  const downloadPDF = (type, invoiceId, invoiceNum) => {
    const token = localStorage.getItem('erp_token');
    const url = `${import.meta.env.VITE_API_URL || 'http://localhost:5050/api'}/invoices/${type.toLowerCase()}/${invoiceId}/pdf`;
    
    // Create hidden anchor to trigger native stream download
    const link = document.createElement('a');
    link.href = url;
    // Set headers is tricky via direct href, but wait, the backend does not require auth if we pass token in query, or we can fetch it via axios and download the blob!
    // Let's fetch it via Axios blob request to ensure Authorization header is attached!
    setLoading(true);
    api.get(`/invoices/${type.toLowerCase()}/${invoiceId}/pdf`, { responseType: 'blob' })
      .then((response) => {
        const file = new Blob([response.data], { type: 'application/pdf' });
        const fileURL = URL.createObjectURL(file);
        const pdfLink = document.createElement('a');
        pdfLink.href = fileURL;
        pdfLink.setAttribute('download', `Invoice-${invoiceNum}.pdf`);
        document.body.appendChild(pdfLink);
        pdfLink.click();
        document.body.removeChild(pdfLink);
        setLoading(false);
      })
      .catch((err) => {
        alert('Failed to download PDF: ' + err.message);
        setLoading(false);
      });
  };

  const activeInvoices = activeTab === 'sales' ? salesInvoices : purchaseInvoices;
  
  const filteredInvoices = activeInvoices.filter(inv => 
    inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
    inv.order_number.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <Receipt className="text-emerald-400 h-8 w-8" />
            Billing & Invoices
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Generate and export professional GST-compliant invoices for commercial orders and manage outstanding balances.
          </p>
        </div>

        {((activeTab === 'sales' && isSales) || (activeTab === 'purchase' && isPurchase)) && (
          <button
            onClick={handleOpenGenerate}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium px-4 py-2 rounded-lg shadow-lg hover:shadow-emerald-500/20 transition-all duration-300 transform hover:-translate-y-0.5"
          >
            <Plus className="h-5 w-5" />
            Generate Invoice
          </button>
        )}
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => { setActiveTab('sales'); setSearch(''); }}
          className={`px-6 py-3 font-semibold text-sm transition border-b-2 ${
            activeTab === 'sales'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Customer Sales Invoices
        </button>
        <button
          onClick={() => { setActiveTab('purchase'); setSearch(''); }}
          className={`px-6 py-3 font-semibold text-sm transition border-b-2 ${
            activeTab === 'purchase'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Supplier Purchase Invoices
        </button>
      </div>

      {/* Search Bar & List */}
      <div className="bg-slate-900/40 backdrop-blur-md border border-slate-850 rounded-xl p-5 shadow-md">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <h2 className="text-base font-bold text-white uppercase tracking-wider">
            {activeTab === 'sales' ? 'Sales Billing History' : 'Purchase Billing History'}
          </h2>
          <div className="relative w-64">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-slate-500" />
            </span>
            <input
              type="text"
              placeholder="Search invoices or order numbers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950/60 border border-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all"
            />
          </div>
        </div>

        {/* Invoice Table */}
        <div className="overflow-x-auto rounded-lg border border-slate-800/80 bg-slate-950/20">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg text-sm flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              {error}
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center text-slate-500 py-16">No invoices created under this category.</div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900/60 border-b border-slate-850 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="px-4 py-3">Invoice No</th>
                  <th className="px-4 py-3">Order Ref</th>
                  <th className="px-4 py-3 text-right">Grand Total</th>
                  <th className="px-4 py-3 text-right">Balance Due</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3">Payment Status</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/60 text-slate-300">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-900/20 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-emerald-400">{inv.invoice_number}</td>
                    <td className="px-4 py-3 font-mono text-slate-400">{inv.order_number}</td>
                    <td className="px-4 py-3 text-right font-medium text-white">
                      Rs {new Intl.NumberFormat('en-IN').format(parseFloat(inv.grand_total))}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`${parseFloat(inv.balance_due) > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                        Rs {new Intl.NumberFormat('en-IN').format(parseFloat(inv.balance_due))}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{new Date(inv.due_date).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        inv.payment_status === 'PAID' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        inv.payment_status === 'PARTIAL' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                        {inv.payment_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => downloadPDF(activeTab, inv.id, inv.invoice_number)}
                        className="inline-flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium px-2.5 py-1 rounded transition text-[11px]"
                      >
                        <FileDown className="h-3.5 w-3.5" />
                        PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Generation Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm transition-all duration-300">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-950/40 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Receipt className="h-5 w-5 text-emerald-400" />
                Generate {activeTab === 'sales' ? 'Sales' : 'Purchase'} Invoice
              </h3>
              <button 
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white transition rounded p-1 hover:bg-slate-800"
              >
                &times;
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitInvoice}>
              <div className="p-6 space-y-4">
                {formError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    {formError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Select Reference Order *
                  </label>
                  <select
                    required
                    value={selectedOrderId}
                    onChange={(e) => setSelectedOrderId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Choose order</option>
                    {orders.map(o => (
                      <option key={o.id} value={o.id}>
                        {o.order_number} — {o.customer_name || o.vendor_name} (Rs {parseFloat(o.total_amount).toFixed(2)})
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {activeTab === 'sales' 
                      ? 'Only Approved orders are eligible for invoicing.'
                      : 'Only Received Purchase Orders are eligible for invoicing.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      GST Rate (%) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      max="100"
                      step="0.01"
                      value={taxRate}
                      onChange={(e) => setTaxRate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Discount Amount *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={discountAmount}
                      onChange={(e) => setDiscountAmount(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
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
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium px-4 py-2 rounded-lg text-sm shadow-md transition disabled:opacity-50"
                >
                  {submitting ? 'Generating...' : 'Create Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceHubPage;
