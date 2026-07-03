const procurementEngine = require('../services/procurementEngine');
const { sendSuccess } = require('../utils/response');

/**
 * Procurement Controller.
 * Resolves incoming HTTP requests for automated replenishment and alerts.
 */
class ProcurementController {
  /**
   * Fetch active alerts for items breaching their reorder point thresholds.
   */
  getProcurementAlerts = async (req, res, next) => {
    try {
      const alerts = await procurementEngine.getProcurementAlerts();
      return sendSuccess(res, 'Procurement stock alerts loaded successfully.', alerts);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * Manually trigger the auto-replenishment run.
   */
  runAutoReplenishment = async (req, res, next) => {
    try {
      const userId = req.user.id;
      const result = await procurementEngine.runAutoReplenishment(userId);
      return sendSuccess(res, 'Auto-replenishment execution complete.', result);
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = new ProcurementController();
