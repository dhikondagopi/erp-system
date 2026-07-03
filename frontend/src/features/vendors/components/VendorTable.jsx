import React from 'react';
import { Link } from 'react-router-dom';
import { Eye, Edit2, Trash2 } from 'lucide-react';

const VendorTable = ({ vendors, onViewDetails, onDelete, canModify }) => {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-900 bg-slate-950/20 backdrop-blur-md">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-slate-900 bg-slate-950/60 text-xs font-bold uppercase tracking-wider text-slate-400">
            <th className="px-6 py-4">Vendor Name</th>
            <th className="px-6 py-4">Email Address</th>
            <th className="px-6 py-4">Phone Number</th>
            <th className="px-6 py-4">Billing Address</th>
            <th className="px-6 py-4 text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-900 bg-transparent text-slate-350">
          {vendors.map((vendor) => (
            <tr key={vendor.id} className="hover:bg-slate-900/30 transition-colors">
              {/* Name with initials */}
              <td className="px-6 py-4.5">
                <div className="flex items-center space-x-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-955/30 border border-emerald-900/20 text-emerald-400 font-bold text-xs uppercase">
                    {vendor.name.substring(0, 2)}
                  </div>
                  <span className="font-semibold text-slate-200 text-sm">{vendor.name}</span>
                </div>
              </td>

              {/* Email */}
              <td className="px-6 py-4.5 text-slate-300 font-medium">
                {vendor.email}
              </td>

              {/* Phone */}
              <td className="px-6 py-4.5 font-mono text-slate-400">
                {vendor.phone || <span className="text-slate-600 font-sans italic">N/A</span>}
              </td>

              {/* Address */}
              <td className="px-6 py-4.5 max-w-xs text-slate-400">
                <p className="truncate text-xs" title={vendor.address}>
                  {vendor.address || <span className="text-slate-650 italic">No address recorded</span>}
                </p>
              </td>

              {/* Actions Grid */}
              <td className="px-6 py-4.5 text-center">
                <div className="flex items-center justify-center space-x-2">
                  {/* View Details */}
                  <button
                    onClick={() => onViewDetails(vendor.id)}
                    className="flex h-7.5 w-7.5 items-center justify-center rounded-md border border-slate-800 bg-slate-900/30 text-slate-400 hover:bg-slate-900 hover:text-slate-200 active:scale-90 transition-all"
                    title="View Details"
                  >
                    <Eye className="h-4 w-4" />
                  </button>

                  {/* Edit (RBAC) */}
                  {canModify && (
                    <Link
                      to={`/vendors/edit/${vendor.id}`}
                      className="flex h-7.5 w-7.5 items-center justify-center rounded-md border border-slate-800 bg-slate-900/30 text-slate-400 hover:bg-slate-900 hover:text-emerald-400 active:scale-90 transition-all"
                      title="Edit Profile"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Link>
                  )}

                  {/* Delete (RBAC) */}
                  {canModify && (
                    <button
                      onClick={() => onDelete(vendor)}
                      className="flex h-7.5 w-7.5 items-center justify-center rounded-md border border-slate-800 bg-slate-900/30 text-slate-400 hover:bg-red-950/20 hover:text-red-400 hover:border-red-900/30 active:scale-90 transition-all"
                      title="Delete Profile"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default VendorTable;
