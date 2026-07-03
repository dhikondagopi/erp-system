import api from '../../../services/api';

/**
 * Sales Orders Management API client service.
 * Handles Axios requests to sales order endpoints.
 */
const salesApi = {
  /**
   * Fetch paginated and filtered sales order listings.
   */
  getSalesOrders: async (params = {}) => {
    const response = await api.get('/sales-orders', { params });
    return response.data.data;
  },

  /**
   * Fetch single sales order details by ID.
   */
  getSalesOrderById: async (id) => {
    const response = await api.get(`/sales-orders/${id}`);
    return response.data.data;
  },

  /**
   * Create a new sales order draft.
   */
  createSalesOrder: async (orderData) => {
    const response = await api.post('/sales-orders', orderData);
    return response.data.data;
  },

  /**
   * Transition order status (APPROVED, COMPLETED, CANCELLED).
   */
  updateOrderStatus: async (id, status) => {
    const response = await api.put(`/sales-orders/${id}/status`, { status });
    return response.data.data;
  }
};

export default salesApi;
