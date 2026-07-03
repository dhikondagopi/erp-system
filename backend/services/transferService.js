const { pool } = require('../config/db');
const transferRepository = require('../repositories/transferRepository');
const inventoryService = require('./inventoryService');
const auditService = require('./auditService');
const notificationService = require('./notificationService');

class TransferService {
  async getTransferById(id) {
    const transfer = await transferRepository.findById(id);
    if (!transfer) {
      const error = new Error(`Warehouse Transfer request with ID '${id}' not found.`);
      error.statusCode = 404;
      throw error;
    }
    return transfer;
  }

  async getAllTransfers(queryParams) {
    const { sourceWarehouseId, destinationWarehouseId, status, page = 1, limit = 50 } = queryParams;
    const parsedPage = Math.max(1, parseInt(page, 10));
    const parsedLimit = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const offset = (parsedPage - 1) * parsedLimit;

    const { transfers, total } = await transferRepository.findAll({
      sourceWarehouseId,
      destinationWarehouseId,
      status,
      limit: parsedLimit,
      offset
    });

    return {
      transfers,
      pagination: {
        totalItems: total,
        itemsPerPage: parsedLimit,
        currentPage: parsedPage,
        totalPages: Math.ceil(total / parsedLimit)
      }
    };
  }

  async createTransfer(transferData, userId) {
    const { source_warehouse_id, destination_warehouse_id, reason, items } = transferData;

    if (!source_warehouse_id || !destination_warehouse_id) {
      throw new Error('Source and destination warehouses are required.');
    }
    if (source_warehouse_id === destination_warehouse_id) {
      throw new Error('Source and destination warehouses must be different.');
    }
    if (!items || items.length === 0) {
      throw new Error('Transfer items list cannot be empty.');
    }

    // Verify warehouses active
    const whRes = await pool.query('SELECT id, name, is_active FROM warehouses WHERE id IN ($1, $2)', [
      source_warehouse_id,
      destination_warehouse_id
    ]);
    if (whRes.rows.length !== 2) {
      throw new Error('One or both warehouses do not exist.');
    }
    whRes.rows.forEach(w => {
      if (!w.is_active) throw new Error(`Warehouse '${w.name}' is inactive.`);
    });

    // Validate quantities are available in source warehouse
    const validatedItems = [];
    for (const item of items) {
      const qty = parseFloat(item.quantity);
      if (isNaN(qty) || qty <= 0) {
        throw new Error('Transfer quantity must be positive.');
      }

      // Check available quantity in source warehouse
      const invRes = await pool.query(
        'SELECT qty_on_hand, qty_reserved FROM inventory WHERE product_id = $1 AND warehouse_id = $2',
        [item.product_id, source_warehouse_id]
      );
      
      const inv = invRes.rows[0];
      const available = inv ? parseFloat(inv.qty_on_hand) - parseFloat(inv.qty_reserved) : 0;
      
      if (available < qty) {
        const prodRes = await pool.query('SELECT name FROM products WHERE id = $1', [item.product_id]);
        const prodName = prodRes.rows[0]?.name || 'Product';
        throw new Error(`Insufficient inventory for ${prodName} in source warehouse. Available: ${available}, Requested: ${qty}`);
      }

      validatedItems.push({
        product_id: item.product_id,
        quantity: qty
      });
    }

    // Generate unique transfer serial format: TR-YYYYMMDD-XXXX
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const transferNumber = `TR-${todayStr}-${randSuffix}`;

    const payload = {
      transfer_number: transferNumber,
      source_warehouse_id,
      destination_warehouse_id,
      status: 'PENDING',
      reason,
      created_by: userId
    };

    const newTransfer = await transferRepository.create(payload, validatedItems);

    await auditService.log({
      user_id: userId,
      action: 'CREATE_TRANSFER_REQUEST',
      entity_type: 'warehouse_transfers',
      entity_id: newTransfer.id,
      new_value: payload,
      ip_address: 'System Service'
    });

    // Notify Business Owner/Admin for approval
    await notificationService.createNotification({
      title: 'Transfer Approval Required',
      message: `Warehouse Transfer ${transferNumber} is pending approval.`,
      type: 'TRANSFER_APPROVAL_REQUIRED',
      role: 'Business Owner'
    });

    return newTransfer;
  }

  async approveTransfer(id, userId) {
    const transfer = await this.getTransferById(id);

    if (transfer.status !== 'PENDING') {
      const error = new Error(`Cannot approve transfer. Status is already '${transfer.status}'. Only PENDING transfers can be approved.`);
      error.statusCode = 400;
      throw error;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Process stock transfers
      for (const item of transfer.items) {
        // 1. Deduct stock from source warehouse
        await inventoryService.removeStock(
          item.product_id,
          transfer.source_warehouse_id,
          parseFloat(item.quantity),
          'TRANSFER',
          id,
          userId,
          `Transfer Outbound - ${transfer.transfer_number}`,
          `Transferred to ${transfer.destination_warehouse_name}`,
          client
        );

        // 2. Add stock to destination warehouse
        await inventoryService.addStock(
          item.product_id,
          transfer.destination_warehouse_id,
          parseFloat(item.quantity),
          'TRANSFER',
          id,
          userId,
          `Transfer Inbound - ${transfer.transfer_number}`,
          `Transferred from ${transfer.source_warehouse_name}`,
          client
        );
      }

      // Update transfer status
      const updatedTransfer = await transferRepository.updateStatus(id, 'APPROVED', userId, client);

      await auditService.log({
        user_id: userId,
        action: 'APPROVE_TRANSFER',
        entity_type: 'warehouse_transfers',
        entity_id: id,
        old_value: { status: 'PENDING' },
        new_value: { status: 'APPROVED' },
        ip_address: 'System Service'
      }, client);

      // Notify creator
      await notificationService.createNotification({
        title: 'Transfer Order Approved',
        message: `Transfer Request ${transfer.transfer_number} has been approved and stock transferred.`,
        type: 'TRANSFER_APPROVED',
        user_id: transfer.created_by
      }, client);

      await client.query('COMMIT');
      return updatedTransfer;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async rejectTransfer(id, userId) {
    const transfer = await this.getTransferById(id);

    if (transfer.status !== 'PENDING') {
      const error = new Error(`Cannot reject transfer. Status is already '${transfer.status}'. Only PENDING transfers can be rejected.`);
      error.statusCode = 400;
      throw error;
    }

    const updated = await transferRepository.updateStatus(id, 'REJECTED', userId);

    await auditService.log({
      user_id: userId,
      action: 'REJECT_TRANSFER',
      entity_type: 'warehouse_transfers',
      entity_id: id,
      old_value: { status: 'PENDING' },
      new_value: { status: 'REJECTED' },
      ip_address: 'System Service'
    });

    await notificationService.createNotification({
      title: 'Transfer Request Rejected',
      message: `Warehouse Transfer Request ${transfer.transfer_number} has been rejected.`,
      type: 'TRANSFER_REJECTED',
      user_id: transfer.created_by
    });

    return updated;
  }

  async cancelTransfer(id, userId) {
    const transfer = await this.getTransferById(id);

    if (transfer.status !== 'PENDING') {
      const error = new Error(`Cannot cancel transfer. Status is already '${transfer.status}'. Only PENDING transfers can be cancelled.`);
      error.statusCode = 400;
      throw error;
    }

    const updated = await transferRepository.updateStatus(id, 'CANCELLED', null);

    await auditService.log({
      user_id: userId,
      action: 'CANCEL_TRANSFER',
      entity_type: 'warehouse_transfers',
      entity_id: id,
      old_value: { status: 'PENDING' },
      new_value: { status: 'CANCELLED' },
      ip_address: 'System Service'
    });

    return updated;
  }
}

module.exports = new TransferService();
