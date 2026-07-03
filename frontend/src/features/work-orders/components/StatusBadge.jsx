import React from 'react';

const StatusBadge = ({ status }) => {
  const getStyles = () => {
    switch (status) {
      case 'PENDING':
        return 'bg-slate-800 text-slate-400 border border-slate-700/60';
      case 'IN_PROGRESS':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/30';
      case 'PAUSED':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/30';
      case 'COMPLETED':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30';
      default:
        return 'bg-slate-800 text-slate-400 border border-slate-750';
    }
  };

  const getLabel = () => {
    switch (status) {
      case 'PENDING':
        return 'Pending';
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'PAUSED':
        return 'Paused';
      case 'COMPLETED':
        return 'Completed';
      default:
        return status;
    }
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${getStyles()}`}>
      <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
        status === 'PENDING' ? 'bg-slate-400' :
        status === 'IN_PROGRESS' ? 'bg-blue-400' :
        status === 'PAUSED' ? 'bg-amber-400' :
        status === 'COMPLETED' ? 'bg-emerald-400' : 'bg-slate-400'
      }`}></span>
      {getLabel()}
    </span>
  );
};

export default StatusBadge;
