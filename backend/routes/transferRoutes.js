const express = require('express');
const router = express.Router();
const transferController = require('../controllers/transferController');
const authenticate = require('../middlewares/auth');
const authorize = require('../middlewares/rbac');
const { USER_ROLES } = require('../config/constants');

const writeRoles = [USER_ROLES.ADMIN, USER_ROLES.INVENTORY_MANAGER];
const readRoles = [USER_ROLES.ADMIN, USER_ROLES.INVENTORY_MANAGER, USER_ROLES.BUSINESS_OWNER];

router.use(authenticate);

router.get('/', authorize(readRoles), transferController.getAllTransfers);
router.get('/:id', authorize(readRoles), transferController.getTransferById);

router.post('/', authorize(writeRoles), transferController.createTransfer);
router.put('/:id/approve', authorize([USER_ROLES.ADMIN, USER_ROLES.BUSINESS_OWNER]), transferController.approveTransfer); // Only business owner or admin can approve transfers
router.put('/:id/reject', authorize([USER_ROLES.ADMIN, USER_ROLES.BUSINESS_OWNER]), transferController.rejectTransfer);
router.put('/:id/cancel', authorize(writeRoles), transferController.cancelTransfer);

module.exports = router;
