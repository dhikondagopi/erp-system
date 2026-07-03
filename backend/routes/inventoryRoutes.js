const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const authenticate = require('../middlewares/auth');
const authorize = require('../middlewares/rbac');
const { USER_ROLES } = require('../config/constants');

// Apply JWT authentication universally to inventory endpoints
router.use(authenticate);

// 1. Read endpoints
// Any authenticated system user can view real-time inventory levels
router.get('/', inventoryController.getInventoryLevels);

// Historical stock ledger access: Restricted to management/owners
const ledgerRoles = [USER_ROLES.ADMIN, USER_ROLES.INVENTORY_MANAGER, USER_ROLES.BUSINESS_OWNER];
router.get('/:productId/ledger', authorize(ledgerRoles), inventoryController.getLedgerHistory);

// 2. Adjustments and movement endpoints
// Manual direct inventory adjustments (cycle counts/correction)
const adjustRoles = [USER_ROLES.ADMIN, USER_ROLES.INVENTORY_MANAGER];
router.post('/adjust', authorize(adjustRoles), inventoryController.adjustStock);

// Replenish physical stock (Purchase receipts, manufacturing finished output completion)
const addRoles = [
  USER_ROLES.ADMIN, 
  USER_ROLES.INVENTORY_MANAGER, 
  USER_ROLES.PURCHASE_USER, 
  USER_ROLES.MANUFACTURING_USER
];
router.post('/add', authorize(addRoles), inventoryController.addStock);

// Issue physical stock (manual write-off, scrap, direct sales)
const removeRoles = [USER_ROLES.ADMIN, USER_ROLES.INVENTORY_MANAGER];
router.post('/remove', authorize(removeRoles), inventoryController.removeStock);

// Allocate and reserve stock (Sales order validation, manufacturing order staging)
const reserveRoles = [
  USER_ROLES.ADMIN, 
  USER_ROLES.INVENTORY_MANAGER, 
  USER_ROLES.SALES_USER, 
  USER_ROLES.MANUFACTURING_USER
];
router.post('/reserve', authorize(reserveRoles), inventoryController.reserveStock);

// Release allocated reserves (cancellation or adjustment of sales/manufacturing orders)
router.post('/release', authorize(reserveRoles), inventoryController.releaseStock);

// Finalize shipments (deduct physical and reserved stock)
const shipRoles = [USER_ROLES.ADMIN, USER_ROLES.INVENTORY_MANAGER, USER_ROLES.SALES_USER];
router.post('/ship', authorize(shipRoles), inventoryController.shipReservedStock);

module.exports = router;
