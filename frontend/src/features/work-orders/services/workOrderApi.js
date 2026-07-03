import api from '../../../services/api';

/**
 * Work Order API client service.
 * Handles Axios requests to the work order endpoints.
 */
const workOrderApi = {
  /**
   * Fetch all work orders with filters.
   */
  getWorkOrders: async (params = {}) => {
    const response = await api.get('/work-orders', { params });
    return response.data.data;
  },

  /**
   * Fetch system workers/employees for assignments.
   */
  getWorkers: async () => {
    const response = await api.get('/work-orders/workers');
    return response.data.data;
  },

  /**
   * Update work order details (status, assignee).
   */
  updateWorkOrder: async (id, data) => {
    const response = await api.put(`/work-orders/${id}`, data);
    return response.data.data;
  }
};

export default workOrderApi;
