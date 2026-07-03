const { pool, query } = require('../config/db');

/**
 * Bill of Materials (BoM) Repository.
 * Handles database CRUD operations for 'bills_of_materials' and 'bom_items' tables, including labor and overhead costs.
 */
class BomRepository {
  /**
   * Find BoM by ID, including details of all component materials.
   */
  async findById(id, client = null) {
    const db = client || pool;
    const bomSql = `
      SELECT b.*, p.sku AS finished_good_sku, p.name AS finished_good_name, p.uom AS finished_good_uom, p.unit_price AS finished_good_price
      FROM bills_of_materials b
      INNER JOIN products p ON b.finished_good_id = p.id
      WHERE b.id = $1
    `;
    const bomRes = await db.query(bomSql, [id]);
    const bom = bomRes.rows[0];

    if (!bom) return null;

    const itemsSql = `
      SELECT bi.*, p.sku, p.name, p.uom, p.unit_cost
      FROM bom_items bi
      INNER JOIN products p ON bi.raw_material_id = p.id
      WHERE bi.bom_id = $1
    `;
    const itemsRes = await db.query(itemsSql, [id]);
    bom.items = itemsRes.rows;

    return bom;
  }

  /**
   * Find BoM by Finished Good Product ID.
   */
  async findByFinishedGoodId(finishedGoodId, client = null) {
    const db = client || pool;
    const bomSql = `
      SELECT b.*, p.sku AS finished_good_sku, p.name AS finished_good_name, p.uom AS finished_good_uom, p.unit_price AS finished_good_price
      FROM bills_of_materials b
      INNER JOIN products p ON b.finished_good_id = p.id
      WHERE b.finished_good_id = $1
    `;
    const bomRes = await db.query(bomSql, [finishedGoodId]);
    const bom = bomRes.rows[0];

    if (!bom) return null;

    const itemsSql = `
      SELECT bi.*, p.sku, p.name, p.uom, p.unit_cost
      FROM bom_items bi
      INNER JOIN products p ON bi.raw_material_id = p.id
      WHERE bi.bom_id = $1
    `;
    const itemsRes = await db.query(itemsSql, [bom.id]);
    bom.items = itemsRes.rows;

    return bom;
  }

  /**
   * List all BoMs.
   */
  async findAll({ search, limit = 50, offset = 0 }) {
    let sql = `
      SELECT b.*, p.sku AS finished_good_sku, p.name AS finished_good_name
      FROM bills_of_materials b
      INNER JOIN products p ON b.finished_good_id = p.id
    `;
    let countSql = `
      SELECT COUNT(*) 
      FROM bills_of_materials b
      INNER JOIN products p ON b.finished_good_id = p.id
    `;
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (search) {
      conditions.push(`(b.name ILIKE $${paramIndex} OR p.name ILIKE $${paramIndex} OR p.sku ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (conditions.length > 0) {
      const whereClause = ' WHERE ' + conditions.join(' AND ');
      sql += whereClause;
      countQuery += whereClause; // Wait, let's keep countSql
    }

    sql += ` ORDER BY b.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;

    const countRes = await query(countSql, params);
    const total = parseInt(countRes.rows[0].count, 10);

    const dataParams = [...params, limit, offset];
    const res = await query(sql, dataParams);

    return {
      boms: res.rows,
      total
    };
  }

  /**
   * Create BoM recipe with items in transaction.
   */
  async create(bomData, items, client = null) {
    const db = client || pool;
    const mustManageTransaction = !client;
    const activeDb = mustManageTransaction ? await pool.connect() : db;

    try {
      if (mustManageTransaction) {
        await activeDb.query('BEGIN');
      }

      // 1. Insert parent BoM row
      const bomSql = `
        INSERT INTO bills_of_materials (finished_good_id, name, version, labor_cost, overhead_cost)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
      `;
      const bomParams = [
        bomData.finished_good_id,
        bomData.name,
        bomData.version || '1.0',
        bomData.labor_cost || 0.00,
        bomData.overhead_cost || 0.00
      ];
      const bomRes = await activeDb.query(bomSql, bomParams);
      const newBom = bomRes.rows[0];

      // 2. Insert component items
      const itemSql = `
        INSERT INTO bom_items (bom_id, raw_material_id, quantity_required)
        VALUES ($1, $2, $3)
        RETURNING *;
      `;

      newBom.items = [];
      for (const item of items) {
        const itemRes = await activeDb.query(itemSql, [
          newBom.id,
          item.raw_material_id,
          item.quantity_required
        ]);
        newBom.items.push(itemRes.rows[0]);
      }

      if (mustManageTransaction) {
        await activeDb.query('COMMIT');
      }
      return newBom;
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
   * Update BoM header and replace items.
   */
  async update(id, bomData, items, client = null) {
    const db = client || pool;
    const mustManageTransaction = !client;
    const activeDb = mustManageTransaction ? await pool.connect() : db;

    try {
      if (mustManageTransaction) {
        await activeDb.query('BEGIN');
      }

      // 1. Update parent header properties
      const bomSql = `
        UPDATE bills_of_materials
        SET name = $1, 
            version = $2, 
            labor_cost = $3, 
            overhead_cost = $4,
            updated_at = now()
        WHERE id = $5
        RETURNING *;
      `;
      const bomRes = await activeDb.query(bomSql, [
        bomData.name,
        bomData.version,
        bomData.labor_cost || 0.00,
        bomData.overhead_cost || 0.00,
        id
      ]);
      const updatedBom = bomRes.rows[0];

      // 2. Clear out older components
      await activeDb.query('DELETE FROM bom_items WHERE bom_id = $1', [id]);

      // 3. Re-insert new components list
      const itemSql = `
        INSERT INTO bom_items (bom_id, raw_material_id, quantity_required)
        VALUES ($1, $2, $3)
        RETURNING *;
      `;

      updatedBom.items = [];
      for (const item of items) {
        const itemRes = await activeDb.query(itemSql, [
          id,
          item.raw_material_id,
          item.quantity_required
        ]);
        updatedBom.items.push(itemRes.rows[0]);
      }

      if (mustManageTransaction) {
        await activeDb.query('COMMIT');
      }
      return updatedBom;
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
   * Delete BoM by ID.
   */
  async delete(id) {
    const sql = 'DELETE FROM bills_of_materials WHERE id = $1 RETURNING id';
    const res = await query(sql, [id]);
    return res.rowCount > 0;
  }
}

module.exports = new BomRepository();
