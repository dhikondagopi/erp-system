const express = require('express');
const router = express.Router();

const productController = require('../controllers/productController');
const authenticate = require('../middlewares/auth');
const authorize = require('../middlewares/rbac');
const audit = require('../middlewares/audit');

const {
  USER_ROLES,
  AUDIT_ACTIONS,
} = require('../config/constants');

/**
 * ==========================================================
 * Product Routes
 * ==========================================================
 */

// ----------------------------------------------------------
// Authentication
// ----------------------------------------------------------

router.use(authenticate);

// ----------------------------------------------------------
// Roles
// ----------------------------------------------------------

const PRODUCT_MANAGERS = [
  USER_ROLES.ADMIN,
  USER_ROLES.INVENTORY_MANAGER,
  USER_ROLES.BUSINESS_OWNER,
];

// ----------------------------------------------------------
// Read Routes
// Accessible by all authenticated users
// ----------------------------------------------------------

router.get('/', productController.getAllProducts);

router.get(
  '/templates/list',
  productController.getProductTemplates
);

router.get(
  '/barcode/:barcode',
  productController.getProductByBarcode
);

router.get(
  '/:id',
  productController.getProductById
);

// ----------------------------------------------------------
// Write Routes
// ----------------------------------------------------------

router.post(
  '/',
  authorize(PRODUCT_MANAGERS),
  audit(AUDIT_ACTIONS.CREATE, 'products'),
  productController.createProduct
);

router.put(
  '/:id',
  authorize(PRODUCT_MANAGERS),
  audit(AUDIT_ACTIONS.UPDATE, 'products'),
  productController.updateProduct
);

router.delete(
  '/:id',
  authorize([USER_ROLES.ADMIN]),
  audit(AUDIT_ACTIONS.DELETE, 'products'),
  productController.deleteProduct
);

module.exports = router;