const { pool, query } = require('../config/db');

/**
 * Manufacturing Order Repository.
 * Handles database CRUD operations for 'manufacturing_orders' table.
 */
class ManufacturingRepository {
  /**
   * Find Manufacturing Order by ID, bringing in finished good metadata, BoM details, and component list requirements.
   */
  async findById(id, client = null) {
    const db = client || pool;
    const moSql = `
      SELECT mo.*, p.sku AS finished_good_sku, p.name AS finished_good_name, p.uom AS finished_good_uom,
             b.name AS bom_name, b.version AS bom_version, u.first_name AS creator_first_name
      FROM manufacturing_orders mo
      INNER JOIN products p ON mo.finished_good_id = p.id
      INNER JOIN bills_of_materials b ON mo.bom_id = b.id
      LEFT JOIN users u ON mo.created_by = u.id
      WHERE mo.id = $1
    `;
    const moRes = await db.query(moSql, [id]);
    const mo = moRes.rows[0];

    if (!mo) return null;

    // Retrieve components required based on BoM items and MO quantity
    const componentsSql = `
      SELECT bi.raw_material_id, bi.quantity_required, 
             p.sku, p.name, p.uom, p.unit_cost,
             (bi.quantity_required * $2) AS total_quantity_required,
             inv.qty_on_hand, inv.qty_reserved, (inv.qty_on_hand - inv.qty_reserved) AS qty_available
      FROM bom_items bi
      INNER JOIN products p ON bi.raw_material_id = p.id
      INNER JOIN inventory inv ON p.id = inv.product_id
      WHERE bi.bom_id = $1
    `;
    const componentsRes = await db.query(componentsSql, [mo.bom_id, parseFloat(mo.quantity)]);
    mo.components = componentsRes.rows;

    return mo;
  }

  /**
   * List manufacturing orders with optional filters and pagination.
   */
  async findAll({ finishedGoodId, status, limit = 50, offset = 0 }) {
    let sql = `
      SELECT mo.*, p.sku AS finished_good_sku, p.name AS finished_good_name
      FROM manufacturing_orders mo
      INNER JOIN products p ON mo.finished_good_id = p.id
    `;
    let countSql = `
      SELECT COUNT(*) 
      FROM manufacturing_orders mo
      INNER JOIN products p ON mo.finished_good_id = p.id
    `;
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (finishedGoodId) {
      conditions.push(`mo.finished_good_id = $${paramIndex}`);
      params.push(finishedGoodId);
      paramIndex++;
    }

    if (status) {
      conditions.push(`mo.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (conditions.length > 0) {
      const whereClause = ' WHERE ' + conditions.join(' AND ');
      sql += whereClause;
      countSql += whereClause;
    }

    sql += ` ORDER BY mo.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;

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
   * Create a new manufacturing order.
   */
  async create(moData, client = null) {
    const db = client || pool;
    const sql = `
      INSERT INTO manufacturing_orders (
        mo_number, finished_good_id, bom_id, quantity, status, source_type, source_id, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
    const params = [
      moData.mo_number,
      moData.finished_good_id,
      moData.bom_id,
      moData.quantity,
      moData.status,
      moData.source_type || null,
      moData.source_id || null,
      moData.created_by
    ];
    const res = await db.query(sql, params);
    return res.rows[0];
  }

  /**
   * Update the status of a Manufacturing Order.
   */
  async updateStatus(id, status, client = null) {
    const db = client || pool;
    const sql = `
      UPDATE manufacturing_orders
      SET status = $1, updated_at = now()
      WHERE id = $2
      RETURNING *;
    `;
    const res = await db.query(sql, [status, id]);
    return res.rows[0] || null;
  }
}

module.exports = new ManufacturingRepository();
