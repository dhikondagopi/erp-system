const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authenticate = require('../middlewares/auth');
const authorize = require('../middlewares/rbac');
const { USER_ROLES } = require('../config/constants');

const readRoles = [USER_ROLES.ADMIN, USER_ROLES.BUSINESS_OWNER, USER_ROLES.SALES_USER, USER_ROLES.PURCHASE_USER];
const writeRoles = [USER_ROLES.ADMIN, USER_ROLES.BUSINESS_OWNER, USER_ROLES.SALES_USER, USER_ROLES.PURCHASE_USER];

router.use(authenticate);

router.get('/', authorize(readRoles), paymentController.getAllPayments);
router.get('/analytics/overview', authorize(readRoles), paymentController.getDashboardPaymentsStats);
router.get('/invoice/:invoiceType/:invoiceId', authorize(readRoles), paymentController.getPaymentsByInvoice);

router.post('/', authorize(writeRoles), paymentController.recordPayment);

module.exports = router;
