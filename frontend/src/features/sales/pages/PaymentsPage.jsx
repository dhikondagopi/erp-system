import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { 
  CreditCard, 
  Plus, 
  Search, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  FileText, 
  AlertTriangle 
} from 'lucide-react';

const PaymentsPage = () => {
  const { user } = useAuth();

  // State Management
  const [payments, setPayments] = useState([]);
  const [unpaidInvoices, setUnpaidInvoices] = useState([]);
  const [stats, setStats] = useState({ totalReceivables: 0, totalPayables: 0, collectedThisMonth: 0, paidThisMonth: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  // Log Payment Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [invoiceType, setInvoiceType] = useState('SALES'); // 'SALES' | 'PURCHASE'
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Load Data
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [payRes, statsRes] = await Promise.all([
        api.get('/payments'),
        api.get('/payments/analytics/overview')
      ]);
      setPayments(payRes.data.data.payments || []);
      setStats(statsRes.data.data || { totalReceivables: 0, totalPayables: 0, collectedThisMonth: 0, paidThisMonth: 0 });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to retrieve payments history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Fetch Unpaid Invoices based on selected Invoice Type
  useEffect(() => {
    if (!modalOpen) return;

    const fetchInvoices = async () => {
      setSelectedInvoiceId('');
      try {
        if (invoiceType === 'SALES') {
          const res = await api.get('/invoices/sales');
          const unpaid = res.data.data.invoices.filter(inv => parseFloat(inv.balance_due) > 0) || [];
          setUnpaidInvoices(unpaid);
        } else {
          const res = await api.get('/invoices/purchase');
          const unpaid = res.data.data.invoices.filter(inv => parseFloat(inv.balance_due) > 0) || [];
          setUnpaidInvoices(unpaid);
        }
      } catch (err) {
        console.error('Failed to fetch unpaid invoices list:', err);
      }
    };

    fetchInvoices();
  }, [invoiceType, modalOpen]);

  // Submit payment logging
  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedInvoiceId) {
      setFormError('Please select an invoice.');
      return;
    }

    const payVal = parseFloat(amount);
    if (isNaN(payVal) || payVal <= 0) {
      setFormError('Please enter a payment amount greater than 0.');
      return;
    }

    const selectedInv = unpaidInvoices.find(inv => inv.id === selectedInvoiceId);
    if (selectedInv && payVal > parseFloat(selectedInv.balance_due)) {
      setFormError(`Payment amount cannot exceed the balance due of Rs ${selectedInv.balance_due}`);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        invoice_type: invoiceType,
        payment_method: paymentMethod,
        amount: payVal,
        notes
      };

      if (invoiceType === 'SALES') {
        payload.sales_invoice_id = selectedInvoiceId;
      } else {
        payload.purchase_invoice_id = selectedInvoiceId;
      }

      await api.post('/payments', payload);
      setModalOpen(false);
      loadData();
      
      // Reset form
      setAmount('');
      setNotes('');
    } catch (err) {
      setFormError(err.response?.data?.message || 'Logging payment failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPayments = payments.filter(p => 
    p.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
    p.payment_method.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <CreditCard className="text-violet-400 h-8 w-8" />
            Financial Payments
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Track corporate cash inflows, process disbursements to vendors, and manage accounts receivable and payable lists.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-violet-500 to-indigo-650 hover:from-violet-600 hover:to-indigo-750 text-white font-medium px-4 py-2 rounded-lg shadow-lg hover:shadow-violet-500/20 transition-all duration-300 transform hover:-translate-y-0.5"
        >
          <Plus className="h-5 w-5" />
          Log Transaction
        </button>
      </div>

      {/* Finance Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        {/* Receivables */}
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl p-5 shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Accounts Receivable</p>
              <h3 className="text-xl font-bold text-emerald-400 mt-1">
                Rs {new Intl.NumberFormat('en-IN').format(stats.totalReceivables || 0)}
              </h3>
            </div>
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Payables */}
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl p-5 shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Accounts Payable</p>
              <h3 className="text-xl font-bold text-rose-450 mt-1">
                Rs {new Intl.NumberFormat('en-IN').format(stats.totalPayables || 0)}
              </h3>
            </div>
            <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-lg">
              <TrendingDown className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Inflow Month */}
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl p-5 shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Inflow This Month</p>
              <h3 className="text-xl font-bold text-white mt-1">
                Rs {new Intl.NumberFormat('en-IN').format(stats.collectedThisMonth || 0)}
              </h3>
            </div>
            <div className="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-lg">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Outflow Month */}
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl p-5 shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Outflow This Month</p>
              <h3 className="text-xl font-bold text-slate-200 mt-1">
                Rs {new Intl.NumberFormat('en-IN').format(stats.paidThisMonth || 0)}
              </h3>
            </div>
            <div className="p-2.5 bg-slate-800 text-slate-400 rounded-lg">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Payments Ledger List */}
      <div className="bg-slate-900/40 backdrop-blur-md border border-slate-850 rounded-xl p-5 shadow-md">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <FileText className="h-5 w-5 text-violet-400" />
            Transaction Payment Ledger
          </h2>
          <div className="relative w-64">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-slate-500" />
            </span>
            <input
              type="text"
              placeholder="Search invoice number or method..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950/60 border border-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-all"
            />
          </div>
        </div>

        {/* Payments Table */}
        <div className="overflow-x-auto rounded-lg border border-slate-800/80 bg-slate-950/20">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg text-sm flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              {error}
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center text-slate-500 py-16">No transactions logged under this query.</div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900/60 border-b border-slate-850 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="px-4 py-3">Receipt / Payout</th>
                  <th className="px-4 py-3">Invoice Ref</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3">Logged Date</th>
                  <th className="px-4 py-3">Operator</th>
                  <th className="px-4 py-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/60 text-slate-300">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-900/20 transition-colors">
                    <td className="px-4 py-3 font-semibold">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase border ${
                        p.invoice_type === 'SALES'
                          ? 'bg-emerald-500/10 text-emerald-450 border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-450 border-rose-500/20'
                      }`}>
                        {p.invoice_type === 'SALES' ? 'Receipt (In)' : 'Disbursement (Out)'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-200">{p.invoice_number}</td>
                    <td className="px-4 py-3 text-slate-300">{p.payment_method.replace('_', ' ')}</td>
                    <td className="px-4 py-3 text-right font-bold text-white">
                      Rs {new Intl.NumberFormat('en-IN').format(parseFloat(p.amount))}
                    </td>
                    <td className="px-4 py-3 text-slate-400">{new Date(p.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-slate-400">{p.operator_name || 'System'}</td>
                    <td className="px-4 py-3 text-slate-500 truncate max-w-xs">{p.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Log Transaction Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm transition-all duration-300">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-950/40 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-violet-400" />
                Log Financial Transaction
              </h3>
              <button 
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white transition rounded p-1 hover:bg-slate-800"
              >
                &times;
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitPayment}>
              <div className="p-6 space-y-4">
                {formError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    {formError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Flow Type
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setInvoiceType('SALES')}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition ${
                          invoiceType === 'SALES'
                            ? 'bg-emerald-500/10 text-emerald-450 border-emerald-500/30'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        Receipt (In)
                      </button>
                      <button
                        type="button"
                        onClick={() => setInvoiceType('PURCHASE')}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition ${
                          invoiceType === 'PURCHASE'
                            ? 'bg-rose-500/10 text-rose-455 border-rose-500/30'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        Payout (Out)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Payment Method
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-violet-500"
                    >
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                      <option value="CASH">Cash</option>
                      <option value="CHEQUE">Cheque</option>
                      <option value="UPI">UPI</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Select Reference Invoice *
                  </label>
                  <select
                    required
                    value={selectedInvoiceId}
                    onChange={(e) => setSelectedInvoiceId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-violet-500"
                  >
                    <option value="">Select outstanding invoice</option>
                    {unpaidInvoices.map(inv => (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoice_number} — {inv.order_number} (Due: Rs {parseFloat(inv.balance_due).toFixed(2)})
                      </option>
                    ))}
                  </select>
                  {unpaidInvoices.length === 0 && (
                    <p className="text-[10px] text-amber-400 mt-1">
                      No outstanding {invoiceType === 'SALES' ? 'customer' : 'vendor'} invoices found with a balance due.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Amount to Log (Rs) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-500"
                    placeholder="Enter transaction amount"
                  />
                  {selectedInvoiceId && (
                    <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1">
                      <span>Max limit:</span>
                      <span 
                        onClick={() => setAmount(unpaidInvoices.find(i => i.id === selectedInvoiceId)?.balance_due || '')}
                        className="text-violet-400 hover:underline cursor-pointer font-bold"
                      >
                        Rs {unpaidInvoices.find(i => i.id === selectedInvoiceId)?.balance_due} (Pay Full)
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Transaction Remarks / Notes
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-500"
                    placeholder="UPI ID / Cheque Number details"
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
                  disabled={submitting || unpaidInvoices.length === 0}
                  className="bg-gradient-to-r from-violet-500 to-indigo-650 hover:from-violet-650 hover:to-indigo-750 text-white font-medium px-4 py-2 rounded-lg text-sm shadow-md transition disabled:opacity-50"
                >
                  {submitting ? 'Logging...' : 'Log Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsPage;
