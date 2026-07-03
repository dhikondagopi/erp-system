import React from 'react';
import WorkOrderCard from './WorkOrderCard';
import { Layers, Play, Pause, CheckCircle2 } from 'lucide-react';

const KanbanBoard = ({ 
  workOrders = [], 
  canModify, 
  onStart, 
  onPause, 
  onComplete, 
  onAssignClick, 
  onDragDrop 
}) => {

  // Columns specification
  const columns = [
    {
      title: 'Pending',
      status: 'PENDING',
      borderColor: 'border-t-slate-700 bg-slate-950/15',
      icon: <Layers className="h-4 w-4 text-slate-400" />
    },
    {
      title: 'In Progress',
      status: 'IN_PROGRESS',
      borderColor: 'border-t-blue-500 bg-blue-950/5',
      icon: <Play className="h-4 w-4 text-blue-400 fill-current" />
    },
    {
      title: 'Paused',
      status: 'PAUSED',
      borderColor: 'border-t-amber-500 bg-amber-950/5',
      icon: <Pause className="h-4 w-4 text-amber-400 fill-current" />
    },
    {
      title: 'Completed',
      status: 'COMPLETED',
      borderColor: 'border-t-emerald-500 bg-emerald-950/5',
      icon: <CheckCircle2 className="h-4 w-4 text-emerald-400" />
    }
  ];

  // Helper to filter work orders for a column status
  const getColumnWorkOrders = (status) => {
    return workOrders.filter((wo) => wo.status === status);
  };

  // Drag and Drop Event Handlers
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    const workOrderId = e.dataTransfer.getData('text/plain');
    if (!workOrderId) return;
    
    // Check if dragging completed task
    const sourceCard = workOrders.find((w) => w.id === workOrderId);
    if (!sourceCard || sourceCard.status === targetStatus || sourceCard.status === 'COMPLETED') return;

    onDragDrop(workOrderId, targetStatus);
  };

  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
      {columns.map((col) => {
        const colOrders = getColumnWorkOrders(col.status);

        return (
          <div
            key={col.status}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.status)}
            id={`kanban-column-${col.status}`}
            className={`flex flex-col rounded-2xl border border-slate-850 p-4 border-t-2 ${col.borderColor} min-h-[500px] shadow-sm`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4 border-b border-slate-850 pb-3">
              <div className="flex items-center space-x-2">
                {col.icon}
                <h3 className="font-bold text-white text-sm tracking-tight">{col.title}</h3>
              </div>
              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs font-black text-slate-400">
                {colOrders.length}
              </span>
            </div>

            {/* Column Content */}
            <div className="flex-1 space-y-3 overflow-y-auto">
              {colOrders.length > 0 ? (
                colOrders.map((wo) => (
                  <WorkOrderCard
                    key={wo.id}
                    workOrder={wo}
                    canModify={canModify}
                    onStart={onStart}
                    onPause={onPause}
                    onComplete={onComplete}
                    onAssignClick={onAssignClick}
                  />
                ))
              ) : (
                <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-slate-850 py-10 text-center text-xs text-slate-650 font-medium">
                  Drop tasks here
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KanbanBoard;
