import React from 'react';
import { Link } from 'react-router-dom';
import { Eye, Calendar, User } from 'lucide-react';

const PurchaseOrderTable = ({ orders }) => {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'DRAFT':
        return (
          <span className="inline-block rounded-full bg-slate-900 border border-slate-800 px-2.5 py-0.5 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
            Draft
          </span>
        );
      case 'PENDING_APPROVAL':
        return (
          <span className="inline-block rounded-full bg-amber-955/20 border border-amber-900/30 px-2.5 py-0.5 text-[10px] font-bold text-amber-400 uppercase tracking-wide">
            Pending Approval
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-block rounded-full bg-blue-955/20 border border-blue-900/30 px-2.5 py-0.5 text-[10px] font-bold text-blue-400 uppercase tracking-wide">
            Approved
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-block rounded-full bg-red-955/20 border border-red-900/30 px-2.5 py-0.5 text-[10px] font-bold text-red-400 uppercase tracking-wide">
            Rejected
          </span>
        );
      case 'RECEIVED':
        return (
          <span className="inline-block rounded-full bg-emerald-955/20 border border-emerald-900/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 uppercase tracking-wide">
            Received
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-block rounded-full bg-red-955/20 border border-red-900/30 px-2.5 py-0.5 text-[10px] font-bold text-red-400 uppercase tracking-wide">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-block rounded-full bg-slate-900 border border-slate-800 px-2.5 py-0.5 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
            {status}
          </span>
        );
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-900 bg-slate-950/20 backdrop-blur-md">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-slate-900 bg-slate-950/60 text-xs font-bold uppercase tracking-wider text-slate-400">
            <th className="px-6 py-4">Order Reference</th>
            <th className="px-6 py-4">Supplier</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4">Total Cost (₹)</th>
            <th className="px-6 py-4">Date Created</th>
            <th className="px-6 py-4 text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-900 bg-transparent text-slate-350">
          {orders.map((order) => (
            <tr key={order.id} className="hover:bg-slate-900/30 transition-colors">
              {/* Order Number */}
              <td className="px-6 py-4 font-mono font-semibold text-slate-200 text-xs">
                {order.order_number}
              </td>

              {/* Vendor */}
              <td className="px-6 py-4 text-slate-300 font-medium">
                <div className="flex items-center space-x-2">
                  <User className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                  <span>{order.vendor_name}</span>
                </div>
              </td>

              {/* Status */}
              <td className="px-6 py-4">
                {getStatusBadge(order.status)}
              </td>

              {/* Total Cost */}
              <td className="px-6 py-4 font-mono font-semibold text-slate-250">
                ₹{parseFloat(order.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>

              {/* Created Date */}
              <td className="px-6 py-4 text-slate-455 text-xs">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                  <span>{formatDate(order.created_at)}</span>
                </div>
              </td>

              {/* Actions Grid */}
              <td className="px-6 py-4 text-center">
                <Link
                  to={`/purchase-orders/${order.id}`}
                  className="inline-flex h-7.5 w-7.5 items-center justify-center rounded-md border border-slate-800 bg-slate-900/30 text-slate-400 hover:bg-slate-900 hover:text-slate-200 active:scale-90 transition-all mx-auto"
                  title="View Details"
                >
                  <Eye className="h-4 w-4" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PurchaseOrderTable;
