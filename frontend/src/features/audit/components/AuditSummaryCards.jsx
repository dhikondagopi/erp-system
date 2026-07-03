import React from 'react';
import { Activity, TrendingUp, Shield, Clock } from 'lucide-react';

/**
 * AuditSummaryCards – Four top-level KPI cards for the audit logs page.
 */
const AuditSummaryCards = ({ logs = [], totalItems = 0, loading = false }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayCount = logs.filter((l) => {
    if (!l.created_at) return false;
    return new Date(l.created_at) >= today;
  }).length;

  const uniqueUsers = new Set(logs.map((l) => l.user_id).filter(Boolean)).size;

  const highRiskCount = logs.filter((l) =>
    ['deleted', 'cancelled'].includes(l.action)
  ).length;

  const cards = [
    {
      label: 'Total Events',
      value: totalItems.toLocaleString(),
      sub: 'All time records',
      icon: Activity,
      gradient: 'from-violet-500/20 to-indigo-500/20',
      border: 'border-violet-500/20',
      iconColor: 'text-violet-400',
    },
    {
      label: 'Events Today',
      value: todayCount.toLocaleString(),
      sub: 'Current page scope',
      icon: Clock,
      gradient: 'from-cyan-500/20 to-blue-500/20',
      border: 'border-cyan-500/20',
      iconColor: 'text-cyan-400',
    },
    {
      label: 'Unique Users',
      value: uniqueUsers.toLocaleString(),
      sub: 'Active in this view',
      icon: TrendingUp,
      gradient: 'from-emerald-500/20 to-teal-500/20',
      border: 'border-emerald-500/20',
      iconColor: 'text-emerald-400',
    },
    {
      label: 'High Risk Actions',
      value: highRiskCount.toLocaleString(),
      sub: 'Deletions & cancellations',
      icon: Shield,
      gradient: 'from-red-500/20 to-orange-500/20',
      border: 'border-red-500/20',
      iconColor: 'text-red-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className={`rounded-xl border ${card.border} bg-gradient-to-br ${card.gradient} p-5 space-y-3`}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {card.label}
              </p>
              <div className="p-2 rounded-lg bg-slate-900/60">
                <Icon className={`w-4 h-4 ${card.iconColor}`} />
              </div>
            </div>
            {loading ? (
              <div className="h-8 w-16 bg-slate-700/50 rounded animate-pulse" />
            ) : (
              <p className="text-3xl font-extrabold text-white tracking-tight">{card.value}</p>
            )}
            <p className="text-xs text-slate-500">{card.sub}</p>
          </div>
        );
      })}
    </div>
  );
};

export default AuditSummaryCards;
