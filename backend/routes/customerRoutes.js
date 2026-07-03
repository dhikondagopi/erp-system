const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const authenticate = require('../middlewares/auth');
const authorize = require('../middlewares/rbac');
const audit = require('../middlewares/audit');
const { USER_ROLES } = require('../config/constants');

// Apply JWT authentication universally to customer endpoints
router.use(authenticate);

// Read actions: Open to Admin, Sales User, and Business Owner
const readRoles = [USER_ROLES.ADMIN, USER_ROLES.SALES_USER, USER_ROLES.BUSINESS_OWNER];
router.get('/', authorize(readRoles), customerController.getAllCustomers);
router.get('/:id', authorize(readRoles), customerController.getCustomerById);

// Write actions (Create/Update): Restricted to Admin and Sales User roles
const writeRoles = [USER_ROLES.ADMIN, USER_ROLES.SALES_USER];
router.post('/', authorize(writeRoles), audit('CREATE_CUSTOMER', 'customers'), customerController.createCustomer);
router.put('/:id', authorize(writeRoles), audit('UPDATE_CUSTOMER', 'customers'), customerController.updateCustomer);

// Delete action: Restricted strictly to System Administrator
router.delete('/:id', authorize([USER_ROLES.ADMIN]), audit('DELETE_CUSTOMER', 'customers'), customerController.deleteCustomer);

module.exports = router;
