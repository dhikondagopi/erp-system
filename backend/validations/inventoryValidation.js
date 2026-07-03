const { REFERENCE_TYPES } = require('../config/constants');

/**
 * Validates request bodies for inventory operations.
 */
class InventoryValidation {
  /**
   * Validate adjustment payload inputs.
   */
  validateAdjustment(data) {
    const errors = {};

    if (!data.product_id || typeof data.product_id !== 'string') {
      errors.product_id = 'Product ID (product_id) is required and must be a valid UUID.';
    }

    if (data.warehouse_id && typeof data.warehouse_id !== 'string') {
      errors.warehouse_id = 'Warehouse ID (warehouse_id) must be a valid UUID string.';
    }

    const qty = Number(data.qty_change);
    if (isNaN(qty) || qty === 0) {
      errors.qty_change = 'Quantity change (qty_change) is required and must be a non-zero decimal.';
    }

    if (!data.reason || typeof data.reason !== 'string' || data.reason.trim() === '') {
      errors.reason = 'Reason is required and must be a valid non-empty string explaining the adjustment.';
    }

    if (data.reference_type && !Object.values(REFERENCE_TYPES).includes(data.reference_type)) {
      errors.reference_type = `Reference type must be one of: ${Object.values(REFERENCE_TYPES).join(', ')}`;
    }

    if (data.reference_id && typeof data.reference_id !== 'string') {
      errors.reference_id = 'Reference ID must be a valid UUID.';
    }

    if (data.notes && typeof data.notes !== 'string') {
      errors.notes = 'Notes must be a valid string.';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * Validate basic movement payload (add/remove/reserve/release/ship).
   */
  validateMovement(data) {
    const errors = {};

    if (!data.product_id || typeof data.product_id !== 'string') {
      errors.product_id = 'Product ID (product_id) is required and must be a valid UUID.';
    }

    if (data.warehouse_id && typeof data.warehouse_id !== 'string') {
      errors.warehouse_id = 'Warehouse ID (warehouse_id) must be a valid UUID string.';
    }

    const qty = Number(data.qty);
    if (isNaN(qty) || qty <= 0) {
      errors.qty = 'Quantity (qty) is required and must be a positive decimal.';
    }

    if (!data.reason || typeof data.reason !== 'string' || data.reason.trim() === '') {
      errors.reason = 'Reason is required and must be a valid non-empty string.';
    }

    if (data.reference_type && !Object.values(REFERENCE_TYPES).includes(data.reference_type)) {
      errors.reference_type = `Reference type must be one of: ${Object.values(REFERENCE_TYPES).join(', ')}`;
    }

    if (data.reference_id && typeof data.reference_id !== 'string') {
      errors.reference_id = 'Reference ID must be a valid UUID.';
    }

    if (data.notes && typeof data.notes !== 'string') {
      errors.notes = 'Notes must be a valid string.';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
}

module.exports = new InventoryValidation();
