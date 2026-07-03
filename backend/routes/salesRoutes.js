const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController');
const authenticate = require('../middlewares/auth');
const authorize = require('../middlewares/rbac');
const { USER_ROLES } = require('../config/constants');

// Apply JWT authentication universally to sales order endpoints
router.use(authenticate);

// Read actions: Open to Admin, Sales User, and Business Owner
const readRoles = [USER_ROLES.ADMIN, USER_ROLES.SALES_USER, USER_ROLES.BUSINESS_OWNER];
router.get('/', authorize(readRoles), salesController.getAllSalesOrders);
router.get('/:id', authorize(readRoles), salesController.getSalesOrderById);

// Create order drafts: Restricted to Admin and Sales User roles
const writeRoles = [USER_ROLES.ADMIN, USER_ROLES.SALES_USER];
router.post('/', authorize(writeRoles), salesController.createSalesOrder);

// Status transitions: Allowed for Admin, Sales User, Business Owner, and Inventory Manager roles
const statusRoles = [USER_ROLES.ADMIN, USER_ROLES.SALES_USER, USER_ROLES.BUSINESS_OWNER, USER_ROLES.INVENTORY_MANAGER];
router.put('/:id/status', authorize(statusRoles), salesController.updateOrderStatus);

module.exports = router;
