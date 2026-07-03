# Audit Logging Module - Integration Guide

This guide details how to integrate the newly generated [audit](file:///Users/gowrishankar/Desktop/ERP/backend/middlewares/audit.js) middleware and [auditService](file:///Users/gowrishankar/Desktop/ERP/backend/services/auditService.js) into the Express routers and business service layers.

---

## 1. Route-Level Logging (Using Middleware)

For standard CRUD endpoints (creation, updating, deletion), the `audit` middleware automatically intercepts successful HTTP responses and writes logs asynchronously.

### Example: Product Management Routes (`productRoutes.js`)

```javascript
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authenticate = require('../middlewares/auth');
const authorize = require('../middlewares/rbac');
const audit = require('../middlewares/audit'); // Import audit middleware
const { USER_ROLES } = require('../config/constants');

router.use(authenticate);

const managerRoles = [USER_ROLES.ADMIN, USER_ROLES.INVENTORY_MANAGER];

// 1. Create Product (Audited)
router.post(
  '/', 
  authorize(managerRoles), 
  audit('CREATE_PRODUCT', 'products'), // Automatically logs product creation
  productController.createProduct
);

// 2. Update Product (Audited)
router.put(
  '/:id', 
  authorize(managerRoles), 
  audit('UPDATE_PRODUCT', 'products'), // Automatically logs product edits
  productController.updateProduct
);

// 3. Delete Product (Audited)
router.delete(
  '/:id', 
  authorize(managerRoles), 
  audit('DELETE_PRODUCT', 'products'), // Automatically logs product removals
  productController.deleteProduct
);
```

---

## 2. Transactional Service-Level Logging (Using Service Layer)

For state transitions involving inventory movements, pricing updates, or status adjustments inside database transaction blocks, call `auditService.log` directly.

This guarantees that audit records are committed **only if** the parent database transaction succeeds.

### Example: Sales Order Confirmation (`salesService.js`)

```javascript
const { pool } = require('../config/db');
const auditService = require('./auditService'); // Import audit service

class SalesService {
  async confirmSalesOrder(orderId, userId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Core business logic (Stock reservations, updates)
      // ... (reserve inventory logic) ...

      // 2. Perform state update
      await client.query(
        "UPDATE sales_orders SET status = 'CONFIRMED' WHERE id = $1", 
        [orderId]
      );

      // 3. Record Audit Log inside the SAME database transaction
      await auditService.log({
        user_id: userId,
        action: 'CONFIRM_SALES_ORDER',
        entity_type: 'sales_orders',
        entity_id: orderId,
        old_value: { status: 'DRAFT' },
        new_value: { status: 'CONFIRMED' },
        ip_address: 'System Transaction'
      }, client); // Pass the transaction client context!

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
```

### Example: Manual Inventory Adjustment (`inventoryService.js`)

```javascript
const { pool } = require('../config/db');
const auditService = require('./auditService');

class InventoryService {
  async adjustStock(productId, qtyChange, userId, reason, notes) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Process adjustment
      // ... (db updates) ...

      // 2. Commit transaction log into stock ledger
      // ...

      // 3. Record audit log row in shared transaction
      await auditService.log({
        user_id: userId,
        action: 'ADJUST_INVENTORY',
        entity_type: 'inventory',
        entity_id: productId,
        old_value: { change: 0 },
        new_value: { change: qtyChange, reason },
        ip_address: 'Direct Adjustment API'
      }, client);

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
```
