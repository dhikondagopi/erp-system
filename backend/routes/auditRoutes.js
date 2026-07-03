const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const authenticate = require('../middlewares/auth');
const authorize = require('../middlewares/rbac');
const { USER_ROLES } = require('../config/constants');

// Apply JWT authentication universally to audit log endpoints
router.use(authenticate);

// Read actions: Open strictly to Admin and Business Owner roles
const viewRoles = [USER_ROLES.ADMIN, USER_ROLES.BUSINESS_OWNER];
router.get('/', authorize(viewRoles), auditController.getLogs);

module.exports = router;
