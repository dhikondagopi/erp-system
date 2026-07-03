const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authenticate = require('../middlewares/auth');
const authorize = require('../middlewares/rbac');
const { USER_ROLES } = require('../config/constants');

// Apply JWT authentication universally to dashboard endpoints
router.use(authenticate);

// Analytics endpoints: Restricted to Admin and Business Owner roles only
const viewerRoles = [USER_ROLES.ADMIN, USER_ROLES.BUSINESS_OWNER];
router.get('/stats', authorize(viewerRoles), dashboardController.getDashboardSummary);

module.exports = router;
