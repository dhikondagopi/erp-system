const { pool } = require('../config/db');
const invoiceRepository = require('../repositories/invoiceRepository');
const salesRepository = require('../repositories/salesRepository');
const purchaseRepository = require('../repositories/purchaseRepository');
const auditService = require('./auditService');
const notificationService = require('./notificationService');
const PDFDocument = require('pdfkit');

class InvoiceService {
  async getSalesInvoiceById(id) {
    const inv = await invoiceRepository.findSalesInvoiceById(id);
    if (!inv) {
      const error = new Error(`Sales Invoice with ID '${id}' not found.`);
      error.statusCode = 404;
      throw error;
    }
    return inv;
  }

  async getPurchaseInvoiceById(id) {
    const inv = await invoiceRepository.findPurchaseInvoiceById(id);
    if (!inv) {
      const error = new Error(`Purchase Invoice with ID '${id}' not found.`);
      error.statusCode = 404;
      throw error;
    }
    return inv;
  }

  async getAllSalesInvoices(queryParams) {
    const { customerId, paymentStatus, status, page = 1, limit = 50 } = queryParams;
    const parsedPage = Math.max(1, parseInt(page, 10));
    const parsedLimit = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const offset = (parsedPage - 1) * parsedLimit;

    const { invoices, total } = await invoiceRepository.findAllSalesInvoices({
      customerId,
      paymentStatus: paymentStatus ? paymentStatus.toUpperCase() : null,
      status: status ? status.toUpperCase() : null,
      limit: parsedLimit,
      offset
    });

    return {
      invoices,
      pagination: {
        totalItems: total,
        itemsPerPage: parsedLimit,
        currentPage: parsedPage,
        totalPages: Math.ceil(total / parsedLimit)
      }
    };
  }

  async getAllPurchaseInvoices(queryParams) {
    const { vendorId, paymentStatus, status, page = 1, limit = 50 } = queryParams;
    const parsedPage = Math.max(1, parseInt(page, 10));
    const parsedLimit = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const offset = (parsedPage - 1) * parsedLimit;

    const { invoices, total } = await invoiceRepository.findAllPurchaseInvoices({
      vendorId,
      paymentStatus: paymentStatus ? paymentStatus.toUpperCase() : null,
      status: status ? status.toUpperCase() : null,
      limit: parsedLimit,
      offset
    });

    return {
      invoices,
      pagination: {
        totalItems: total,
        itemsPerPage: parsedLimit,
        currentPage: parsedPage,
        totalPages: Math.ceil(total / parsedLimit)
      }
    };
  }

  async createSalesInvoice(salesOrderId, invoiceData, userId) {
    const order = await salesRepository.findById(salesOrderId);
    if (!order) {
      const error = new Error(`Sales Order with ID '${salesOrderId}' not found.`);
      error.statusCode = 404;
      throw error;
    }

    if (order.status !== 'APPROVED' && order.status !== 'COMPLETED') {
      throw new Error(`Invoices can only be generated for Sales Orders in APPROVED or COMPLETED status. Current: ${order.status}`);
    }

    // Check if invoice already exists for this order
    const existing = await pool.query('SELECT id FROM sales_invoices WHERE sales_order_id = $1', [salesOrderId]);
    if (existing.rows.length > 0) {
      throw new Error(`An invoice has already been generated for Sales Order ${order.order_number}.`);
    }

    const subtotal = parseFloat(order.total_amount);
    const taxRate = parseFloat(invoiceData.tax_rate || 18.00); // Default 18% GST
    const discount = parseFloat(invoiceData.discount_amount || 0.00);

    const taxAmount = Math.round((subtotal * (taxRate / 100)) * 100) / 100;
    const grandTotal = Math.round((subtotal + taxAmount - discount) * 100) / 100;

    // Generate unique invoice number: INV-S-YYYYMMDD-XXXX
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = `INV-S-${todayStr}-${randSuffix}`;

    const payload = {
      invoice_number: invoiceNumber,
      sales_order_id: salesOrderId,
      customer_id: order.customer_id,
      invoice_date: new Date(),
      due_date: invoiceData.due_date ? new Date(invoiceData.due_date) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      subtotal,
      tax_amount: taxAmount,
      discount_amount: discount,
      grand_total: grandTotal,
      paid_amount: 0.00,
      payment_status: 'PENDING',
      status: 'SENT', // Default to sent upon creation
      created_by: userId
    };

    const newInvoice = await invoiceRepository.createSalesInvoice(payload);

    await auditService.log({
      user_id: userId,
      action: 'CREATE_SALES_INVOICE',
      entity_type: 'sales_invoices',
      entity_id: newInvoice.id,
      new_value: payload,
      ip_address: 'System Service'
    });

    return newInvoice;
  }

  async createPurchaseInvoice(purchaseOrderId, invoiceData, userId) {
    const order = await purchaseRepository.findById(purchaseOrderId);
    if (!order) {
      const error = new Error(`Purchase Order with ID '${purchaseOrderId}' not found.`);
      error.statusCode = 404;
      throw error;
    }

    if (order.status !== 'RECEIVED') {
      throw new Error(`Invoices can only be generated for Purchase Orders in RECEIVED status. Current: ${order.status}`);
    }

    // Check if invoice already exists
    const existing = await pool.query('SELECT id FROM purchase_invoices WHERE purchase_order_id = $1', [purchaseOrderId]);
    if (existing.rows.length > 0) {
      throw new Error(`An invoice has already been generated for Purchase Order ${order.order_number}.`);
    }

    const subtotal = parseFloat(order.total_amount);
    const taxRate = parseFloat(invoiceData.tax_rate || 18.00);
    const discount = parseFloat(invoiceData.discount_amount || 0.00);

    const taxAmount = Math.round((subtotal * (taxRate / 100)) * 100) / 100;
    const grandTotal = Math.round((subtotal + taxAmount - discount) * 100) / 100;

    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = `INV-P-${todayStr}-${randSuffix}`;

    const payload = {
      invoice_number: invoiceNumber,
      purchase_order_id: purchaseOrderId,
      vendor_id: order.vendor_id,
      invoice_date: new Date(),
      due_date: invoiceData.due_date ? new Date(invoiceData.due_date) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      subtotal,
      tax_amount: taxAmount,
      discount_amount: discount,
      grand_total: grandTotal,
      paid_amount: 0.00,
      payment_status: 'PENDING',
      status: 'SENT',
      created_by: userId
    };

    const newInvoice = await invoiceRepository.createPurchaseInvoice(payload);

    await auditService.log({
      user_id: userId,
      action: 'CREATE_PURCHASE_INVOICE',
      entity_type: 'purchase_invoices',
      entity_id: newInvoice.id,
      new_value: payload,
      ip_address: 'System Service'
    });

    return newInvoice;
  }

  /**
   * PDF Generator using pdfkit.
   */
  async generatePDF(invoiceType, id, res) {
    let invoice;
    let partnerName, partnerEmail, partnerAddress, orderNumLabel, orderNumber;

    if (invoiceType === 'SALES') {
      invoice = await this.getSalesInvoiceById(id);
      partnerName = invoice.customer_name;
      partnerEmail = invoice.customer_email;
      partnerAddress = invoice.customer_address || 'Not Provided';
      orderNumLabel = 'Sales Order';
      orderNumber = invoice.sales_order_number;
    } else {
      invoice = await this.getPurchaseInvoiceById(id);
      partnerName = invoice.vendor_name;
      partnerEmail = invoice.vendor_email;
      partnerAddress = invoice.vendor_address || 'Not Provided';
      orderNumLabel = 'Purchase Order';
      orderNumber = invoice.purchase_order_number;
    }

    const doc = new PDFDocument({ margin: 50 });

    // Stream PDF directly to client response
    doc.pipe(res);

    // ─── HEADER ───
    doc
      .fillColor('#475569')
      .font('Helvetica-Bold')
      .fontSize(22)
      .text('SHIV FURNITURE WORKS', 50, 50)
      .fontSize(10)
      .font('Helvetica')
      .text('Premium Wooden Furniture & Decors', 50, 75)
      .text('Industrial Area, Sector 4, Hyderabad, India', 50, 90)
      .text('Email: billing@shivfurniture.com | Tel: +91 99888 77665', 50, 105);

    // Invoice Meta (right aligned)
    doc
      .fillColor('#1e293b')
      .font('Helvetica-Bold')
      .fontSize(18)
      .text('INVOICE', 380, 50, { align: 'right', width: 180 })
      .fontSize(10)
      .font('Helvetica')
      .text(`Invoice #: ${invoice.invoice_number}`, 380, 75, { align: 'right', width: 180 })
      .text(`Date: ${new Date(invoice.invoice_date).toLocaleDateString()}`, 380, 90, { align: 'right', width: 180 })
      .text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString()}`, 380, 105, { align: 'right', width: 180 })
      .text(`Payment Status: ${invoice.payment_status}`, 380, 120, { align: 'right', width: 180 });

    doc.moveTo(50, 145).lineTo(560, 145).strokeColor('#cbd5e1').stroke();

    // ─── BILL TO & REFERENCES ───
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor('#475569')
      .text('BILL TO:', 50, 160)
      .font('Helvetica-Bold')
      .fillColor('#0f172a')
      .text(partnerName, 50, 175)
      .font('Helvetica')
      .fillColor('#334155')
      .text(`Email: ${partnerEmail}`, 50, 190)
      .text(`Address: ${partnerAddress}`, 50, 205, { width: 220 });

    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor('#475569')
      .text('ORDER REFERENCE:', 350, 160)
      .font('Helvetica')
      .fillColor('#0f172a')
      .text(`${orderNumLabel} #: ${orderNumber}`, 350, 175)
      .text(`Issued By: Shiv Furniture Billing Team`, 350, 190);

    doc.moveTo(50, 240).lineTo(560, 240).strokeColor('#cbd5e1').stroke();

    // ─── ITEMS TABLE HEADER ───
    let tableTop = 260;
    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .fillColor('#475569')
      .text('SKU', 50, tableTop)
      .text('Item Description', 150, tableTop)
      .text('Qty', 350, tableTop, { width: 50, align: 'right' })
      .text('Rate', 410, tableTop, { width: 70, align: 'right' })
      .text('Total', 490, tableTop, { width: 70, align: 'right' });

    doc.moveTo(50, 275).lineTo(560, 275).strokeColor('#94a3b8').strokeWidth(1.5).stroke();

    // ─── ITEMS LIST ───
    let rowTop = 285;
    doc.font('Helvetica').fontSize(9).fillColor('#334155');
    
    invoice.items.forEach(item => {
      const price = parseFloat(invoiceType === 'SALES' ? item.unit_price : item.unit_cost);
      const qty = parseFloat(item.quantity);
      const total = qty * price;

      doc
        .text(item.sku, 50, rowTop)
        .text(item.name, 150, rowTop, { width: 190 })
        .text(qty.toFixed(2), 350, rowTop, { width: 50, align: 'right' })
        .text(`Rs ${price.toFixed(2)}`, 410, rowTop, { width: 70, align: 'right' })
        .text(`Rs ${total.toFixed(2)}`, 490, rowTop, { width: 70, align: 'right' });

      rowTop += 25;
    });

    doc.moveTo(50, rowTop).lineTo(560, rowTop).strokeColor('#cbd5e1').strokeWidth(1).stroke();

    // ─── TOTALS CALCULATION ───
    let totalsTop = rowTop + 15;
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#475569')
      .text('Subtotal:', 350, totalsTop, { width: 110, align: 'right' })
      .text(`Rs ${parseFloat(invoice.subtotal).toFixed(2)}`, 470, totalsTop, { width: 90, align: 'right' });

    totalsTop += 20;
    doc
      .text('Tax (18% GST):', 350, totalsTop, { width: 110, align: 'right' })
      .text(`Rs ${parseFloat(invoice.tax_amount).toFixed(2)}`, 470, totalsTop, { width: 90, align: 'right' });

    totalsTop += 20;
    doc
      .text('Discount:', 350, totalsTop, { width: 110, align: 'right' })
      .text(`Rs ${parseFloat(invoice.discount_amount).toFixed(2)}`, 470, totalsTop, { width: 90, align: 'right' });

    totalsTop += 25;
    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor('#0f172a')
      .text('Grand Total:', 350, totalsTop, { width: 110, align: 'right' })
      .text(`Rs ${parseFloat(invoice.grand_total).toFixed(2)}`, 470, totalsTop, { width: 90, align: 'right' });

    totalsTop += 20;
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#059669')
      .text('Paid Amount:', 350, totalsTop, { width: 110, align: 'right' })
      .text(`Rs ${parseFloat(invoice.paid_amount).toFixed(2)}`, 470, totalsTop, { width: 90, align: 'right' });

    totalsTop += 20;
    const balance = parseFloat(invoice.grand_total) - parseFloat(invoice.paid_amount);
    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .fillColor(balance > 0 ? '#dc2626' : '#1e293b')
      .text('Balance Due:', 350, totalsTop, { width: 110, align: 'right' })
      .text(`Rs ${balance.toFixed(2)}`, 470, totalsTop, { width: 90, align: 'right' });

    // ─── FOOTER TERMS ───
    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor('#94a3b8')
      .text('Thank you for choosing Shiv Furniture Works. All items are crafted from authentic selected timber woods.', 50, 700, { align: 'center', width: 510 })
      .text('Please verify billing items on receipt. Payments are due within invoice parameters.', 50, 715, { align: 'center', width: 510 });

    doc.end();
  }
}

module.exports = new InvoiceService();
