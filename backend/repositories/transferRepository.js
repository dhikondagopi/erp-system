const { pool, query } = require('../config/db');

class TransferRepository {
  async findById(id, client = null) {
    const db = client || pool;
    const sql = `
      SELECT t.*, 
             w_src.name AS source_warehouse_name, w_src.code AS source_warehouse_code,
             w_dst.name AS destination_warehouse_name, w_dst.code AS destination_warehouse_code,
             u_creator.first_name AS creator_first_name, u_creator.last_name AS creator_last_name,
             u_approver.first_name AS approver_first_name, u_approver.last_name AS approver_last_name
      FROM warehouse_transfers t
      INNER JOIN warehouses w_src ON t.source_warehouse_id = w_src.id
      INNER JOIN warehouses w_dst ON t.destination_warehouse_id = w_dst.id
      LEFT JOIN users u_creator ON t.created_by = u_creator.id
      LEFT JOIN users u_approver ON t.approved_by = u_approver.id
      WHERE t.id = $1;
    `;
    const res = await db.query(sql, [id]);
    if (res.rows.length === 0) return null;

    const transfer = res.rows[0];
    
    // Load transfer items
    const itemsSql = `
      SELECT ti.*, p.sku, p.name, p.uom, p.category
      FROM warehouse_transfer_items ti
      INNER JOIN products p ON ti.product_id = p.id
      WHERE ti.transfer_id = $1;
    `;
    const itemsRes = await db.query(itemsSql, [id]);
    transfer.items = itemsRes.rows;

    return transfer;
  }

  async findAll({ sourceWarehouseId, destinationWarehouseId, status, limit = 50, offset = 0 } = {}) {
    let sql = `
      SELECT t.*, 
             w_src.name AS source_warehouse_name, w_src.code AS source_warehouse_code,
             w_dst.name AS destination_warehouse_name, w_dst.code AS destination_warehouse_code,
             u_creator.first_name AS creator_first_name, u_creator.last_name AS creator_last_name
      FROM warehouse_transfers t
      INNER JOIN warehouses w_src ON t.source_warehouse_id = w_src.id
      INNER JOIN warehouses w_dst ON t.destination_warehouse_id = w_dst.id
      LEFT JOIN users u_creator ON t.created_by = u_creator.id
    `;
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (sourceWarehouseId) {
      conditions.push(`t.source_warehouse_id = $${paramIndex}`);
      params.push(sourceWarehouseId);
      paramIndex++;
    }

    if (destinationWarehouseId) {
      conditions.push(`t.destination_warehouse_id = $${paramIndex}`);
      params.push(destinationWarehouseId);
      paramIndex++;
    }

    if (status) {
      conditions.push(`t.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ` ORDER BY t.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;

    let countSql = 'SELECT COUNT(*) FROM warehouse_transfers t';
    if (conditions.length > 0) {
      countSql += ' WHERE ' + conditions.join(' AND ');
    }

    const countRes = await query(countSql, params);
    const total = parseInt(countRes.rows[0].count, 10);

    const dataParams = [...params, limit, offset];
    const res = await query(sql, dataParams);

    return {
      transfers: res.rows,
      total
    };
  }

  async create(payload, items, client = null) {
    const db = client || pool;
    const localClient = client ? null : await pool.connect();
    const activeDb = client || localClient;

    try {
      if (!client) await activeDb.query('BEGIN');

      const transferSql = `
        INSERT INTO warehouse_transfers (
          transfer_number, source_warehouse_id, destination_warehouse_id, status, reason, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;
      `;
      const transferParams = [
        payload.transfer_number,
        payload.source_warehouse_id,
        payload.destination_warehouse_id,
        payload.status,
        payload.reason || null,
        payload.created_by
      ];
      const transferRes = await activeDb.query(transferSql, transferParams);
      const newTransfer = transferRes.rows[0];

      const itemInsertSql = `
        INSERT INTO warehouse_transfer_items (transfer_id, product_id, quantity)
        VALUES ($1, $2, $3)
        RETURNING *;
      `;

      newTransfer.items = [];
      for (const item of items) {
        const itemRes = await activeDb.query(itemInsertSql, [newTransfer.id, item.product_id, item.quantity]);
        newTransfer.items.push(itemRes.rows[0]);
      }

      if (!client) await activeDb.query('COMMIT');
      return newTransfer;
    } catch (err) {
      if (!client) await activeDb.query('ROLLBACK');
      throw err;
    } finally {
      if (localClient) localClient.release();
    }
  }

  async updateStatus(id, status, approvedBy = null, client = null) {
    const db = client || pool;
    const sql = `
      UPDATE warehouse_transfers
      SET status = $1,
          approved_by = $2,
          updated_at = now()
      WHERE id = $3
      RETURNING *;
    `;
    const res = await db.query(sql, [status, approvedBy, id]);
    return res.rows[0] || null;
  }
}

module.exports = new TransferRepository();
