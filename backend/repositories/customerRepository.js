const { query } = require('../config/db');

/**
 * Customer Repository.
 * Handles direct database CRUD execution for the 'customers' table.
 */
class CustomerRepository {
  /**
   * Find customer by ID.
   */
  async findById(id) {
    const text = 'SELECT * FROM customers WHERE id = $1';
    const res = await query(text, [id]);
    return res.rows[0] || null;
  }

  /**
   * Find customer by unique email.
   */
  async findByEmail(email) {
    const text = 'SELECT * FROM customers WHERE email = $1';
    const res = await query(text, [email]);
    return res.rows[0] || null;
  }

  /**
   * List and search customers.
   */
  async findAll({ search, limit = 50, offset = 0 }) {
    let sql = 'SELECT * FROM customers';
    let countSql = 'SELECT COUNT(*) FROM customers';
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
      customers: res.rows,
      total
    };
  }

  /**
   * Create a new customer profile.
   */
  async create(data) {
    const sql = `
      INSERT INTO customers (name, email, phone, address)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const params = [data.name, data.email, data.phone || null, data.address || null];
    const res = await query(sql, params);
    return res.rows[0];
  }

  /**
   * Update customer attributes.
   */
  async update(id, data) {
    const sql = `
      UPDATE customers
      SET name = $1, email = $2, phone = $3, address = $4, updated_at = now()
      WHERE id = $5
      RETURNING *;
    `;
    const params = [data.name, data.email, data.phone || null, data.address || null, id];
    const res = await query(sql, params);
    return res.rows[0] || null;
  }

  /**
   * Delete customer profile.
   */
  async delete(id) {
    const sql = 'DELETE FROM customers WHERE id = $1 RETURNING id';
    const res = await query(sql, [id]);
    return res.rowCount > 0;
  }
}

module.exports = new CustomerRepository();
