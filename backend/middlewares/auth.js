const jwt = require('jsonwebtoken');

const { query } = require('../config/db');
const { sendError } = require('../utils/response');

// =====================================================
// Environment Validation
// =====================================================

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is missing.');
}

const JWT_SECRET = process.env.JWT_SECRET;

// =====================================================
// Helpers
// =====================================================

const extractBearerToken = (authHeader = '') => {
  if (typeof authHeader !== 'string') return null;
  if (!authHeader.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7).trim();
  return token || null;
};

// =====================================================
// Authentication Middleware
// =====================================================

const authenticate = async (req, res, next) => {
  try {
    const token = extractBearerToken(req.headers.authorization);

    if (!token) {
      return sendError(res, 'Authorization token is missing.', 401);
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    if (!decoded?.id) {
      return sendError(res, 'Invalid authentication token.', 401);
    }

    const result = await query(
      `
      SELECT
        id,
        email,
        first_name,
        last_name,
        role,
        is_active
      FROM users
      WHERE id = $1
      LIMIT 1
      `,
      [decoded.id]
    );

    if (result.rowCount === 0) {
      return sendError(res, 'User account not found.', 401);
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return sendError(res, 'User account is disabled.', 403);
    }

    req.user = {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      firstName: user.first_name,
      lastName: user.last_name,
      full_name: [user.first_name, user.last_name].filter(Boolean).join(' ').trim(),
      role: user.role,
      is_active: user.is_active,
      token_payload: decoded,
    };

    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendError(res, 'Authentication token has expired.', 401);
    }

    if (err.name === 'JsonWebTokenError') {
      return sendError(res, 'Invalid authentication token.', 401);
    }

    return next(err);
  }
};

module.exports = authenticate;