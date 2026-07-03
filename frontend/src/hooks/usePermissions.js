import { useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';
import {
  can,
  getNavForRole,
  ROLE_META,
  PERMISSION_MATRIX,
  ROLES,
} from '../config/permissions';

/**
 * usePermissions — Role-based permission utility hook.
 *
 * Provides fine-grained access checks that any component can consume
 * without importing the full permissions config directly.
 */
const usePermissions = () => {
  const { user } = useAuth();
  const role = user?.role || null;

  const checkCan = useCallback(
    (module, action) => can(role, module, action),
    [role]
  );

  const hasRole = useCallback(
    (allowedRoles = []) => {
      if (!role || !Array.isArray(allowedRoles)) return false;
      return allowedRoles.includes(role);
    },
    [role]
  );

  const isReadOnly = useCallback(
    (module) => {
      if (!role) return true;
      const perms = PERMISSION_MATRIX[role]?.[module] || [];
      return perms.length > 0 && !perms.includes('manage') && perms.every((p) => p === 'read');
    },
    [role]
  );

  const navGroups = useMemo(() => getNavForRole(role), [role]);
  const roleMeta = useMemo(() => (role ? ROLE_META[role] : null), [role]);

  const isAdmin = role === ROLES.ADMIN;
  const isBusinessOwner = role === ROLES.BUSINESS_OWNER;
  const currentRole = role;

  return {
    can: checkCan,
    hasRole,
    isAdmin,
    isBusinessOwner,
    isReadOnly,
    navGroups,
    roleMeta,
    currentRole,
    role,
  };
};

export default usePermissions;