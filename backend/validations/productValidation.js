const { PRODUCT_TYPES, PROCUREMENT_TYPES, REPLENISHMENT_STRATEGIES } = require('../config/constants');

/**
 * Validation methods for Product requests.
 */
class ProductValidation {
  /**
   * Validate product creation request parameters.
   * 
   * @param {object} data
   * @returns {{ isValid: boolean, errors: object }}
   */
  validateCreate(data) {
    const errors = {};

    if (!data.sku || typeof data.sku !== 'string' || data.sku.trim() === '') {
      errors.sku = 'SKU is required and must be a valid non-empty string.';
    } else if (data.sku.length > 100) {
      errors.sku = 'SKU cannot exceed 100 characters.';
    }

    if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
      errors.name = 'Name is required and must be a valid non-empty string.';
    }

    if (!data.type || !Object.values(PRODUCT_TYPES).includes(data.type)) {
      errors.type = `Type is required and must be one of: ${Object.values(PRODUCT_TYPES).join(', ')}`;
    }

    if (!data.procurement_type || !Object.values(PROCUREMENT_TYPES).includes(data.procurement_type)) {
      errors.procurement_type = `Procurement type is required and must be one of: ${Object.values(PROCUREMENT_TYPES).join(', ')}`;
    }

    if (!data.replenishment_strategy || !Object.values(REPLENISHMENT_STRATEGIES).includes(data.replenishment_strategy)) {
      errors.replenishment_strategy = `Replenishment strategy is required and must be one of: ${Object.values(REPLENISHMENT_STRATEGIES).join(', ')}`;
    }

    if (!data.uom || typeof data.uom !== 'string' || data.uom.trim() === '') {
      errors.uom = 'Unit of Measure (UoM) is required.';
    }

    if (data.unit_cost !== undefined) {
      const cost = Number(data.unit_cost);
      if (isNaN(cost) || cost < 0) {
        errors.unit_cost = 'Unit cost must be a non-negative decimal number.';
      }
    }

    if (data.unit_price !== undefined) {
      const price = Number(data.unit_price);
      if (isNaN(price) || price < 0) {
        errors.unit_price = 'Unit price must be a non-negative decimal number.';
      }
    }

    if (data.reorder_point !== undefined) {
      const point = Number(data.reorder_point);
      if (isNaN(point) || point < 0) {
        errors.reorder_point = 'Reorder point must be a non-negative decimal number.';
      }
    }

    if (data.image_url && typeof data.image_url !== 'string') {
      errors.image_url = 'Image URL must be a valid string.';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * Validate product update request parameters.
   * 
   * @param {object} data
   * @returns {{ isValid: boolean, errors: object }}
   */
  validateUpdate(data) {
    const errors = {};

    if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
      errors.name = 'Name is required and must be a valid non-empty string.';
    }

    if (!data.procurement_type || !Object.values(PROCUREMENT_TYPES).includes(data.procurement_type)) {
      errors.procurement_type = `Procurement type is required and must be one of: ${Object.values(PROCUREMENT_TYPES).join(', ')}`;
    }

    if (!data.replenishment_strategy || !Object.values(REPLENISHMENT_STRATEGIES).includes(data.replenishment_strategy)) {
      errors.replenishment_strategy = `Replenishment strategy is required and must be one of: ${Object.values(REPLENISHMENT_STRATEGIES).join(', ')}`;
    }

    if (!data.uom || typeof data.uom !== 'string' || data.uom.trim() === '') {
      errors.uom = 'Unit of Measure (UoM) is required.';
    }

    if (data.unit_cost !== undefined) {
      const cost = Number(data.unit_cost);
      if (isNaN(cost) || cost < 0) {
        errors.unit_cost = 'Unit cost must be a non-negative decimal number.';
      }
    }

    if (data.unit_price !== undefined) {
      const price = Number(data.unit_price);
      if (isNaN(price) || price < 0) {
        errors.unit_price = 'Unit price must be a non-negative decimal number.';
      }
    }

    if (data.reorder_point !== undefined) {
      const point = Number(data.reorder_point);
      if (isNaN(point) || point < 0) {
        errors.reorder_point = 'Reorder point must be a non-negative decimal number.';
      }
    }

    if (data.image_url && typeof data.image_url !== 'string') {
      errors.image_url = 'Image URL must be a valid string.';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
}

module.exports = new ProductValidation();
