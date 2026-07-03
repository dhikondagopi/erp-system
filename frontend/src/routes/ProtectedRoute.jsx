import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * ProtectedRoute — Route guard that enforces authentication and role-based access.
 *
 * Behaviour:
 * 1. While auth state is resolving → show full-screen loading spinner
 * 2. Not authenticated → redirect to /login (preserving return URL)
 * 3. Authenticated but wrong role → redirect to /unauthorized
 * 4. Correct role → render children
 *
 * @param {React.ReactNode} children
 * @param {string[]} allowedRoles
 */
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, isLoading, hasRole } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center space-y-5">
          <div className="relative h-14 w-14">
            <div className="absolute inset-0 rounded-full border-4 border-slate-800" />
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-violet-500" />
          </div>

          <div className="space-y-1 text-center">
            <p className="text-sm font-semibold text-slate-300">
              Loading ERP Environment
            </p>
            <p className="text-xs text-slate-600">
              Verifying your session…
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !hasRole(allowedRoles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;