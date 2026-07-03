import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Truck, XCircle, AlertTriangle, FileText } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useSalesOrderDetailsQuery, useUpdateOrderStatusMutation } from '../hooks/useSales';

const SalesOrderDetailsPage = () => {
  const { hasRole } = useAuth();
  const canModify = hasRole(['Admin', 'Sales User']);
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: order, isLoading, error } = useSalesOrderDetailsQuery(id);
  const statusMutation = useUpdateOrderStatusMutation();
  const [actionError, setActionError] = useState(null);

  const handleStatusTransition = async (status) => {
    setActionError(null);
    try {
      await statusMutation.mutateAsync({ id, status });
    } catch (err) {
      setActionError(err.response?.data?.message || err.message || 'Failed to update order status.');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DRAFT':
        return (
          <span className="inline-block rounded-full bg-slate-900 border border-slate-800 px-3 py-1 text-xs font-bold text-slate-500 uppercase tracking-wide">
            Draft
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-block rounded-full bg-blue-955/20 border border-blue-900/30 px-3 py-1 text-xs font-bold text-blue-400 uppercase tracking-wide">
            Approved
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-block rounded-full bg-emerald-955/20 border border-emerald-900/30 px-3 py-1 text-xs font-bold text-emerald-400 uppercase tracking-wide">
            Completed
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-block rounded-full bg-red-955/20 border border-red-900/30 px-3 py-1 text-xs font-bold text-red-400 uppercase tracking-wide">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-block rounded-full bg-slate-900 border border-slate-800 px-3 py-1 text-xs font-bold text-slate-500 uppercase tracking-wide">
            {status}
          </span>
        );
    }
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

  if (isLoading) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center space-y-3">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-blue-500"></div>
        <p className="text-xs text-slate-500 font-semibold">Loading sales order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="rounded-xl border border-red-955/40 bg-red-955/20 p-6 text-center max-w-lg mx-auto">
        <div className="flex justify-center text-red-500 mb-2">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h3 className="text-sm font-bold text-red-400">Failed to load sales order</h3>
        <p className="text-xs text-slate-400 mt-2">The order profile you are trying to view does not exist or could not be loaded.</p>
        <button
          onClick={() => navigate('/sales-orders')}
          className="mt-4 px-4 py-2 text-xs font-bold rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-900 hover:text-slate-200"
        >
          Back to list
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top action/header block */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-900 pb-5">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/sales-orders')}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-900 hover:text-slate-200"
            title="Back to list"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </button>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Order Ledger</span>
            <div className="flex items-center space-x-3.5 mt-0.5">
              <h1 className="text-xl font-extrabold text-white font-mono">{order.order_number}</h1>
              {getStatusBadge(order.status)}
            </div>
          </div>
        </div>

        {/* Transition options */}
        <div className="flex flex-wrap items-center gap-3">
          {order.status === 'DRAFT' && (
            <>
              {hasRole(['Admin', 'Business Owner']) && (
                <button
                  onClick={() => handleStatusTransition('APPROVED')}
                  disabled={statusMutation.isLoading}
                  className="flex items-center space-x-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 shadow-md shadow-blue-900/20 transition-all disabled:opacity-50"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Approve Order</span>
                </button>
              )}
              {hasRole(['Admin', 'Business Owner', 'Sales User']) && (
                <button
                  onClick={() => handleStatusTransition('CANCELLED')}
                  disabled={statusMutation.isLoading}
                  className="flex items-center space-x-2 rounded-lg border border-slate-800 bg-slate-950 hover:bg-red-950/20 hover:text-red-400 hover:border-red-900/35 text-slate-455 font-bold text-xs px-4 py-2.5 transition-all disabled:opacity-50"
                >
                  <XCircle className="h-4 w-4" />
                  <span>Cancel Order</span>
                </button>
              )}
            </>
          )}

          {order.status === 'APPROVED' && (
            <>
              {hasRole(['Admin', 'Sales User', 'Inventory Manager']) && (
                <button
                  onClick={() => handleStatusTransition('COMPLETED')}
                  disabled={statusMutation.isLoading}
                  className="flex items-center space-x-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 shadow-md shadow-emerald-900/20 transition-all disabled:opacity-50"
                >
                  <Truck className="h-4 w-4" />
                  <span>Ship & Complete Order</span>
                </button>
              )}
              {hasRole(['Admin', 'Business Owner', 'Sales User']) && (
                <button
                  onClick={() => handleStatusTransition('CANCELLED')}
                  disabled={statusMutation.isLoading}
                  className="flex items-center space-x-2 rounded-lg border border-slate-800 bg-slate-950 hover:bg-red-955/20 hover:text-red-400 hover:border-red-900/35 text-slate-455 font-bold text-xs px-4 py-2.5 transition-all disabled:opacity-50"
                >
                  <XCircle className="h-4 w-4" />
                  <span>Cancel Order</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {actionError && (
        <div className="rounded-xl border border-red-955/40 bg-red-955/20 p-4 text-sm font-semibold text-red-400 animate-in fade-in duration-150">
          {actionError}
        </div>
      )}

      {/* Grid: Details and timeline */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Order Details & Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Metadata Card */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Customer Details */}
            <div className="rounded-xl border border-slate-900 bg-slate-955/40 p-5 space-y-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Client Profile</span>
              <div className="space-y-1">
                <p className="text-sm font-bold text-white">{order.customer_name}</p>
                <p className="text-xs text-slate-400">{order.customer_email}</p>
              </div>
            </div>

            {/* Operator Details */}
            <div className="rounded-xl border border-slate-900 bg-slate-955/40 p-5 space-y-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Operator</span>
              <div className="space-y-1">
                <p className="text-sm font-bold text-white">
                  {order.creator_first_name || <span className="italic text-slate-550">System generated</span>}
                </p>
                <p className="text-xs text-slate-400">Created on {formatDate(order.created_at)}</p>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Line Items</h3>
            <div className="w-full overflow-x-auto rounded-xl border border-slate-900 bg-slate-955/20">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-900 bg-slate-950/60 text-xs font-bold uppercase tracking-wider text-slate-400">
                    <th className="px-6 py-4">Product Specs</th>
                    <th className="px-6 py-4">Quantity</th>
                    <th className="px-6 py-4">Unit Price (₹)</th>
                    <th className="px-6 py-4">Subtotal (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 text-slate-350">
                  {order.items?.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-900/20">
                      <td className="px-6 py-3.5">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-200 text-sm">{item.name}</span>
                          <span className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">SKU: {item.sku}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 font-mono text-slate-300">
                        {item.quantity} <span className="text-xs text-slate-500 font-sans ml-1">{item.uom}</span>
                      </td>
                      <td className="px-6 py-3.5 font-mono text-slate-300">
                        ₹{parseFloat(item.unit_price).toFixed(2)}
                      </td>
                      <td className="px-6 py-3.5 font-mono font-semibold text-slate-200">
                        ₹{(parseFloat(item.quantity) * parseFloat(item.unit_price)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar Calculations & Timelines */}
        <div className="space-y-6">
          {/* Summary */}
          <div className="rounded-xl border border-slate-900 bg-slate-955/40 p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-900 pb-3">
              Order Valuations
            </h3>
            <div className="flex justify-between font-bold text-base text-white">
              <span>Grand Total</span>
              <span className="font-mono text-blue-400">
                ₹{parseFloat(order.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Timeline */}
          <div className="rounded-xl border border-slate-900 bg-slate-955/40 p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-900 pb-3">
              Order History Timeline
            </h3>
            <div className="relative border-l border-slate-800 pl-4 ml-2.5 space-y-5">
              {/* Draft state always first */}
              <div className="relative">
                <div className="absolute -left-6.5 top-0.5 rounded-full bg-slate-950 p-1 border border-slate-750 text-slate-400">
                  <FileText className="h-3 w-3" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Draft Order Generated</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">{formatDate(order.created_at)}</p>
                </div>
              </div>

              {/* Approved */}
              {(order.status === 'APPROVED' || order.status === 'COMPLETED') && (
                <div className="relative animate-in fade-in duration-200">
                  <div className="absolute -left-6.5 top-0.5 rounded-full bg-slate-950 p-1 border border-blue-900/40 text-blue-400">
                    <CheckCircle className="h-3 w-3" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Order Approved</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">Inventory reserved at source</p>
                  </div>
                </div>
              )}

              {/* Completed */}
              {order.status === 'COMPLETED' && (
                <div className="relative animate-in fade-in duration-200">
                  <div className="absolute -left-6.5 top-0.5 rounded-full bg-slate-950 p-1 border border-emerald-900/40 text-emerald-400">
                    <Truck className="h-3 w-3" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Order Dispatched & Completed</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">Physical inventory stocks deducted</p>
                  </div>
                </div>
              )}

              {/* Cancelled */}
              {order.status === 'CANCELLED' && (
                <div className="relative animate-in fade-in duration-200">
                  <div className="absolute -left-6.5 top-0.5 rounded-full bg-slate-950 p-1 border border-red-900/40 text-red-400">
                    <XCircle className="h-3 w-3" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Order Cancelled</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">Reservations released or order voided</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesOrderDetailsPage;
