const vendorService = require('../services/vendorService');
const vendorValidation = require('../validations/vendorValidation');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Vendor Controller.
 * Resolves incoming routing endpoints for Vendor Profile tracking.
 */
class VendorController {
  /**
   * Fetch single vendor details.
   */
  getVendorById = async (req, res, next) => {
    try {
      const { id } = req.params;
      const vendor = await vendorService.getVendorById(id);
      return sendSuccess(res, 'Vendor profile details retrieved successfully.', vendor);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * Fetch search-filtered and paginated vendor lists.
   */
  getAllVendors = async (req, res, next) => {
    try {
      const result = await vendorService.getAllVendors(req.query);
      return sendSuccess(res, 'Vendors lists loaded successfully.', result);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * Create a new vendor profile database entry.
   */
  createVendor = async (req, res, next) => {
    try {
      const { isValid, errors } = vendorValidation.validateVendor(req.body);
      if (!isValid) {
        return sendError(res, 'Validation failed: Invalid vendor details.', 400, errors);
      }

      const vendor = await vendorService.createVendor(req.body);
      return sendSuccess(res, 'Vendor profile created successfully.', vendor, 201);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * Update existing vendor fields.
   */
  updateVendor = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { isValid, errors } = vendorValidation.validateVendor(req.body);
      if (!isValid) {
        return sendError(res, 'Validation failed: Invalid vendor details.', 400, errors);
      }

      const vendor = await vendorService.updateVendor(id, req.body);
      return sendSuccess(res, 'Vendor profile updated successfully.', vendor);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * Delete a vendor profile from directory.
   */
  deleteVendor = async (req, res, next) => {
    try {
      const { id } = req.params;
      await vendorService.deleteVendor(id);
      return sendSuccess(res, 'Vendor profile deleted successfully.');
    } catch (error) {
      return next(error);
    }
  };

  /**
   * Get vendor performance scorecard analysis and AI advice.
   */
  getVendorScorecard = async (req, res, next) => {
    try {
      const { id } = req.params;
      const scorecard = await vendorService.getVendorScorecard(id);
      return sendSuccess(res, 'Vendor performance scorecard generated successfully.', scorecard);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * Get vendor performance comparison lists.
   */
  getPerformanceOverview = async (req, res, next) => {
    try {
      const overview = await vendorService.getPerformanceOverview();
      return sendSuccess(res, 'Vendor performance overview aggregate generated successfully.', overview);
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = new VendorController();
