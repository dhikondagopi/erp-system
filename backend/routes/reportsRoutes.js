const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const authenticate = require('../middlewares/auth');
const authorize = require('../middlewares/rbac');
const { USER_ROLES } = require('../config/constants');

// Apply JWT authentication universally to report endpoints
router.use(authenticate);

// Restrict report exports to Admins and Business Owners
const reportRoles = [USER_ROLES.ADMIN, USER_ROLES.BUSINESS_OWNER];
router.get('/:type', authorize(reportRoles), reportsController.getReport);

module.exports = router;
