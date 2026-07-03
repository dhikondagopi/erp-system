const { query } = require('../config/db');

/**
 * Vendor Repository.
 * Handles direct database CRUD execution for the 'vendors' table.
 */
class VendorRepository {
  /**
   * Find vendor by ID.
   */
  async findById(id) {
    const text = 'SELECT * FROM vendors WHERE id = $1';
    const res = await query(text, [id]);
    return res.rows[0] || null;
  }

  /**
   * Find vendor by unique email.
   */
  async findByEmail(email) {
    const text = 'SELECT * FROM vendors WHERE email = $1';
    const res = await query(text, [email]);
    return res.rows[0] || null;
  }

  /**
   * List and search vendors.
   */
  async findAll({ search, limit = 50, offset = 0 }) {
    let sql = 'SELECT * FROM vendors';
    let countSql = 'SELECT COUNT(*) FROM vendors';
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (search) {
      conditions.push(`(name ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR phone ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (conditions.length > 0) {
      const whereClause = ' WHERE ' + conditions.join(' AND ');
      sql += whereClause;
      countSql += whereClause;
    }

    sql += ` ORDER BY name ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    
    const countRes = await query(countSql, params);
    const total = parseInt(countRes.rows[0].count, 10);

    const dataParams = [...params, limit, offset];
    const res = await query(sql, dataParams);

    return {
      vendors: res.rows,
      total
    };
  }

  /**
   * Create a new vendor profile.
   */
  async create(data) {
    const sql = `
      INSERT INTO vendors (name, email, phone, address)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const params = [data.name, data.email, data.phone || null, data.address || null];
    const res = await query(sql, params);
    return res.rows[0];
  }

  /**
   * Update vendor attributes.
   */
  async update(id, data) {
    const sql = `
      UPDATE vendors
      SET name = $1, email = $2, phone = $3, address = $4, updated_at = now()
      WHERE id = $5
      RETURNING *;
    `;
    const params = [data.name, data.email, data.phone || null, data.address || null, id];
    const res = await query(sql, params);
    return res.rows[0] || null;
  }

  /**
   * Delete vendor profile.
   */
  async delete(id) {
    const sql = 'DELETE FROM vendors WHERE id = $1 RETURNING id';
    const res = await query(sql, [id]);
    return res.rowCount > 0;
  }
}

module.exports = new VendorRepository();
