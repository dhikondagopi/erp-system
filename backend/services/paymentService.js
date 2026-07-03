const { pool, query } = require('../config/db');
const auditService = require('./auditService');
const notificationService = require('./notificationService');

class PaymentService {
  async getAllPayments(queryParams) {
    const { invoiceType, page = 1, limit = 50 } = queryParams;
    const parsedPage = Math.max(1, parseInt(page, 10));
    const parsedLimit = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const offset = (parsedPage - 1) * parsedLimit;

    let sql = `
      SELECT p.*,
             u.first_name, u.last_name,
             si.invoice_number AS sales_invoice_number,
             pi.invoice_number AS purchase_invoice_number
      FROM payments p
      LEFT JOIN users u ON p.created_by = u.id
      LEFT JOIN sales_invoices si ON p.sales_invoice_id = si.id
      LEFT JOIN purchase_invoices pi ON p.purchase_invoice_id = pi.id
    `;
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (invoiceType) {
      conditions.push(`p.invoice_type = $${paramIndex}`);
      params.push(invoiceType.toUpperCase());
      paramIndex++;
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ` ORDER BY p.payment_date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;

    let countSql = 'SELECT COUNT(*) FROM payments p';
    if (conditions.length > 0) {
      countSql += ' WHERE ' + conditions.join(' AND ');
    }

    const countRes = await query(countSql, params);
    const total = parseInt(countRes.rows[0].count, 10);

    const dataParams = [...params, limit, offset];
    const res = await query(sql, dataParams);

    return {
      payments: res.rows,
      total,
      pagination: {
        totalItems: total,
        itemsPerPage: parsedLimit,
        currentPage: parsedPage,
        totalPages: Math.ceil(total / parsedLimit)
      }
    };
  }

  async getPaymentsByInvoice(invoiceType, invoiceId) {
    let sql = `
      SELECT p.*, u.first_name, u.last_name
      FROM payments p
      LEFT JOIN users u ON p.created_by = u.id
    `;
    if (invoiceType.toUpperCase() === 'SALES') {
      sql += ' WHERE p.sales_invoice_id = $1';
    } else {
      sql += ' WHERE p.purchase_invoice_id = $1';
    }
    sql += ' ORDER BY p.payment_date DESC;';
    const res = await query(sql, [invoiceId]);
    return res.rows;
  }

  async recordPayment(paymentData, userId) {
    const { invoice_type, sales_invoice_id, purchase_invoice_id, amount, payment_method, transaction_reference, notes } = paymentData;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      throw new Error('Payment amount must be a positive decimal.');
    }

    if (invoice_type !== 'SALES' && invoice_type !== 'PURCHASE') {
      throw new Error("Invoice type must be either 'SALES' or 'PURCHASE'.");
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      let grandTotal, paidBefore, orderId, orderNumber, updatedInvoice;
      const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randSuffix = Math.floor(1000 + Math.random() * 9000);
      const paymentNumber = `PAY-${todayStr}-${randSuffix}`;

      if (invoice_type === 'SALES') {
        if (!sales_invoice_id) throw new Error('Sales invoice ID is required for SALES payments.');
        
        // Lock invoice row
        const invRes = await client.query(
          'SELECT grand_total, paid_amount, sales_order_id, invoice_number FROM sales_invoices WHERE id = $1 FOR UPDATE',
          [sales_invoice_id]
        );
        if (invRes.rows.length === 0) throw new Error('Sales invoice not found.');
        
        grandTotal = parseFloat(invRes.rows[0].grand_total);
        paidBefore = parseFloat(invRes.rows[0].paid_amount);
        orderId = invRes.rows[0].sales_order_id;
        orderNumber = invRes.rows[0].invoice_number;

        if (paidBefore + parsedAmount > grandTotal) {
          throw new Error(`Payment exceeds balance due. Total Grand Total: Rs ${grandTotal}, Already Paid: Rs ${paidBefore}, Remaining: Rs ${grandTotal - paidBefore}`);
        }

        const newPaidAmount = paidBefore + parsedAmount;
        let newPaymentStatus = 'PARTIAL';
        if (newPaidAmount >= grandTotal) {
          newPaymentStatus = 'PAID';
        }

        // 1. Insert payment record
        const paymentSql = `
          INSERT INTO payments (
            payment_number, invoice_type, sales_invoice_id, amount, payment_method, transaction_reference, notes, created_by
          ) VALUES ($1, 'SALES', $2, $3, $4, $5, $6, $7)
          RETURNING *;
        `;
        await client.query(paymentSql, [
          paymentNumber,
          sales_invoice_id,
          parsedAmount,
          payment_method,
          transaction_reference || null,
          notes || null,
          userId
        ]);

        // 2. Update invoice status
        const updateInvSql = `
          UPDATE sales_invoices
          SET paid_amount = $1,
              payment_status = $2,
              status = $3,
              updated_at = now()
          WHERE id = $4
          RETURNING *;
        `;
        const updatedInvRes = await client.query(updateInvSql, [
          newPaidAmount,
          newPaymentStatus,
          newPaymentStatus === 'PAID' ? 'PAID' : 'SENT',
          sales_invoice_id
        ]);
        updatedInvoice = updatedInvRes.rows[0];

        // 3. Automatically complete Sales Order if paid in full
        if (newPaymentStatus === 'PAID') {
          await client.query(
            "UPDATE sales_orders SET status = 'COMPLETED', updated_at = now() WHERE id = $1",
            [orderId]
          );

          await auditService.log({
            user_id: userId,
            action: 'COMPLETE_SALES_ORDER_VIA_PAYMENT',
            entity_type: 'sales_orders',
            entity_id: orderId,
            new_value: { status: 'COMPLETED' },
            ip_address: 'System Service'
          }, client);
        }

      } else {
        if (!purchase_invoice_id) throw new Error('Purchase invoice ID is required for PURCHASE payments.');
        
        // Lock invoice row
        const invRes = await client.query(
          'SELECT grand_total, paid_amount, purchase_order_id, invoice_number FROM purchase_invoices WHERE id = $1 FOR UPDATE',
          [purchase_invoice_id]
        );
        if (invRes.rows.length === 0) throw new Error('Purchase invoice not found.');
        
        grandTotal = parseFloat(invRes.rows[0].grand_total);
        paidBefore = parseFloat(invRes.rows[0].paid_amount);
        orderId = invRes.rows[0].purchase_order_id;
        orderNumber = invRes.rows[0].invoice_number;

        if (paidBefore + parsedAmount > grandTotal) {
          throw new Error(`Payment exceeds balance due. Total Grand Total: Rs ${grandTotal}, Already Paid: Rs ${paidBefore}, Remaining: Rs ${grandTotal - paidBefore}`);
        }

        const newPaidAmount = paidBefore + parsedAmount;
        let newPaymentStatus = 'PARTIAL';
        if (newPaidAmount >= grandTotal) {
          newPaymentStatus = 'PAID';
        }

        // 1. Insert payment record
        const paymentSql = `
          INSERT INTO payments (
            payment_number, invoice_type, purchase_invoice_id, amount, payment_method, transaction_reference, notes, created_by
          ) VALUES ($1, 'PURCHASE', $2, $3, $4, $5, $6, $7)
          RETURNING *;
        `;
        await client.query(paymentSql, [
          paymentNumber,
          purchase_invoice_id,
          parsedAmount,
          payment_method,
          transaction_reference || null,
          notes || null,
          userId
        ]);

        // 2. Update invoice status
        const updateInvSql = `
          UPDATE purchase_invoices
          SET paid_amount = $1,
              payment_status = $2,
              status = $3,
              updated_at = now()
          WHERE id = $4
          RETURNING *;
        `;
        const updatedInvRes = await client.query(updateInvSql, [
          newPaidAmount,
          newPaymentStatus,
          newPaymentStatus === 'PAID' ? 'PAID' : 'SENT',
          purchase_invoice_id
        ]);
        updatedInvoice = updatedInvRes.rows[0];

        // 3. Automatically complete Purchase Order / Vendor Payment loop if paid in full
        if (newPaymentStatus === 'PAID') {
          // Check if Goods receipt received
          const poRes = await client.query('SELECT status FROM purchase_orders WHERE id = $1', [orderId]);
          if (poRes.rows[0]?.status === 'RECEIVED') {
            // Note: We can complete purchase order workflow state
            // Let's keep status tracking clean.
          }
        }
      }

      await auditService.log({
        user_id: userId,
        action: 'RECORD_PAYMENT',
        entity_type: 'payments',
        entity_id: updatedInvoice.id,
        new_value: { paymentNumber, amount: parsedAmount, invoice_number: orderNumber },
        ip_address: 'System Service'
      }, client);

      await client.query('COMMIT');
      return updatedInvoice;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getDashboardPaymentsStats() {
    // Accounts Receivable: Unpaid sales invoices
    const arRes = await query(`
      SELECT COALESCE(SUM(grand_total - paid_amount), 0) AS accounts_receivable,
             COUNT(id) AS unpaid_sales_invoices_count
      FROM sales_invoices
      WHERE status <> 'CANCELLED' AND payment_status <> 'PAID';
    `);

    // Accounts Payable: Unpaid purchase invoices
    const apRes = await query(`
      SELECT COALESCE(SUM(grand_total - paid_amount), 0) AS accounts_payable,
             COUNT(id) AS unpaid_purchase_invoices_count
      FROM purchase_invoices
      WHERE status <> 'CANCELLED' AND payment_status <> 'PAID';
    `);

    // Outstanding Payments list
    const outstandingRes = await query(`
      SELECT si.id, si.invoice_number, si.grand_total - si.paid_amount AS outstanding,
             si.due_date, c.name AS partner_name, 'SALES' AS invoice_type
      FROM sales_invoices si
      INNER JOIN customers c ON si.customer_id = c.id
      WHERE si.status <> 'CANCELLED' AND si.payment_status <> 'PAID'
      UNION ALL
      SELECT pi.id, pi.invoice_number, pi.grand_total - pi.paid_amount AS outstanding,
             pi.due_date, v.name AS partner_name, 'PURCHASE' AS invoice_type
      FROM purchase_invoices pi
      INNER JOIN vendors v ON pi.vendor_id = v.id
      WHERE pi.status <> 'CANCELLED' AND pi.payment_status <> 'PAID'
      ORDER BY due_date ASC
      LIMIT 10;
    `);

    // Upcoming Dues: Unpaid invoices due in the next 15 days
    const upcomingDuesRes = await query(`
      SELECT si.invoice_number, si.grand_total - si.paid_amount AS amount_due,
             si.due_date, c.name AS partner_name, 'SALES' AS invoice_type
      FROM sales_invoices si
      INNER JOIN customers c ON si.customer_id = c.id
      WHERE si.status <> 'CANCELLED' AND si.payment_status <> 'PAID' AND si.due_date BETWEEN now() AND (now() + INTERVAL '15 days')
      UNION ALL
      SELECT pi.invoice_number, pi.grand_total - pi.paid_amount AS amount_due,
             pi.due_date, v.name AS partner_name, 'PURCHASE' AS invoice_type
      FROM purchase_invoices pi
      INNER JOIN vendors v ON pi.vendor_id = v.id
      WHERE pi.status <> 'CANCELLED' AND pi.payment_status <> 'PAID' AND pi.due_date BETWEEN now() AND (now() + INTERVAL '15 days')
      ORDER BY due_date ASC;
    `);

    return {
      accounts_receivable: parseFloat(arRes.rows[0].accounts_receivable),
      unpaid_sales_count: parseInt(arRes.rows[0].unpaid_sales_invoices_count, 10),
      accounts_payable: parseFloat(apRes.rows[0].accounts_payable),
      unpaid_purchase_count: parseInt(apRes.rows[0].unpaid_purchase_invoices_count, 10),
      outstanding_payments: outstandingRes.rows.map(r => ({
        ...r,
        outstanding: parseFloat(r.outstanding)
      })),
      upcoming_due_payments: upcomingDuesRes.rows.map(r => ({
        ...r,
        amount_due: parseFloat(r.amount_due)
      }))
    };
  }
}

module.exports = new PaymentService();
