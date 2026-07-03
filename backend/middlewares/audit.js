const auditService = require('../services/auditService');

/**
 * ==========================================================
 * Audit Middleware
 * Logs successful CREATE / UPDATE / DELETE operations.
 * ==========================================================
 */
const audit = (action, entityType) => {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = async (body) => {
      try {
        if (
          res.statusCode >= 200 &&
          res.statusCode < 300 &&
          body?.success
        ) {
          const entityId =
            body?.data?.id ||
            req.params?.id ||
            null;

          if (entityId) {
            await auditService.log({
              user_id: req.user?.id || null,
              action,
              entity_type: entityType,
              entity_id: entityId,
              new_value: req.body,
              ip_address: req.ip,
            });
          }
        }
      } catch (error) {
        console.error(
          'Audit middleware failed:',
          error.message
        );
      }

      return originalJson(body);
    };

    next();
  };
};

module.exports = audit;