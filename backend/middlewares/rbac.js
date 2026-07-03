const { sendError } = require('../utils/response');

/**
 * =====================================================
 * Role-Based Access Control (RBAC) Middleware
 * =====================================================
 *
 * Restricts access to users with specific roles.
 *
 * Usage:
 * router.get(
 *   '/users',
 *   authenticate,
 *   authorize([USER_ROLES.ADMIN])
 * );
 */

const normalizeRole = (role) => String(role || '').trim().toUpperCase();

const authorize = (allowedRoles = []) => {
  if (!Array.isArray(allowedRoles)) {
    throw new TypeError('authorize() expects an array of allowed roles.');
  }

  const normalizedRoles = allowedRoles
    .map(normalizeRole)
    .filter(Boolean);

  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Authentication required.', 401);
    }

    if (normalizedRoles.length === 0) {
      return sendError(res, 'Access denied. No roles configured for this route.', 403);
    }

    const userRole = normalizeRole(req.user.role);

    if (!userRole) {
      return sendError(res, 'Access denied. User role is missing.', 403);
    }

    if (!normalizedRoles.includes(userRole)) {
      console.warn(
        `[RBAC] Access denied | User: ${req.user.id || 'unknown'} | Role: ${userRole} | ${req.method} ${req.originalUrl}`
      );

      return sendError(res, 'Access denied. Insufficient permissions.', 403);
    }

    return next();
  };
};

module.exports = authorize;