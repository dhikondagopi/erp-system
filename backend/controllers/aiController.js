const aiService = require('../services/aiService');
const geminiService = require('../services/geminiService');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * AI Controller — Exposes all AI Intelligence endpoints.
 * All methods use live database + Gemini. No mock data.
 */
class AiController {
  /**
   * GET /api/ai/health  — Unprotected diagnostics endpoint.
   */
  getHealth = async (req, res) => {
    try {
      const status = await aiService.getHealthStatus();
      const httpCode = status.overall === 'HEALTHY' ? 200 : 206;
      return res.status(httpCode).json({ success: true, data: status });
    } catch (error) {
      return res.status(500).json({ success: false, data: { overall: 'ERROR', error: error.message } });
    }
  };

  /**
   * GET /api/ai/procurement
   */
  getProcurementRecommendations = async (req, res) => {
    try {
      const result = await aiService.getProcurementRecommendations();
      return sendSuccess(res, 'AI Procurement recommendations generated from live data.', result);
    } catch (error) {
      console.error('[AiController] getProcurementRecommendations:', error.message);
      return sendError(res, error.message, 503);
    }
  };

  /**
   * GET /api/ai/inventory
   */
  getInventoryInsights = async (req, res) => {
    try {
      const result = await aiService.getInventoryInsights();
      return sendSuccess(res, 'AI Inventory insights generated from live data.', result);
    } catch (error) {
      console.error('[AiController] getInventoryInsights:', error.message);
      return sendError(res, error.message, 503);
    }
  };

  /**
   * POST /api/ai/manufacturing-plan
   */
  generateProductionPlan = async (req, res) => {
    try {
      const { finished_good_id, quantity } = req.body;
      if (!finished_good_id || !quantity) {
        return sendError(res, 'finished_good_id and quantity are required.', 400);
      }
      const result = await aiService.generateProductionPlan(finished_good_id, parseInt(quantity));
      return sendSuccess(res, 'AI Production plan generated from live BOM & inventory data.', result);
    } catch (error) {
      console.error('[AiController] generateProductionPlan:', error.message);
      return sendError(res, error.message, 503);
    }
  };

  /**
   * GET /api/ai/insights
   */
  getBusinessInsights = async (req, res) => {
    try {
      const result = await aiService.getBusinessInsights();
      return sendSuccess(res, 'AI Business insights generated from live data.', result);
    } catch (error) {
      console.error('[AiController] getBusinessInsights:', error.message);
      return sendError(res, error.message, 503);
    }
  };

  /**
   * GET /api/ai/forecast
   */
  getDemandForecasts = async (req, res) => {
    try {
      const result = await aiService.getDemandForecasts();
      return sendSuccess(res, 'AI Demand forecasts generated from live sales history.', result);
    } catch (error) {
      console.error('[AiController] getDemandForecasts:', error.message);
      return sendError(res, error.message, 503);
    }
  };

  /**
   * GET /api/ai/vendors
   */
  getVendorAnalysis = async (req, res) => {
    try {
      const result = await aiService.getVendorAnalysis();
      return sendSuccess(res, 'AI Vendor analysis generated from live data.', result);
    } catch (error) {
      console.error('[AiController] getVendorAnalysis:', error.message);
      return sendError(res, error.message, 503);
    }
  };

  /**
   * POST /api/ai/chat
   */
  processChatPrompt = async (req, res) => {
    try {
      const { message } = req.body;
      if (!message || message.trim() === '') {
        return sendError(res, 'Chat prompt message is required.', 400);
      }
      const result = await aiService.processChatPrompt(message);
      return sendSuccess(res, 'Chat response generated from live ERP data.', result);
    } catch (error) {
      console.error('[AiController] processChatPrompt:', error.message);
      return sendError(res, error.message, 503);
    }
  };
}

module.exports = new AiController();
