const express = require('express');
const router = express.Router();
const manufacturingController = require('../controllers/manufacturingController');
const authenticate = require('../middlewares/auth');
const authorize = require('../middlewares/rbac');
const audit = require('../middlewares/audit');
const { USER_ROLES } = require('../config/constants');

// Apply JWT authentication universally to manufacturing order endpoints
router.use(authenticate);

// Read actions: Open to Admin, Manufacturing User, and Business Owner
const readRoles = [USER_ROLES.ADMIN, USER_ROLES.MANUFACTURING_USER, USER_ROLES.BUSINESS_OWNER];
router.get('/', authorize(readRoles), manufacturingController.getAllManufacturingOrders);
router.get('/:id', authorize(readRoles), manufacturingController.getManufacturingOrderById);

// Create order drafts: Restricted to Admin and Manufacturing User roles
const writeRoles = [USER_ROLES.ADMIN, USER_ROLES.MANUFACTURING_USER];
router.post('/', authorize(writeRoles), audit('CREATE_MANUFACTURING_ORDER', 'manufacturing_orders'), manufacturingController.createManufacturingOrder);

// Status transitions: Allowed for Admin, Manufacturing User, and Business Owner roles
const statusRoles = [USER_ROLES.ADMIN, USER_ROLES.MANUFACTURING_USER, USER_ROLES.BUSINESS_OWNER];
router.put('/:id/status', authorize(statusRoles), audit('UPDATE_MANUFACTURING_ORDER_STATUS', 'manufacturing_orders'), manufacturingController.updateOrderStatus);

module.exports = router;
