import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const DeleteModal = ({ isOpen, onClose, onConfirm, customerName, customerEmail, isDeleting }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Box */}
      <div className="relative w-full max-w-md rounded-2xl border border-slate-900 bg-slate-900/90 backdrop-blur-xl p-6 shadow-2xl animate-in fade-in scale-in duration-200">
        <button
          onClick={onClose}
          disabled={isDeleting}
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-350 disabled:opacity-50"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex flex-col items-center text-center space-y-4">
          <div className="rounded-full bg-red-950/30 p-4 border border-red-900/30 text-red-500">
            <AlertTriangle className="h-8 w-8" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-white">Delete Customer profile?</h3>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Are you sure you want to delete <span className="font-semibold text-slate-200">"{customerName}"</span> ({customerEmail})? This action is permanent and will delete the customer profile from the directory.
            </p>
          </div>

          <div className="flex w-full space-x-3.5 pt-4">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 px-4 py-2.5 text-xs font-bold rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-900 hover:text-slate-200 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 px-4 py-2.5 text-xs font-bold rounded-lg bg-red-600 hover:bg-red-500 text-white transition-all shadow-md shadow-red-900/20 active:scale-95 disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Delete Customer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;
