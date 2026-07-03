import api from '../../../services/api';

/**
 * Purchase Orders Management API client service.
 * Handles Axios requests to purchase order endpoints.
 */
const purchaseApi = {
  /**
   * Fetch paginated and filtered purchase order listings.
   */
  getPurchaseOrders: async (params = {}) => {
    const response = await api.get('/purchase-orders', { params });
    return response.data.data;
  },

  /**
   * Fetch single purchase order details by ID.
   */
  getPurchaseOrderById: async (id) => {
    const response = await api.get(`/purchase-orders/${id}`);
    return response.data.data;
  },

  /**
   * Create a new purchase order draft.
   */
  createPurchaseOrder: async (orderData) => {
    const response = await api.post('/purchase-orders', orderData);
    return response.data.data;
  },

  /**
   * Transition order status (PENDING_APPROVAL, APPROVED, REJECTED, RECEIVED, CANCELLED).
   */
  updateOrderStatus: async (id, status) => {
    const response = await api.put(`/purchase-orders/${id}/status`, { status });
    return response.data.data;
  }
};

export default purchaseApi;
