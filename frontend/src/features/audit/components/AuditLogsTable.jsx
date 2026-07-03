import React from 'react';
import {
  Activity,
  Package,
  ShoppingCart,
  Truck,
  Factory,
  Wrench,
  Layers,
  Users,
  Building2,
  UserCircle,
  CheckCircle2,
  Trash2,
  Edit3,
  PlusCircle,
  XCircle,
  RotateCcw,
  Play,
  Pause,
  LogIn,
  LogOut,
} from 'lucide-react';

/** Map entity types to an icon and tint color */
const ENTITY_META = {
  product: { icon: Package, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  inventory: { icon: Layers, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  sales_order: { icon: ShoppingCart, color: 'text-green-400', bg: 'bg-green-500/10' },
  purchase_order: { icon: Truck, color: 'text-orange-400', bg: 'bg-orange-500/10' },
  manufacturing_order: { icon: Factory, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  work_order: { icon: Wrench, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  bom: { icon: Layers, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
  customer: { icon: Users, color: 'text-pink-400', bg: 'bg-pink-500/10' },
  vendor: { icon: Building2, color: 'text-rose-400', bg: 'bg-rose-500/10' },
  user: { icon: UserCircle, color: 'text-slate-300', bg: 'bg-slate-500/10' },
};

/** Map action strings to badge colors and icons */
const ACTION_META = {
  created: { color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', icon: PlusCircle },
  updated: { color: 'bg-blue-500/10 text-blue-400 border-blue-500/30', icon: Edit3 },
  deleted: { color: 'bg-red-500/10 text-red-400 border-red-500/30', icon: Trash2 },
  confirmed: { color: 'bg-violet-500/10 text-violet-400 border-violet-500/30', icon: CheckCircle2 },
  shipped: { color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30', icon: Truck },
  cancelled: { color: 'bg-orange-500/10 text-orange-400 border-orange-500/30', icon: XCircle },
  received: { color: 'bg-teal-500/10 text-teal-400 border-teal-500/30', icon: CheckCircle2 },
  adjusted: { color: 'bg-amber-500/10 text-amber-400 border-amber-500/30', icon: RotateCcw },
  started: { color: 'bg-lime-500/10 text-lime-400 border-lime-500/30', icon: Play },
  paused: { color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30', icon: Pause },
  completed: { color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', icon: CheckCircle2 },
  login: { color: 'bg-sky-500/10 text-sky-400 border-sky-500/30', icon: LogIn },
  logout: { color: 'bg-slate-500/10 text-slate-400 border-slate-500/30', icon: LogOut },
};

const getEntityMeta = (entityType) =>
  ENTITY_META[entityType] || { icon: Activity, color: 'text-slate-400', bg: 'bg-slate-500/10' };

const getActionMeta = (action) =>
  ACTION_META[action] || { color: 'bg-slate-500/10 text-slate-400 border-slate-500/30', icon: Activity };

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
};

const formatEntityType = (e) =>
  (e || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

/**
 * AuditLogsTable – Displays paginated audit log rows with action badges and entity icons.
 */
const AuditLogsTable = ({ logs = [], pagination, page, onPageChange, onRowClick, loading }) => {
  const { totalItems = 0, totalPages = 1, itemsPerPage = 50, currentPage = 1 } = pagination || {};

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="p-8 space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-10 bg-slate-800/60 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!logs.length) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-16 text-center">
        <Activity className="w-10 h-10 text-slate-700 mx-auto mb-3" />
        <p className="text-slate-400 font-medium">No audit logs found</p>
        <p className="text-slate-600 text-sm mt-1">Try adjusting your filters or date range.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/80">
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Timestamp
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                User
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Action
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Module
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Entity ID
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                IP Address
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {logs.map((log) => {
              const entityMeta = getEntityMeta(log.entity_type);
              const actionMeta = getActionMeta(log.action);
              const EntityIcon = entityMeta.icon;
              const ActionIcon = actionMeta.icon;
              const userName = log.first_name
                ? `${log.first_name} ${log.last_name || ''}`.trim()
                : log.email || 'System';

              return (
                <tr
                  key={log.id}
                  onClick={() => onRowClick(log)}
                  className="hover:bg-slate-800/40 cursor-pointer transition-colors group"
                >
                  {/* Timestamp */}
                  <td className="px-5 py-3.5 text-slate-300 font-mono text-xs whitespace-nowrap">
                    {formatDate(log.created_at)}
                  </td>

                  {/* User */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {userName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white font-medium leading-none">{userName}</p>
                        {log.email && log.first_name && (
                          <p className="text-slate-500 text-xs mt-0.5">{log.email}</p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Action Badge */}
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${actionMeta.color}`}
                    >
                      <ActionIcon className="w-3 h-3" />
                      {log.action?.charAt(0).toUpperCase() + log.action?.slice(1)}
                    </span>
                  </td>

                  {/* Entity Type */}
                  <td className="px-5 py-3.5">
                    <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg ${entityMeta.bg}`}>
                      <EntityIcon className={`w-3.5 h-3.5 ${entityMeta.color}`} />
                      <span className={`text-xs font-medium ${entityMeta.color}`}>
                        {formatEntityType(log.entity_type)}
                      </span>
                    </div>
                  </td>

                  {/* Entity ID */}
                  <td className="px-5 py-3.5">
                    <code className="text-slate-400 font-mono text-xs bg-slate-800 px-2 py-0.5 rounded">
                      {log.entity_id || '—'}
                    </code>
                  </td>

                  {/* IP Address */}
                  <td className="px-5 py-3.5">
                    <span className="text-slate-500 font-mono text-xs">
                      {log.ip_address || '—'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="border-t border-slate-800 px-5 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/40">
        <p className="text-xs text-slate-500">
          Showing{' '}
          <span className="text-slate-300 font-medium">
            {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}–
            {Math.min(currentPage * itemsPerPage, totalItems)}
          </span>{' '}
          of <span className="text-slate-300 font-medium">{totalItems}</span> records
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="px-3 py-1.5 text-xs text-slate-300 bg-slate-800 rounded-lg hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            ← Prev
          </button>
          {[...Array(Math.min(5, totalPages))].map((_, i) => {
            const pageNum = Math.max(1, Math.min(currentPage - 2, totalPages - 4)) + i;
            if (pageNum < 1 || pageNum > totalPages) return null;
            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`w-8 h-7 text-xs rounded-lg transition ${
                  pageNum === currentPage
                    ? 'bg-violet-600 text-white font-semibold'
                    : 'text-slate-400 bg-slate-800 hover:bg-slate-700'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="px-3 py-1.5 text-xs text-slate-300 bg-slate-800 rounded-lg hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuditLogsTable;
