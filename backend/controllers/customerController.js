const customerService = require('../services/customerService');
const customerValidation = require('../validations/customerValidation');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Customer Controller.
 * Resolves incoming routing endpoints for Customer Profile tracking.
 */
class CustomerController {
  /**
   * Fetch single customer details.
   */
  getCustomerById = async (req, res, next) => {
    try {
      const { id } = req.params;
      const customer = await customerService.getCustomerById(id);
      return sendSuccess(res, 'Customer profile details retrieved successfully.', customer);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * Fetch search-filtered and paginated customer lists.
   */
  getAllCustomers = async (req, res, next) => {
    try {
      const result = await customerService.getAllCustomers(req.query);
      return sendSuccess(res, 'Customers lists loaded successfully.', result);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * Create a new customer profile database entry.
   */
  createCustomer = async (req, res, next) => {
    try {
      const { isValid, errors } = customerValidation.validateCustomer(req.body);
      if (!isValid) {
        return sendError(res, 'Validation failed: Invalid customer details.', 400, errors);
      }

      const customer = await customerService.createCustomer(req.body);
      return sendSuccess(res, 'Customer profile created successfully.', customer, 201);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * Update existing customer fields.
   */
  updateCustomer = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { isValid, errors } = customerValidation.validateCustomer(req.body);
      if (!isValid) {
        return sendError(res, 'Validation failed: Invalid customer details.', 400, errors);
      }

      const customer = await customerService.updateCustomer(id, req.body);
      return sendSuccess(res, 'Customer profile updated successfully.', customer);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * Delete a customer profile from directory.
   */
  deleteCustomer = async (req, res, next) => {
    try {
      const { id } = req.params;
      await customerService.deleteCustomer(id);
      return sendSuccess(res, 'Customer profile deleted successfully.');
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = new CustomerController();
