const express = require('express');
const router = express.Router();
const warehouseController = require('../controllers/warehouseController');
const authenticate = require('../middlewares/auth');
const authorize = require('../middlewares/rbac');
const { USER_ROLES } = require('../config/constants');

const writeRoles = [USER_ROLES.ADMIN, USER_ROLES.INVENTORY_MANAGER];
const readRoles = [USER_ROLES.ADMIN, USER_ROLES.INVENTORY_MANAGER, USER_ROLES.BUSINESS_OWNER, USER_ROLES.SALES_USER, USER_ROLES.PURCHASE_USER, USER_ROLES.MANUFACTURING_USER];

router.use(authenticate);

router.get('/', authorize(readRoles), warehouseController.getAllWarehouses);
router.get('/analytics/overview', authorize(readRoles), warehouseController.getWarehouseDashboardStats);
router.get('/:id', authorize(readRoles), warehouseController.getWarehouseById);
router.get('/:id/stock', authorize(readRoles), warehouseController.getWarehouseStockSummary);

router.post('/', authorize(writeRoles), warehouseController.createWarehouse);
router.put('/:id', authorize(writeRoles), warehouseController.updateWarehouse);
router.put('/:id/disable', authorize(writeRoles), warehouseController.disableWarehouse);
router.put('/:id/enable', authorize(writeRoles), warehouseController.enableWarehouse);

module.exports = router;
