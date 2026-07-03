const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { query } = require('../config/db');
const { sendSuccess, sendError } = require('../utils/response');
const auditService = require('../services/auditService');
const { USER_ROLES } = require('../config/constants');

// =====================================================
// Environment Validation
// =====================================================

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is missing.');
}

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// =====================================================
// Helpers
// =====================================================

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

class AuthController {
  /**
   * Login
   */
  login = async (req, res, next) => {
    try {
      const email = req.body.email?.trim().toLowerCase();
      const password = req.body.password;

      if (!email || !password) {
        return sendError(
          res,
          'Email and password are required.',
          400
        );
      }

      if (!EMAIL_REGEX.test(email)) {
        return sendError(
          res,
          'Invalid email format.',
          400
        );
      }

      const userResult = await query(
        `
        SELECT
          id,
          email,
          password_hash,
          first_name,
          last_name,
          role,
          is_active
        FROM users
        WHERE email = $1
        `,
        [email]
      );

      if (userResult.rowCount === 0) {
        return sendError(
          res,
          'Invalid email or password.',
          401
        );
      }

      const user = userResult.rows[0];

      if (!user.is_active) {
        return sendError(
          res,
          'User account is deactivated.',
          403
        );
      }

      const passwordMatch = await bcrypt.compare(
        password,
        user.password_hash
      );

      if (!passwordMatch) {
        return sendError(
          res,
          'Invalid email or password.',
          401
        );
      }

      const token = jwt.sign(
        {
          id: user.id,
          role: user.role,
        },
        JWT_SECRET,
        {
          expiresIn: JWT_EXPIRES_IN,
        }
      );

      await auditService.log({
        user_id: user.id,
        action: 'LOGIN',
        entity_type: 'User',
        entity_id: user.id,
        ip_address: req.ip,
      });

      return sendSuccess(res, 'Login successful.', {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
        },
        token,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Register
   */
  register = async (req, res, next) => {
    try {
      let {
        email,
        password,
        first_name,
        last_name,
        role,
      } = req.body;

      email = email?.trim().toLowerCase();
      first_name = first_name?.trim();
      last_name = last_name?.trim();

      if (
        !email ||
        !password ||
        !first_name ||
        !last_name ||
        !role
      ) {
        return sendError(
          res,
          'All fields are required.',
          400
        );
      }

      if (!EMAIL_REGEX.test(email)) {
        return sendError(
          res,
          'Invalid email format.',
          400
        );
      }

      if (password.length < 8) {
        return sendError(
          res,
          'Password must contain at least 8 characters.',
          400
        );
      }

      const validRoles = Object.values(USER_ROLES);

      if (!validRoles.includes(role)) {
        return sendError(
          res,
          'Invalid user role.',
          400
        );
      }

      const existingUser = await query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (existingUser.rowCount > 0) {
        return sendError(
          res,
          'Email is already registered.',
          409
        );
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const insertResult = await query(
        `
        INSERT INTO users
        (
          email,
          password_hash,
          first_name,
          last_name,
          role,
          is_active
        )
        VALUES
        (
          $1,
          $2,
          $3,
          $4,
          $5,
          TRUE
        )
        RETURNING
          id,
          email,
          first_name,
          last_name,
          role
        `,
        [
          email,
          passwordHash,
          first_name,
          last_name,
          role,
        ]
      );

      const newUser = insertResult.rows[0];

      const token = jwt.sign(
        {
          id: newUser.id,
          role: newUser.role,
        },
        JWT_SECRET,
        {
          expiresIn: JWT_EXPIRES_IN,
        }
      );

      await auditService.log({
        user_id: req.user?.id || newUser.id,
        action: 'CREATE_USER',
        entity_type: 'User',
        entity_id: newUser.id,
        ip_address: req.ip,
      });

      return sendSuccess(
        res,
        'User registered successfully.',
        {
          user: {
            id: newUser.id,
            email: newUser.email,
            firstName: newUser.first_name,
            lastName: newUser.last_name,
            role: newUser.role,
          },
          token,
        },
        201
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Logout
   */
  logout = async (req, res, next) => {
    try {
      if (req.user) {
        await auditService.log({
          user_id: req.user.id,
          action: 'LOGOUT',
          entity_type: 'User',
          entity_id: req.user.id,
          ip_address: req.ip,
        });
      }

      return sendSuccess(
        res,
        'Logout successful.'
      );
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new AuthController();