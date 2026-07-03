const { pool } = require('../config/db');

class AuditRepository {
  async create(logData, client = null) {
    if (!logData || typeof logData !== 'object') {
      throw new Error('Invalid audit log payload.');
    }

    const db = client || pool;

    let oldValue = null;
    let newValue = null;

    try {
      oldValue = logData.old_value
        ? JSON.stringify(logData.old_value)
        : null;

      newValue = logData.new_value
        ? JSON.stringify(logData.new_value)
        : null;
    } catch {
      oldValue = null;
      newValue = null;
    }

    const sql = `
      INSERT INTO audit_logs
      (
        user_id,
        action,
        entity_type,
        entity_id,
        old_value,
        new_value,
        ip_address
      )
      VALUES
      (
        $1,$2,$3,$4,$5,$6,$7
      )
      RETURNING
        id,
        user_id,
        action,
        entity_type,
        entity_id,
        created_at;
    `;

    const params = [
      logData.user_id ?? null,
      logData.action,
      logData.entity_type,
      logData.entity_id,
      oldValue,
      newValue,
      logData.ip_address ?? null,
    ];

    const result = await db.query(sql, params);

    return result.rows[0];
  }

  async findAll(
    {
      userId,
      action,
      entityType,
      limit = 50,
      offset = 0,
    },
    client = null
  ) {
    const db = client || pool;

    let sql = `
      SELECT
        al.*,
        u.first_name,
        u.last_name,
        u.email
      FROM audit_logs al
      LEFT JOIN users u
      ON al.user_id = u.id
    `;

    let countSql = `
      SELECT COUNT(*) AS total
      FROM audit_logs al
    `;

    const where = [];
    const params = [];
    let index = 1;

    if (userId) {
      where.push(`al.user_id = $${index++}`);
      params.push(userId);
    }

    if (action) {
      where.push(`al.action = $${index++}`);
      params.push(action);
    }

    if (entityType) {
      where.push(`al.entity_type = $${index++}`);
      params.push(entityType);
    }

    if (where.length) {
      const clause = ` WHERE ${where.join(' AND ')}`;
      sql += clause;
      countSql += clause;
    }

    sql += `
      ORDER BY al.created_at DESC
      LIMIT $${index}
      OFFSET $${index + 1}
    `;

    const countResult = await db.query(countSql, params);

    const dataResult = await db.query(sql, [
      ...params,
      limit,
      offset,
    ]);

    return {
      logs: dataResult.rows,
      total: Number(countResult.rows[0].total),
    };
  }
}

module.exports = new AuditRepository();