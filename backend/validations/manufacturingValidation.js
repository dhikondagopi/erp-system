/**
 * Manufacturing Order request payload validations.
 */
class ManufacturingValidation {
  /**
   * Validate parameters on Manufacturing Order creation.
   */
  validateCreate(data) {
    const errors = {};

    if (!data.finished_good_id || typeof data.finished_good_id !== 'string') {
      errors.finished_good_id = 'Finished Good Product ID (finished_good_id) is required and must be a valid UUID.';
    }

    if (!data.bom_id || typeof data.bom_id !== 'string') {
      errors.bom_id = 'Bill of Materials ID (bom_id) is required and must be a valid UUID.';
    }

    const qty = Number(data.quantity);
    if (isNaN(qty) || qty <= 0) {
      errors.quantity = 'Quantity (quantity) is required and must be a positive decimal number greater than 0.';
    }

    if (data.source_id && typeof data.source_id !== 'string') {
      errors.source_id = 'Source ID must be a valid UUID.';
    }

    if (data.source_type && typeof data.source_type !== 'string') {
      errors.source_type = 'Source type must be a string.';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * Validate parameters on Manufacturing Order status transition.
   */
  validateStatusUpdate(data) {
    const errors = {};
    const validStatuses = ['APPROVED', 'IN_PRODUCTION', 'COMPLETED', 'CANCELLED'];

    if (!data.status || !validStatuses.includes(data.status)) {
      errors.status = `Status is required and must be one of: ${validStatuses.join(', ')}`;
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
}

module.exports = new ManufacturingValidation();
