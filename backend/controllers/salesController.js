const salesService = require('../services/salesService');
const salesValidation = require('../validations/salesValidation');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Sales Order Controller.
 * Resolves incoming HTTP requests for the Sales Orders Module.
 */
class SalesController {
  /**
   * Fetch details of a single sales order.
   */
  getSalesOrderById = async (req, res, next) => {
    try {
      const { id } = req.params;
      const order = await salesService.getSalesOrderById(id);
      return sendSuccess(res, 'Sales Order details retrieved successfully.', order);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * Fetch paginated list of sales orders with filtering.
   */
  getAllSalesOrders = async (req, res, next) => {
    try {
      const result = await salesService.getAllSalesOrders(req.query);
      return sendSuccess(res, 'Sales Orders list loaded successfully.', result);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * Draft a new Sales Order.
   */
  createSalesOrder = async (req, res, next) => {
    try {
      const { isValid, errors } = salesValidation.validateCreate(req.body);
      if (!isValid) {
        return sendError(res, 'Validation failed: Invalid sales order properties.', 400, errors);
      }

      const userId = req.user.id;
      const newOrder = await salesService.createSalesOrder(req.body, userId);
      return sendSuccess(res, 'Sales Order draft created successfully.', newOrder, 201);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * Transition order status (APPROVED, COMPLETED, CANCELLED).
   */
  updateOrderStatus = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.user.id;
      const userRole = req.user.role;

      const { isValid, errors } = salesValidation.validateStatusUpdate(req.body);
      if (!isValid) {
        return sendError(res, 'Validation failed: Invalid status modification request.', 400, errors);
      }

      // Enforce strict workflow roles:
      if (userRole === 'Business Owner' && !['APPROVED', 'CANCELLED'].includes(status)) {
        return sendError(res, 'Access Forbidden: Business Owner can only Approve or Cancel sales orders.', 403);
      }
      if (userRole === 'Sales User' && !['COMPLETED', 'CANCELLED'].includes(status)) {
        return sendError(res, 'Access Forbidden: Sales Users can only Complete or Cancel sales orders.', 403);
      }
      if (userRole === 'Inventory Manager' && status !== 'COMPLETED') {
        return sendError(res, 'Access Forbidden: Inventory Manager can only mark sales orders as Completed (shipped).', 403);
      }

      let updatedOrder;
      switch (status) {
        case 'APPROVED':
          updatedOrder = await salesService.confirmSalesOrder(id, userId);
          break;
        case 'COMPLETED':
          updatedOrder = await salesService.shipSalesOrder(id, userId);
          break;
        case 'CANCELLED':
          updatedOrder = await salesService.cancelSalesOrder(id, userId);
          break;
        default:
          return sendError(res, `Unsupported status transition: '${status}'.`, 400);
      }

      return sendSuccess(res, `Sales Order status updated to '${status}' successfully.`, updatedOrder);
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = new SalesController();
