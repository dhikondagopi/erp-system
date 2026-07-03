const { pool, query } = require('../config/db');

/**
 * Purchase Order Repository.
 * Handles database CRUD operations for 'purchase_orders' and 'purchase_order_items' tables.
 */
class PurchaseRepository {
  /**
   * Find Purchase Order by ID, bringing in its related vendor details and order items.
   */
  async findById(id, client = null) {
    const db = client || pool;
    const orderSql = `
      SELECT po.*, v.name AS vendor_name, v.email AS vendor_email, u.first_name AS creator_first_name
      FROM purchase_orders po
      INNER JOIN vendors v ON po.vendor_id = v.id
      LEFT JOIN users u ON po.created_by = u.id
      WHERE po.id = $1
    `;
    const orderRes = await db.query(orderSql, [id]);
    const order = orderRes.rows[0];

    if (!order) return null;

    const itemsSql = `
      SELECT poi.*, p.sku, p.name, p.uom
      FROM purchase_order_items poi
      INNER JOIN products p ON poi.product_id = p.id
      WHERE poi.purchase_order_id = $1
    `;
    const itemsRes = await db.query(itemsSql, [id]);
    order.items = itemsRes.rows;

    return order;
  }

  /**
   * List purchase orders with optional filters and pagination.
   */
  async findAll({ vendorId, status, limit = 50, offset = 0 }) {
    let sql = `
      SELECT po.*, v.name AS vendor_name, v.email AS vendor_email
      FROM purchase_orders po
      INNER JOIN vendors v ON po.vendor_id = v.id
    `;
    let countSql = `
      SELECT COUNT(*) 
      FROM purchase_orders po
      INNER JOIN vendors v ON po.vendor_id = v.id
    `;
    
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (vendorId) {
      conditions.push(`po.vendor_id = $${paramIndex}`);
      params.push(vendorId);
      paramIndex++;
    }

    if (status) {
      conditions.push(`po.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (conditions.length > 0) {
      const whereClause = ' WHERE ' + conditions.join(' AND ');
      sql += whereClause;
      countSql += whereClause;
    }

    sql += ` ORDER BY po.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;

    const countRes = await query(countSql, params);
    const total = parseInt(countRes.rows[0].count, 10);

    const dataParams = [...params, limit, offset];
    const res = await query(sql, dataParams);

    return {
      orders: res.rows,
      total
    };
  }

  /**
   * Create a new purchase order with line items in a database transaction.
   */
  async create(orderData, items, client = null) {
    const db = client || pool;
    const mustManageTransaction = !client;
    
    const activeDb = mustManageTransaction ? await pool.connect() : db;

    try {
      if (mustManageTransaction) {
        await activeDb.query('BEGIN');
      }

      // 1. Insert parent Purchase Order row
      const orderSql = `
        INSERT INTO purchase_orders (order_number, vendor_id, status, total_amount, created_by)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
      `;
      const orderParams = [
        orderData.order_number,
        orderData.vendor_id,
        orderData.status,
        orderData.total_amount,
        orderData.created_by
      ];
      const orderRes = await activeDb.query(orderSql, orderParams);
      const newOrder = orderRes.rows[0];

      // 2. Insert line items
      const itemSql = `
        INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, unit_cost)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
      `;

      newOrder.items = [];
      for (const item of items) {
        const itemRes = await activeDb.query(itemSql, [
          newOrder.id,
          item.product_id,
          item.quantity,
          item.unit_cost
        ]);
        newOrder.items.push(itemRes.rows[0]);
      }

      if (mustManageTransaction) {
        await activeDb.query('COMMIT');
      }
      return newOrder;
    } catch (error) {
      if (mustManageTransaction) {
        await activeDb.query('ROLLBACK');
      }
      throw error;
    } finally {
      if (mustManageTransaction) {
        activeDb.release();
      }
    }
  }

  /**
   * Update the status of a Purchase Order.
   */
  async updateStatus(id, status, client = null) {
    const db = client || pool;
    const sql = `
      UPDATE purchase_orders
      SET status = $1, updated_at = now()
      WHERE id = $2
      RETURNING *;
    `;
    const res = await db.query(sql, [status, id]);
    return res.rows[0] || null;
  }
}

module.exports = new PurchaseRepository();
