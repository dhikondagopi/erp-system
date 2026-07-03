const { query } = require('../config/db');

class NotificationService {
  /**
   * Create a new persistent notification in the database.
   * Can accept a client to participate in transactions.
   */
  async createNotification(data, client = null) {
    const { user_id = null, role = null, title, message, type } = data;
    const sql = `
      INSERT INTO notifications (user_id, role, title, message, type, is_read, created_at)
      VALUES ($1, $2, $3, $4, $5, FALSE, NOW())
      RETURNING *;
    `;
    const params = [user_id, role, title, message, type];
    const res = client ? await client.query(sql, params) : await query(sql, params);
    return res.rows[0];
  }

  /**
   * Retrieve active notifications visible to the authenticated user.
   * A notification is visible if:
   *  - it belongs to the user specifically (user_id = user.id)
   *  - it belongs to the user's role (role = user.role)
   *  - it is a global notification (user_id IS NULL AND role IS NULL)
   */
  async getNotifications(user) {
    // If no user object is passed, default to empty list to prevent crash
    if (!user) return [];

    const sql = `
      SELECT id, user_id, role, title, message, type, is_read, created_at
      FROM notifications
      WHERE user_id = $1 
         OR role = $2 
         OR (user_id IS NULL AND role IS NULL)
      ORDER BY created_at DESC
      LIMIT 100;
    `;
    const res = await query(sql, [user.id, user.role]);

    return res.rows.map(row => ({
      id: row.id,
      title: row.title,
      message: row.message,
      type: this.mapNotificationType(row.type),
      created_at: row.created_at,
      read: row.is_read,
      time: this.timeAgo(row.created_at)
    }));
  }

  /**
   * Get unread notifications count for the authenticated user.
   */
  async getUnreadCount(user) {
    if (!user) return 0;

    const sql = `
      SELECT COUNT(*) AS count
      FROM notifications
      WHERE is_read = FALSE
        AND (user_id = $1 OR role = $2 OR (user_id IS NULL AND role IS NULL));
    `;
    const res = await query(sql, [user.id, user.role]);
    return parseInt(res.rows[0].count, 10);
  }

  /**
   * Mark a specific notification as read.
   */
  async markAsRead(id, user) {
    if (!user) return null;

    const sql = `
      UPDATE notifications
      SET is_read = TRUE
      WHERE id = $1
        AND (user_id = $2 OR role = $3 OR (user_id IS NULL AND role IS NULL))
      RETURNING *;
    `;
    const res = await query(sql, [id, user.id, user.role]);
    return res.rows[0];
  }

  /**
   * Mark all notifications as read for the authenticated user.
   */
  async markAllAsRead(user) {
    if (!user) return [];

    const sql = `
      UPDATE notifications
      SET is_read = TRUE
      WHERE is_read = FALSE
        AND (user_id = $1 OR role = $2 OR (user_id IS NULL AND role IS NULL))
      RETURNING *;
    `;
    const res = await query(sql, [user.id, user.role]);
    return res.rows;
  }

  /**
   * Check stock levels for a product and trigger a low-stock alert if it falls below the reorder point.
   * Can accept a client to participate in transactions.
   */
  async checkAndTriggerLowStock(productId, client = null) {
    const checkSql = `
      SELECT p.id, p.name, p.sku, i.qty_on_hand, p.reorder_point
      FROM products p
      INNER JOIN inventory i ON p.id = i.product_id
      WHERE p.id = $1;
    `;
    const checkRes = client ? await client.query(checkSql, [productId]) : await query(checkSql, [productId]);
    if (checkRes.rows.length === 0) return;

    const prod = checkRes.rows[0];
    const qtyOnHand = parseFloat(prod.qty_on_hand) || 0;
    const reorderPoint = parseFloat(prod.reorder_point) || 0;

    if (qtyOnHand < reorderPoint) {
      // Check if there is already an unread LOW_STOCK notification for this product SKU
      const existingSql = `
        SELECT id FROM notifications
        WHERE type = 'LOW_STOCK'
          AND is_read = FALSE
          AND message LIKE $1;
      `;
      const existingRes = client
        ? await client.query(existingSql, [`%(${prod.sku})%`])
        : await query(existingSql, [`%(${prod.sku})%`]);

      if (existingRes.rows.length === 0) {
        await this.createNotification({
          title: 'Low Stock Alert',
          message: `${prod.name} (${prod.sku}) stock level is below reorder point (${qtyOnHand} units remaining).`,
          type: 'LOW_STOCK',
          role: 'Inventory Manager'
        }, client);
      }
    }
  }

  /**
   * Helper to map DB/domain types to UI classes/types ('shortage', 'completion', 'sales')
   */
  mapNotificationType(dbType) {
    const type = (dbType || '').toLowerCase();
    if (type.includes('shortage') || type.includes('low_stock') || type.includes('purchase')) {
      return 'shortage';
    }
    if (type.includes('completion') || type.includes('mo_') || type.includes('work_order')) {
      return 'completion';
    }
    if (type.includes('sales') || type.includes('so_')) {
      return 'sales';
    }
    return 'shortage'; // Default fallback
  }

  /**
   * Formats dates to a relative human-readable string.
   */
  timeAgo(date) {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }
}

module.exports = new NotificationService();
