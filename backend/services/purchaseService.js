const { pool } = require('../config/db');
const purchaseRepository = require('../repositories/purchaseRepository');
const { PO_STATUS, TRANSACTION_TYPES, REFERENCE_TYPES } = require('../config/constants');
const notificationService = require('./notificationService');
const auditService = require('./auditService');

/**
 * Purchase Order Service.
 * Implements business logic and transaction management for procurement actions.
 */
class PurchaseService {
  /**
   * Fetch purchase order details by ID.
   */
  async getPurchaseOrderById(id) {
    const order = await purchaseRepository.findById(id);
    if (!order) {
      const error = new Error(`Purchase Order with ID '${id}' not found.`);
      error.statusCode = 404;
      throw error;
    }
    return order;
  }

  /**
   * Fetch paginated list of purchase orders.
   */
  async getAllPurchaseOrders(queryParams) {
    const { vendorId, status, page = 1, limit = 50 } = queryParams;
    const parsedPage = Math.max(1, parseInt(page, 10));
    const parsedLimit = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const offset = (parsedPage - 1) * parsedLimit;

    const { orders, total } = await purchaseRepository.findAll({
      vendorId,
      status,
      limit: parsedLimit,
      offset
    });

    return {
      orders,
      pagination: {
        totalItems: total,
        itemsPerPage: parsedLimit,
        currentPage: parsedPage,
        totalPages: Math.ceil(total / parsedLimit)
      }
    };
  }

  /**
   * Draft a new Purchase Order.
   */
  async createPurchaseOrder(orderData, userId) {
    const { vendor_id, items } = orderData;

    // Generate unique serial formatting: PO-YYYYMMDD-XXXX
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `PO-${todayStr}-${randSuffix}`;

    // Verify vendor exists
    const vendorRes = await pool.query('SELECT id FROM vendors WHERE id = $1', [vendor_id]);
    if (vendorRes.rows.length === 0) {
      const error = new Error('Vendor does not exist.');
      error.statusCode = 400;
      throw error;
    }

    // Verify all products exist and calculate order total cost
    let totalAmount = 0.00;
    const validatedItems = [];

    for (const item of items) {
      const prodRes = await pool.query('SELECT id, name, unit_cost FROM products WHERE id = $1', [item.product_id]);
      if (prodRes.rows.length === 0) {
        const error = new Error(`Product reference conflict: Product ID '${item.product_id}' does not exist.`);
        error.statusCode = 400;
        throw error;
      }
      
      const product = prodRes.rows[0];
      const qty = parseFloat(item.quantity);
      const cost = parseFloat(item.unit_cost || product.unit_cost);
      
      totalAmount += qty * cost;
      validatedItems.push({
        product_id: item.product_id,
        quantity: qty,
        unit_cost: cost
      });
    }

    const payload = {
      order_number: orderNumber,
      vendor_id,
      status: PO_STATUS.DRAFT,
      total_amount: totalAmount,
      created_by: userId
    };

    return await purchaseRepository.create(payload, validatedItems);
  }

  /**
   * Submit Purchase Order for approval (DRAFT -> PENDING_APPROVAL).
   */
  async submitPurchaseOrder(id, userId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const order = await purchaseRepository.findById(id, client);
      if (!order) {
        const error = new Error(`Purchase Order with ID '${id}' not found.`);
        error.statusCode = 404;
        throw error;
      }

      if (order.status !== PO_STATUS.DRAFT) {
        const error = new Error(`Cannot submit Purchase Order: status is '${order.status}'. Only DRAFT orders can be submitted.`);
        error.statusCode = 400;
        throw error;
      }

      await purchaseRepository.updateStatus(id, PO_STATUS.PENDING_APPROVAL, client);

      // Trigger audit log
      await auditService.log({
        user_id: userId,
        action: 'SUBMIT_PURCHASE_ORDER',
        entity_type: 'purchase_orders',
        entity_id: id,
        old_value: { status: PO_STATUS.DRAFT },
        new_value: { status: PO_STATUS.PENDING_APPROVAL },
        ip_address: 'System Service'
      }, client);

      // Notify Business Owner / Admin
      await notificationService.createNotification({
        title: 'Purchase Approval Required',
        message: `Purchase Order ${order.order_number} has been submitted and requires approval.`,
        type: 'PURCHASE_APPROVAL_REQUIRED',
        role: 'Business Owner'
      }, client);

      await client.query('COMMIT');
      return await purchaseRepository.findById(id);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Approve Purchase Order (PENDING_APPROVAL -> APPROVED).
   * Increments the 'qty_incoming' field in products inventory.
   */
  async approvePurchaseOrder(id, userId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const order = await purchaseRepository.findById(id, client);
      if (!order) {
        const error = new Error(`Purchase Order with ID '${id}' not found.`);
        error.statusCode = 404;
        throw error;
      }

      if (order.status !== PO_STATUS.PENDING_APPROVAL) {
        const error = new Error(`Cannot approve Purchase Order: status is '${order.status}'. Only PENDING_APPROVAL orders can be approved.`);
        error.statusCode = 400;
        throw error;
      }

      // Increment incoming stock flags
      for (const item of order.items) {
        await client.query(
          'UPDATE inventory SET qty_incoming = qty_incoming + $2, updated_at = now() WHERE product_id = $1',
          [item.product_id, parseFloat(item.quantity)]
        );
      }

      await purchaseRepository.updateStatus(id, PO_STATUS.APPROVED, client);

      // Trigger audit log
      await auditService.log({
        user_id: userId,
        action: 'APPROVE_PURCHASE_ORDER',
        entity_type: 'purchase_orders',
        entity_id: id,
        old_value: { status: PO_STATUS.PENDING_APPROVAL },
        new_value: { status: PO_STATUS.APPROVED },
        ip_address: 'System Service'
      }, client);

      // Notify Creator / Purchase Role
      await notificationService.createNotification({
        title: 'Purchase Order Approved',
        message: `Purchase Order ${order.order_number} has been APPROVED by owner.`,
        type: 'PURCHASE_APPROVED',
        user_id: order.created_by
      }, client);

      await client.query('COMMIT');
      return await purchaseRepository.findById(id);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Reject Purchase Order (PENDING_APPROVAL -> REJECTED).
   */
  async rejectPurchaseOrder(id, userId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const order = await purchaseRepository.findById(id, client);
      if (!order) {
        const error = new Error(`Purchase Order with ID '${id}' not found.`);
        error.statusCode = 404;
        throw error;
      }

      if (order.status !== PO_STATUS.PENDING_APPROVAL) {
        const error = new Error(`Cannot reject Purchase Order: status is '${order.status}'. Only PENDING_APPROVAL orders can be rejected.`);
        error.statusCode = 400;
        throw error;
      }

      await purchaseRepository.updateStatus(id, PO_STATUS.REJECTED, client);

      // Trigger audit log
      await auditService.log({
        user_id: userId,
        action: 'REJECT_PURCHASE_ORDER',
        entity_type: 'purchase_orders',
        entity_id: id,
        old_value: { status: PO_STATUS.PENDING_APPROVAL },
        new_value: { status: PO_STATUS.REJECTED },
        ip_address: 'System Service'
      }, client);

      // Notify Creator
      await notificationService.createNotification({
        title: 'Purchase Order Rejected',
        message: `Purchase Order ${order.order_number} has been REJECTED.`,
        type: 'PURCHASE_REJECTED',
        user_id: order.created_by
      }, client);

      await client.query('COMMIT');
      return await purchaseRepository.findById(id);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Receive Purchase Order items.
   * Decrements incoming stock, increments physical on hand stock, and updates product unit cost (moving average).
   */
  async receivePurchaseOrder(id, userId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const order = await purchaseRepository.findById(id, client);
      if (!order) {
        const error = new Error(`Purchase Order with ID '${id}' not found.`);
        error.statusCode = 404;
        throw error;
      }

      if (order.status !== PO_STATUS.APPROVED) {
        const error = new Error(`Cannot receive Purchase Order: status is '${order.status}'. Only APPROVED orders can be received.`);
        error.statusCode = 400;
        throw error;
      }

      for (const item of order.items) {
        // Lock inventory table row
        const invRes = await client.query(
          'SELECT qty_on_hand, qty_incoming, location FROM inventory WHERE product_id = $1 FOR UPDATE',
          [item.product_id]
        );

        const inv = invRes.rows[0];
        const qtyOnHand = parseFloat(inv.qty_on_hand);
        const qtyIncoming = parseFloat(inv.qty_incoming);
        const receivedQty = parseFloat(item.quantity);

        // Lock product row to fetch/update unit cost
        const prodRes = await client.query(
          'SELECT name, sku, unit_cost, reorder_point, procurement_type FROM products WHERE id = $1 FOR UPDATE',
          [item.product_id]
        );
        const product = prodRes.rows[0];
        const oldCost = parseFloat(product.unit_cost);
        const receivedCost = parseFloat(item.unit_cost);

        // 1. Recalculate moving average cost:
        let newCost = receivedCost;
        if (qtyOnHand + receivedQty > 0) {
          newCost = ((qtyOnHand * oldCost) + (receivedQty * receivedCost)) / (qtyOnHand + receivedQty);
        }

        newCost = Math.round(newCost * 100) / 100;

        // Update product cost rate
        await client.query(
          'UPDATE products SET unit_cost = $2, updated_at = now() WHERE id = $1',
          [item.product_id, newCost]
        );

        // 2. Adjust inventory quantities:
        const targetIncomingChange = Math.max(0, qtyIncoming - receivedQty);
        await client.query(
          'UPDATE inventory SET qty_on_hand = qty_on_hand + $2, qty_incoming = $3, updated_at = now() WHERE product_id = $1',
          [item.product_id, receivedQty, targetIncomingChange]
        );

        // 3. Record transaction log in stock ledger (RECEIPT)
        const ledgerSql = `
          INSERT INTO stock_ledger (
            product_id, transaction_type, reference_type, reference_id,
            qty_change, unit_cost, user_id, reason, notes,
            qty_previous, qty_new, location, reference_number
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13);
        `;
        await client.query(ledgerSql, [
          item.product_id,
          TRANSACTION_TYPES.RECEIPT,
          REFERENCE_TYPES.PURCHASE_ORDER,
          id,
          receivedQty,
          receivedCost,
          userId,
          'Purchase Order Receipt',
          `Received inventory against ${order.order_number}`,
          qtyOnHand,
          qtyOnHand + receivedQty,
          inv.location || 'Main Warehouse',
          order.order_number
        ]);

        // 4. Low stock validation notification trigger
        if (product.procurement_type === 'PURCHASE' && (qtyOnHand + receivedQty + targetIncomingChange) < parseFloat(product.reorder_point)) {
          await notificationService.createNotification({
            title: 'Low Stock Alert',
            message: `${product.name} (${product.sku}) stock is low. Current total: ${qtyOnHand + receivedQty + targetIncomingChange} units.`,
            type: 'LOW_STOCK'
          }, client);
        }
      }

      // Mark PO as RECEIVED
      await purchaseRepository.updateStatus(id, PO_STATUS.RECEIVED, client);

      // Trigger audit log
      await auditService.log({
        user_id: userId,
        action: 'RECEIVE_PURCHASE_ORDER',
        entity_type: 'purchase_orders',
        entity_id: id,
        old_value: { status: PO_STATUS.APPROVED },
        new_value: { status: PO_STATUS.RECEIVED },
        ip_address: 'System Service'
      }, client);

      await client.query('COMMIT');
      return await purchaseRepository.findById(id);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Cancel Purchase Order.
   * Reverses incoming stock allocations if the order had already been approved.
   */
  async cancelPurchaseOrder(id, userId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const order = await purchaseRepository.findById(id, client);
      if (!order) {
        const error = new Error(`Purchase Order with ID '${id}' not found.`);
        error.statusCode = 404;
        throw error;
      }

      if (order.status === PO_STATUS.RECEIVED || order.status === PO_STATUS.CANCELLED) {
        const error = new Error(`Cannot cancel Purchase Order: order is already in '${order.status}' status.`);
        error.statusCode = 400;
        throw error;
      }

      const initialStatus = order.status;

      // If the order had already been approved, we must subtract the incoming stock expectations
      if (initialStatus === PO_STATUS.APPROVED) {
        for (const item of order.items) {
          const invRes = await client.query('SELECT qty_incoming FROM inventory WHERE product_id = $1 FOR UPDATE', [item.product_id]);
          const currentIncoming = parseFloat(invRes.rows[0].qty_incoming);
          const orderQty = parseFloat(item.quantity);

          const targetIncoming = Math.max(0, currentIncoming - orderQty);
          await client.query(
            'UPDATE inventory SET qty_incoming = $2, updated_at = now() WHERE product_id = $1',
            [item.product_id, targetIncoming]
          );
        }
      }

      await purchaseRepository.updateStatus(id, PO_STATUS.CANCELLED, client);

      // Trigger audit log
      await auditService.log({
        user_id: userId,
        action: 'CANCEL_PURCHASE_ORDER',
        entity_type: 'purchase_orders',
        entity_id: id,
        old_value: { status: initialStatus },
        new_value: { status: PO_STATUS.CANCELLED },
        ip_address: 'System Service'
      }, client);

      await client.query('COMMIT');
      return await purchaseRepository.findById(id);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = new PurchaseService();
