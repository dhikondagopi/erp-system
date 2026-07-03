const express = require('express');
const router = express.Router();
const bomController = require('../controllers/bomController');
const authenticate = require('../middlewares/auth');
const authorize = require('../middlewares/rbac');
const audit = require('../middlewares/audit');
const { USER_ROLES } = require('../config/constants');

// Apply JWT authentication universally to BoM endpoints
router.use(authenticate);

// Read actions: Open to Admin, Manufacturing User, and Business Owner
const readRoles = [USER_ROLES.ADMIN, USER_ROLES.MANUFACTURING_USER, USER_ROLES.BUSINESS_OWNER];
router.get('/', authorize(readRoles), bomController.getAllBoms);
router.get('/:id', authorize(readRoles), bomController.getBomById);
router.get('/product/:finishedGoodId', authorize(readRoles), bomController.getBomByFinishedGoodId);
router.get('/product/:finishedGoodId/cost-analysis', authorize(readRoles), bomController.getManufacturingCostAnalysis);

// Write actions (Create/Update): Restricted to Admin and Manufacturing User roles
const writeRoles = [USER_ROLES.ADMIN, USER_ROLES.MANUFACTURING_USER];
router.post('/', authorize(writeRoles), audit('CREATE_BOM', 'bills_of_materials'), bomController.createBom);
router.put('/:id', authorize(writeRoles), audit('UPDATE_BOM', 'bills_of_materials'), bomController.updateBom);

// Delete action: Restricted strictly to System Administrator
router.delete('/:id', authorize([USER_ROLES.ADMIN]), audit('DELETE_BOM', 'bills_of_materials'), bomController.deleteBom);

module.exports = router;
