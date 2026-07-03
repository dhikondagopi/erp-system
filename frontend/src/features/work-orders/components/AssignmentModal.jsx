import React, { useState } from 'react';
import { useWorkersQuery } from '../hooks/useWorkOrder';
import { X, UserPlus, AlertCircle } from 'lucide-react';

const AssignmentModal = ({ isOpen, onClose, onAssign, currentAssigneeId, workOrderName }) => {
  const [selectedWorkerId, setSelectedWorkerId] = useState(currentAssigneeId || '');
  const { data: workers, isLoading, error } = useWorkersQuery();

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onAssign(selectedWorkerId || null); // Pass null if they select unassign option
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Box */}
      <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-xl p-6 shadow-2xl animate-in fade-in scale-in duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-350"
        >
          <X className="h-5 w-5" />
        </button>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center space-x-2.5">
            <div className="rounded-lg bg-blue-500/10 p-2 text-blue-400">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Assign Task</h3>
              <p className="text-xs text-slate-400">Select operator for "{workOrderName}"</p>
            </div>
          </div>

          {error && (
            <div className="flex items-center space-x-2 text-red-400 bg-red-950/20 border border-red-950/40 p-3 rounded-lg text-xs">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>Failed to load workers list. Try again.</span>
            </div>
          )}

          {/* Select Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
              Choose Operator
            </label>
            {isLoading ? (
              <div className="w-full rounded-lg border border-slate-800 bg-slate-950/20 px-3 py-2 text-sm text-slate-500">
                Loading workers directory...
              </div>
            ) : (
              <select
                id="assign-worker-select"
                value={selectedWorkerId}
                onChange={(e) => setSelectedWorkerId(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-200 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-all"
              >
                <option value="" className="bg-slate-900">-- Unassigned / Clear Assignee --</option>
                {workers?.map((w) => (
                  <option key={w.id} value={w.id} className="bg-slate-900">
                    {w.first_name} {w.last_name} ({w.role})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3.5 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-xs font-bold rounded-lg border border-slate-800 bg-slate-950 text-slate-450 hover:bg-slate-900 hover:text-slate-200 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="assign-submit-btn"
              className="flex-1 px-4 py-2.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md shadow-blue-900/25 active:scale-95"
            >
              Confirm Assignment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignmentModal;
