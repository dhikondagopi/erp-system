const bomService = require('../services/bomService');
const bomValidation = require('../validations/bomValidation');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Bill of Materials (BoM) Controller.
 * Resolves incoming HTTP requests for the BoM module.
 */
class BomController {
  /**
   * Fetch details of a single BoM recipe by ID.
   */
  getBomById = async (req, res, next) => {
    try {
      const { id } = req.params;
      const bom = await bomService.getBomById(id);
      return sendSuccess(res, 'BoM recipe details retrieved successfully.', bom);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * Fetch BoM recipe details associated with a specific finished good.
   */
  getBomByFinishedGoodId = async (req, res, next) => {
    try {
      const { finishedGoodId } = req.params;
      const bom = await bomService.getBomByFinishedGoodId(finishedGoodId);
      return sendSuccess(res, 'Product BoM recipe retrieved successfully.', bom);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * Fetch paginated list of all recipes.
   */
  getAllBoms = async (req, res, next) => {
    try {
      const result = await bomService.getAllBoms(req.query);
      return sendSuccess(res, 'BoM recipes lists loaded successfully.', result);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * Create a new BoM recipe.
   */
  createBom = async (req, res, next) => {
    try {
      const { isValid, errors } = bomValidation.validateCreate(req.body);
      if (!isValid) {
        return sendError(res, 'Validation failed: Invalid BoM recipe payload details.', 400, errors);
      }

      const bom = await bomService.createBom(req.body);
      return sendSuccess(res, 'BoM recipe created successfully.', bom, 201);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * Update BoM components.
   */
  updateBom = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { isValid, errors } = bomValidation.validateUpdate(req.body);
      if (!isValid) {
        return sendError(res, 'Validation failed: Invalid BoM update payload details.', 400, errors);
      }

      const bom = await bomService.updateBom(id, req.body);
      return sendSuccess(res, 'BoM recipe updated successfully.', bom);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * Remove a BoM recipe.
   */
  deleteBom = async (req, res, next) => {
    try {
      const { id } = req.params;
      await bomService.deleteBom(id);
      return sendSuccess(res, 'BoM recipe deleted successfully.');
    } catch (error) {
      return next(error);
    }
  };

  /**
   * Get dynamic cost breakdown analysis for a manufactured product.
   */
  getManufacturingCostAnalysis = async (req, res, next) => {
    try {
      const { finishedGoodId } = req.params;
      const analysis = await bomService.getManufacturingCostAnalysis(finishedGoodId);
      return sendSuccess(res, 'Manufacturing cost analysis generated successfully.', analysis);
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = new BomController();
