const express = require('express');

const router = express.Router();

const { sendSuccess } = require('../utils/response');

const authenticate = require('../middlewares/auth');
const authorize = require('../middlewares/rbac');

const inventoryController = require('../controllers/inventoryController');

const { USER_ROLES } = require('../config/constants');

const authRoutes = require('./authRoutes');
const productRoutes = require('./productRoutes');
const customerRoutes = require('./customerRoutes');
const vendorRoutes = require('./vendorRoutes');
const warehouseRoutes = require('./warehouseRoutes');
const inventoryRoutes = require('./inventoryRoutes');
const transferRoutes = require('./transferRoutes');
const salesRoutes = require('./salesRoutes');
const invoiceRoutes = require('./invoiceRoutes');
const paymentRoutes = require('./paymentRoutes');
const purchaseRoutes = require('./purchaseRoutes');
const procurementRoutes = require('./procurementRoutes');
const bomRoutes = require('./bomRoutes');
const manufacturingRoutes = require('./manufacturingRoutes');
const workOrderRoutes = require('./workOrderRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const reportsRoutes = require('./reportsRoutes');
const aiRoutes = require('./aiRoutes');
const notificationRoutes = require('./notificationRoutes');
const auditRoutes = require('./auditRoutes');
const searchRoutes = require('./searchRoutes');
const uploadRoutes = require('./uploadRoutes');

// =====================================================
// Role Configuration
// =====================================================

const ledgerRoles = [
  USER_ROLES.ADMIN,
  USER_ROLES.INVENTORY_MANAGER,
  USER_ROLES.BUSINESS_OWNER,
];

// =====================================================
// Health Check
// =====================================================

router.get('/health', (req, res) => {
  return sendSuccess(res, 'ERP API Gateway is running.', {
    status: 'HEALTHY',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
  });
});

// =====================================================
// Authentication
// =====================================================

router.use('/auth', authRoutes);

// =====================================================
// Master Data
// =====================================================

router.use('/products', productRoutes);
router.use('/customers', customerRoutes);
router.use('/vendors', vendorRoutes);
router.use('/warehouses', warehouseRoutes);

// =====================================================
// Inventory
// =====================================================

router.use('/inventory', inventoryRoutes);
router.use('/transfers', transferRoutes);

router.get(
  '/stock-ledger',
  authenticate,
  authorize(ledgerRoles),
  inventoryController.getGlobalLedgerHistory
);

// =====================================================
// Sales
// =====================================================

router.use('/sales-orders', salesRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/payments', paymentRoutes);

// =====================================================
// Purchase
// =====================================================

router.use('/purchase-orders', purchaseRoutes);
router.use('/procurement', procurementRoutes);

// =====================================================
// Manufacturing
// =====================================================

router.use('/bom', bomRoutes);
router.use('/manufacturing-orders', manufacturingRoutes);
router.use('/work-orders', workOrderRoutes);

// =====================================================
// Reports & Dashboard
// =====================================================

router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportsRoutes);

// =====================================================
// AI
// =====================================================

router.use('/ai', aiRoutes);

// =====================================================
// System
// =====================================================

router.use('/notifications', notificationRoutes);
router.use('/audit', auditRoutes);
router.use('/audit-logs', auditRoutes);
router.use('/search', searchRoutes);
router.use('/upload', uploadRoutes);

module.exports = router;