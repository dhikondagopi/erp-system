const { pool } = require('../config/db');
const workOrderRepository = require('../repositories/workOrderRepository');
const manufacturingService = require('./manufacturingService');
const { WO_STATUS } = require('../config/constants');
const notificationService = require('./notificationService');

/**
 * Work Order Service.
 * Coordinates shop-floor fabrication tasks and timeline events.
 */
class WorkOrderService {
  /**
   * Fetch work order details by ID.
   */
  async getWorkOrderById(id) {
    const wo = await workOrderRepository.findById(id);
    if (!wo) {
      const error = new Error(`Work Order with ID '${id}' not found.`);
      error.statusCode = 404;
      throw error;
    }
    return wo;
  }

  /**
   * Fetch all work orders for a Manufacturing Order.
   */
  async getWorkOrdersByMoId(moId) {
    // Assert MO exists
    const moRes = await pool.query('SELECT id FROM manufacturing_orders WHERE id = $1', [moId]);
    if (moRes.rows.length === 0) {
      const error = new Error(`Manufacturing Order with ID '${moId}' not found.`);
      error.statusCode = 404;
      throw error;
    }
    return await workOrderRepository.findByMoId(moId);
  }

  /**
   * Fetch work orders assigned to a specific worker.
   */
  async getMyWorkOrders(userId, queryParams) {
    const { status, page = 1, limit = 50 } = queryParams;
    const parsedPage = Math.max(1, parseInt(page, 10));
    const parsedLimit = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const offset = (parsedPage - 1) * parsedLimit;

    return await workOrderRepository.findByAssignedUser(userId, {
      status,
      limit: parsedLimit,
      offset
    });
  }

  /**
   * Create a new Work Order manually.
   */
  async createWorkOrder(woData) {
    const { manufacturing_order_id, operation_name, assigned_to } = woData;

    // Assert parent MO exists
    const moRes = await pool.query('SELECT id, status FROM manufacturing_orders WHERE id = $1', [manufacturing_order_id]);
    if (moRes.rows.length === 0) {
      const error = new Error('Parent Manufacturing Order does not exist.');
      error.statusCode = 400;
      throw error;
    }

    if (assigned_to) {
      const userRes = await pool.query('SELECT id FROM users WHERE id = $1', [assigned_to]);
      if (userRes.rows.length === 0) {
        const error = new Error('Target assigned worker account does not exist.');
        error.statusCode = 400;
        throw error;
      }
    }

    const payload = {
      manufacturing_order_id,
      operation_name: operation_name.trim(),
      status: WO_STATUS.PENDING,
      assigned_to
    };

    return await workOrderRepository.create(payload);
  }

  /**
   * Assign a Work Order to a worker.
   */
  async assignWorkOrder(id, assignedToUserId) {
    const wo = await workOrderRepository.findById(id);
    if (!wo) {
      const error = new Error(`Work Order with ID '${id}' not found.`);
      error.statusCode = 404;
      throw error;
    }

    // Verify user profile exists
    const userRes = await pool.query('SELECT id, role FROM users WHERE id = $1', [assignedToUserId]);
    if (userRes.rows.length === 0) {
      const error = new Error('Target worker account does not exist.');
      error.statusCode = 400;
      throw error;
    }

    const updatedWo = await workOrderRepository.assignUser(id, assignedToUserId);

    // Notify the assigned user
    await notificationService.createNotification({
      user_id: assignedToUserId,
      title: 'Work Order Assigned',
      message: `You have been assigned to work order "${wo.operation_name}" for MO #${wo.mo_number || ''}.`,
      type: 'WORK_ORDER_ASSIGNED'
    });

    return updatedWo;
  }

  /**
   * Start Work Order (IN_PROGRESS and logs start_time).
   */
  async startWorkOrder(id) {
    const wo = await workOrderRepository.findById(id);
    if (!wo) {
      const error = new Error(`Work Order with ID '${id}' not found.`);
      error.statusCode = 404;
      throw error;
    }

    if (wo.status === WO_STATUS.COMPLETED) {
      throw new Error('Cannot start work order: task is already completed.');
    }

    const updates = { start_time: new Date() };
    return await workOrderRepository.updateStatus(id, WO_STATUS.IN_PROGRESS, updates);
  }

  /**
   * Pause Work Order (sets status to PAUSED).
   */
  async pauseWorkOrder(id) {
    const wo = await workOrderRepository.findById(id);
    if (!wo) {
      const error = new Error(`Work Order with ID '${id}' not found.`);
      error.statusCode = 404;
      throw error;
    }

    if (wo.status !== WO_STATUS.IN_PROGRESS) {
      throw new Error(`Cannot pause work order: status is currently '${wo.status}'. Tasks can only be paused when IN_PROGRESS.`);
    }

    return await workOrderRepository.updateStatus(id, WO_STATUS.PAUSED, {});
  }

  /**
   * Complete Work Order (COMPLETED and logs end_time).
   * Checks if all sibling work orders are complete, and if so, completes the parent MO.
   */
  async completeWorkOrder(id, userId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const wo = await workOrderRepository.findById(id, client);
      if (!wo) {
        const error = new Error(`Work Order with ID '${id}' not found.`);
        error.statusCode = 404;
        throw error;
      }

      if (wo.status === WO_STATUS.COMPLETED) {
        throw new Error('Work Order is already marked COMPLETED.');
      }

      // 1. Update status to COMPLETED and set end_time
      await workOrderRepository.updateStatus(id, WO_STATUS.COMPLETED, { end_time: new Date() }, client);

      // 2. Check if all sibling work orders are completed for this parent MO
      const checkRes = await client.query(
        'SELECT COUNT(*) FROM work_orders WHERE manufacturing_order_id = $1 AND status != $2',
        [wo.manufacturing_order_id, WO_STATUS.COMPLETED]
      );
      const remainingCount = parseInt(checkRes.rows[0].count, 10);

      let parentMoCompleted = false;
      if (remainingCount === 0) {
        // Automatically trigger completeManufacturingOrder inside the same transaction client!
        // This consumes raw materials, updates finished goods, and writes stock logs
        await manufacturingService.completeManufacturingOrder(wo.manufacturing_order_id, userId, client);
        parentMoCompleted = true;
      }

      await client.query('COMMIT');

      // Fetch completed result
      const completedWo = await workOrderRepository.findById(id);
      return {
        workOrder: completedWo,
        parentMoCompleted
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Fetch all work orders globally.
   */
  async getAllWorkOrders(queryParams) {
    const { status, assigned_to, search, page = 1, limit = 50 } = queryParams;
    const parsedPage = Math.max(1, parseInt(page, 10));
    const parsedLimit = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const offset = (parsedPage - 1) * parsedLimit;

    const { workOrders, total } = await workOrderRepository.findAll({
      status,
      assigned_to,
      search: search ? search.trim() : null,
      limit: parsedLimit,
      offset
    });

    return {
      workOrders,
      pagination: {
        totalItems: total,
        itemsPerPage: parsedLimit,
        currentPage: parsedPage,
        totalPages: Math.ceil(total / parsedLimit)
      }
    };
  }

  /**
   * Fetch workers directory list.
   */
  async getWorkers() {
    const res = await pool.query(
      'SELECT id, email, first_name, last_name, role FROM users ORDER BY first_name ASC'
    );
    return res.rows;
  }

  /**
   * Unified work order update (assignee and status transitions).
   */
  async updateWorkOrder(id, data, userId) {
    const { status, assigned_to } = data;
    
    const wo = await workOrderRepository.findById(id);
    if (!wo) {
      const error = new Error(`Work Order with ID '${id}' not found.`);
      error.statusCode = 404;
      throw error;
    }

    let updated = wo;

    if (assigned_to !== undefined && assigned_to !== wo.assigned_to) {
      if (assigned_to === null || assigned_to === '') {
        updated = await workOrderRepository.assignUser(id, null);
      } else {
        updated = await this.assignWorkOrder(id, assigned_to);
      }
    }

    if (status && status !== wo.status) {
      switch (status) {
        case 'IN_PROGRESS':
          updated = await this.startWorkOrder(id);
          break;
        case 'PAUSED':
          updated = await this.pauseWorkOrder(id);
          break;
        case 'COMPLETED':
          const result = await this.completeWorkOrder(id, userId);
          updated = result.workOrder;
          break;
        case 'PENDING':
          updated = await workOrderRepository.updateStatus(id, 'PENDING', { start_time: null, end_time: null });
          break;
        default:
          const error = new Error(`Unsupported status transition: '${status}'.`);
          error.statusCode = 400;
          throw error;
      }
    }

    return await workOrderRepository.findById(id);
  }
}

module.exports = new WorkOrderService();
