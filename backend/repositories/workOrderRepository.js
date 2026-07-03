const { pool, query } = require('../config/db');

/**
 * Work Order Repository.
 * Handles database CRUD operations for 'work_orders' table.
 */
class WorkOrderRepository {
  /**
   * Fetch single work order details.
   */
  async findById(id, client = null) {
    const db = client || pool;
    const sql = `
      SELECT wo.*, u.first_name AS assignee_first_name, u.last_name AS assignee_last_name,
             mo.mo_number, mo.quantity AS mo_quantity, p.name AS finished_good_name
      FROM work_orders wo
      LEFT JOIN users u ON wo.assigned_to = u.id
      INNER JOIN manufacturing_orders mo ON wo.manufacturing_order_id = mo.id
      INNER JOIN products p ON mo.finished_good_id = p.id
      WHERE wo.id = $1
    `;
    const res = await db.query(sql, [id]);
    return res.rows[0] || null;
  }

  /**
   * Fetch all work orders belonging to a Manufacturing Order.
   */
  async findByMoId(moId, client = null) {
    const db = client || pool;
    const sql = `
      SELECT wo.*, u.first_name AS assignee_first_name, u.last_name AS assignee_last_name
      FROM work_orders wo
      LEFT JOIN users u ON wo.assigned_to = u.id
      WHERE wo.manufacturing_order_id = $1
      ORDER BY wo.created_at ASC
    `;
    const res = await db.query(sql, [moId]);
    return res.rows[0] ? res.rows : [];
  }

  /**
   * Fetch work orders assigned to a specific worker.
   */
  async findByAssignedUser(userId, { status, limit = 50, offset = 0 } = {}) {
    let sql = `
      SELECT wo.*, mo.mo_number, p.name AS finished_good_name
      FROM work_orders wo
      INNER JOIN manufacturing_orders mo ON wo.manufacturing_order_id = mo.id
      INNER JOIN products p ON mo.finished_good_id = p.id
      WHERE wo.assigned_to = $1
    `;
    const params = [userId];
    let paramIndex = 2;

    if (status) {
      sql += ` AND wo.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    sql += ` ORDER BY wo.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;

    let countSql = 'SELECT COUNT(*) FROM work_orders WHERE assigned_to = $1';
    const countParams = [userId];
    if (status) {
      countSql += ' AND status = $2';
      countParams.push(status);
    }

    const countRes = await query(countSql, countParams);
    const total = parseInt(countRes.rows[0].count, 10);

    const dataParams = [...params, limit, offset];
    const res = await query(sql, dataParams);

    return {
      workOrders: res.rows,
      total
    };
  }

  /**
   * Fetch all work orders globally with filtering.
   */
  async findAll({ status, assigned_to, search, limit = 100, offset = 0 } = {}) {
    let sql = `
      SELECT wo.*, u.first_name AS assignee_first_name, u.last_name AS assignee_last_name,
             mo.mo_number, mo.quantity AS mo_quantity, p.name AS finished_good_name
      FROM work_orders wo
      LEFT JOIN users u ON wo.assigned_to = u.id
      INNER JOIN manufacturing_orders mo ON wo.manufacturing_order_id = mo.id
      INNER JOIN products p ON mo.finished_good_id = p.id
    `;
    let countSql = `
      SELECT COUNT(*)
      FROM work_orders wo
      INNER JOIN manufacturing_orders mo ON wo.manufacturing_order_id = mo.id
      INNER JOIN products p ON mo.finished_good_id = p.id
    `;
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (status) {
      conditions.push(`wo.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (assigned_to) {
      conditions.push(`wo.assigned_to = $${paramIndex}`);
      params.push(assigned_to);
      paramIndex++;
    }

    if (search) {
      conditions.push(`(wo.operation_name ILIKE $${paramIndex} OR mo.mo_number ILIKE $${paramIndex} OR p.name ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (conditions.length > 0) {
      const whereClause = ' WHERE ' + conditions.join(' AND ');
      sql += whereClause;
      countSql += whereClause;
    }

    sql += ` ORDER BY wo.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;

    const countRes = await query(countSql, params);
    const total = parseInt(countRes.rows[0].count, 10);

    const dataParams = [...params, limit, offset];
    const res = await query(sql, dataParams);

    return {
      workOrders: res.rows,
      total
    };
  }

  /**
   * Create work orders in database.
   */
  async create(woData, client = null) {
    const db = client || pool;
    const sql = `
      INSERT INTO work_orders (manufacturing_order_id, operation_name, status, assigned_to)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const params = [
      woData.manufacturing_order_id,
      woData.operation_name,
      woData.status,
      woData.assigned_to || null
    ];
    const res = await db.query(sql, params);
    return res.rows[0];
  }

  /**
   * Update work order status and timestamps.
   */
  async updateStatus(id, status, { start_time, end_time }, client = null) {
    const db = client || pool;
    
    let sql = 'UPDATE work_orders SET status = $1, updated_at = now()';
    const params = [status];
    let paramIndex = 2;

    if (start_time !== undefined) {
      sql += `, start_time = $${paramIndex}`;
      params.push(start_time);
      paramIndex++;
    }

    if (end_time !== undefined) {
      sql += `, end_time = $${paramIndex}`;
      params.push(end_time);
      paramIndex++;
    }

    sql += ` WHERE id = $${paramIndex} RETURNING *`;
    params.push(id);

    const res = await db.query(sql, params);
    return res.rows[0] || null;
  }

  /**
   * Assign a work order to a user.
   */
  async assignUser(id, assignedToUserId, client = null) {
    const db = client || pool;
    const sql = `
      UPDATE work_orders
      SET assigned_to = $1, updated_at = now()
      WHERE id = $2
      RETURNING *;
    `;
    const res = await db.query(sql, [assignedToUserId, id]);
    return res.rows[0] || null;
  }
}

module.exports = new WorkOrderRepository();
