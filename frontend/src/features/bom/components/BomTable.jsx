import React from 'react';
import { Link } from 'react-router-dom';
import { Eye, Edit3, Trash2, Calendar, FileText } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

const BomTable = ({ boms = [], onDelete }) => {
  const { hasRole } = useAuth();

  // Role Access Checks
  const canModify = hasRole(['Admin', 'Manufacturing User']);
  const canDelete = hasRole(['Admin']);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/20 shadow-xl">
      <div className="overflow-x-auto">
        <table id="bom-table" className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/60 text-xs font-bold uppercase tracking-wider text-slate-400">
              <th className="px-6 py-4">Recipe Name</th>
              <th className="px-6 py-4">Finished Product</th>
              <th className="px-6 py-4">Version</th>
              <th className="px-6 py-4 hidden md:table-cell">Created Date</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-850 text-slate-300 text-sm">
            {boms.map((bom) => (
              <tr 
                key={bom.id} 
                className="hover:bg-slate-850/40 transition-colors"
                id={`bom-row-${bom.id}`}
              >
                {/* Recipe Name */}
                <td className="px-6 py-4 font-semibold text-white">
                  <div className="flex items-center space-x-3">
                    <div className="rounded-lg bg-blue-500/10 p-2 text-blue-400">
                      <FileText className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <span className="block font-bold text-slate-200">{bom.name}</span>
                      <span className="block text-[11px] text-slate-500 font-medium">ID: {bom.id.substring(0, 8)}...</span>
                    </div>
                  </div>
                </td>

                {/* Finished Good Product */}
                <td className="px-6 py-4">
                  <div>
                    <span className="block font-semibold text-slate-300">{bom.finished_good_name}</span>
                    <span className="inline-block rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-slate-400 uppercase mt-0.5">
                      SKU: {bom.finished_good_sku}
                    </span>
                  </div>
                </td>

                {/* Version */}
                <td className="px-6 py-4">
                  <span className="inline-flex items-center rounded-full bg-blue-400/10 px-2.5 py-0.5 text-xs font-bold text-blue-400">
                    v{bom.version}
                  </span>
                </td>

                {/* Created Date */}
                <td className="px-6 py-4 hidden md:table-cell text-slate-450 font-medium">
                  <div className="flex items-center space-x-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-500" />
                    <span>{new Date(bom.created_at).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}</span>
                  </div>
                </td>

                {/* Actions */}
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <Link
                      to={`/bom/${bom.id}`}
                      id={`bom-view-btn-${bom.id}`}
                      title="View Details"
                      className="rounded-lg border border-slate-800 bg-slate-900 p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-all shadow-sm"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>

                    {canModify && (
                      <Link
                        to={`/bom/edit/${bom.id}`}
                        id={`bom-edit-btn-${bom.id}`}
                        title="Edit Recipe"
                        className="rounded-lg border border-slate-800 bg-slate-900 p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-all shadow-sm"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Link>
                    )}

                    {canDelete && (
                      <button
                        onClick={() => onDelete(bom)}
                        id={`bom-delete-btn-${bom.id}`}
                        title="Delete Recipe"
                        className="rounded-lg border border-red-950 bg-red-950/20 p-2 text-red-400 hover:bg-red-950/45 hover:text-red-300 transition-all shadow-sm"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BomTable;
