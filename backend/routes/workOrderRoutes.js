const express = require('express');
const router = express.Router();
const workOrderController = require('../controllers/workOrderController');
const authenticate = require('../middlewares/auth');
const authorize = require('../middlewares/rbac');
const audit = require('../middlewares/audit');
const { USER_ROLES } = require('../config/constants');

// Apply JWT authentication universally to work order endpoints
router.use(authenticate);

// Read actions: Open to Admin, Manufacturing User, and Business Owner
const readRoles = [USER_ROLES.ADMIN, USER_ROLES.MANUFACTURING_USER, USER_ROLES.BUSINESS_OWNER];
router.get('/', authorize(readRoles), workOrderController.getAllWorkOrders);
router.get('/workers', authorize(readRoles), workOrderController.getWorkers);
router.get('/assigned', authorize(readRoles), workOrderController.getMyWorkOrders);
router.get('/:id', authorize(readRoles), workOrderController.getWorkOrderById);
router.get('/order/:moId', authorize(readRoles), workOrderController.getWorkOrdersByMoId);

// Write actions (Create/Assign/Status): Restricted to Admin and Manufacturing User roles
const writeRoles = [USER_ROLES.ADMIN, USER_ROLES.MANUFACTURING_USER];
router.post('/', authorize(writeRoles), audit('CREATE_WORK_ORDER', 'work_orders'), workOrderController.createWorkOrder);
router.put('/:id', authorize(writeRoles), audit('UPDATE_WORK_ORDER', 'work_orders'), workOrderController.updateWorkOrder);
router.put('/:id/assign', authorize(writeRoles), audit('ASSIGN_WORK_ORDER', 'work_orders'), workOrderController.assignWorkOrder);
router.put('/:id/status', authorize(writeRoles), audit('UPDATE_WORK_ORDER_STATUS', 'work_orders'), workOrderController.updateOrderStatus);

module.exports = router;
