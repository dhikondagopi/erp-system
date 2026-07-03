const dashboardService = require('../services/dashboardService');
const { sendSuccess } = require('../utils/response');

/**
 * Dashboard Controller.
 * Resolves API requests to compile overall business analytics.
 */
class DashboardController {
  /**
   * Fetch analytical summaries and KPIs.
   */
  getDashboardSummary = async (req, res, next) => {
    try {
      const summary = await dashboardService.getDashboardSummary();
      return sendSuccess(res, 'Dashboard analytics data compiled successfully.', summary);
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = new DashboardController();
