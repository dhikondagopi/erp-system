const manufacturingService = require('../services/manufacturingService');
const manufacturingValidation = require('../validations/manufacturingValidation');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Manufacturing Order Controller.
 * Resolves incoming HTTP requests for the Manufacturing Orders Module.
 */
class ManufacturingController {
  /**
   * Fetch details of a single manufacturing order.
   */
  getManufacturingOrderById = async (req, res, next) => {
    try {
      const { id } = req.params;
      const mo = await manufacturingService.getManufacturingOrderById(id);
      return sendSuccess(res, 'Manufacturing Order details retrieved successfully.', mo);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * Fetch paginated list of manufacturing orders with filtering.
   */
  getAllManufacturingOrders = async (req, res, next) => {
    try {
      const result = await manufacturingService.getAllManufacturingOrders(req.query);
      return sendSuccess(res, 'Manufacturing Orders list loaded successfully.', result);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * Plan a new Manufacturing Order.
   */
  createManufacturingOrder = async (req, res, next) => {
    try {
      const { isValid, errors } = manufacturingValidation.validateCreate(req.body);
      if (!isValid) {
        return sendError(res, 'Validation failed: Invalid manufacturing order properties.', 400, errors);
      }

      const userId = req.user.id;
      const newMo = await manufacturingService.createManufacturingOrder(req.body, userId);
      return sendSuccess(res, 'Manufacturing Order planned successfully.', newMo, 201);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * Transition order status (APPROVED, IN_PRODUCTION, COMPLETED, CANCELLED).
   */
  updateOrderStatus = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.user.id;
      const userRole = req.user.role;

      const { isValid, errors } = manufacturingValidation.validateStatusUpdate(req.body);
      if (!isValid) {
        return sendError(res, 'Validation failed: Invalid status modification request.', 400, errors);
      }

      // Enforce strict workflow roles:
      if (status === 'APPROVED' && !['Admin', 'Business Owner'].includes(userRole)) {
        return sendError(res, 'Access Forbidden: Only Admins or Business Owners can Approve manufacturing orders.', 403);
      }
      if (['IN_PRODUCTION', 'COMPLETED'].includes(status) && !['Admin', 'Manufacturing User'].includes(userRole)) {
        return sendError(res, 'Access Forbidden: Only Admins or Manufacturing Users can start/complete production.', 403);
      }
      if (status === 'CANCELLED' && !['Admin', 'Business Owner', 'Manufacturing User'].includes(userRole)) {
        return sendError(res, 'Access Forbidden: You do not have permission to cancel manufacturing orders.', 403);
      }

      let updatedMo;
      switch (status) {
        case 'APPROVED':
          updatedMo = await manufacturingService.stageManufacturingOrder(id, userId);
          break;
        case 'IN_PRODUCTION':
          updatedMo = await manufacturingService.startProduction(id, userId);
          break;
        case 'COMPLETED':
          updatedMo = await manufacturingService.completeManufacturingOrder(id, userId);
          break;
        case 'CANCELLED':
          updatedMo = await manufacturingService.cancelManufacturingOrder(id, userId);
          break;
        default:
          return sendError(res, `Unsupported status transition: '${status}'.`, 400);
      }

      return sendSuccess(res, `Manufacturing Order status updated to '${status}' successfully.`, updatedMo);
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = new ManufacturingController();
