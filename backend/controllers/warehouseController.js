const warehouseService = require('../services/warehouseService');
const { sendSuccess } = require('../utils/response');

class WarehouseController {
  getWarehouseById = async (req, res, next) => {
    try {
      const { id } = req.params;
      const wh = await warehouseService.getWarehouseById(id);
      return sendSuccess(res, 'Warehouse fetched successfully.', wh);
    } catch (error) {
      return next(error);
    }
  };

  getAllWarehouses = async (req, res, next) => {
    try {
      const result = await warehouseService.getAllWarehouses(req.query);
      return sendSuccess(res, 'Warehouses list loaded successfully.', result);
    } catch (error) {
      return next(error);
    }
  };

  createWarehouse = async (req, res, next) => {
    try {
      const newWh = await warehouseService.createWarehouse(req.body, req.user.id);
      return sendSuccess(res, 'Warehouse created successfully.', newWh, 201);
    } catch (error) {
      return next(error);
    }
  };

  updateWarehouse = async (req, res, next) => {
    try {
      const { id } = req.params;
      const updatedWh = await warehouseService.updateWarehouse(id, req.body, req.user.id);
      return sendSuccess(res, 'Warehouse updated successfully.', updatedWh);
    } catch (error) {
      return next(error);
    }
  };

  disableWarehouse = async (req, res, next) => {
    try {
      const { id } = req.params;
      const updatedWh = await warehouseService.disableWarehouse(id, req.user.id);
      return sendSuccess(res, 'Warehouse disabled successfully.', updatedWh);
    } catch (error) {
      return next(error);
    }
  };

  enableWarehouse = async (req, res, next) => {
    try {
      const { id } = req.params;
      const updatedWh = await warehouseService.enableWarehouse(id, req.user.id);
      return sendSuccess(res, 'Warehouse enabled successfully.', updatedWh);
    } catch (error) {
      return next(error);
    }
  };

  getWarehouseStockSummary = async (req, res, next) => {
    try {
      const { id } = req.params;
      const summary = await warehouseService.getWarehouseStockSummary(id);
      return sendSuccess(res, 'Warehouse stock summary loaded successfully.', summary);
    } catch (error) {
      return next(error);
    }
  };

  getWarehouseDashboardStats = async (req, res, next) => {
    try {
      const stats = await warehouseService.getWarehouseDashboardStats();
      return sendSuccess(res, 'Warehouse dashboard stats loaded successfully.', stats);
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = new WarehouseController();
