import React from 'react';
import {
  ClipboardList, Package, Layers, Play, CheckCircle2,
  XCircle, PauseCircle, ArrowRight, Calendar
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

/**
 * Returns a styled status badge for a Manufacturing Order status.
 */
const MoStatusBadge = ({ status }) => {
  const map = {
    DRAFT: {
      cls: 'bg-slate-900 border-slate-800 text-slate-400',
      label: 'Draft',
    },
    APPROVED: {
      cls: 'bg-amber-955/20 border-amber-900/30 text-amber-400',
      label: 'Approved',
    },
    IN_PRODUCTION: {
      cls: 'bg-blue-955/20 border-blue-900/30 text-blue-400',
      label: 'In Production',
    },
    COMPLETED: {
      cls: 'bg-emerald-955/20 border-emerald-900/30 text-emerald-400',
      label: 'Completed',
    },
    CANCELLED: {
      cls: 'bg-red-955/20 border-red-900/30 text-red-400',
      label: 'Cancelled',
    },
  };
  const { cls, label } = map[status] || { cls: 'bg-slate-900 border-slate-800 text-slate-400', label: status };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${cls}`}>
      {label}
    </span>
  );
};

/**
 * MoActionButtons – Shows the valid action buttons for a given MO status.
 * Transitions: DRAFT → APPROVED → IN_PRODUCTION → COMPLETED
 *              Any active state → CANCELLED
 */
const MoActionButtons = ({ order, onUpdateStatus, isLoading }) => {
  const { hasRole } = useAuth();
  const { status, id } = order;
  const base = 'flex items-center space-x-1.5 rounded-lg border px-3 py-1.5 text-[10px] font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed';

  const canApprove = hasRole(['Admin', 'Business Owner']);
  const canExecute = hasRole(['Admin', 'Manufacturing User']);
  const canCancel = hasRole(['Admin', 'Business Owner', 'Manufacturing User']);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {status === 'DRAFT' && (
        <>
          {canApprove ? (
            <button
              onClick={() => onUpdateStatus(id, 'APPROVED')}
              disabled={isLoading}
              className={`${base} border-amber-800 bg-amber-950/20 text-amber-400 hover:bg-amber-950/50`}
              title="Approve order & stage materials"
            >
              <Layers className="h-3 w-3" />
              <span>Approve & Stage</span>
            </button>
          ) : (
            <span className="text-[10px] text-slate-600 italic mr-2">Awaiting Owner Approval</span>
          )}
          {canCancel && (
            <button
              onClick={() => onUpdateStatus(id, 'CANCELLED')}
              disabled={isLoading}
              className={`${base} border-slate-800 bg-slate-950 text-slate-500 hover:bg-red-955/20 hover:text-red-400 hover:border-red-900/40`}
            >
              <XCircle className="h-3 w-3" />
              <span>Cancel</span>
            </button>
          )}
        </>
      )}

      {status === 'APPROVED' && (
        <>
          {canExecute ? (
            <button
              onClick={() => onUpdateStatus(id, 'IN_PRODUCTION')}
              disabled={isLoading}
              className={`${base} border-blue-800 bg-blue-955/20 text-blue-400 hover:bg-blue-955/50`}
              title="Start production run"
            >
              <Play className="h-3 w-3 fill-current" />
              <span>Start Production</span>
            </button>
          ) : (
            <span className="text-[10px] text-slate-600 italic mr-2">Approved (Awaiting Execution)</span>
          )}
          {canCancel && (
            <button
              onClick={() => onUpdateStatus(id, 'CANCELLED')}
              disabled={isLoading}
              className={`${base} border-slate-800 bg-slate-955 text-slate-500 hover:bg-red-955/20 hover:text-red-400 hover:border-red-900/40`}
            >
              <XCircle className="h-3 w-3" />
              <span>Cancel</span>
            </button>
          )}
        </>
      )}

      {status === 'IN_PRODUCTION' && (
        <>
          {canExecute ? (
            <button
              onClick={() => onUpdateStatus(id, 'COMPLETED')}
              disabled={isLoading}
              className={`${base} border-emerald-800 bg-emerald-955/20 text-emerald-400 hover:bg-emerald-955/50`}
              title="Mark as completed"
            >
              <CheckCircle2 className="h-3 w-3" />
              <span>Complete</span>
            </button>
          ) : (
            <span className="text-[10px] text-slate-600 italic mr-2">In Production</span>
          )}
          {canCancel && (
            <button
              onClick={() => onUpdateStatus(id, 'CANCELLED')}
              disabled={isLoading}
              className={`${base} border-slate-800 bg-slate-955 text-slate-500 hover:bg-red-955/20 hover:text-red-400 hover:border-red-900/40`}
            >
              <XCircle className="h-3 w-3" />
              <span>Cancel</span>
            </button>
          )}
        </>
      )}

      {(status === 'COMPLETED' || status === 'CANCELLED') && (
        <span className="text-[10px] text-slate-600 italic">No actions available</span>
      )}
    </div>
  );
};

/**
 * ProductionQueueTable – Main production queue display component.
 * Shows all manufacturing orders with status transitions.
 */
const ProductionQueueTable = ({ orders, onUpdateStatus, isLoading }) => {
  if (!orders || orders.length === 0) {
    return (
      <div className="rounded-xl border border-slate-900 bg-slate-950/20 py-20 text-center">
        <ClipboardList className="h-10 w-10 text-slate-700 mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-500">No manufacturing orders found.</p>
        <p className="text-xs text-slate-600 mt-1">Create a manufacturing order from the AI Planner or create one manually.</p>
      </div>
    );
  }

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-900 bg-slate-950/20">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-slate-900 bg-slate-950/60 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            <th className="px-5 py-4">MO Reference</th>
            <th className="px-5 py-4">Finished Good</th>
            <th className="px-5 py-4">BoM Recipe</th>
            <th className="px-5 py-4">Qty</th>
            <th className="px-5 py-4">Status</th>
            <th className="px-5 py-4">Created</th>
            <th className="px-5 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-900">
          {orders.map((order) => (
            <tr
              key={order.id}
              className="hover:bg-slate-900/30 transition-colors"
            >
              {/* MO Number */}
              <td className="px-5 py-4">
                <span className="font-mono text-xs font-bold text-slate-300">{order.mo_number}</span>
              </td>

              {/* Finished Good */}
              <td className="px-5 py-4">
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-200 text-sm">{order.finished_good_name}</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">
                    {order.finished_good_sku}
                  </span>
                </div>
              </td>

              {/* BoM Recipe */}
              <td className="px-5 py-4">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-slate-350">{order.bom_name || '—'}</span>
                  {order.bom_version && (
                    <span className="text-[10px] text-slate-600">v{order.bom_version}</span>
                  )}
                </div>
              </td>

              {/* Quantity */}
              <td className="px-5 py-4">
                <span className="font-mono text-slate-300 font-semibold">{parseFloat(order.quantity)}</span>
                <span className="text-xs text-slate-500 ml-1">{order.finished_good_uom || 'pcs'}</span>
              </td>

              {/* Status */}
              <td className="px-5 py-4">
                <MoStatusBadge status={order.status} />
              </td>

              {/* Created date */}
              <td className="px-5 py-4">
                <div className="flex items-center space-x-1.5 text-xs text-slate-500">
                  <Calendar className="h-3.5 w-3.5 shrink-0" />
                  <span>{formatDate(order.created_at)}</span>
                </div>
              </td>

              {/* Actions */}
              <td className="px-5 py-4 text-right">
                <MoActionButtons
                  order={order}
                  onUpdateStatus={onUpdateStatus}
                  isLoading={isLoading}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProductionQueueTable;
