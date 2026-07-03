const { pool, query } = require('../config/db');

/**
 * Sales Order Repository.
 * Handles database CRUD operations for 'sales_orders' and 'sales_order_items' tables.
 */
class SalesRepository {
  /**
   * Find Sales Order by ID, bringing in its related customer details and order items.
   */
  async findById(id, client = null) {
    const db = client || pool;
    const orderSql = `
      SELECT so.*, c.name AS customer_name, c.email AS customer_email, u.first_name AS creator_first_name
      FROM sales_orders so
      INNER JOIN customers c ON so.customer_id = c.id
      LEFT JOIN users u ON so.created_by = u.id
      WHERE so.id = $1
    `;
    const orderRes = await db.query(orderSql, [id]);
    const order = orderRes.rows[0];

    if (!order) return null;

    const itemsSql = `
      SELECT soi.*, p.sku, p.name, p.uom
      FROM sales_order_items soi
      INNER JOIN products p ON soi.product_id = p.id
      WHERE soi.sales_order_id = $1
    `;
    const itemsRes = await db.query(itemsSql, [id]);
    order.items = itemsRes.rows;

    return order;
  }

  /**
   * List sales orders with optional filters and pagination.
   */
  async findAll({ customerId, status, limit = 50, offset = 0 }) {
    let sql = `
      SELECT so.*, c.name AS customer_name, c.email AS customer_email
      FROM sales_orders so
      INNER JOIN customers c ON so.customer_id = c.id
    `;
    let countSql = `
      SELECT COUNT(*) 
      FROM sales_orders so
      INNER JOIN customers c ON so.customer_id = c.id
    `;
    
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (customerId) {
      conditions.push(`so.customer_id = $${paramIndex}`);
      params.push(customerId);
      paramIndex++;
    }

    if (status) {
      conditions.push(`so.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (conditions.length > 0) {
      const whereClause = ' WHERE ' + conditions.join(' AND ');
      sql += whereClause;
      countSql += whereClause;
    }

    sql += ` ORDER BY so.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;

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
   * Create a new sales order with line items in a database transaction.
   */
  async create(orderData, items, client = null) {
    const db = client || pool;
    const mustManageTransaction = !client;
    
    const activeDb = mustManageTransaction ? await pool.connect() : db;

    try {
      if (mustManageTransaction) {
        await activeDb.query('BEGIN');
      }

      // 1. Insert parent Sales Order row
      const orderSql = `
        INSERT INTO sales_orders (order_number, customer_id, status, total_amount, created_by)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
      `;
      const orderParams = [
        orderData.order_number,
        orderData.customer_id,
        orderData.status,
        orderData.total_amount,
        orderData.created_by
      ];
      const orderRes = await activeDb.query(orderSql, orderParams);
      const newOrder = orderRes.rows[0];

      // 2. Insert line items
      const itemSql = `
        INSERT INTO sales_order_items (sales_order_id, product_id, quantity, unit_price)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
      `;

      newOrder.items = [];
      for (const item of items) {
        const itemRes = await activeDb.query(itemSql, [
          newOrder.id,
          item.product_id,
          item.quantity,
          item.unit_price
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
   * Update the status of a Sales Order.
   */
  async updateStatus(id, status, client = null) {
    const db = client || pool;
    const sql = `
      UPDATE sales_orders
      SET status = $1, updated_at = now()
      WHERE id = $2
      RETURNING *;
    `;
    const res = await db.query(sql, [status, id]);
    return res.rows[0] || null;
  }
}

module.exports = new SalesRepository();
