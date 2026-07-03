import React from 'react';
import { Play, Pause, CheckCircle2, UserCheck, Calendar, ArrowUpRight, Clock } from 'lucide-react';
import StatusBadge from './StatusBadge';

const WorkOrderCard = ({ workOrder, canModify, onStart, onPause, onComplete, onAssignClick }) => {
  const {
    id,
    operation_name,
    status,
    mo_number,
    mo_quantity,
    finished_good_name,
    assignee_first_name,
    assignee_last_name,
    assigned_to,
    start_time,
    end_time
  } = workOrder;

  // Handle Drag Start
  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Get Initials for Assignee Avatar
  const getInitials = () => {
    if (!assignee_first_name) return '?';
    return `${assignee_first_name.charAt(0)}${assignee_last_name ? assignee_last_name.charAt(0) : ''}`.toUpperCase();
  };

  const getDuration = () => {
    if (!start_time) return null;
    const start = new Date(start_time);
    const end = end_time ? new Date(end_time) : new Date();
    const diffMs = Math.abs(end - start);
    
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div
      draggable={canModify && status !== 'COMPLETED'}
      onDragStart={handleDragStart}
      className={`group relative overflow-hidden rounded-xl border bg-slate-900/50 p-4 transition-all shadow-md ${
        canModify && status !== 'COMPLETED' ? 'cursor-grab active:cursor-grabbing hover:border-slate-700 hover:bg-slate-900/80 hover:shadow-lg' : ''
      } ${
        status === 'IN_PROGRESS' ? 'border-blue-500/25 ring-1 ring-blue-500/10' :
        status === 'PAUSED' ? 'border-amber-500/25' :
        status === 'COMPLETED' ? 'border-slate-800 opacity-75' : 'border-slate-800/80'
      }`}
    >
      {/* Visual top accent bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${
        status === 'PENDING' ? 'bg-slate-700' :
        status === 'IN_PROGRESS' ? 'bg-blue-500 animate-pulse' :
        status === 'PAUSED' ? 'bg-amber-500' :
        status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-slate-700'
      }`}></div>

      <div className="space-y-3.5">
        
        {/* Top line: Operation Name & Status Badge */}
        <div className="flex items-start justify-between">
          <h4 className="font-bold text-slate-100 group-hover:text-white transition-colors tracking-tight text-sm">
            {operation_name}
          </h4>
          <StatusBadge status={status} />
        </div>

        {/* Manufacturing Order link details */}
        <div className="rounded-lg bg-slate-950/40 p-2.5 space-y-1.5 text-[11px] border border-slate-850">
          <div className="flex items-center justify-between text-slate-450 font-semibold">
            <span>Parent MO Ref</span>
            <span className="inline-flex items-center font-mono text-slate-300">
              {mo_number}
              <ArrowUpRight className="h-3 w-3 ml-0.5" />
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-500">
            <span>Finished Good</span>
            <span className="text-slate-300 font-medium truncate max-w-[120px]">{finished_good_name}</span>
          </div>
          <div className="flex items-center justify-between text-slate-500">
            <span>Batch Qty</span>
            <span className="text-slate-300 font-medium">{parseFloat(mo_quantity).toFixed(0)} units</span>
          </div>
        </div>

        {/* Assignee worker section */}
        <div className="flex items-center justify-between border-t border-slate-850/50 pt-2.5">
          <div className="flex items-center space-x-2">
            {assigned_to ? (
              <>
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600/10 border border-blue-500/20 text-[10px] font-bold text-blue-400">
                  {getInitials()}
                </div>
                <div className="text-[11px]">
                  <span className="block font-semibold text-slate-300 leading-tight">
                    {assignee_first_name} {assignee_last_name ? assignee_last_name.charAt(0) : ''}.
                  </span>
                  <span className="block text-[9px] text-slate-500">Operator</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-950/60 border border-slate-800 text-[10px] font-bold text-slate-500">
                  ?
                </div>
                <span className="text-[11px] text-slate-500 font-semibold italic">Unassigned</span>
              </>
            )}
          </div>

          {canModify && status !== 'COMPLETED' && (
            <button
              onClick={() => onAssignClick(workOrder)}
              className="inline-flex items-center space-x-1 rounded bg-slate-950 px-2 py-1 text-[10px] font-bold text-slate-400 border border-slate-850 hover:bg-slate-850 hover:text-white transition-all shadow-sm active:scale-95"
            >
              <UserCheck className="h-3 w-3" />
              <span>Assign</span>
            </button>
          )}
        </div>

        {/* Timestamps & Duration */}
        {start_time && (
          <div className="flex items-center justify-between border-t border-slate-850/50 pt-2.5 text-[10px] text-slate-500 font-semibold">
            <div className="flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span>Started: {new Date(start_time).toLocaleDateString()}</span>
            </div>
            {status !== 'PENDING' && (
              <div className="flex items-center space-x-1 text-slate-400">
                <Clock className="h-3 w-3 text-slate-500" />
                <span>{getDuration()}</span>
              </div>
            )}
          </div>
        )}

        {/* Bottom Actions Row (only if canModify) */}
        {canModify && status !== 'COMPLETED' && (
          <div className="flex items-center gap-2 border-t border-slate-850/50 pt-3">
            {/* Start Button */}
            {(status === 'PENDING' || status === 'PAUSED') && (
              <button
                onClick={() => onStart(id)}
                className="flex flex-1 items-center justify-center space-x-1 rounded bg-blue-600/10 border border-blue-500/20 py-1.5 text-xs font-bold text-blue-400 hover:bg-blue-600 hover:text-white hover:border-transparent transition-all shadow-sm active:scale-95"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>Start</span>
              </button>
            )}

            {/* Pause Button */}
            {status === 'IN_PROGRESS' && (
              <button
                onClick={() => onPause(id)}
                className="flex flex-1 items-center justify-center space-x-1 rounded bg-amber-600/10 border border-amber-500/20 py-1.5 text-xs font-bold text-amber-400 hover:bg-amber-600 hover:text-white hover:border-transparent transition-all shadow-sm active:scale-95"
              >
                <Pause className="h-3.5 w-3.5 fill-current" />
                <span>Pause</span>
              </button>
            )}

            {/* Complete Button */}
            {status === 'IN_PROGRESS' && (
              <button
                onClick={() => onComplete(id)}
                className="flex flex-1 items-center justify-center space-x-1 rounded bg-emerald-600/10 border border-emerald-500/20 py-1.5 text-xs font-bold text-emerald-400 hover:bg-emerald-600 hover:text-white hover:border-transparent transition-all shadow-sm active:scale-95"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Complete</span>
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default WorkOrderCard;
