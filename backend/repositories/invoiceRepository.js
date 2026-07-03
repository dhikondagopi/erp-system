const { pool, query } = require('../config/db');

class InvoiceRepository {
  // ─── SALES INVOICES ───
  async findSalesInvoiceById(id, client = null) {
    const db = client || pool;
    const sql = `
      SELECT si.*, 
             c.name AS customer_name, c.email AS customer_email, c.phone AS customer_phone, c.address AS customer_address,
             so.order_number AS sales_order_number
      FROM sales_invoices si
      INNER JOIN customers c ON si.customer_id = c.id
      INNER JOIN sales_orders so ON si.sales_order_id = so.id
      WHERE si.id = $1;
    `;
    const res = await db.query(sql, [id]);
    if (res.rows.length === 0) return null;
    
    const invoice = res.rows[0];
    
    // Load Sales Order Items
    const itemsSql = `
      SELECT soi.*, p.sku, p.name, p.uom
      FROM sales_order_items soi
      INNER JOIN products p ON soi.product_id = p.id
      WHERE soi.sales_order_id = $1;
    `;
    const itemsRes = await db.query(itemsSql, [invoice.sales_order_id]);
    invoice.items = itemsRes.rows;

    return invoice;
  }

  async findAllSalesInvoices({ customerId, paymentStatus, status, limit = 50, offset = 0 } = {}) {
    let sql = `
      SELECT si.*, c.name AS customer_name, c.email AS customer_email,
             so.order_number AS sales_order_number
      FROM sales_invoices si
      INNER JOIN customers c ON si.customer_id = c.id
      INNER JOIN sales_orders so ON si.sales_order_id = so.id
    `;
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (customerId) {
      conditions.push(`si.customer_id = $${paramIndex}`);
      params.push(customerId);
      paramIndex++;
    }

    if (paymentStatus) {
      conditions.push(`si.payment_status = $${paramIndex}`);
      params.push(paymentStatus);
      paramIndex++;
    }

    if (status) {
      conditions.push(`si.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ` ORDER BY si.invoice_date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;

    let countSql = 'SELECT COUNT(*) FROM sales_invoices si';
    if (conditions.length > 0) {
      countSql += ' WHERE ' + conditions.join(' AND ');
    }

    const countRes = await query(countSql, params);
    const total = parseInt(countRes.rows[0].count, 10);

    const dataParams = [...params, limit, offset];
    const res = await query(sql, dataParams);

    return {
      invoices: res.rows,
      total
    };
  }

  async createSalesInvoice(data, client = null) {
    const db = client || pool;
    const sql = `
      INSERT INTO sales_invoices (
        invoice_number, sales_order_id, customer_id, invoice_date, due_date,
        subtotal, tax_amount, discount_amount, grand_total, paid_amount, payment_status, status, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *;
    `;
    const params = [
      data.invoice_number,
      data.sales_order_id,
      data.customer_id,
      data.invoice_date || new Date(),
      data.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      data.subtotal,
      data.tax_amount || 0.00,
      data.discount_amount || 0.00,
      data.grand_total,
      data.paid_amount || 0.00,
      data.payment_status || 'PENDING',
      data.status || 'DRAFT',
      data.created_by
    ];
    const res = await db.query(sql, params);
    return res.rows[0];
  }

  async updateSalesInvoiceStatus(id, { paymentStatus, status, paidAmount }, client = null) {
    const db = client || pool;
    let sql = 'UPDATE sales_invoices SET ';
    const sets = [];
    const params = [];
    let paramIndex = 1;

    if (paymentStatus) {
      sets.push(`payment_status = $${paramIndex}`);
      params.push(paymentStatus);
      paramIndex++;
    }

    if (status) {
      sets.push(`status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (paidAmount !== undefined) {
      sets.push(`paid_amount = $${paramIndex}`);
      params.push(paidAmount);
      paramIndex++;
    }

    sets.push(`updated_at = now()`);
    sql += sets.join(', ') + ` WHERE id = $${paramIndex} RETURNING *;`;
    params.push(id);

    const res = await db.query(sql, params);
    return res.rows[0] || null;
  }

  // ─── PURCHASE INVOICES ───
  async findPurchaseInvoiceById(id, client = null) {
    const db = client || pool;
    const sql = `
      SELECT pi.*, 
             v.name AS vendor_name, v.email AS vendor_email, v.phone AS vendor_phone, v.address AS vendor_address,
             po.order_number AS purchase_order_number
      FROM purchase_invoices pi
      INNER JOIN vendors v ON pi.vendor_id = v.id
      INNER JOIN purchase_orders po ON pi.purchase_order_id = po.id
      WHERE pi.id = $1;
    `;
    const res = await db.query(sql, [id]);
    if (res.rows.length === 0) return null;
    
    const invoice = res.rows[0];

    // Load Purchase Order Items
    const itemsSql = `
      SELECT poi.*, p.sku, p.name, p.uom
      FROM purchase_order_items poi
      INNER JOIN products p ON poi.product_id = p.id
      WHERE poi.purchase_order_id = $1;
    `;
    const itemsRes = await db.query(itemsSql, [invoice.purchase_order_id]);
    invoice.items = itemsRes.rows;

    return invoice;
  }

  async findAllPurchaseInvoices({ vendorId, paymentStatus, status, limit = 50, offset = 0 } = {}) {
    let sql = `
      SELECT pi.*, v.name AS vendor_name, v.email AS vendor_email,
             po.order_number AS purchase_order_number
      FROM purchase_invoices pi
      INNER JOIN vendors v ON pi.vendor_id = v.id
      INNER JOIN purchase_orders po ON pi.purchase_order_id = po.id
    `;
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (vendorId) {
      conditions.push(`pi.vendor_id = $${paramIndex}`);
      params.push(vendorId);
      paramIndex++;
    }

    if (paymentStatus) {
      conditions.push(`pi.payment_status = $${paramIndex}`);
      params.push(paymentStatus);
      paramIndex++;
    }

    if (status) {
      conditions.push(`pi.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ` ORDER BY pi.invoice_date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;

    let countSql = 'SELECT COUNT(*) FROM purchase_invoices pi';
    if (conditions.length > 0) {
      countSql += ' WHERE ' + conditions.join(' AND ');
    }

    const countRes = await query(countSql, params);
    const total = parseInt(countRes.rows[0].count, 10);

    const dataParams = [...params, limit, offset];
    const res = await query(sql, dataParams);

    return {
      invoices: res.rows,
      total
    };
  }

  async createPurchaseInvoice(data, client = null) {
    const db = client || pool;
    const sql = `
      INSERT INTO purchase_invoices (
        invoice_number, purchase_order_id, vendor_id, invoice_date, due_date,
        subtotal, tax_amount, discount_amount, grand_total, paid_amount, payment_status, status, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *;
    `;
    const params = [
      data.invoice_number,
      data.purchase_order_id,
      data.vendor_id,
      data.invoice_date || new Date(),
      data.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      data.subtotal,
      data.tax_amount || 0.00,
      data.discount_amount || 0.00,
      data.grand_total,
      data.paid_amount || 0.00,
      data.payment_status || 'PENDING',
      data.status || 'DRAFT',
      data.created_by
    ];
    const res = await db.query(sql, params);
    return res.rows[0];
  }

  async updatePurchaseInvoiceStatus(id, { paymentStatus, status, paidAmount }, client = null) {
    const db = client || pool;
    let sql = 'UPDATE purchase_invoices SET ';
    const sets = [];
    const params = [];
    let paramIndex = 1;

    if (paymentStatus) {
      sets.push(`payment_status = $${paramIndex}`);
      params.push(paymentStatus);
      paramIndex++;
    }

    if (status) {
      sets.push(`status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (paidAmount !== undefined) {
      sets.push(`paid_amount = $${paramIndex}`);
      params.push(paidAmount);
      paramIndex++;
    }

    sets.push(`updated_at = now()`);
    sql += sets.join(', ') + ` WHERE id = $${paramIndex} RETURNING *;`;
    params.push(id);

    const res = await db.query(sql, params);
    return res.rows[0] || null;
  }
}

module.exports = new InvoiceRepository();
