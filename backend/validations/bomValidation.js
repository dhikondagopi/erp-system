/**
 * Bill of Materials (BoM) request payload validations.
 */
class BomValidation {
  /**
   * Validate parameters on BoM creation.
   */
  validateCreate(data) {
    const errors = {};

    if (!data.finished_good_id || typeof data.finished_good_id !== 'string') {
      errors.finished_good_id = 'Finished Good Product ID (finished_good_id) is required and must be a valid UUID.';
    }

    if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
      errors.name = 'BoM recipe name is required and must be a non-empty string.';
    }

    if (data.version && typeof data.version !== 'string') {
      errors.version = 'Version must be a valid string.';
    }

    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      errors.items = 'Components list (items) is required and must contain at least one raw material.';
    } else {
      const itemErrors = [];
      data.items.forEach((item, index) => {
        const errorsOnItem = {};

        if (!item.raw_material_id || typeof item.raw_material_id !== 'string') {
          errorsOnItem.raw_material_id = 'Raw Material Product ID (raw_material_id) is required.';
        }

        const qty = Number(item.quantity_required);
        if (isNaN(qty) || qty <= 0) {
          errorsOnItem.quantity_required = 'Quantity required must be a positive decimal number greater than 0.';
        }

        if (Object.keys(errorsOnItem).length > 0) {
          itemErrors[index] = errorsOnItem;
        }
      });

      if (itemErrors.some(err => err !== undefined)) {
        errors.itemDetails = itemErrors;
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * Validate parameters on BoM update.
   */
  validateUpdate(data) {
    const errors = {};

    if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
      errors.name = 'BoM recipe name is required and must be a non-empty string.';
    }

    if (!data.version || typeof data.version !== 'string' || data.version.trim() === '') {
      errors.version = 'Version string is required.';
    }

    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      errors.items = 'Components list (items) is required and must contain at least one raw material.';
    } else {
      const itemErrors = [];
      data.items.forEach((item, index) => {
        const errorsOnItem = {};

        if (!item.raw_material_id || typeof item.raw_material_id !== 'string') {
          errorsOnItem.raw_material_id = 'Raw Material Product ID (raw_material_id) is required.';
        }

        const qty = Number(item.quantity_required);
        if (isNaN(qty) || qty <= 0) {
          errorsOnItem.quantity_required = 'Quantity required must be a positive decimal number greater than 0.';
        }

        if (Object.keys(errorsOnItem).length > 0) {
          itemErrors[index] = errorsOnItem;
        }
      });

      if (itemErrors.some(err => err !== undefined)) {
        errors.itemDetails = itemErrors;
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
}

module.exports = new BomValidation();
