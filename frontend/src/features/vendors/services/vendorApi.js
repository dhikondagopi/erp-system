import api from '../../../services/api';

/**
 * Vendor Management API client service.
 * Handles Axios requests to the vendor profile endpoints.
 */
const vendorApi = {
  /**
   * Fetch paginated and search-filtered vendor listing.
   */
  getVendors: async (params = {}) => {
    const response = await api.get('/vendors', { params });
    return response.data.data;
  },

  /**
   * Fetch single vendor details by UUID.
   */
  getVendorById: async (id) => {
    const response = await api.get(`/vendors/${id}`);
    return response.data.data;
  },

  /**
   * Register a new vendor profile.
   */
  createVendor: async (vendorData) => {
    const response = await api.post('/vendors', vendorData);
    return response.data.data;
  },

  /**
   * Update metadata fields for an existing vendor.
   */
  updateVendor: async (id, vendorData) => {
    const response = await api.put(`/vendors/${id}`, vendorData);
    return response.data.data;
  },

  /**
   * Delete a vendor profile.
   */
  deleteVendor: async (id) => {
    const response = await api.delete(`/vendors/${id}`);
    return response.data;
  }
};

export default vendorApi;
