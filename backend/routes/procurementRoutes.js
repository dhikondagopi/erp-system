const express = require('express');
const router = express.Router();
const procurementController = require('../controllers/procurementController');
const authenticate = require('../middlewares/auth');
const authorize = require('../middlewares/rbac');
const { USER_ROLES } = require('../config/constants');

// Apply JWT authentication universally to procurement automation endpoints
router.use(authenticate);

// 1. Fetch stock reorder alerts: Open to Admin, Purchase User, and Business Owner
const readRoles = [USER_ROLES.ADMIN, USER_ROLES.PURCHASE_USER, USER_ROLES.BUSINESS_OWNER];
router.get('/alerts', authorize(readRoles), procurementController.getProcurementAlerts);

// 2. Trigger auto-replenishment generation: Restricted to Admin and Purchase User roles
const writeRoles = [USER_ROLES.ADMIN, USER_ROLES.PURCHASE_USER];
router.post('/auto-replenish', authorize(writeRoles), procurementController.runAutoReplenishment);

module.exports = router;
