import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import usePermissions from '../hooks/usePermissions';
import { LogOut, ChevronRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
/**
 * Sidebar — Role-aware navigation sidebar.
 *
 * Renders only the nav groups and items the current user is permitted to see,
 * sourced from the central permissions config via `usePermissions`.
 *
 * Features:
 *  • Grouped navigation with section labels
 *  • Active route highlighting with violet accent
 *  • Role badge in user profile footer
 *  • Collapsible on mobile (controlled by AppLayout)
 */
const Sidebar = () => {
  const { user, logout } = useAuth();
  const { navGroups, roleMeta, isAdmin } = usePermissions();
  const location = useLocation();

  return (
    <aside className="fixed bottom-0 top-0 left-0 z-20 flex w-64 flex-col border-r border-slate-900 bg-slate-950/90 backdrop-blur-xl">

      {/* ── Brand Header ─────────────────────────────────────────────────── */}
      <div className="flex h-16 items-center px-5 border-b border-slate-900/60 flex-shrink-0">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 shadow-lg shadow-violet-500/20">
            <span className="text-white font-extrabold text-sm tracking-wider">SF</span>
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-white tracking-wide truncate">Shiv Furniture Works</h2>
            <p className="text-[10px] font-medium text-slate-500 tracking-wider uppercase">ERP Engine</p>
          </div>
        </div>
      </div>

      {/* ── Navigation Groups ─────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-1 scrollbar-thin">
        {navGroups.map((group, gi) => (
          <div key={group.groupLabel} className={gi > 0 ? 'pt-2' : ''}>
            {/* Section label */}
            <p className="px-5 pb-1.5 text-[9px] font-bold text-slate-600 uppercase tracking-widest select-none">
              {group.groupLabel}
            </p>

            {/* Nav items */}
            <div className="space-y-0.5 px-2">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path ||
                  (item.path !== '/dashboard' && location.pathname.startsWith(item.path));

                return (
                  <NavLink
                    key={item.key}
                    to={item.path}
                    className={() =>
                      `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                        isActive
                          ? 'bg-violet-600/10 text-violet-300 border border-violet-600/20 shadow-[inset_0_1px_0_0_rgba(139,92,246,0.08)]'
                          : 'text-slate-400 hover:bg-slate-900/50 hover:text-slate-200 border border-transparent'
                      }`
                    }
                  >
                    {/* Icon */}
                    <Icon
                      className={`h-4.5 w-4.5 flex-shrink-0 transition-colors ${
                        isActive ? 'text-violet-400' : 'text-slate-500 group-hover:text-slate-300'
                      }`}
                    />

                    {/* Label */}
                    <span className="flex-1 truncate">{item.name}</span>

                    {/* Active indicator chevron */}
                    {isActive && (
                      <ChevronRight className="h-3.5 w-3.5 text-violet-500 flex-shrink-0" />
                    )}
                  </NavLink>
                );
              })}
            </div>

            {/* Group divider — not after the last group */}
            {gi < navGroups.length - 1 && (
              <div className="mx-4 mt-3 border-t border-slate-900/60" />
            )}
          </div>
        ))}
      </nav>

      {/* ── User Profile Footer ───────────────────────────────────────────── */}
      <div className="border-t border-slate-900/60 p-4 flex-shrink-0 bg-slate-950/40 space-y-3">
        {user && (
          <div className="flex items-center gap-3 min-w-0">
            {/* Avatar */}
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600/30 to-indigo-600/30 border border-violet-500/20 text-violet-300 font-bold text-sm">
              {user.first_name?.[0]}{user.last_name?.[0]}
            </div>

            {/* Name + role badge */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-200">
                {user.first_name} {user.last_name}
              </p>
              {roleMeta && (
                <span
                  className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wide ${roleMeta.color}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${roleMeta.dot}`} />
                  {roleMeta.label}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Sign Out button */}
        <button
          onClick={logout}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-800 bg-slate-900/20 px-3 py-2 text-xs font-semibold text-slate-400 hover:bg-red-950/20 hover:text-red-400 hover:border-red-900/30 transition-all active:scale-95"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
