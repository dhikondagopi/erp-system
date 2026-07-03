const invoiceService = require('../services/invoiceService');
const { sendSuccess } = require('../utils/response');

class InvoiceController {
  getSalesInvoiceById = async (req, res, next) => {
    try {
      const { id } = req.params;
      const invoice = await invoiceService.getSalesInvoiceById(id);
      return sendSuccess(res, 'Sales Invoice details fetched successfully.', invoice);
    } catch (error) {
      return next(error);
    }
  };

  getPurchaseInvoiceById = async (req, res, next) => {
    try {
      const { id } = req.params;
      const invoice = await invoiceService.getPurchaseInvoiceById(id);
      return sendSuccess(res, 'Purchase Invoice details fetched successfully.', invoice);
    } catch (error) {
      return next(error);
    }
  };

  getAllSalesInvoices = async (req, res, next) => {
    try {
      const result = await invoiceService.getAllSalesInvoices(req.query);
      return sendSuccess(res, 'Sales Invoices list loaded successfully.', result);
    } catch (error) {
      return next(error);
    }
  };

  getAllPurchaseInvoices = async (req, res, next) => {
    try {
      const result = await invoiceService.getAllPurchaseInvoices(req.query);
      return sendSuccess(res, 'Purchase Invoices list loaded successfully.', result);
    } catch (error) {
      return next(error);
    }
  };

  createSalesInvoice = async (req, res, next) => {
    try {
      const { sales_order_id, tax_rate, discount_amount, due_date } = req.body;
      const invoice = await invoiceService.createSalesInvoice(
        sales_order_id, 
        { tax_rate, discount_amount, due_date }, 
        req.user.id
      );
      return sendSuccess(res, 'Sales Invoice generated successfully.', invoice, 201);
    } catch (error) {
      return next(error);
    }
  };

  createPurchaseInvoice = async (req, res, next) => {
    try {
      const { purchase_order_id, tax_rate, discount_amount, due_date } = req.body;
      const invoice = await invoiceService.createPurchaseInvoice(
        purchase_order_id, 
        { tax_rate, discount_amount, due_date }, 
        req.user.id
      );
      return sendSuccess(res, 'Purchase Invoice generated successfully.', invoice, 201);
    } catch (error) {
      return next(error);
    }
  };

  getSalesInvoicePDF = async (req, res, next) => {
    try {
      const { id } = req.params;
      const invoice = await invoiceService.getSalesInvoiceById(id);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=Invoice-${invoice.invoice_number}.pdf`);
      await invoiceService.generatePDF('SALES', id, res);
    } catch (error) {
      return next(error);
    }
  };

  getPurchaseInvoicePDF = async (req, res, next) => {
    try {
      const { id } = req.params;
      const invoice = await invoiceService.getPurchaseInvoiceById(id);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=Invoice-${invoice.invoice_number}.pdf`);
      await invoiceService.generatePDF('PURCHASE', id, res);
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = new InvoiceController();
