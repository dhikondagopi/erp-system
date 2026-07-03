const { query } = require('../config/db');
const { sendSuccess } = require('../utils/response');

class SearchController {
  async search(req, res, next) {
    try {
      const { q } = req.query;
      if (!q || q.trim() === '') {
        return sendSuccess(res, 'Search results', {
          products: [],
          customers: [],
          vendors: [],
          sales_orders: [],
          purchase_orders: [],
          manufacturing_orders: [],
          work_orders: []
        });
      }

      const searchPattern = `%${q.trim()}%`;

      const [
        productsRes,
        customersRes,
        vendorsRes,
        salesOrdersRes,
        purchaseOrdersRes,
        manufacturingOrdersRes,
        workOrdersRes
      ] = await Promise.all([
        query(
          `SELECT id, name, sku, type, category, unit_price 
           FROM products 
           WHERE name ILIKE $1 OR sku ILIKE $1 OR description ILIKE $1 
           LIMIT 5`,
          [searchPattern]
        ),
        query(
          `SELECT id, name, email, phone 
           FROM customers 
           WHERE name ILIKE $1 OR email ILIKE $1 OR phone ILIKE $1 
           LIMIT 5`,
          [searchPattern]
        ),
        query(
          `SELECT id, name, email, phone 
           FROM vendors 
           WHERE name ILIKE $1 OR email ILIKE $1 OR phone ILIKE $1 
           LIMIT 5`,
          [searchPattern]
        ),
        query(
          `SELECT so.id, so.order_number, c.name AS customer_name, so.status, so.total_amount 
           FROM sales_orders so 
           JOIN customers c ON so.customer_id = c.id 
           WHERE so.order_number ILIKE $1 OR c.name ILIKE $1 
           LIMIT 5`,
          [searchPattern]
        ),
        query(
          `SELECT po.id, po.order_number, v.name AS vendor_name, po.status, po.total_amount 
           FROM purchase_orders po 
           JOIN vendors v ON po.vendor_id = v.id 
           WHERE po.order_number ILIKE $1 OR v.name ILIKE $1 
           LIMIT 5`,
          [searchPattern]
        ),
        query(
          `SELECT mo.id, mo.mo_number, p.name AS product_name, mo.status, mo.quantity 
           FROM manufacturing_orders mo 
           JOIN products p ON mo.finished_good_id = p.id 
           WHERE mo.mo_number ILIKE $1 OR p.name ILIKE $1 
           LIMIT 5`,
          [searchPattern]
        ),
        query(
          `SELECT wo.id, wo.operation_name, mo.mo_number, wo.status 
           FROM work_orders wo 
           JOIN manufacturing_orders mo ON wo.manufacturing_order_id = mo.id 
           WHERE wo.operation_name ILIKE $1 OR mo.mo_number ILIKE $1 
           LIMIT 5`,
          [searchPattern]
        )
      ]);

      return sendSuccess(res, 'Search results retrieved successfully', {
        products: productsRes.rows,
        customers: customersRes.rows,
        vendors: vendorsRes.rows,
        sales_orders: salesOrdersRes.rows,
        purchase_orders: purchaseOrdersRes.rows,
        manufacturing_orders: manufacturingOrdersRes.rows,
        work_orders: workOrdersRes.rows
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SearchController();
