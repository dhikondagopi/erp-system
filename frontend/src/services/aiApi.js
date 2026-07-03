import api from './api';

const AI_BASE = '/ai';

const aiApi = {
  /** Unauthenticated — checks Gemini + DB status */
  getHealth: async () => {
    const response = await api.get(`${AI_BASE}/health`, { timeout: 30000 });
    return response.data.data;
  },

  getInsights: async () => {
    const response = await api.get(`${AI_BASE}/insights`, { timeout: 60000 });
    return response.data.data;
  },
  getProcurement: async () => {
    const response = await api.get(`${AI_BASE}/procurement`, { timeout: 60000 });
    return response.data.data;
  },
  getInventoryInsights: async () => {
    const response = await api.get(`${AI_BASE}/inventory`, { timeout: 60000 });
    return response.data.data;
  },
  getForecast: async () => {
    const response = await api.get(`${AI_BASE}/forecast`, { timeout: 60000 });
    return response.data.data;
  },
  getVendorAnalysis: async () => {
    const response = await api.get(`${AI_BASE}/vendors`, { timeout: 60000 });
    return response.data.data;
  },
  generateProductionPlan: async (finishedGoodId, quantity) => {
    const response = await api.post(`${AI_BASE}/manufacturing-plan`, {
      finished_good_id: finishedGoodId,
      quantity,
    }, { timeout: 60000 });
    return response.data.data;
  },
  sendChatMessage: async (message) => {
    const response = await api.post(`${AI_BASE}/chat`, { message }, { timeout: 60000 });
    return response.data.data;
  },
};

export default aiApi;
