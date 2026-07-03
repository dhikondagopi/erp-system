const auditRepository = require('../repositories/auditRepository');
const {
  PAGINATION,
  AUDIT_ACTIONS,
} = require('../config/constants');

/**
 * ==========================================================
 * Audit Service
 * Handles audit log business logic.
 * ==========================================================
 */
class AuditService {
  /**
   * Create Audit Log
   *
   * @param {Object} logData
   * @param {Object|null} client PostgreSQL transaction client
   */
  async log(logData, client = null) {
    if (!logData || typeof logData !== 'object') {
      console.warn('[Audit] Invalid log payload.');
      return null;
    }

    const {
      user_id,
      action,
      entity_type,
      entity_id,
      ip_address,
    } = logData;

    if (!action || !entity_type || !entity_id) {
      console.warn('[Audit] Missing required audit fields.');
      return null;
    }

    // Validate action (if defined in constants)
    if (
      Object.keys(AUDIT_ACTIONS).length > 0 &&
      !Object.values(AUDIT_ACTIONS).includes(action)
    ) {
      console.warn(`[Audit] Unknown action: ${action}`);
    }

    try {
      return await auditRepository.create(
        {
          user_id,
          action,
          entity_type: String(entity_type).trim(),
          entity_id,
          ip_address,
        },
        client
      );
    } catch (error) {
      console.error('[Audit] Failed to create audit log.');

      if (process.env.NODE_ENV === 'development') {
        console.error(error);
      } else {
        console.error(error.message);
      }

      // Never interrupt business logic because of audit failure
      return null;
    }
  }

  /**
   * Get Audit Logs
   */
  async getLogs(queryParams = {}) {
    let {
      userId,
      action,
      entityType,
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
    } = queryParams;

    page = Number(page);
    limit = Number(limit);

    if (Number.isNaN(page) || page < 1) {
      page = PAGINATION.DEFAULT_PAGE;
    }

    if (Number.isNaN(limit) || limit < 1) {
      limit = PAGINATION.DEFAULT_LIMIT;
    }

    limit = Math.min(limit, PAGINATION.MAX_LIMIT);

    const offset = (page - 1) * limit;

    const result = await auditRepository.findAll({
      userId,
      action,
      entityType,
      limit,
      offset,
    });

    const logs = result.logs || [];
    const total = Number(result.total) || 0;

    return {
      logs,

      pagination: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems: total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

module.exports = new AuditService();