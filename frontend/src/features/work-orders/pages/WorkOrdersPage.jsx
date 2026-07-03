import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useWorkOrdersQuery, useUpdateWorkOrderMutation } from '../hooks/useWorkOrder';
import KanbanBoard from '../components/KanbanBoard';
import AssignmentModal from '../components/AssignmentModal';
import { 
  AlertTriangle, RefreshCw, Search, X, 
  Layers, Play, Pause, CheckCircle2 
} from 'lucide-react';

const WorkOrdersPage = () => {
  const { user, hasRole } = useAuth();
  const canModify = hasRole(['Admin', 'Manufacturing User']);

  // Filters State
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('ALL'); // 'ALL' or 'ME'

  // Modal State
  const [selectedWo, setSelectedWo] = useState(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [actionError, setActionError] = useState(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 450);
    return () => clearTimeout(handler);
  }, [search]);

  // Queries & Mutations
  const queryParams = {
    search: debouncedSearch
  };
  
  if (filterAssignee === 'ME' && user?.id) {
    queryParams.assigned_to = user.id;
  }

  const { data: woData, isLoading, error, refetch } = useWorkOrdersQuery(queryParams);
  const updateMutation = useUpdateWorkOrderMutation();

  // Core Actions
  const handleUpdateStatus = async (id, status) => {
    setActionError(null);
    try {
      await updateMutation.mutateAsync({ id, data: { status } });
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to update work task status.');
      setTimeout(() => setActionError(null), 5000);
    }
  };

  const handleOpenAssignModal = (workOrder) => {
    setSelectedWo(workOrder);
    setIsAssignModalOpen(true);
  };

  const handleAssignWorker = async (workerId) => {
    if (!selectedWo) return;
    setActionError(null);
    try {
      await updateMutation.mutateAsync({ 
        id: selectedWo.id, 
        data: { assigned_to: workerId } 
      });
      setIsAssignModalOpen(false);
      setSelectedWo(null);
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to assign task operator.');
      setTimeout(() => setActionError(null), 5000);
    }
  };

  const handleDragDropStatus = (id, targetStatus) => {
    handleUpdateStatus(id, targetStatus);
  };

  // Compile KPI Summary stats from fetched results
  const getKpiStats = () => {
    const list = woData?.workOrders || [];
    const total = list.length;
    const pending = list.filter(w => w.status === 'PENDING').length;
    const inProgress = list.filter(w => w.status === 'IN_PROGRESS').length;
    const paused = list.filter(w => w.status === 'PAUSED').length;
    const completed = list.filter(w => w.status === 'COMPLETED').length;

    return { total, pending, inProgress, paused, completed };
  };

  const stats = getKpiStats();

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Shop Floor Work Orders</h1>
          <p className="text-slate-400 font-medium">Orchestrate fabrication tasks (cutting, sanding, assembly, polishing) and track progress logs.</p>
        </div>

        <button
          onClick={() => refetch()}
          className="flex items-center justify-center space-x-1.5 rounded-lg border border-slate-800 bg-slate-900 px-4.5 py-2.5 text-xs font-bold text-slate-350 hover:bg-slate-800 hover:text-white transition-all shadow-sm active:scale-95 self-start sm:self-auto"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh Board</span>
        </button>
      </div>

      {/* Action error banner */}
      {actionError && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center space-x-2.5 rounded-xl border border-red-950/40 bg-red-950/95 backdrop-blur-md p-4 text-xs font-bold text-red-400 shadow-2xl animate-bounce">
          <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* KPI Stats overview row */}
      {!error && (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
          {/* Total */}
          <div className="rounded-2xl border border-slate-850 bg-slate-900/20 p-4 flex items-center space-x-3.5 shadow-sm">
            <div className="rounded-xl bg-slate-800 p-2.5 text-slate-400">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Total Tasks</span>
              <span className="text-lg font-black text-white">{isLoading ? '...' : stats.total}</span>
            </div>
          </div>
          
          {/* Pending */}
          <div className="rounded-2xl border border-slate-850 bg-slate-900/20 p-4 flex items-center space-x-3.5 shadow-sm">
            <div className="rounded-xl bg-slate-800 p-2.5 text-slate-400">
              <span className="block h-5 w-5 rounded-full border border-dashed border-slate-500"></span>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Pending</span>
              <span className="text-lg font-black text-white">{isLoading ? '...' : stats.pending}</span>
            </div>
          </div>

          {/* In Progress */}
          <div className="rounded-2xl border border-slate-850 bg-slate-900/20 p-4 flex items-center space-x-3.5 shadow-sm">
            <div className="rounded-xl bg-blue-500/10 p-2.5 text-blue-400 border border-blue-500/20">
              <Play className="h-5 w-5 fill-current" />
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">In Progress</span>
              <span className="text-lg font-black text-blue-400">{isLoading ? '...' : stats.inProgress}</span>
            </div>
          </div>

          {/* Paused */}
          <div className="rounded-2xl border border-slate-850 bg-slate-900/20 p-4 flex items-center space-x-3.5 shadow-sm">
            <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-400 border border-amber-500/20">
              <Pause className="h-5 w-5 fill-current" />
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Paused</span>
              <span className="text-lg font-black text-amber-400">{isLoading ? '...' : stats.paused}</span>
            </div>
          </div>

          {/* Completed */}
          <div className="rounded-2xl border border-slate-850 bg-slate-900/20 p-4 flex items-center space-x-3.5 shadow-sm col-span-2 lg:col-span-1">
            <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Completed</span>
              <span className="text-lg font-black text-emerald-400">{isLoading ? '...' : stats.completed}</span>
            </div>
          </div>
        </div>
      )}

      {/* Filter panel */}
      <div className="rounded-2xl border border-slate-850 bg-slate-900/10 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
            <Search className="h-4.5 w-4.5" />
          </span>
          <input
            type="text"
            placeholder="Search operation name, MO reference, or product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-950/40 py-2 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-350"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Tab Filter assignee */}
        <div className="flex rounded-lg border border-slate-800 bg-slate-950/40 p-1 self-start">
          <button
            onClick={() => setFilterAssignee('ALL')}
            className={`rounded-md px-4 py-1.5 text-xs font-bold transition-all ${
              filterAssignee === 'ALL' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            All Work Tasks
          </button>
          <button
            onClick={() => setFilterAssignee('ME')}
            className={`rounded-md px-4 py-1.5 text-xs font-bold transition-all ${
              filterAssignee === 'ME' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Assigned to Me
          </button>
        </div>
      </div>

      {/* Main Board Viewport */}
      {error && (
        <div className="rounded-xl border border-red-950/45 bg-red-950/20 p-6 text-center max-w-lg mx-auto">
          <div className="flex justify-center text-red-500 mb-2">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h3 className="text-sm font-bold text-red-400">Failed to load Kanban board</h3>
          <p className="text-xs text-slate-400 mt-2">Verify database configurations and try reloading.</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-blue-500"></div>
          <p className="text-xs text-slate-550 font-bold">Populating Kanban board...</p>
        </div>
      ) : !error && woData ? (
        <KanbanBoard
          workOrders={woData.workOrders}
          canModify={canModify}
          onStart={(id) => handleUpdateStatus(id, 'IN_PROGRESS')}
          onPause={(id) => handleUpdateStatus(id, 'PAUSED')}
          onComplete={(id) => handleUpdateStatus(id, 'COMPLETED')}
          onAssignClick={handleOpenAssignModal}
          onDragDrop={handleDragDropStatus}
        />
      ) : null}

      {/* Assignment Modal dialog */}
      <AssignmentModal
        isOpen={isAssignModalOpen}
        onClose={() => {
          setIsAssignModalOpen(false);
          setSelectedWo(null);
        }}
        onAssign={handleAssignWorker}
        currentAssigneeId={selectedWo?.assigned_to}
        workOrderName={selectedWo?.operation_name}
      />
    </div>
  );
};

export default WorkOrdersPage;
