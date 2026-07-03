import api from '../../../services/api';

/**
 * Dashboard API client service.
 * Fetches aggregated ERP analytics from the backend stats endpoint.
 */
const dashboardApi = {
  /**
   * Retrieve full dashboard summary: KPIs, charts, and activity feed.
   */
  getStats: async () => {
    const response = await api.get('/dashboard/stats');
    return response.data.data;
  }
};

export default dashboardApi;
