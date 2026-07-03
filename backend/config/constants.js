/**
 * ==========================================================
 * Global Constants
 * Shiv Furniture Works ERP
 * ==========================================================
 */

// ==========================================================
// User Roles
// ==========================================================

const USER_ROLES = Object.freeze({
  ADMIN: 'Admin',
  SALES_USER: 'Sales User',
  PURCHASE_USER: 'Purchase User',
  MANUFACTURING_USER: 'Manufacturing User',
  INVENTORY_MANAGER: 'Inventory Manager',
  BUSINESS_OWNER: 'Business Owner',
});

// ==========================================================
// Product
// ==========================================================

const PRODUCT_TYPES = Object.freeze({
  RAW_MATERIAL: 'RAW_MATERIAL',
  FINISHED_GOOD: 'FINISHED_GOOD',
});

// ==========================================================
// Procurement
// ==========================================================

const PROCUREMENT_TYPES = Object.freeze({
  PURCHASE: 'PURCHASE',
  MANUFACTURE: 'MANUFACTURE',
});

const REPLENISHMENT_STRATEGIES = Object.freeze({
  MAKE_TO_STOCK: 'MAKE_TO_STOCK',
  MAKE_TO_ORDER: 'MAKE_TO_ORDER',
});

// ==========================================================
// Inventory
// ==========================================================

const TRANSACTION_TYPES = Object.freeze({
  RECEIPT: 'RECEIPT',
  ISSUE: 'ISSUE',
  ADJUSTMENT: 'ADJUSTMENT',
  ALLOCATION: 'ALLOCATION',
  DEALLOCATION: 'DEALLOCATION',
});

const REFERENCE_TYPES = Object.freeze({
  SALES_ORDER: 'SALES_ORDER',
  PURCHASE_ORDER: 'PURCHASE_ORDER',
  MANUFACTURING_ORDER: 'MANUFACTURING_ORDER',
  MANUAL: 'MANUAL',
});

// ==========================================================
// Sales Order
// ==========================================================

const SALES_ORDER_STATUS = Object.freeze({
  DRAFT: 'DRAFT',
  APPROVED: 'APPROVED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
});

// ==========================================================
// Purchase Order
// ==========================================================

const PURCHASE_ORDER_STATUS = Object.freeze({
  DRAFT: 'DRAFT',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  RECEIVED: 'RECEIVED',
  CANCELLED: 'CANCELLED',
});

// ==========================================================
// Manufacturing
// ==========================================================

const MANUFACTURING_ORDER_STATUS = Object.freeze({
  DRAFT: 'DRAFT',
  APPROVED: 'APPROVED',
  IN_PRODUCTION: 'IN_PRODUCTION',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
});

const WORK_ORDER_STATUS = Object.freeze({
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  PAUSED: 'PAUSED',
});

// ==========================================================
// Invoice
// ==========================================================

const INVOICE_STATUS = Object.freeze({
  DRAFT: 'DRAFT',
  ISSUED: 'ISSUED',
  PAID: 'PAID',
  PARTIALLY_PAID: 'PARTIALLY_PAID',
  CANCELLED: 'CANCELLED',
});

// ==========================================================
// Payments
// ==========================================================

const PAYMENT_STATUS = Object.freeze({
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
});

// ==========================================================
// Audit
// ==========================================================

const AUDIT_ACTIONS = Object.freeze({
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  CREATE_USER: 'CREATE_USER',
});

// ==========================================================
// Upload
// ==========================================================

const UPLOAD = Object.freeze({
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
});

// ==========================================================
// Pagination
// ==========================================================

const PAGINATION = Object.freeze({
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
});

// ==========================================================
// Security
// ==========================================================

const PASSWORD = Object.freeze({
  MIN_LENGTH: 8,
});

const JWT = Object.freeze({
  EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
});

// ==========================================================
// Validation
// ==========================================================

const REGEX = Object.freeze({
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
});

// ==========================================================
// Exports
// ==========================================================

module.exports = {
  USER_ROLES,

  PRODUCT_TYPES,

  PROCUREMENT_TYPES,
  REPLENISHMENT_STRATEGIES,

  TRANSACTION_TYPES,
  REFERENCE_TYPES,

  SALES_ORDER_STATUS,
  PURCHASE_ORDER_STATUS,
  MANUFACTURING_ORDER_STATUS,
  WORK_ORDER_STATUS,

  INVOICE_STATUS,
  PAYMENT_STATUS,

  AUDIT_ACTIONS,

  UPLOAD,

  PAGINATION,

  PASSWORD,

  JWT,

  REGEX,
};