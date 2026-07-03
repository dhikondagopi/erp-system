/**
 * Sales Order request payload validations.
 */
class SalesValidation {
  /**
   * Validate parameters on sales order creation.
   */
  validateCreate(data) {
    const errors = {};

    if (!data.customer_id || typeof data.customer_id !== 'string') {
      errors.customer_id = 'Customer ID (customer_id) is required and must be a valid UUID.';
    }

    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      errors.items = 'Order items list is required and must contain at least one product.';
    } else {
      const itemErrors = [];
      data.items.forEach((item, index) => {
        const errorsOnItem = {};
        
        if (!item.product_id || typeof item.product_id !== 'string') {
          errorsOnItem.product_id = 'Product ID (product_id) is required.';
        }

        const qty = Number(item.quantity);
        if (isNaN(qty) || qty <= 0) {
          errorsOnItem.quantity = 'Quantity must be a positive number greater than 0.';
        }

        const price = Number(item.unit_price);
        if (isNaN(price) || price < 0) {
          errorsOnItem.unit_price = 'Unit price must be a non-negative number.';
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
   * Validate parameters on sales order status transition.
   */
  validateStatusUpdate(data) {
    const errors = {};
    const validStatuses = ['APPROVED', 'COMPLETED', 'CANCELLED'];

    if (!data.status || !validStatuses.includes(data.status)) {
      errors.status = `Status is required and must be one of: ${validStatuses.join(', ')}`;
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
}

module.exports = new SalesValidation();
