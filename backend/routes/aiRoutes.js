const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const authenticate = require('../middlewares/auth');
const authorize = require('../middlewares/rbac');
const { USER_ROLES } = require('../config/constants');

// ── Unprotected: health/diagnostics endpoint ──────────────────────────────────
router.get('/health', aiController.getHealth);

// ── All other AI routes require JWT authentication ────────────────────────────
router.use(authenticate);

router.get('/procurement', authorize([USER_ROLES.ADMIN, USER_ROLES.BUSINESS_OWNER, USER_ROLES.PURCHASE_USER]), aiController.getProcurementRecommendations);
router.get('/inventory', authorize([USER_ROLES.ADMIN, USER_ROLES.BUSINESS_OWNER, USER_ROLES.INVENTORY_MANAGER]), aiController.getInventoryInsights);
router.post('/manufacturing-plan', authorize([USER_ROLES.ADMIN, USER_ROLES.BUSINESS_OWNER, USER_ROLES.MANUFACTURING_USER]), aiController.generateProductionPlan);
router.get('/insights', authorize([USER_ROLES.ADMIN, USER_ROLES.BUSINESS_OWNER]), aiController.getBusinessInsights);
router.get('/forecast', authorize([USER_ROLES.ADMIN, USER_ROLES.BUSINESS_OWNER]), aiController.getDemandForecasts);
router.get('/vendors', authorize([USER_ROLES.ADMIN, USER_ROLES.BUSINESS_OWNER, USER_ROLES.PURCHASE_USER]), aiController.getVendorAnalysis);
router.post('/chat', authorize([
  USER_ROLES.ADMIN,
  USER_ROLES.BUSINESS_OWNER,
  USER_ROLES.SALES_USER,
  USER_ROLES.PURCHASE_USER,
  USER_ROLES.MANUFACTURING_USER,
  USER_ROLES.INVENTORY_MANAGER
]), aiController.processChatPrompt);

module.exports = router;
