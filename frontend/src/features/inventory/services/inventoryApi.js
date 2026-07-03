import api from '../../../services/api';

/**
 * Inventory Management API client service.
 * Handles Axios requests to the inventory and stock ledger endpoints.
 */
const inventoryApi = {
  /**
   * Fetch current inventory levels across products.
   */
  getInventoryLevels: async (params = {}) => {
    const response = await api.get('/inventory', { params });
    return response.data.data;
  },

  /**
   * Post manual cycle count adjustments.
   */
  adjustStock: async (adjustmentData) => {
    const response = await api.post('/inventory/adjust', adjustmentData);
    return response.data.data;
  },

  /**
   * Fetch global transaction ledger logs.
   */
  getStockLedger: async (params = {}) => {
    const response = await api.get('/stock-ledger', { params });
    return response.data.data;
  }
};

export default inventoryApi;
