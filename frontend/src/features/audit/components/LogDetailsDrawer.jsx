import React, { useEffect } from 'react';
import { X, Clock, User, Activity, Hash, Globe, FileText, ChevronRight } from 'lucide-react';

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-US', {
    weekday: 'short',
    month: 'long',
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

const JsonViewer = ({ data, label }) => {
  if (!data) return null;
  let parsed = data;
  if (typeof data === 'string') {
    try {
      parsed = JSON.parse(data);
    } catch {
      parsed = data;
    }
  }
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
      <pre className="text-xs text-slate-300 bg-slate-950 rounded-lg p-3 overflow-x-auto border border-slate-800 max-h-48 leading-relaxed">
        {JSON.stringify(parsed, null, 2)}
      </pre>
    </div>
  );
};

/**
 * LogDetailsDrawer – Slide-in drawer showing full audit log details,
 * including before/after JSON snapshots when available.
 */
const LogDetailsDrawer = ({ log, onClose }) => {
  // Close on Escape key
  useEffect(() => {
    if (!log) return;
    const handler = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [log, onClose]);

  if (!log) return null;

  const userName = log.first_name
    ? `${log.first_name} ${log.last_name || ''}`.trim()
    : log.email || 'System';

  const actionColor = {
    created: 'text-emerald-400',
    updated: 'text-blue-400',
    deleted: 'text-red-400',
    confirmed: 'text-violet-400',
    shipped: 'text-cyan-400',
    cancelled: 'text-orange-400',
    received: 'text-teal-400',
    adjusted: 'text-amber-400',
    started: 'text-lime-400',
    paused: 'text-yellow-400',
    completed: 'text-emerald-400',
  }[log.action] || 'text-slate-300';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full sm:w-[480px] bg-slate-900 border-l border-slate-800 z-50 flex flex-col shadow-2xl animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <Activity className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h2 className="text-white font-bold text-base leading-none">Log Details</h2>
              <p className="text-slate-500 text-xs mt-0.5">Audit record snapshot</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Summary Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-800/30 p-4 space-y-4">
            {/* Action + Entity */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-lg font-bold ${actionColor}`}>
                {log.action?.charAt(0).toUpperCase() + log.action?.slice(1)}
              </span>
              <ChevronRight className="w-4 h-4 text-slate-600" />
              <span className="text-white font-semibold">
                {formatEntityType(log.entity_type)}
              </span>
            </div>

            {/* Meta Info Grid */}
            <div className="grid grid-cols-2 gap-3">
              <InfoCell icon={Hash} label="Entity ID" value={log.entity_id || '—'} mono />
              <InfoCell icon={Globe} label="IP Address" value={log.ip_address || '—'} mono />
              <InfoCell
                icon={Clock}
                label="Timestamp"
                value={formatDate(log.created_at)}
                className="col-span-2"
              />
            </div>
          </div>

          {/* User Block */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> Performed By
            </p>
            <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-800/30 p-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-base flex-shrink-0">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-white font-semibold">{userName}</p>
                {log.email && (
                  <p className="text-slate-400 text-sm">{log.email}</p>
                )}
              </div>
            </div>
          </div>

          {/* Before / After Snapshots */}
          {(log.old_value || log.new_value) && (
            <div className="space-y-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Record Snapshots
              </p>
              <JsonViewer data={log.old_value} label="Before (Old State)" />
              <JsonViewer data={log.new_value} label="After (New State)" />
            </div>
          )}

          {/* Raw Log ID */}
          <div className="rounded-xl border border-slate-800/60 bg-slate-900 p-4">
            <p className="text-xs text-slate-600 font-semibold uppercase tracking-wider mb-1">Log ID</p>
            <code className="text-slate-400 font-mono text-xs break-all">{log.id}</code>
          </div>
        </div>
      </div>

      {/* Slide-in animation */}
      <style>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.22s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
      `}</style>
    </>
  );
};

/** Small info cell used inside the summary card */
const InfoCell = ({ icon: Icon, label, value, mono, className = '' }) => (
  <div className={`space-y-1 ${className}`}>
    <p className="text-xs text-slate-500 flex items-center gap-1">
      <Icon className="w-3 h-3" />
      {label}
    </p>
    <p className={`text-sm text-white font-medium ${mono ? 'font-mono' : ''} break-all`}>
      {value}
    </p>
  </div>
);

export default LogDetailsDrawer;
