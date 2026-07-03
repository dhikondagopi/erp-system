import api from '../../../services/api';

/**
 * Customer Management API client service.
 * Handles Axios requests to the customer profile endpoints.
 */
const customerApi = {
  /**
   * Fetch paginated and search-filtered customer listing.
   */
  getCustomers: async (params = {}) => {
    const response = await api.get('/customers', { params });
    return response.data.data;
  },

  /**
   * Fetch single customer details by UUID.
   */
  getCustomerById: async (id) => {
    const response = await api.get(`/customers/${id}`);
    return response.data.data;
  },

  /**
   * Register a new customer profile.
   */
  createCustomer: async (customerData) => {
    const response = await api.post('/customers', customerData);
    return response.data.data;
  },

  /**
   * Update metadata fields for an existing customer.
   */
  updateCustomer: async (id, customerData) => {
    const response = await api.put(`/customers/${id}`, customerData);
    return response.data.data;
  },

  /**
   * Delete a customer profile.
   */
  deleteCustomer: async (id) => {
    const response = await api.delete(`/customers/${id}`);
    return response.data;
  }
};

export default customerApi;
