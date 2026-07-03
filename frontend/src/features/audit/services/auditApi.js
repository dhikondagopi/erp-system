import api from '../../../services/api';

/**
 * Audit Log API client service.
 * Handles Axios requests to the audit log endpoints.
 */
const auditApi = {
  /**
   * Fetch paginated, filtered list of audit log records.
   * @param {Object} params - { userId, action, entityType, page, limit, search, startDate, endDate }
   */
  getLogs: async (params = {}) => {
    const response = await api.get('/audit-logs', { params });
    return response.data.data;
  }
};

export default auditApi;
