import api from '../../../services/api';

/**
 * Product Management API client service.
 * Handles Axios requests to the product endpoints.
 */
const productApi = {
  /**
   * Fetch paginated and filtered product listing.
   */
  getProducts: async (params = {}) => {
    const response = await api.get('/products', { params });
    return response.data.data;
  },

  /**
   * Fetch single product details by UUID.
   */
  getProductById: async (id) => {
    const response = await api.get(`/products/${id}`);
    return response.data.data;
  },

  /**
   * Register a new product item.
   */
  createProduct: async (productData) => {
    const response = await api.post('/products', productData);
    return response.data.data;
  },

  /**
   * Update metadata fields for an existing product.
   */
  updateProduct: async (id, productData) => {
    const response = await api.put(`/products/${id}`, productData);
    return response.data.data;
  },

  /**
   * Delete a product profile.
   */
  deleteProduct: async (id) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  }
};

export default productApi;
