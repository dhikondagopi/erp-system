const express = require("express");
const rateLimit = require("express-rate-limit");

const router = express.Router();

const authController = require("../controllers/authController");

const authenticate = require("../middlewares/auth");
const authorize = require("../middlewares/rbac");

const { USER_ROLES } = require("../config/constants");

// =====================================================
// Login Rate Limiter
// =====================================================

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Too many login attempts. Please try again in 15 minutes.",
  },
});

// =====================================================
// Public Routes
// =====================================================

router.post(
  "/login",
  loginLimiter,
  authController.login
);

// =====================================================
// Protected Routes
// =====================================================

router.post(
  "/register",
  authController.register
);

router.post(
  "/logout",
  authenticate,
  authController.logout
);

module.exports = router;