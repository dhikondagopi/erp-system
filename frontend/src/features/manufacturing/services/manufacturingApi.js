import api from '../../../services/api';

/**
 * Manufacturing Order API service.
 * Wraps all HTTP calls to the /manufacturing-orders backend endpoints.
 */
const manufacturingApi = {
  /**
   * Fetch paginated manufacturing orders list with optional filters.
   * @param {Object} params - Query parameters (finishedGoodId, status, page, limit)
   */
  getAll: (params = {}) =>
    api.get('/manufacturing-orders', { params }).then((r) => r.data.data),

  /**
   * Fetch a single manufacturing order by ID.
   * @param {string} id - Manufacturing order UUID
   */
  getById: (id) =>
    api.get(`/manufacturing-orders/${id}`).then((r) => r.data.data),

  /**
   * Create a new (DRAFT) manufacturing order.
   * @param {Object} moData - { finished_good_id, bom_id, quantity, source_type, source_id }
   */
  create: (moData) =>
    api.post('/manufacturing-orders', moData).then((r) => r.data.data),

  /**
   * Transition a manufacturing order to a new status.
   * @param {string} id - Manufacturing order UUID
   * @param {string} status - Target status: APPROVED | IN_PRODUCTION | COMPLETED | CANCELLED
   */
  updateStatus: (id, status) =>
    api.put(`/manufacturing-orders/${id}/status`, { status }).then((r) => r.data.data),
};

export default manufacturingApi;
