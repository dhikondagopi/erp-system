import api from '../../../services/api';

/**
 * Bill of Materials (BoM) API client service.
 * Handles Axios requests to the BoM endpoints.
 */
const bomApi = {
  /**
   * Fetch paginated and filtered BoM recipe listing.
   */
  getBoms: async (params = {}) => {
    const response = await api.get('/bom', { params });
    return response.data.data;
  },

  /**
   * Fetch single BoM recipe details by UUID.
   */
  getBomById: async (id) => {
    const response = await api.get(`/bom/${id}`);
    return response.data.data;
  },

  /**
   * Fetch BoM recipe details associated with a specific finished good.
   */
  getBomByFinishedGoodId: async (finishedGoodId) => {
    const response = await api.get(`/bom/product/${finishedGoodId}`);
    return response.data.data;
  },

  /**
   * Register a new BoM recipe.
   */
  createBom: async (bomData) => {
    const response = await api.post('/bom', bomData);
    return response.data.data;
  },

  /**
   * Update metadata and components for an existing BoM recipe.
   */
  updateBom: async (id, bomData) => {
    const response = await api.put(`/bom/${id}`, bomData);
    return response.data.data;
  },

  /**
   * Remove a BoM recipe.
   */
  deleteBom: async (id) => {
    const response = await api.delete(`/bom/${id}`);
    return response.data;
  }
};

export default bomApi;
