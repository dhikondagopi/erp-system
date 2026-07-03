const { WO_STATUS } = require('../config/constants');

/**
 * Work Order request body validations.
 */
class WorkOrderValidation {
  /**
   * Validate parameters on manual work order creation.
   */
  validateCreate(data) {
    const errors = {};

    if (!data.manufacturing_order_id || typeof data.manufacturing_order_id !== 'string') {
      errors.manufacturing_order_id = 'Manufacturing Order ID (manufacturing_order_id) is required and must be a valid UUID.';
    }

    if (!data.operation_name || typeof data.operation_name !== 'string' || data.operation_name.trim() === '') {
      errors.operation_name = 'Operation name (operation_name) is required.';
    }

    if (data.assigned_to && typeof data.assigned_to !== 'string') {
      errors.assigned_to = 'Assigned user ID must be a valid UUID string.';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * Validate parameters on assigning work orders.
   */
  validateAssign(data) {
    const errors = {};

    if (!data.assigned_to || typeof data.assigned_to !== 'string') {
      errors.assigned_to = 'Assigned user ID (assigned_to) is required and must be a valid UUID string.';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * Validate parameters on updating status.
   */
  validateStatusUpdate(data) {
    const errors = {};

    if (!data.status || !Object.values(WO_STATUS).includes(data.status)) {
      errors.status = `Status is required and must be one of: ${Object.values(WO_STATUS).join(', ')}`;
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
}

module.exports = new WorkOrderValidation();
