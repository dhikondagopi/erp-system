const { pool, query } = require('../config/db');

/**
 * Inventory Repository.
 * Handles read/write actions for 'inventory' and 'stock_ledger' tables with multi-warehouse support.
 */
class InventoryRepository {
  /**
   * Fetch inventory row for a product and warehouse.
   */
  async findByProductAndWarehouse(productId, warehouseId, client = null) {
    const db = client || pool;
    let text = 'SELECT * FROM inventory WHERE product_id = $1';
    const params = [productId];

    if (warehouseId) {
      text += ' AND warehouse_id = $2';
      params.push(warehouseId);
    } else {
      // Fallback to default Main Warehouse if no warehouse_id provided
      text += ' AND warehouse_id = (SELECT id FROM warehouses WHERE code = \'WH-MAIN\' LIMIT 1)';
    }

    const res = await db.query(text, params);
    return res.rows[0] || null;
  }

  /**
   * Helper to ensure an inventory row exists for a product and warehouse.
   */
  async findOrCreateInventory(productId, warehouseId, client = null) {
    const db = client || pool;
    let whId = warehouseId;
    
    if (!whId) {
      const whRes = await db.query('SELECT id FROM warehouses WHERE code = \'WH-MAIN\' LIMIT 1');
      if (whRes.rows.length === 0) {
        throw new Error('Default Main Warehouse (WH-MAIN) not found. Run database migrations and seeding first.');
      }
      whId = whRes.rows[0].id;
    }

    // Try finding first
    let inv = await this.findByProductAndWarehouse(productId, whId, db);
    if (!inv) {
      // Create with zeroed values
      const sql = `
        INSERT INTO inventory (product_id, warehouse_id, qty_on_hand, qty_reserved, qty_incoming, reorder_point)
        VALUES ($1, $2, 0.00, 0.00, 0.00, (SELECT reorder_point FROM products WHERE id = $1))
        ON CONFLICT (product_id, warehouse_id) DO UPDATE 
        SET updated_at = now()
        RETURNING *;
      `;
      const res = await db.query(sql, [productId, whId]);
      inv = res.rows[0];
    }
    return inv;
  }

  /**
   * Atomic increment/decrement of inventory quantities.
   */
  async updateQuantities(productId, warehouseId, { qtyOnHandChange = 0, qtyReservedChange = 0, qtyIncomingChange = 0 }, client = null) {
    const db = client || pool;
    
    // Ensure inventory row exists first
    const existing = await this.findOrCreateInventory(productId, warehouseId, db);

    const sql = `
      UPDATE inventory
      SET qty_on_hand = qty_on_hand + $3,
          qty_reserved = qty_reserved + $4,
          qty_incoming = qty_incoming + $5,
          updated_at = now()
      WHERE product_id = $1 AND warehouse_id = $2
      RETURNING *;
    `;
    const params = [productId, existing.warehouse_id, qtyOnHandChange, qtyReservedChange, qtyIncomingChange];
    const res = await db.query(sql, params);
    return res.rows[0] || null;
  }

  /**
   * Create an entry in the stock ledger.
   */
  async createLedgerEntry(ledgerData, client = null) {
    const db = client || pool;
    let whId = ledgerData.warehouse_id;

    if (!whId) {
      const whRes = await db.query('SELECT id FROM warehouses WHERE code = \'WH-MAIN\' LIMIT 1');
      whId = whRes.rows[0]?.id || null;
    }

    const sql = `
      INSERT INTO stock_ledger (
        product_id, transaction_type, reference_type, reference_id,
        qty_change, unit_cost, user_id, reason, notes,
        qty_previous, qty_new, location, reference_number, warehouse_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *;
    `;
    
    const params = [
      ledgerData.product_id,
      ledgerData.transaction_type,
      ledgerData.reference_type || null,
      ledgerData.reference_id || null,
      ledgerData.qty_change,
      ledgerData.unit_cost,
      ledgerData.user_id || null,
      ledgerData.reason,
      ledgerData.notes || null,
      ledgerData.qty_previous || 0.00,
      ledgerData.qty_new || 0.00,
      ledgerData.location || 'Main Warehouse',
      ledgerData.reference_number || null,
      whId
    ];
    const res = await db.query(sql, params);
    return res.rows[0];
  }

  /**
   * Get real-time inventory levels.
   */
  async getInventoryLevels({ search, warehouseId, limit = 50, offset = 0 }) {
    let sql = `
      SELECT i.*, p.sku, p.name, p.uom, p.category, p.unit_cost, p.unit_price,
             w.name AS warehouse_name, w.code AS warehouse_code,
             (i.qty_on_hand - i.qty_reserved) AS calculated_qty_available
      FROM inventory i
      INNER JOIN products p ON i.product_id = p.id
      INNER JOIN warehouses w ON i.warehouse_id = w.id
    `;
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (search) {
      conditions.push(`(p.sku ILIKE $${paramIndex} OR p.name ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (warehouseId) {
      conditions.push(`i.warehouse_id = $${paramIndex}`);
      params.push(warehouseId);
      paramIndex++;
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ` ORDER BY p.name ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    
    // Count query
    let countSql = `
      SELECT COUNT(*) 
      FROM inventory i
      INNER JOIN products p ON i.product_id = p.id
      INNER JOIN warehouses w ON i.warehouse_id = w.id
    `;
    if (conditions.length > 0) {
      countSql += ' WHERE ' + conditions.join(' AND ');
    }
    
    const countRes = await query(countSql, params);
    const total = parseInt(countRes.rows[0].count, 10);

    const dataParams = [...params, limit, offset];
    const res = await query(sql, dataParams);

    return {
      inventory: res.rows,
      total
    };
  }

  /**
   * Get ledger records filtered by product.
   */
  async getLedgerHistory(productId, { limit = 50, offset = 0 } = {}) {
    const sql = `
      SELECT sl.*, u.first_name, u.last_name, w.name AS warehouse_name, w.code AS warehouse_code
      FROM stock_ledger sl
      LEFT JOIN users u ON sl.user_id = u.id
      LEFT JOIN warehouses w ON sl.warehouse_id = w.id
      WHERE sl.product_id = $1
      ORDER BY sl.created_at DESC
      LIMIT $2 OFFSET $3;
    `;
    
    const countSql = 'SELECT COUNT(*) FROM stock_ledger WHERE product_id = $1';
    
    const [countRes, dataRes] = await Promise.all([
      query(countSql, [productId]),
      query(sql, [productId, limit, offset])
    ]);

    return {
      history: dataRes.rows,
      total: parseInt(countRes.rows[0].count, 10)
    };
  }

  /**
   * Get global stock ledger logs.
   */
  async getGlobalLedgerHistory({ limit = 50, offset = 0, transaction_type = null, search = null, warehouseId = null } = {}) {
    let sql = `
      SELECT sl.*, p.sku AS product_sku, p.name AS product_name,
             u.first_name, u.last_name, w.name AS warehouse_name, w.code AS warehouse_code
      FROM stock_ledger sl
      INNER JOIN products p ON sl.product_id = p.id
      LEFT JOIN users u ON sl.user_id = u.id
      LEFT JOIN warehouses w ON sl.warehouse_id = w.id
    `;
    let countSql = `
      SELECT COUNT(*)
      FROM stock_ledger sl
      INNER JOIN products p ON sl.product_id = p.id
      LEFT JOIN warehouses w ON sl.warehouse_id = w.id
    `;
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (transaction_type) {
      conditions.push(`sl.transaction_type = $${paramIndex}`);
      params.push(transaction_type);
      paramIndex++;
    }

    if (search) {
      conditions.push(`(p.sku ILIKE $${paramIndex} OR p.name ILIKE $${paramIndex} OR sl.reason ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (warehouseId) {
      conditions.push(`sl.warehouse_id = $${paramIndex}`);
      params.push(warehouseId);
      paramIndex++;
    }

    if (conditions.length > 0) {
      const whereClause = ' WHERE ' + conditions.join(' AND ');
      sql += whereClause;
      countSql += whereClause;
    }

    sql += ` ORDER BY sl.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;

    const countRes = await query(countSql, params);
    const total = parseInt(countRes.rows[0].count, 10);

    const dataParams = [...params, limit, offset];
    const dataRes = await query(sql, dataParams);

    return {
      history: dataRes.rows,
      total
    };
  }
}

module.exports = new InventoryRepository();
