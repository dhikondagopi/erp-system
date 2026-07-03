import React from 'react';
import { PackageOpen } from 'lucide-react';

const EmptyState = ({
  icon: Icon = PackageOpen,
  title = 'No records found',
  description = 'Try adjusting your filters or search query to find what you are looking for.',
  actionButton
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-slate-900 bg-slate-950/20 max-w-lg mx-auto my-8 space-y-4">
      <div className="w-14 h-14 rounded-2xl bg-slate-900/50 border border-slate-800 flex items-center justify-center text-slate-500">
        <Icon className="h-7 w-7" />
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-slate-200 tracking-wide uppercase">{title}</h3>
        <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-sm">
          {description}
        </p>
      </div>
      {actionButton && (
        <div className="pt-2">
          {actionButton}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
