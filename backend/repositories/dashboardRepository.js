const { query } = require('../config/db');

/**
 * Dashboard Analytics Repository.
 * Executes optimized database queries to compute business KPIs and summaries.
 */
class DashboardRepository {
  /**
   * Calculate total revenue today.
   * Matches Confirmed or Shipped Sales Orders created today.
   */
  async getRevenueToday() {
    const sql = `
      SELECT COALESCE(SUM(total_amount), 0) AS value
      FROM sales_orders
      WHERE status IN ('APPROVED', 'COMPLETED')
        AND created_at >= CURRENT_DATE;
    `;
    const res = await query(sql);
    return parseFloat(res.rows[0].value);
  }

  /**
   * Calculate total revenue this month.
   */
  async getRevenueThisMonth() {
    const sql = `
      SELECT COALESCE(SUM(total_amount), 0) AS value
      FROM sales_orders
      WHERE status IN ('APPROVED', 'COMPLETED')
        AND created_at >= date_trunc('month', now());
    `;
    const res = await query(sql);
    return parseFloat(res.rows[0].value);
  }

  /**
   * Calculate current cumulative cost valuation of physical stock.
   */
  async getInventoryValuation() {
    const sql = `
      SELECT COALESCE(SUM(i.qty_on_hand * p.unit_cost), 0) AS value
      FROM inventory i
      INNER JOIN products p ON i.product_id = p.id;
    `;
    const res = await query(sql);
    return parseFloat(res.rows[0].value);
  }

  /**
   * Count products currently breaching reorder point parameters.
   */
  async getLowStockCount() {
    const sql = `
      SELECT COUNT(*)::int AS count
      FROM products p
      INNER JOIN inventory i ON p.id = i.product_id
      WHERE p.procurement_type = 'PURCHASE'
        AND (i.qty_on_hand + i.qty_incoming) < p.reorder_point;
    `;
    const res = await query(sql);
    return res.rows[0].count;
  }

  /**
   * Count pending Purchase Orders.
   */
  async getPendingPurchaseOrdersCount() {
    const sql = `
      SELECT COUNT(*)::int AS count
      FROM purchase_orders
      WHERE status IN ('DRAFT', 'PENDING_APPROVAL', 'APPROVED');
    `;
    const res = await query(sql);
    return res.rows[0].count;
  }

  /**
   * Count pending Manufacturing Orders.
   */
  async getPendingManufacturingOrdersCount() {
    const sql = `
      SELECT COUNT(*)::int AS count
      FROM manufacturing_orders
      WHERE status IN ('DRAFT', 'APPROVED', 'IN_PRODUCTION');
    `;
    const res = await query(sql);
    return res.rows[0].count;
  }

  /**
   * Retrieve top 5 selling products by summation of units sold.
   */
  async getTopSellingProducts(limit = 5) {
    const sql = `
      SELECT p.id, p.sku, p.name, p.category, p.image_url,
             SUM(soi.quantity)::numeric AS units_sold,
             SUM(soi.quantity * soi.unit_price)::numeric AS revenue_generated
      FROM sales_order_items soi
      INNER JOIN products p ON soi.product_id = p.id
      INNER JOIN sales_orders so ON soi.sales_order_id = so.id
      WHERE so.status IN ('APPROVED', 'COMPLETED')
      GROUP BY p.id, p.sku, p.name, p.category, p.image_url
      ORDER BY units_sold DESC
      LIMIT $1;
    `;
    const res = await query(sql, [limit]);
    return res.rows.map(row => ({
      ...row,
      units_sold: parseFloat(row.units_sold),
      revenue_generated: parseFloat(row.revenue_generated)
    }));
  }

  /**
   * Fetch latest 10 inventory audit ledger logs with product SKU labels.
   */
  async getRecentLedgerMovements(limit = 10) {
    const sql = `
      SELECT sl.id, sl.transaction_type, sl.reference_type, sl.reference_id,
             sl.qty_change, sl.unit_cost, sl.reason, sl.created_at,
             p.sku AS product_sku, p.name AS product_name,
             u.first_name || ' ' || u.last_name AS operator_name
      FROM stock_ledger sl
      INNER JOIN products p ON sl.product_id = p.id
      LEFT JOIN users u ON sl.user_id = u.id
      ORDER BY sl.created_at DESC
      LIMIT $1;
    `;
    const res = await query(sql, [limit]);
    return res.rows.map(row => ({
      ...row,
      qty_change: parseFloat(row.qty_change),
      unit_cost: parseFloat(row.unit_cost)
    }));
  }

  /**
   * Compute rolling monthly revenue for the past N months.
   * Groups confirmed/shipped sales orders by calendar month.
   */
  async getMonthlyRevenueTrend(months = 6) {
    const sql = `
      SELECT
        TO_CHAR(date_trunc('month', created_at), 'Mon YYYY') AS month,
        date_trunc('month', created_at) AS month_date,
        COALESCE(SUM(total_amount), 0)::numeric AS revenue
      FROM sales_orders
      WHERE status IN ('APPROVED', 'COMPLETED')
        AND created_at >= date_trunc('month', now()) - INTERVAL '1 month' * ($1 - 1)
      GROUP BY date_trunc('month', created_at)
      ORDER BY month_date ASC;
    `;
    const res = await query(sql, [months]);
    return res.rows.map(row => ({
      month: row.month,
      revenue: parseFloat(row.revenue)
    }));
  }

  /**
   * Count manufacturing orders grouped by status.
   */
  async getManufacturingStatusDistribution() {
    const sql = `
      SELECT status, COUNT(*)::int AS count
      FROM manufacturing_orders
      GROUP BY status
      ORDER BY count DESC;
    `;
    const res = await query(sql);
    return res.rows;
  }

  /**
   * Fetch purchase cost trend over past N months.
   */
  async getPurchaseTrend(months = 6) {
    const sql = `
      SELECT
        TO_CHAR(date_trunc('month', created_at), 'Mon YYYY') AS month,
        date_trunc('month', created_at) AS month_date,
        COALESCE(SUM(total_amount), 0)::numeric AS spend
      FROM purchase_orders
      WHERE status = 'RECEIVED'
        AND created_at >= date_trunc('month', now()) - INTERVAL '1 month' * ($1 - 1)
      GROUP BY date_trunc('month', created_at)
      ORDER BY month_date ASC;
    `;
    const res = await query(sql, [months]);
    return res.rows.map(row => ({
      month: row.month,
      spend: parseFloat(row.spend)
    }));
  }

  /**
   * Retrieve top customers by sales order spend.
   */
  async getTopCustomers(limit = 5) {
    const sql = `
      SELECT 
        c.name AS customer_name,
        COALESCE(SUM(so.total_amount), 0)::numeric AS spend
      FROM customers c
      JOIN sales_orders so ON c.id = so.customer_id
      WHERE so.status IN ('APPROVED', 'COMPLETED')
      GROUP BY c.id, c.name
      ORDER BY spend DESC
      LIMIT $1;
    `;
    const res = await query(sql, [limit]);
    return res.rows.map(row => ({
      customer_name: row.customer_name,
      spend: parseFloat(row.spend)
    }));
  }

  /**
   * Retrieve top vendors by purchase order spend.
   */
  async getTopVendors(limit = 5) {
    const sql = `
      SELECT 
        v.name AS vendor_name,
        COALESCE(SUM(po.total_amount), 0)::numeric AS spend
      FROM vendors v
      JOIN purchase_orders po ON v.id = po.vendor_id
      WHERE po.status = 'RECEIVED'
      GROUP BY v.id, v.name
      ORDER BY spend DESC
      LIMIT $1;
    `;
    const res = await query(sql, [limit]);
    return res.rows.map(row => ({
      vendor_name: row.vendor_name,
      spend: parseFloat(row.spend)
    }));
  }

  /**
   * Fetch inventory valuation categorized by product category.
   */
  async getInventoryValuationByCategory() {
    const sql = `
      SELECT 
        p.category,
        COALESCE(SUM(i.qty_on_hand * p.unit_cost), 0)::numeric AS valuation
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      GROUP BY p.category
      ORDER BY valuation DESC;
    `;
    const res = await query(sql);
    return res.rows.map(row => ({
      category: row.category || 'Uncategorized',
      valuation: parseFloat(row.valuation)
    }));
  }

  /**
   * Calculate total profit.
   * Revenue - COGS
   */
  async getProfit() {
    const sql = `
      SELECT COALESCE(SUM(soi.quantity * (soi.unit_price - p.unit_cost)), 0) AS profit
      FROM sales_order_items soi
      INNER JOIN products p ON soi.product_id = p.id
      INNER JOIN sales_orders so ON soi.sales_order_id = so.id
      WHERE so.status IN ('APPROVED', 'COMPLETED');
    `;
    const res = await query(sql);
    return parseFloat(res.rows[0].profit);
  }

  /**
   * Calculate Inventory Turnover Ratio: COGS / Avg Inventory Value
   */
  async getInventoryTurnover() {
    const sql = `
      SELECT 
        COALESCE(
          (SELECT SUM(soi.quantity * p.unit_cost) 
           FROM sales_order_items soi 
           JOIN products p ON soi.product_id = p.id
           JOIN sales_orders so ON soi.sales_order_id = so.id
           WHERE so.status = 'COMPLETED'), 0
        ) / NULLIF(
          (SELECT SUM(i.qty_on_hand * p.unit_cost) 
           FROM inventory i 
           JOIN products p ON i.product_id = p.id), 0
        ) AS turnover;
    `;
    const res = await query(sql);
    const val = parseFloat(res.rows[0].turnover);
    return isNaN(val) ? 0.0 : Math.round(val * 100) / 100;
  }

  /**
   * Manufacturing Efficiency: COMPLETED MOs / Total MOs
   */
  async getManufacturingEfficiency() {
    const sql = `
      SELECT 
        COALESCE(COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END)::numeric / NULLIF(COUNT(id), 0) * 100, 100) AS efficiency
      FROM manufacturing_orders;
    `;
    const res = await query(sql);
    return Math.round(parseFloat(res.rows[0].efficiency) * 100) / 100;
  }

  /**
   * Order Fulfillment Rate: COMPLETED SOs / Total SOs
   */
  async getOrderFulfillmentRate() {
    const sql = `
      SELECT 
        COALESCE(COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END)::numeric / NULLIF(COUNT(id), 0) * 100, 100) AS rate
      FROM sales_orders;
    `;
    const res = await query(sql);
    return Math.round(parseFloat(res.rows[0].rate) * 100) / 100;
  }

  /**
   * Customer Growth Rate (total customer count)
   */
  async getCustomerGrowth() {
    const sql = `
      SELECT COUNT(*)::int AS count FROM customers;
    `;
    const res = await query(sql);
    return res.rows[0].count;
  }

  /**
   * Monthly Production Trend: total quantity produced per month
   */
  async getMonthlyProductionTrend(months = 6) {
    const sql = `
      SELECT
        TO_CHAR(date_trunc('month', updated_at), 'Mon YYYY') AS month,
        date_trunc('month', updated_at) AS month_date,
        COALESCE(SUM(quantity), 0)::numeric AS quantity
      FROM manufacturing_orders
      WHERE status = 'COMPLETED'
        AND updated_at >= date_trunc('month', now()) - INTERVAL '1 month' * ($1 - 1)
      GROUP BY date_trunc('month', updated_at)
      ORDER BY month_date ASC;
    `;
    const res = await query(sql, [months]);
    return res.rows.map(row => ({
      month: row.month,
      quantity: parseFloat(row.quantity)
    }));
  }
}

module.exports = new DashboardRepository();
