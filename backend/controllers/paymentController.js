const paymentService = require('../services/paymentService');
const { sendSuccess } = require('../utils/response');

class PaymentController {
  getAllPayments = async (req, res, next) => {
    try {
      const result = await paymentService.getAllPayments(req.query);
      return sendSuccess(res, 'Payments history loaded successfully.', result);
    } catch (error) {
      return next(error);
    }
  };

  getPaymentsByInvoice = async (req, res, next) => {
    try {
      const { invoiceType, invoiceId } = req.params;
      const payments = await paymentService.getPaymentsByInvoice(invoiceType, invoiceId);
      return sendSuccess(res, 'Invoice payments loaded successfully.', payments);
    } catch (error) {
      return next(error);
    }
  };

  recordPayment = async (req, res, next) => {
    try {
      const updatedInvoice = await paymentService.recordPayment(req.body, req.user.id);
      return sendSuccess(res, 'Payment recorded and invoice balance updated successfully.', updatedInvoice, 201);
    } catch (error) {
      return next(error);
    }
  };

  getDashboardPaymentsStats = async (req, res, next) => {
    try {
      const stats = await paymentService.getDashboardPaymentsStats();
      return sendSuccess(res, 'Payments dashboard financial stats loaded successfully.', stats);
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = new PaymentController();
