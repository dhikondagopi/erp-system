import React from 'react';

export const Skeleton = ({ className = '', variant = 'text', width, height }) => {
  const baseClasses = 'animate-pulse bg-slate-800/70 rounded';
  
  const variantClasses = {
    text: 'h-4 w-full',
    circular: 'rounded-full',
    rectangular: 'h-10 w-full',
  }[variant];

  const style = {};
  if (width) style.width = width;
  if (height) style.height = height;

  return (
    <div 
      className={`${baseClasses} ${variantClasses} ${className}`}
      style={style}
    />
  );
};

export const TableSkeleton = ({ rows = 5, cols = 4 }) => {
  return (
    <div className="space-y-4 w-full">
      {/* Table Header skeleton */}
      <div className="flex gap-4 p-4 bg-slate-950/20 border border-slate-900 rounded-xl">
        {Array.from({ length: cols }).map((_, idx) => (
          <Skeleton key={idx} variant="rectangular" className="h-5 flex-1" />
        ))}
      </div>
      
      {/* Table Rows skeleton */}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div key={rowIdx} className="flex gap-4 p-4 border border-slate-900 rounded-xl bg-slate-900/10">
            {Array.from({ length: cols }).map((_, colIdx) => (
              <Skeleton key={colIdx} variant="text" className="h-4 flex-1 mt-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Skeleton;
