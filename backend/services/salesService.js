const { pool } = require('../config/db');
const salesRepository = require('../repositories/salesRepository');
const { SO_STATUS, TRANSACTION_TYPES, REFERENCE_TYPES } = require('../config/constants');
const notificationService = require('./notificationService');
const auditService = require('./auditService');

/**
 * Sales Order Service.
 * Coordinates database transaction blocks and business inventory rules for order pipelines.
 */
class SalesService {
  /**
   * Fetch order by ID.
   */
  async getSalesOrderById(id) {
    const order = await salesRepository.findById(id);
    if (!order) {
      const error = new Error(`Sales Order with ID '${id}' not found.`);
      error.statusCode = 404;
      throw error;
    }
    return order;
  }

  /**
   * Fetch paginated list of sales orders with parameters.
   */
  async getAllSalesOrders(queryParams) {
    const { customerId, status, page = 1, limit = 50 } = queryParams;
    const parsedPage = Math.max(1, parseInt(page, 10));
    const parsedLimit = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const offset = (parsedPage - 1) * parsedLimit;

    const { orders, total } = await salesRepository.findAll({
      customerId,
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
   * Generate draft sales order.
   */
  async createSalesOrder(orderData, userId) {
    const { customer_id, items } = orderData;

    // Generate unique order serial layout: SO-YYYYMMDD-TIME
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `SO-${todayStr}-${randSuffix}`;

    // Verify customer exists
    const customerRes = await pool.query('SELECT id FROM customers WHERE id = $1', [customer_id]);
    if (customerRes.rows.length === 0) {
      const error = new Error('Customer does not exist.');
      error.statusCode = 400;
      throw error;
    }

    // Verify all products exist and calculate order total
    let totalAmount = 0.00;
    const validatedItems = [];

    for (const item of items) {
      const prodRes = await pool.query('SELECT id, name, unit_price FROM products WHERE id = $1', [item.product_id]);
      if (prodRes.rows.length === 0) {
        const error = new Error(`Product reference conflict: Product ID '${item.product_id}' does not exist.`);
        error.statusCode = 400;
        throw error;
      }
      
      const product = prodRes.rows[0];
      const qty = parseFloat(item.quantity);
      const price = parseFloat(item.unit_price || product.unit_price);
      
      totalAmount += qty * price;
      validatedItems.push({
        product_id: item.product_id,
        quantity: qty,
        unit_price: price
      });
    }

    const payload = {
      order_number: orderNumber,
      customer_id,
      status: SO_STATUS.DRAFT,
      total_amount: totalAmount,
      created_by: userId
    };

    const newOrder = await salesRepository.create(payload, validatedItems);

    // Trigger Audit Log
    await auditService.log({
      user_id: userId,
      action: 'CREATE_SALES_ORDER',
      entity_type: 'sales_orders',
      entity_id: newOrder.id,
      new_value: payload,
      ip_address: 'System Service'
    });

    // Notify Business Owner / Admin
    await notificationService.createNotification({
      title: 'Sales Approval Required',
      message: `New Sales Order ${orderNumber} has been created and requires approval.`,
      type: 'SALES_APPROVAL_REQUIRED',
      role: 'Business Owner'
    });

    return newOrder;
  }

  /**
   * Confirm/Approve Sales Order (stages and reserves inventory).
   */
  async confirmSalesOrder(id, userId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const order = await salesRepository.findById(id, client);
      if (!order) {
        const error = new Error(`Sales Order with ID '${id}' not found.`);
        error.statusCode = 404;
        throw error;
      }

      if (order.status !== SO_STATUS.DRAFT) {
        const error = new Error(`Cannot approve Sales Order: status is already '${order.status}'. Only DRAFT orders can be approved.`);
        error.statusCode = 400;
        throw error;
      }

      // Process stock allocations for all items
      for (const item of order.items) {
        // Lock inventory row to prevent race conditions
        const invRes = await client.query(
          'SELECT qty_on_hand, qty_reserved, location FROM inventory WHERE product_id = $1 FOR UPDATE',
          [item.product_id]
        );

        if (invRes.rows.length === 0) {
          const error = new Error(`Inventory mapping error: No inventory profile established for product SKU '${item.sku}'.`);
          error.statusCode = 400;
          throw error;
        }

        const inv = invRes.rows[0];
        const qtyOnHand = parseFloat(inv.qty_on_hand);
        const qtyReserved = parseFloat(inv.qty_reserved);
        const qtyAvailable = qtyOnHand - qtyReserved;
        const requestedQty = parseFloat(item.quantity);

        let reserveQty = requestedQty;

        if (qtyAvailable < requestedQty) {
          const shortageQty = requestedQty - qtyAvailable;

          // Trigger automated procurement engine
          const procurementEngine = require('./procurementEngine');
          await procurementEngine.handleShortage(
            item.product_id,
            shortageQty,
            'SALES_ORDER',
            id,
            userId,
            client
          );

          reserveQty = Math.max(0, qtyAvailable);
        }

        if (reserveQty > 0) {
          // Increment reserved quantities
          await client.query(
            'UPDATE inventory SET qty_reserved = qty_reserved + $2, updated_at = now() WHERE product_id = $1',
            [item.product_id, reserveQty]
          );

          // Retrieve cost details
          const prodCostRes = await client.query('SELECT unit_cost FROM products WHERE id = $1', [item.product_id]);
          const unitCost = parseFloat(prodCostRes.rows[0].unit_cost);

          // Record stock ledger entry (ALLOCATION)
          const ledgerSql = `
            INSERT INTO stock_ledger (
              product_id, transaction_type, reference_type, reference_id,
              qty_change, unit_cost, user_id, reason, notes,
              qty_previous, qty_new, location, reference_number
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13);
          `;
          await client.query(ledgerSql, [
            item.product_id,
            TRANSACTION_TYPES.ALLOCATION,
            REFERENCE_TYPES.SALES_ORDER,
            id,
            reserveQty,
            unitCost,
            userId,
            'Sales Order Reservation',
            `Allocated for ${order.order_number}`,
            qtyReserved,
            qtyReserved + reserveQty,
            inv.location || 'Main Warehouse',
            order.order_number
          ]);
        }
      }

      // Mark status as APPROVED
      await salesRepository.updateStatus(id, SO_STATUS.APPROVED, client);

      // Trigger Audit Log
      await auditService.log({
        user_id: userId,
        action: 'APPROVE_SALES_ORDER',
        entity_type: 'sales_orders',
        entity_id: id,
        old_value: { status: SO_STATUS.DRAFT },
        new_value: { status: SO_STATUS.APPROVED },
        ip_address: 'System Service'
      }, client);

      // Notify Sales Creator
      await notificationService.createNotification({
        title: 'Sales Order Approved',
        message: `Sales Order ${order.order_number} has been approved.`,
        type: 'SALES_APPROVED',
        user_id: order.created_by
      }, client);

      await client.query('COMMIT');
      return await salesRepository.findById(id);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Ship Sales Order (removes physical stock and clears reservations).
   */
  async shipSalesOrder(id, userId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const order = await salesRepository.findById(id, client);
      if (!order) {
        const error = new Error(`Sales Order with ID '${id}' not found.`);
        error.statusCode = 404;
        throw error;
      }

      if (order.status !== SO_STATUS.APPROVED) {
        const error = new Error(`Cannot ship Sales Order: status is '${order.status}'. Only APPROVED orders can be shipped.`);
        error.statusCode = 400;
        throw error;
      }

      // Process shipment deductions
      for (const item of order.items) {
        // Lock inventory row
        const invRes = await client.query(
          'SELECT qty_on_hand, qty_reserved, location FROM inventory WHERE product_id = $1 FOR UPDATE',
          [item.product_id]
        );

        const inv = invRes.rows[0];
        const qtyOnHand = parseFloat(inv.qty_on_hand);
        const qtyReserved = parseFloat(inv.qty_reserved);
        const shipQty = parseFloat(item.quantity);

        if (qtyOnHand < shipQty || qtyReserved < shipQty) {
          const error = new Error(`Shipment synchronization error: Product '${item.name}' has out-of-sync values. On Hand: ${qtyOnHand}, Reserved: ${qtyReserved}.`);
          error.statusCode = 400;
          throw error;
        }

        // Deduct physical AND reserved stock metrics
        await client.query(
          'UPDATE inventory SET qty_on_hand = qty_on_hand - $2, qty_reserved = qty_reserved - $2, updated_at = now() WHERE product_id = $1',
          [item.product_id, shipQty]
        );

        // Retrieve cost details
        const prodCostRes = await client.query('SELECT unit_cost FROM products WHERE id = $1', [item.product_id]);
        const unitCost = parseFloat(prodCostRes.rows[0].unit_cost);

        // Record stock ledger entry (ISSUE)
        const ledgerSql = `
          INSERT INTO stock_ledger (
            product_id, transaction_type, reference_type, reference_id,
            qty_change, unit_cost, user_id, reason, notes,
            qty_previous, qty_new, location, reference_number
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13);
        `;
        await client.query(ledgerSql, [
          item.product_id,
          TRANSACTION_TYPES.ISSUE,
          REFERENCE_TYPES.SALES_ORDER,
          id,
          -shipQty,
          unitCost,
          userId,
          'Sales Order Shipment',
          `Shipped items for ${order.order_number}`,
          qtyOnHand,
          qtyOnHand - shipQty,
          inv.location || 'Main Warehouse',
          order.order_number
        ]);
      }

      // Mark status as COMPLETED
      await salesRepository.updateStatus(id, SO_STATUS.COMPLETED, client);

      // Trigger Audit Log
      await auditService.log({
        user_id: userId,
        action: 'COMPLETE_SALES_ORDER',
        entity_type: 'sales_orders',
        entity_id: id,
        old_value: { status: SO_STATUS.APPROVED },
        new_value: { status: SO_STATUS.COMPLETED },
        ip_address: 'System Service'
      }, client);

      // Notify Creator
      await notificationService.createNotification({
        title: 'Sales Order Completed',
        message: `Sales Order ${order.order_number} has been completed and shipped.`,
        type: 'SALES_COMPLETED',
        user_id: order.created_by
      }, client);

      await client.query('COMMIT');
      return await salesRepository.findById(id);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Cancel Sales Order (releases stock reservation if status was APPROVED).
   */
  async cancelSalesOrder(id, userId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const order = await salesRepository.findById(id, client);
      if (!order) {
        const error = new Error(`Sales Order with ID '${id}' not found.`);
        error.statusCode = 404;
        throw error;
      }

      if (order.status === SO_STATUS.COMPLETED || order.status === SO_STATUS.CANCELLED) {
        const error = new Error(`Cannot cancel Sales Order: order is already in '${order.status}' status.`);
        error.statusCode = 400;
        throw error;
      }

      const initialStatus = order.status;

      // If order was APPROVED, we must roll back the stock reservations
      if (initialStatus === SO_STATUS.APPROVED) {
        for (const item of order.items) {
          // Lock inventory row
          const invRes = await client.query(
            'SELECT qty_reserved, location FROM inventory WHERE product_id = $1 FOR UPDATE',
            [item.product_id]
          );

          const inv = invRes.rows[0];
          const qtyReserved = parseFloat(inv.qty_reserved);
          const releaseQty = parseFloat(item.quantity);

          if (qtyReserved < releaseQty) {
            const error = new Error(`Release reservation conflict: Product '${item.name}' has only ${qtyReserved} reserved stock, cannot release ${releaseQty}.`);
            error.statusCode = 400;
            throw error;
          }

          // Decrement reserved quantities
          await client.query(
            'UPDATE inventory SET qty_reserved = qty_reserved - $2, updated_at = now() WHERE product_id = $1',
            [item.product_id, releaseQty]
          );

          // Retrieve cost details
          const prodCostRes = await client.query('SELECT unit_cost FROM products WHERE id = $1', [item.product_id]);
          const unitCost = parseFloat(prodCostRes.rows[0].unit_cost);

          // Record stock ledger entry (DEALLOCATION)
          const ledgerSql = `
            INSERT INTO stock_ledger (
              product_id, transaction_type, reference_type, reference_id,
              qty_change, unit_cost, user_id, reason, notes,
              qty_previous, qty_new, location, reference_number
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13);
          `;
          await client.query(ledgerSql, [
            item.product_id,
            TRANSACTION_TYPES.DEALLOCATION,
            REFERENCE_TYPES.SALES_ORDER,
            id,
            -releaseQty,
            unitCost,
            userId,
            'Sales Order Reservation Cancellation',
            `Cancelled approval for ${order.order_number}`,
            qtyReserved,
            qtyReserved - releaseQty,
            inv.location || 'Main Warehouse',
            order.order_number
          ]);
        }
      }

      // Mark status as CANCELLED
      await salesRepository.updateStatus(id, SO_STATUS.CANCELLED, client);

      // Trigger Audit Log
      await auditService.log({
        user_id: userId,
        action: 'CANCEL_SALES_ORDER',
        entity_type: 'sales_orders',
        entity_id: id,
        old_value: { status: initialStatus },
        new_value: { status: SO_STATUS.CANCELLED },
        ip_address: 'System Service'
      }, client);

      await client.query('COMMIT');
      return await salesRepository.findById(id);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = new SalesService();
