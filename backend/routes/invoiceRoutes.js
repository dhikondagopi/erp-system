const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const authenticate = require('../middlewares/auth');
const authorize = require('../middlewares/rbac');
const { USER_ROLES } = require('../config/constants');

const viewRoles = [USER_ROLES.ADMIN, USER_ROLES.BUSINESS_OWNER, USER_ROLES.SALES_USER, USER_ROLES.PURCHASE_USER, USER_ROLES.INVENTORY_MANAGER];
const salesWriteRoles = [USER_ROLES.ADMIN, USER_ROLES.SALES_USER];
const purchaseWriteRoles = [USER_ROLES.ADMIN, USER_ROLES.PURCHASE_USER];

router.use(authenticate);

// List Invoices
router.get('/sales', authorize(viewRoles), invoiceController.getAllSalesInvoices);
router.get('/purchase', authorize(viewRoles), invoiceController.getAllPurchaseInvoices);

// Details & PDF
router.get('/sales/:id', authorize(viewRoles), invoiceController.getSalesInvoiceById);
router.get('/purchase/:id', authorize(viewRoles), invoiceController.getPurchaseInvoiceById);
router.get('/sales/:id/pdf', authorize(viewRoles), invoiceController.getSalesInvoicePDF);
router.get('/purchase/:id/pdf', authorize(viewRoles), invoiceController.getPurchaseInvoicePDF);

// Create Invoices
router.post('/sales', authorize(salesWriteRoles), invoiceController.createSalesInvoice);
router.post('/purchase', authorize(purchaseWriteRoles), invoiceController.createPurchaseInvoice);

module.exports = router;
