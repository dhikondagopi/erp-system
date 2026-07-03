const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController');
const authenticate = require('../middlewares/auth');
const authorize = require('../middlewares/rbac');
const audit = require('../middlewares/audit');
const { USER_ROLES } = require('../config/constants');

// Apply JWT authentication universally to vendor endpoints
router.use(authenticate);

// Read actions: Open to Admin, Purchase User, and Business Owner
const readRoles = [USER_ROLES.ADMIN, USER_ROLES.PURCHASE_USER, USER_ROLES.BUSINESS_OWNER];
router.get('/', authorize(readRoles), vendorController.getAllVendors);
router.get('/performance/overview', authorize(readRoles), vendorController.getPerformanceOverview);
router.get('/:id', authorize(readRoles), vendorController.getVendorById);
router.get('/:id/scorecard', authorize(readRoles), vendorController.getVendorScorecard);

// Write actions (Create/Update): Restricted to Admin and Purchase User roles
const writeRoles = [USER_ROLES.ADMIN, USER_ROLES.PURCHASE_USER];
router.post('/', authorize(writeRoles), audit('CREATE_VENDOR', 'vendors'), vendorController.createVendor);
router.put('/:id', authorize(writeRoles), audit('UPDATE_VENDOR', 'vendors'), vendorController.updateVendor);

// Delete action: Restricted strictly to System Administrator
router.delete('/:id', authorize([USER_ROLES.ADMIN]), audit('DELETE_VENDOR', 'vendors'), vendorController.deleteVendor);

module.exports = router;
