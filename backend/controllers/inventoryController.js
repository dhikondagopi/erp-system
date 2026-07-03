const inventoryService = require('../services/inventoryService');
const inventoryValidation = require('../validations/inventoryValidation');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Inventory Controller.
 * Resolves API routing requests for stock movements and ledger analysis with multi-warehouse awareness.
 */
class InventoryController {
  /**
   * Get overall real-time inventory level matrix.
   */
  getInventoryLevels = async (req, res, next) => {
    try {
      const result = await inventoryService.getInventoryLevels(req.query);
      return sendSuccess(res, 'Inventory stock list loaded successfully.', result);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * Get specific stock ledger transaction history logs for a product SKU.
   */
  getLedgerHistory = async (req, res, next) => {
    try {
      const { productId } = req.params;
      const result = await inventoryService.getLedgerHistory(productId, req.query);
      return sendSuccess(res, 'Stock ledger history log fetched successfully.', result);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * Perform direct inventory manual adjustment (Cycle counts / corrections).
   */
  adjustStock = async (req, res, next) => {
    try {
      const { isValid, errors } = inventoryValidation.validateAdjustment(req.body);
      if (!isValid) {
        return sendError(res, 'Validation failed: Invalid adjustment parameters.', 400, errors);
      }

      const { product_id, warehouse_id, qty_change, reference_type, reference_id, reason, notes } = req.body;
      const userId = req.user.id;

      const updatedInv = await inventoryService.adjustStock(
        product_id,
        warehouse_id || null,
        parseFloat(qty_change),
        reference_type,
        reference_id,
        userId,
        reason,
        notes
      );

      return sendSuccess(res, 'Inventory manual adjustment recorded, stock ledger logged.', updatedInv);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * Add stock (PO receipt, etc.).
   */
  addStock = async (req, res, next) => {
    try {
      const { isValid, errors } = inventoryValidation.validateMovement(req.body);
      if (!isValid) {
        return sendError(res, 'Validation failed: Invalid stock receipt parameters.', 400, errors);
      }

      const { product_id, warehouse_id, qty, reference_type, reference_id, reason, notes } = req.body;
      const userId = req.user.id;

      const updatedInv = await inventoryService.addStock(
        product_id,
        warehouse_id || null,
        parseFloat(qty),
        reference_type,
        reference_id,
        userId,
        reason,
        notes
      );

      return sendSuccess(res, 'Stock replenishment recorded successfully.', updatedInv);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * Remove stock directly (Manual issue, scrap, etc.).
   */
  removeStock = async (req, res, next) => {
    try {
      const { isValid, errors } = inventoryValidation.validateMovement(req.body);
      if (!isValid) {
        return sendError(res, 'Validation failed: Invalid stock issue parameters.', 400, errors);
      }

      const { product_id, warehouse_id, qty, reference_type, reference_id, reason, notes } = req.body;
      const userId = req.user.id;

      const updatedInv = await inventoryService.removeStock(
        product_id,
        warehouse_id || null,
        parseFloat(qty),
        reference_type,
        reference_id,
        userId,
        reason,
        notes
      );

      return sendSuccess(res, 'Stock issue recorded successfully.', updatedInv);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * Reserve stock (Allocation for Sales/Manufacturing Orders).
   */
  reserveStock = async (req, res, next) => {
    try {
      const { isValid, errors } = inventoryValidation.validateMovement(req.body);
      if (!isValid) {
        return sendError(res, 'Validation failed: Invalid stock reservation parameters.', 400, errors);
      }

      const { product_id, warehouse_id, qty, reference_type, reference_id, reason, notes } = req.body;
      const userId = req.user.id;

      const updatedInv = await inventoryService.reserveStock(
        product_id,
        warehouse_id || null,
        parseFloat(qty),
        reference_type,
        reference_id,
        userId,
        reason,
        notes
      );

      return sendSuccess(res, 'Stock allocated and reserved successfully.', updatedInv);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * Release reserved stock (Cancel orders, etc.).
   */
  releaseStock = async (req, res, next) => {
    try {
      const { isValid, errors } = inventoryValidation.validateMovement(req.body);
      if (!isValid) {
        return sendError(res, 'Validation failed: Invalid stock release parameters.', 400, errors);
      }

      const { product_id, warehouse_id, qty, reference_type, reference_id, reason, notes } = req.body;
      const userId = req.user.id;

      const updatedInv = await inventoryService.releaseStock(
        product_id,
        warehouse_id || null,
        parseFloat(qty),
        reference_type,
        reference_id,
        userId,
        reason,
        notes
      );

      return sendSuccess(res, 'Reserved stock released successfully.', updatedInv);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * Ship reserved stock.
   */
  shipReservedStock = async (req, res, next) => {
    try {
      const { isValid, errors } = inventoryValidation.validateMovement(req.body);
      if (!isValid) {
        return sendError(res, 'Validation failed: Invalid shipment parameters.', 400, errors);
      }

      const { product_id, warehouse_id, qty, reference_type, reference_id, reason, notes } = req.body;
      const userId = req.user.id;

      const updatedInv = await inventoryService.shipReservedStock(
        product_id,
        warehouse_id || null,
        parseFloat(qty),
        reference_type,
        reference_id,
        userId,
        reason,
        notes
      );

      return sendSuccess(res, 'Reserved stock shipped, physical inventory cleared.', updatedInv);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * Get global stock ledger logs.
   */
  getGlobalLedgerHistory = async (req, res, next) => {
    try {
      const result = await inventoryService.getGlobalLedgerHistory(req.query);
      return sendSuccess(res, 'Global stock ledger history logs fetched successfully.', result);
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = new InventoryController();
