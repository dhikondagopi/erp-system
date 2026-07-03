const workOrderService = require('../services/workOrderService');
const workOrderValidation = require('../validations/workOrderValidation');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Work Order Controller.
 * Resolves incoming HTTP requests for the Work Orders Module.
 */
class WorkOrderController {
  /**
   * Fetch details of a single work order by ID.
   */
  getWorkOrderById = async (req, res, next) => {
    try {
      const { id } = req.params;
      const wo = await workOrderService.getWorkOrderById(id);
      return sendSuccess(res, 'Work Order details retrieved successfully.', wo);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * Fetch work orders linked to a parent Manufacturing Order.
   */
  getWorkOrdersByMoId = async (req, res, next) => {
    try {
      const { moId } = req.params;
      const result = await workOrderService.getWorkOrdersByMoId(moId);
      return sendSuccess(res, 'Manufacturing Order work tasks loaded successfully.', result);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * Fetch work orders assigned to the logged-in operator.
   */
  getMyWorkOrders = async (req, res, next) => {
    try {
      const userId = req.user.id;
      const result = await workOrderService.getMyWorkOrders(userId, req.query);
      return sendSuccess(res, 'Assigned work tasks loaded successfully.', result);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * Create a new manual Work Order task.
   */
  createWorkOrder = async (req, res, next) => {
    try {
      const { isValid, errors } = workOrderValidation.validateCreate(req.body);
      if (!isValid) {
        return sendError(res, 'Validation failed: Invalid work order parameters.', 400, errors);
      }

      const wo = await workOrderService.createWorkOrder(req.body);
      return sendSuccess(res, 'Work Order task created successfully.', wo, 201);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * Assign a work order to a shop floor worker.
   */
  assignWorkOrder = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { isValid, errors } = workOrderValidation.validateAssign(req.body);
      if (!isValid) {
        return sendError(res, 'Validation failed: Missing assignee parameters.', 400, errors);
      }

      const { assigned_to } = req.body;
      const updatedWo = await workOrderService.assignWorkOrder(id, assigned_to);
      return sendSuccess(res, 'Work Order task assigned successfully.', updatedWo);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * Transition work task status (START, PAUSE, COMPLETE).
   */
  updateOrderStatus = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.user.id;

      const { isValid, errors } = workOrderValidation.validateStatusUpdate(req.body);
      if (!isValid) {
        return sendError(res, 'Validation failed: Invalid status transition properties.', 400, errors);
      }

      let result;
      switch (status) {
        case 'IN_PROGRESS':
          result = await workOrderService.startWorkOrder(id);
          break;
        case 'PAUSED':
          result = await workOrderService.pauseWorkOrder(id);
          break;
        case 'COMPLETED':
          result = await workOrderService.completeWorkOrder(id, userId);
          break;
        default:
          return sendError(res, `Unsupported status transition: '${status}'.`, 400);
      }

      return sendSuccess(
        res, 
        `Work Order status updated to '${status}' successfully.`, 
        result
      );
    } catch (error) {
      return next(error);
    }
  };

  /**
   * Fetch paginated list of all work orders.
   */
  getAllWorkOrders = async (req, res, next) => {
    try {
      const result = await workOrderService.getAllWorkOrders(req.query);
      return sendSuccess(res, 'Work orders loaded successfully.', result);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * Fetch available workers list.
   */
  getWorkers = async (req, res, next) => {
    try {
      const result = await workOrderService.getWorkers();
      return sendSuccess(res, 'Workers list loaded successfully.', result);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * Update work order (assignee and status).
   */
  updateWorkOrder = async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const updated = await workOrderService.updateWorkOrder(id, req.body, userId);
      return sendSuccess(res, 'Work Order updated successfully.', updated);
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = new WorkOrderController();
