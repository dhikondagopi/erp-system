const auditService = require('../services/auditService');
const { sendSuccess } = require('../utils/response');

/**
 * Audit Log Controller.
 * Resolves incoming HTTP requests to analyze system-wide log history.
 */
class AuditController {
  /**
   * Fetch paginated list of audit records with optional filters.
   */
  getLogs = async (req, res, next) => {
    try {
      const result = await auditService.getLogs(req.query);
      return sendSuccess(res, 'System audit logs loaded successfully.', result);
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = new AuditController();
