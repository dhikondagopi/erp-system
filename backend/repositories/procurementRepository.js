const { pool, query } = require('../config/db');

/**
 * Procurement Repository.
 * Handles database operations for checking shortages, reorder points, and vendor lookups.
 */
class ProcurementRepository {
  /**
   * Find product procurement metadata.
   */
  async findProductProcurementDetails(productId, client = null) {
    const db = client || pool;
    const sql = `
      SELECT p.id, p.sku, p.name, p.type, p.procurement_type, p.replenishment_strategy, p.unit_cost, p.reorder_point,
             i.qty_on_hand, i.qty_reserved, i.qty_incoming, (i.qty_on_hand - i.qty_reserved) AS qty_available
      FROM products p
      INNER JOIN inventory i ON p.id = i.product_id
      WHERE p.id = $1
    `;
    const res = await db.query(sql, [productId]);
    return res.rows[0] || null;
  }

  /**
   * Query raw materials that breach their reorder point.
   * Checks condition: qty_on_hand + qty_incoming < reorder_point
   */
  async findLowStockProducts(client = null) {
    const db = client || pool;
    const sql = `
      SELECT p.id AS product_id, p.sku, p.name, p.reorder_point, p.unit_cost,
             i.qty_on_hand, i.qty_incoming, i.location,
             (p.reorder_point - (i.qty_on_hand + i.qty_incoming)) AS recommended_restock_qty
      FROM products p
      INNER JOIN inventory i ON p.id = i.product_id
      WHERE p.procurement_type = 'PURCHASE'
        AND (i.qty_on_hand + i.qty_incoming) < p.reorder_point
      ORDER BY p.name ASC
    `;
    const res = await db.query(sql);
    return res.rows;
  }

  /**
   * Retrieve a default vendor for drafting Purchase Orders.
   * Picks the first vendor in alphabetical order as a fallback.
   */
  async findDefaultVendor(client = null) {
    const db = client || pool;
    const sql = 'SELECT id, name, email FROM vendors ORDER BY name ASC LIMIT 1';
    const res = await db.query(sql);
    return res.rows[0] || null;
  }

  /**
   * Find the vendor mapped to a specific product.
   */
  async findVendorForProduct(productId, client = null) {
    const db = client || pool;
    const sql = `
      SELECT v.id, v.name, v.email, vp.vendor_price, vp.lead_time_days
      FROM vendors v
      INNER JOIN vendor_products vp ON v.id = vp.vendor_id
      WHERE vp.product_id = $1
      LIMIT 1
    `;
    const res = await db.query(sql, [productId]);
    return res.rows[0] || null;
  }

  /**
   * Find the active BoM associated with a finished good.
   */
  async findActiveBomForFinishedGood(productId, client = null) {
    const db = client || pool;
    const sql = 'SELECT id FROM bills_of_materials WHERE finished_good_id = $1 LIMIT 1';
    const res = await db.query(sql, [productId]);
    return res.rows[0] || null;
  }
}

module.exports = new ProcurementRepository();
