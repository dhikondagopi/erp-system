const express = require('express');
const router = express.Router();
const purchaseController = require('../controllers/purchaseController');
const authenticate = require('../middlewares/auth');
const authorize = require('../middlewares/rbac');
const { USER_ROLES } = require('../config/constants');

// Apply JWT authentication universally to purchase order endpoints
router.use(authenticate);

// Read actions: Open to Admin, Purchase User, and Business Owner
const readRoles = [USER_ROLES.ADMIN, USER_ROLES.PURCHASE_USER, USER_ROLES.BUSINESS_OWNER];
router.get('/', authorize(readRoles), purchaseController.getAllPurchaseOrders);
router.get('/:id', authorize(readRoles), purchaseController.getPurchaseOrderById);

// Create order drafts: Restricted to Admin and Purchase User roles
const writeRoles = [USER_ROLES.ADMIN, USER_ROLES.PURCHASE_USER];
router.post('/', authorize(writeRoles), purchaseController.createPurchaseOrder);

// Status transitions: Allowed for Admin, Purchase User, Business Owner, and Inventory Manager
const statusRoles = [USER_ROLES.ADMIN, USER_ROLES.PURCHASE_USER, USER_ROLES.BUSINESS_OWNER, USER_ROLES.INVENTORY_MANAGER];
router.put('/:id/status', authorize(statusRoles), purchaseController.updateOrderStatus);

module.exports = router;
