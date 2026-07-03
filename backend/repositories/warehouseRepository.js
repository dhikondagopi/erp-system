const { pool, query } = require('../config/db');

class WarehouseRepository {
  async findById(id, client = null) {
    const db = client || pool;
    const res = await db.query('SELECT * FROM warehouses WHERE id = $1', [id]);
    return res.rows[0] || null;
  }

  async findByCode(code, client = null) {
    const db = client || pool;
    const res = await db.query('SELECT * FROM warehouses WHERE code = $1', [code]);
    return res.rows[0] || null;
  }

  async findAll({ search, limit = 50, offset = 0 } = {}) {
    let sql = 'SELECT * FROM warehouses';
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (search) {
      conditions.push(`(name ILIKE $${paramIndex} OR code ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ` ORDER BY name ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    
    let countSql = 'SELECT COUNT(*) FROM warehouses';
    if (conditions.length > 0) {
      countSql += ' WHERE ' + conditions.join(' AND ');
    }

    const countRes = await query(countSql, params);
    const total = parseInt(countRes.rows[0].count, 10);

    const dataParams = [...params, limit, offset];
    const res = await query(sql, dataParams);

    return {
      warehouses: res.rows,
      total
    };
  }

  async create(data, client = null) {
    const db = client || pool;
    const sql = `
      INSERT INTO warehouses (name, code, address, is_active)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const params = [data.name, data.code, data.address || null, data.is_active !== false];
    const res = await db.query(sql, params);
    return res.rows[0];
  }

  async update(id, data, client = null) {
    const db = client || pool;
    const sql = `
      UPDATE warehouses
      SET name = $1,
          code = $2,
          address = $3,
          is_active = $4,
          updated_at = now()
      WHERE id = $5
      RETURNING *;
    `;
    const params = [data.name, data.code, data.address || null, data.is_active !== false, id];
    const res = await db.query(sql, params);
    return res.rows[0] || null;
  }

  async setStatus(id, isActive, client = null) {
    const db = client || pool;
    const sql = `
      UPDATE warehouses
      SET is_active = $1, updated_at = now()
      WHERE id = $2
      RETURNING *;
    `;
    const res = await db.query(sql, [isActive, id]);
    return res.rows[0] || null;
  }
}

module.exports = new WarehouseRepository();
