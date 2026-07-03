const purchaseService = require('../services/purchaseService');
const purchaseValidation = require('../validations/purchaseValidation');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Purchase Order Controller.
 * Resolves incoming HTTP requests for the Purchase Orders Module.
 */
class PurchaseController {
  /**
   * Fetch details of a single purchase order.
   */
  getPurchaseOrderById = async (req, res, next) => {
    try {
      const { id } = req.params;
      const order = await purchaseService.getPurchaseOrderById(id);
      return sendSuccess(res, 'Purchase Order details retrieved successfully.', order);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * Fetch paginated list of purchase orders with filtering.
   */
  getAllPurchaseOrders = async (req, res, next) => {
    try {
      const result = await purchaseService.getAllPurchaseOrders(req.query);
      return sendSuccess(res, 'Purchase Orders list loaded successfully.', result);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * Draft a new Purchase Order.
   */
  createPurchaseOrder = async (req, res, next) => {
    try {
      const { isValid, errors } = purchaseValidation.validateCreate(req.body);
      if (!isValid) {
        return sendError(res, 'Validation failed: Invalid purchase order properties.', 400, errors);
      }

      const userId = req.user.id;
      const newOrder = await purchaseService.createPurchaseOrder(req.body, userId);
      return sendSuccess(res, 'Purchase Order draft created successfully.', newOrder, 201);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * Transition purchase order status (SENT, RECEIVED, CANCELLED).
   */
  updateOrderStatus = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.user.id;
      const userRole = req.user.role;

      const { isValid, errors } = purchaseValidation.validateStatusUpdate(req.body);
      if (!isValid) {
        return sendError(res, 'Validation failed: Invalid status modification request.', 400, errors);
      }

      // Enforce strict workflow roles:
      if (userRole === 'Business Owner' && !['APPROVED', 'REJECTED', 'CANCELLED'].includes(status)) {
        return sendError(res, 'Access Forbidden: Business Owner can only Approve, Reject, or Cancel orders.', 403);
      }
      if (userRole === 'Purchase User' && ['APPROVED', 'REJECTED'].includes(status)) {
        return sendError(res, 'Access Forbidden: Purchase Users cannot Approve or Reject orders.', 403);
      }
      if (userRole === 'Inventory Manager' && status !== 'RECEIVED') {
        return sendError(res, 'Access Forbidden: Inventory Manager can only mark orders as Received.', 403);
      }

      let updatedOrder;
      switch (status) {
        case 'PENDING_APPROVAL':
          updatedOrder = await purchaseService.submitPurchaseOrder(id, userId);
          break;
        case 'APPROVED':
          updatedOrder = await purchaseService.approvePurchaseOrder(id, userId);
          break;
        case 'REJECTED':
          updatedOrder = await purchaseService.rejectPurchaseOrder(id, userId);
          break;
        case 'RECEIVED':
          updatedOrder = await purchaseService.receivePurchaseOrder(id, userId);
          break;
        case 'CANCELLED':
          updatedOrder = await purchaseService.cancelPurchaseOrder(id, userId);
          break;
        default:
          return sendError(res, `Unsupported status transition: '${status}'.`, 400);
      }

      return sendSuccess(res, `Purchase Order status updated to '${status}' successfully.`, updatedOrder);
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = new PurchaseController();
