/**
 * Customer request body validations.
 */
class CustomerValidation {
  /**
   * Simple email format validation regex.
   */
  _isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate customer attributes payload on create and update.
   */
  validateCustomer(data) {
    const errors = {};

    if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
      errors.name = 'Customer name is required and must be a valid non-empty string.';
    }

    if (!data.email || typeof data.email !== 'string' || !this._isValidEmail(data.email)) {
      errors.email = 'A valid, structural email address is required.';
    }

    if (data.phone && (typeof data.phone !== 'string' || data.phone.trim().length < 5)) {
      errors.phone = 'Phone number must be a valid string with at least 5 digits.';
    }

    if (data.address && typeof data.address !== 'string') {
      errors.address = 'Address must be a valid text string.';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
}

module.exports = new CustomerValidation();
