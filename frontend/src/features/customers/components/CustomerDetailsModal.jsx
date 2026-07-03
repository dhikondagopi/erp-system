import React from 'react';
import { X, User, Mail, Phone, MapPin, Calendar } from 'lucide-react';
import { useCustomerDetailsQuery } from '../hooks/useCustomers';

const CustomerDetailsModal = ({ isOpen, onClose, customerId }) => {
  const { data: customer, isLoading, error } = useCustomerDetailsQuery(customerId);

  if (!isOpen) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className="relative w-full max-w-md border-l border-slate-900 bg-slate-955/95 h-full p-6 shadow-2xl overflow-y-auto flex flex-col justify-between z-10 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-900 pb-4 mb-6">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Client Directory</span>
            <h2 className="text-lg font-bold text-white mt-0.5">Details Card</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-880 bg-slate-900/40 text-slate-400 hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Info list */}
        <div className="flex-1 space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-blue-500"></div>
              <p className="text-xs text-slate-500 font-semibold">Loading profile specifications...</p>
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-950/40 bg-red-950/20 p-4 text-center text-xs font-semibold text-red-400">
              Failed to retrieve client profile details.
            </div>
          ) : customer ? (
            <>
              {/* Profile Card Header */}
              <div className="flex flex-col items-center text-center space-y-3.5 pb-6 border-b border-slate-900">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-955/20 border border-blue-900/30 text-blue-400 font-extrabold text-2xl uppercase shadow-inner">
                  {customer.name.substring(0, 2)}
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white leading-tight">{customer.name}</h3>
                  <span className="inline-block rounded-full bg-slate-900 px-3 py-0.5 text-[10px] font-bold text-slate-500 border border-slate-850 uppercase tracking-wide">
                    Customer Account
                  </span>
                </div>
              </div>

              {/* Data specifications list */}
              <div className="space-y-5 text-sm">
                {/* Email */}
                <div className="flex items-start space-x-3.5">
                  <Mail className="h-4.5 w-4.5 text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">Email address</p>
                    <p className="text-slate-200 mt-0.5 font-medium">{customer.email}</p>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start space-x-3.5">
                  <Phone className="h-4.5 w-4.5 text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">Phone Number</p>
                    <p className="text-slate-200 mt-0.5 font-mono">
                      {customer.phone || <span className="text-slate-600 font-sans italic text-xs">No phone number recorded</span>}
                    </p>
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-start space-x-3.5">
                  <MapPin className="h-4.5 w-4.5 text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">Billing Address</p>
                    <p className="text-slate-300 mt-1 text-xs leading-relaxed max-w-xs whitespace-pre-line">
                      {customer.address || <span className="text-slate-600 italic">No address recorded</span>}
                    </p>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="space-y-2 pt-6 border-t border-slate-900 text-[10px] text-slate-500 font-medium">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Registered: {formatDate(customer.created_at)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Last Updated: {formatDate(customer.updated_at)}</span>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default CustomerDetailsModal;
