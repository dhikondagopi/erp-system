const { pool } = require('../config/db');
const PDFDocument = require('pdfkit');
const { Readable } = require('stream');

class ReportsService {
  /**
   * Fetch raw report data depending on type and filters.
   */
  async getReportData(type, filters = {}) {
    const { startDate, endDate, status } = filters;
    const params = [];
    let sql = '';

    switch (type) {
      case 'sales':
        sql = `
          SELECT 
            so.order_number, 
            c.name AS customer_name, 
            so.status, 
            so.total_amount, 
            so.created_at::date AS order_date,
            COUNT(soi.id)::int AS items_count
          FROM sales_orders so
          JOIN customers c ON so.customer_id = c.id
          LEFT JOIN sales_order_items soi ON so.id = soi.sales_order_id
          WHERE ($1::date IS NULL OR so.created_at >= $1)
            AND ($2::date IS NULL OR so.created_at <= $2)
            AND ($3::varchar IS NULL OR so.status = $3)
          GROUP BY so.id, c.name
          ORDER BY so.created_at DESC;
        `;
        params.push(startDate || null, endDate || null, status || null);
        break;

      case 'purchases':
        sql = `
          SELECT 
            po.order_number, 
            v.name AS vendor_name, 
            po.status, 
            po.total_amount, 
            po.created_at::date AS order_date,
            COUNT(poi.id)::int AS items_count
          FROM purchase_orders po
          JOIN vendors v ON po.vendor_id = v.id
          LEFT JOIN purchase_order_items poi ON po.id = poi.purchase_order_id
          WHERE ($1::date IS NULL OR po.created_at >= $1)
            AND ($2::date IS NULL OR po.created_at <= $2)
            AND ($3::varchar IS NULL OR po.status = $3)
          GROUP BY po.id, v.name
          ORDER BY po.created_at DESC;
        `;
        params.push(startDate || null, endDate || null, status || null);
        break;

      case 'inventory':
        sql = `
          SELECT 
            p.name AS product_name, 
            p.sku, 
            p.type,
            i.qty_on_hand, 
            i.qty_reserved, 
            p.unit_cost,
            p.unit_price,
            (i.qty_on_hand * p.unit_cost) AS total_valuation,
            i.location
          FROM inventory i
          JOIN products p ON i.product_id = p.id
          ORDER BY total_valuation DESC;
        `;
        break;

      case 'manufacturing':
        sql = `
          SELECT 
            mo.mo_number, 
            p.name AS product_name, 
            mo.quantity, 
            mo.status, 
            mo.created_at::date AS start_date,
            mo.updated_at::date AS completion_date,
            EXTRACT(DAY FROM (mo.updated_at - mo.created_at))::int AS duration_days
          FROM manufacturing_orders mo
          JOIN products p ON mo.finished_good_id = p.id
          WHERE ($1::date IS NULL OR mo.created_at >= $1)
            AND ($2::date IS NULL OR mo.created_at <= $2)
            AND ($3::varchar IS NULL OR mo.status = $3)
          ORDER BY mo.created_at DESC;
        `;
        params.push(startDate || null, endDate || null, status || null);
        break;

      case 'customers':
        sql = `
          SELECT 
            c.name AS customer_name, 
            c.email, 
            c.phone, 
            COUNT(so.id)::int AS total_orders, 
            COALESCE(SUM(so.total_amount), 0) AS total_spend
          FROM customers c
          LEFT JOIN sales_orders so ON c.id = so.customer_id AND so.status = 'COMPLETED'
          GROUP BY c.id
          ORDER BY total_spend DESC;
        `;
        break;

      case 'vendors':
        sql = `
          SELECT 
            v.name AS vendor_name, 
            v.email, 
            v.phone, 
            COUNT(po.id)::int AS total_orders, 
            COALESCE(SUM(po.total_amount), 0) AS total_spend
          FROM vendors v
          LEFT JOIN purchase_orders po ON v.id = po.vendor_id AND po.status = 'RECEIVED'
          GROUP BY v.id
          ORDER BY total_spend DESC;
        `;
        break;

      default:
        throw new Error(`Invalid report type: ${type}`);
    }

    const res = await pool.query(sql, params);
    return res.rows;
  }

  /**
   * Helper to format report headers and row extraction keys.
   */
  getReportMeta(type) {
    const maps = {
      sales: {
        title: 'Sales Order Report',
        headers: ['Order #', 'Customer', 'Status', 'Order Date', 'Items', 'Total Amount'],
        keys: ['order_number', 'customer_name', 'status', 'order_date', 'items_count', 'total_amount'],
        formats: [null, null, null, 'date', 'number', 'currency']
      },
      purchases: {
        title: 'Purchase Order Report',
        headers: ['Order #', 'Vendor', 'Status', 'Order Date', 'Items', 'Total Amount'],
        keys: ['order_number', 'vendor_name', 'status', 'order_date', 'items_count', 'total_amount'],
        formats: [null, null, null, 'date', 'number', 'currency']
      },
      inventory: {
        title: 'Inventory Stock Valuation Report',
        headers: ['Product Name', 'SKU', 'Type', 'Qty On Hand', 'Qty Reserved', 'Unit Cost', 'Total Valuation', 'Location'],
        keys: ['product_name', 'sku', 'type', 'qty_on_hand', 'qty_reserved', 'unit_cost', 'total_valuation', 'location'],
        formats: [null, null, null, 'number', 'number', 'currency', 'currency', null]
      },
      manufacturing: {
        title: 'Manufacturing Performance Report',
        headers: ['MO #', 'Product', 'Quantity', 'Status', 'Start Date', 'Completion Date', 'Duration (Days)'],
        keys: ['mo_number', 'product_name', 'quantity', 'status', 'start_date', 'completion_date', 'duration_days'],
        formats: [null, null, 'number', null, 'date', 'date', 'number']
      },
      customers: {
        title: 'Customer Sales Summary Report',
        headers: ['Customer Name', 'Email', 'Phone', 'Orders Completed', 'Total Spend'],
        keys: ['customer_name', 'email', 'phone', 'total_orders', 'total_spend'],
        formats: [null, null, null, 'number', 'currency']
      },
      vendors: {
        title: 'Vendor Procurement Summary Report',
        headers: ['Vendor Name', 'Email', 'Phone', 'Orders Fulfilled', 'Total Cost'],
        keys: ['vendor_name', 'email', 'phone', 'total_orders', 'total_spend'],
        formats: [null, null, null, 'number', 'currency']
      }
    };
    return maps[type];
  }

  /**
   * Helper to format values.
   */
  formatVal(val, format) {
    if (val === null || val === undefined) return '';
    if (format === 'currency') {
      return `Rs. ${parseFloat(val).toFixed(2)}`;
    }
    if (format === 'date') {
      return new Date(val).toISOString().split('T')[0];
    }
    if (format === 'number') {
      return parseFloat(val).toString();
    }
    return val.toString();
  }

  /**
   * Generate CSV format payload.
   */
  async generateCSV(type, data) {
    const meta = this.getReportMeta(type);
    let csv = meta.headers.join(',') + '\n';

    data.forEach(row => {
      const line = meta.keys.map((key, idx) => {
        let val = row[key];
        val = this.formatVal(val, meta.formats[idx]);
        // Escape quotes
        if (typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
          val = `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      });
      csv += line.join(',') + '\n';
    });

    return csv;
  }

  /**
   * Generate Excel native HTML structure.
   */
  async generateExcelHTML(type, data) {
    const meta = this.getReportMeta(type);
    let html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <style>
          body { font-family: sans-serif; }
          table { border-collapse: collapse; width: 100%; }
          th { background-color: #1e293b; color: white; font-weight: bold; text-align: left; padding: 10px; border: 1px solid #cbd5e1; }
          td { padding: 8px; border: 1px solid #cbd5e1; text-align: left; }
          tr:nth-child(even) { background-color: #f8fafc; }
          h2 { color: #0f172a; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <h2>${meta.title}</h2>
        <p>Generated on: ${new Date().toLocaleString()}</p>
        <table>
          <thead>
            <tr>
              ${meta.headers.map(h => `<th>${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
    `;

    data.forEach(row => {
      html += '<tr>';
      meta.keys.forEach((key, idx) => {
        const val = this.formatVal(row[key], meta.formats[idx]);
        html += `<td>${val}</td>`;
      });
      html += '</tr>';
    });

    html += `
          </tbody>
        </table>
      </body>
      </html>
    `;

    return html;
  }

  /**
   * Generate PDF Stream (via pdfkit).
   */
  async generatePDFStream(type, data) {
    const meta = this.getReportMeta(type);
    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    // Stream generator
    const stream = new Readable({
      read() {}
    });

    doc.on('data', chunk => stream.push(chunk));
    doc.on('end', () => stream.push(null));

    // Header styling
    doc.fillColor('#0f172a').fontSize(20).text('Shiv Furniture Works', { align: 'center' });
    doc.fontSize(10).fillColor('#64748b').text('Enterprise Resource Planning Report Engine', { align: 'center' });
    doc.moveDown(1.5);

    // Title
    doc.fillColor('#1e293b').fontSize(14).text(meta.title, { underline: true });
    doc.fontSize(8).fillColor('#64748b').text(`Generated: ${new Date().toLocaleString()}`);
    doc.moveDown(2);

    // Draw table
    const tableTop = doc.y;
    const colWidths = type === 'inventory' 
      ? [100, 50, 60, 50, 50, 65, 80, 60] 
      : type === 'manufacturing' 
      ? [80, 110, 50, 70, 70, 70, 65] 
      : [80, 110, 80, 80, 60, 105];

    // Table Header
    doc.fillColor('#ffffff');
    let currentX = 40;
    
    // Draw background header block
    doc.rect(40, tableTop - 5, colWidths.reduce((a, b) => a + b, 0), 20).fill('#1e293b');
    
    doc.fillColor('#ffffff').fontSize(8);
    meta.headers.forEach((h, idx) => {
      doc.text(h, currentX + 4, tableTop, { width: colWidths[idx] - 8, align: 'left' });
      currentX += colWidths[idx];
    });

    doc.moveDown(1.5);
    
    // Rows
    let y = doc.y + 10;
    doc.fillColor('#334155');

    data.forEach((row, rowIdx) => {
      // Page break checker
      if (y > 750) {
        doc.addPage();
        y = 50; // top of new page
      }

      // Zebra striping background
      if (rowIdx % 2 === 1) {
        doc.rect(40, y - 4, colWidths.reduce((a, b) => a + b, 0), 16).fill('#f8fafc');
        doc.fillColor('#334155');
      }

      currentX = 40;
      meta.keys.forEach((key, idx) => {
        const val = this.formatVal(row[key], meta.formats[idx]);
        doc.text(val, currentX + 4, y, { width: colWidths[idx] - 8, align: 'left' });
        currentX += colWidths[idx];
      });

      y += 16;
    });

    doc.end();
    return stream;
  }
}

module.exports = new ReportsService();
