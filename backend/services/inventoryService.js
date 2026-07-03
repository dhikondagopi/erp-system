const { pool } = require('../config/db');
const inventoryRepository = require('../repositories/inventoryRepository');
const { TRANSACTION_TYPES } = require('../config/constants');
const notificationService = require('./notificationService');

/**
 * Inventory Service.
 * Coordinates transactional operations for stock movements and updates the Stock Ledger.
 * Backwards-compatible argument shifts support legacy callers seamlessly.
 */
class InventoryService {
  /**
   * Helper to retrieve product metadata (specifically unit cost) from products database.
   */
  async _getProductCost(productId, client) {
    const res = await client.query('SELECT unit_cost FROM products WHERE id = $1', [productId]);
    if (res.rows.length === 0) {
      const error = new Error(`Product reference conflict: Product with ID '${productId}' does not exist.`);
      error.statusCode = 400;
      throw error;
    }
    return parseFloat(res.rows[0].unit_cost);
  }

  /**
   * Helper to get active inventory status inside a transaction client.
   */
  async _getInventory(productId, warehouseId, client) {
    const inv = await inventoryRepository.findByProductAndWarehouse(productId, warehouseId, client);
    if (!inv) {
      const error = new Error(`Inventory reference error: No inventory record found for product ID '${productId}' in warehouse.`);
      error.statusCode = 404;
      throw error;
    }
    return {
      qtyOnHand: parseFloat(inv.qty_on_hand),
      qtyReserved: parseFloat(inv.qty_reserved),
      qtyIncoming: parseFloat(inv.qty_incoming),
      location: inv.warehouse_id, // Location maps to warehouse_id
      warehouse_id: inv.warehouse_id
    };
  }

  /**
   * Helper to lookup order/mo code using reference type and id.
   */
  async _getReferenceNumber(referenceType, referenceId, client) {
    if (!referenceType || !referenceId) return null;
    try {
      if (referenceType === 'PURCHASE_ORDER') {
        const res = await client.query('SELECT order_number FROM purchase_orders WHERE id = $1', [referenceId]);
        return res.rows[0]?.order_number || null;
      }
      if (referenceType === 'SALES_ORDER') {
        const res = await client.query('SELECT order_number FROM sales_orders WHERE id = $1', [referenceId]);
        return res.rows[0]?.order_number || null;
      }
      if (referenceType === 'MANUFACTURING_ORDER') {
        const res = await client.query('SELECT mo_number FROM manufacturing_orders WHERE id = $1', [referenceId]);
        return res.rows[0]?.mo_number || null;
      }
      if (referenceType === 'TRANSFER') {
        const res = await client.query('SELECT transfer_number FROM warehouse_transfers WHERE id = $1', [referenceId]);
        return res.rows[0]?.transfer_number || null;
      }
    } catch (err) {
      console.error('Error fetching reference number:', err.message);
    }
    return null;
  }

  /**
   * Helper to shift arguments to support legacy non-warehouse calls.
   */
  _parseArgs(productId, warehouseIdOrQty, qtyOrRefType, referenceTypeOrId, referenceIdOrUserId, userIdOrReason, reasonOrNotes, notesVal, args) {
    let warehouseId = null;
    let qty = 0;
    let referenceType, referenceId, userId, reason, notes;

    // Detect if second argument is quantity (meaning warehouseId is omitted)
    const isLegacy = typeof warehouseIdOrQty === 'number' || !isNaN(parseFloat(warehouseIdOrQty)) && (
      typeof qtyOrRefType === 'string' && (
        qtyOrRefType === 'SALES_ORDER' || 
        qtyOrRefType === 'PURCHASE_ORDER' || 
        qtyOrRefType === 'MANUFACTURING_ORDER' || 
        qtyOrRefType === 'MANUAL' ||
        qtyOrRefType === 'TRANSFER'
      )
    );

    if (isLegacy) {
      qty = parseFloat(warehouseIdOrQty);
      referenceType = qtyOrRefType;
      referenceId = referenceTypeOrId;
      userId = referenceIdOrUserId;
      reason = userIdOrReason;
      notes = reasonOrNotes || null;
    } else {
      warehouseId = warehouseIdOrQty;
      qty = parseFloat(qtyOrRefType);
      referenceType = referenceTypeOrId;
      referenceId = referenceIdOrUserId;
      userId = userIdOrReason;
      reason = reasonOrNotes;
      notes = notesVal || null;
    }

    return { warehouseId, qty, referenceType, referenceId, userId, reason, notes };
  }

  /**
   * Increase physical stock (Receipt of inventory).
   */
  async addStock(productId, warehouseIdOrQty, qtyOrRefType, referenceTypeOrId, referenceIdOrUserId, userIdOrReason, reasonOrNotes, notesVal = null) {
    const { warehouseId, qty, referenceType, referenceId, userId, reason, notes } = this._parseArgs(
      productId, warehouseIdOrQty, qtyOrRefType, referenceTypeOrId, referenceIdOrUserId, userIdOrReason, reasonOrNotes, notesVal, arguments
    );

    if (qty <= 0) throw new Error('Add stock quantity must be positive.');
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Ensure inventory row exists
      const targetInv = await inventoryRepository.findOrCreateInventory(productId, warehouseId, client);
      const whId = targetInv.warehouse_id;

      const invBefore = await this._getInventory(productId, whId, client);
      const unitCost = await this._getProductCost(productId, client);
      const refNumber = await this._getReferenceNumber(referenceType, referenceId, client);

      // Increment physical stock
      const updatedInv = await inventoryRepository.updateQuantities(
        productId,
        whId,
        { qtyOnHandChange: qty },
        client
      );

      // Fetch warehouse metadata for ledger naming
      const whRes = await client.query('SELECT name FROM warehouses WHERE id = $1', [whId]);
      const whName = whRes.rows[0]?.name || 'Main Warehouse';

      // Record transaction ledger log
      await inventoryRepository.createLedgerEntry({
        product_id: productId,
        warehouse_id: whId,
        transaction_type: TRANSACTION_TYPES.RECEIPT,
        reference_type: referenceType,
        reference_id: referenceId,
        qty_change: qty,
        unit_cost: unitCost,
        user_id: userId,
        reason,
        notes,
        qty_previous: invBefore.qtyOnHand,
        qty_new: invBefore.qtyOnHand + qty,
        location: whName,
        reference_number: refNumber
      }, client);

      await notificationService.checkAndTriggerLowStock(productId, client);

      await client.query('COMMIT');
      return updatedInv;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Decrease physical stock directly.
   */
  async removeStock(productId, warehouseIdOrQty, qtyOrRefType, referenceTypeOrId, referenceIdOrUserId, userIdOrReason, reasonOrNotes, notesVal = null) {
    const { warehouseId, qty, referenceType, referenceId, userId, reason, notes } = this._parseArgs(
      productId, warehouseIdOrQty, qtyOrRefType, referenceTypeOrId, referenceIdOrUserId, userIdOrReason, reasonOrNotes, notesVal, arguments
    );

    if (qty <= 0) throw new Error('Remove stock quantity must be positive.');

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const targetInv = await inventoryRepository.findOrCreateInventory(productId, warehouseId, client);
      const whId = targetInv.warehouse_id;

      const inv = await this._getInventory(productId, whId, client);
      
      const qtyAvailable = inv.qtyOnHand - inv.qtyReserved;
      if (qtyAvailable < qty) {
        const err = new Error(`Insufficient inventory available in warehouse: Requested ${qty}, but only ${qtyAvailable} is available (On Hand: ${inv.qtyOnHand}, Reserved: ${inv.qtyReserved}).`);
        err.statusCode = 400;
        throw err;
      }

      const unitCost = await this._getProductCost(productId, client);
      const refNumber = await this._getReferenceNumber(referenceType, referenceId, client);

      // Decrement physical stock
      const updatedInv = await inventoryRepository.updateQuantities(
        productId,
        whId,
        { qtyOnHandChange: -qty },
        client
      );

      const whRes = await client.query('SELECT name FROM warehouses WHERE id = $1', [whId]);
      const whName = whRes.rows[0]?.name || 'Main Warehouse';

      // Record transaction ledger log
      await inventoryRepository.createLedgerEntry({
        product_id: productId,
        warehouse_id: whId,
        transaction_type: TRANSACTION_TYPES.ISSUE,
        reference_type: referenceType,
        reference_id: referenceId,
        qty_change: -qty,
        unit_cost: unitCost,
        user_id: userId,
        reason,
        notes,
        qty_previous: inv.qtyOnHand,
        qty_new: inv.qtyOnHand - qty,
        location: whName,
        reference_number: refNumber
      }, client);

      await notificationService.checkAndTriggerLowStock(productId, client);

      await client.query('COMMIT');
      return updatedInv;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Reserve stock.
   */
  async reserveStock(productId, warehouseIdOrQty, qtyOrRefType, referenceTypeOrId, referenceIdOrUserId, userIdOrReason, reasonOrNotes, notesVal = null) {
    const { warehouseId, qty, referenceType, referenceId, userId, reason, notes } = this._parseArgs(
      productId, warehouseIdOrQty, qtyOrRefType, referenceTypeOrId, referenceIdOrUserId, userIdOrReason, reasonOrNotes, notesVal, arguments
    );

    if (qty <= 0) throw new Error('Reservation quantity must be positive.');

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const targetInv = await inventoryRepository.findOrCreateInventory(productId, warehouseId, client);
      const whId = targetInv.warehouse_id;

      const inv = await this._getInventory(productId, whId, client);
      
      const qtyAvailable = inv.qtyOnHand - inv.qtyReserved;
      if (qtyAvailable < qty) {
        const err = new Error(`Cannot reserve stock: Requested reservation of ${qty}, but only ${qtyAvailable} is available (On Hand: ${inv.qtyOnHand}, Reserved: ${inv.qtyReserved}).`);
        err.statusCode = 400;
        throw err;
      }

      const unitCost = await this._getProductCost(productId, client);
      const refNumber = await this._getReferenceNumber(referenceType, referenceId, client);

      // Increment reserved stock
      const updatedInv = await inventoryRepository.updateQuantities(
        productId,
        whId,
        { qtyReservedChange: qty },
        client
      );

      const whRes = await client.query('SELECT name FROM warehouses WHERE id = $1', [whId]);
      const whName = whRes.rows[0]?.name || 'Main Warehouse';

      // Record allocation ledger log
      await inventoryRepository.createLedgerEntry({
        product_id: productId,
        warehouse_id: whId,
        transaction_type: TRANSACTION_TYPES.ALLOCATION,
        reference_type: referenceType,
        reference_id: referenceId,
        qty_change: qty,
        unit_cost: unitCost,
        user_id: userId,
        reason,
        notes,
        qty_previous: inv.qtyReserved,
        qty_new: inv.qtyReserved + qty,
        location: whName,
        reference_number: refNumber
      }, client);

      await client.query('COMMIT');
      return updatedInv;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Release reserved stock.
   */
  async releaseStock(productId, warehouseIdOrQty, qtyOrRefType, referenceTypeOrId, referenceIdOrUserId, userIdOrReason, reasonOrNotes, notesVal = null) {
    const { warehouseId, qty, referenceType, referenceId, userId, reason, notes } = this._parseArgs(
      productId, warehouseIdOrQty, qtyOrRefType, referenceTypeOrId, referenceIdOrUserId, userIdOrReason, reasonOrNotes, notesVal, arguments
    );

    if (qty <= 0) throw new Error('Release quantity must be positive.');

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const targetInv = await inventoryRepository.findOrCreateInventory(productId, warehouseId, client);
      const whId = targetInv.warehouse_id;

      const inv = await this._getInventory(productId, whId, client);
      
      if (inv.qtyReserved < qty) {
        const err = new Error(`Cannot release reservation: Requested release of ${qty}, but only ${inv.qtyReserved} is currently reserved.`);
        err.statusCode = 400;
        throw err;
      }

      const unitCost = await this._getProductCost(productId, client);
      const refNumber = await this._getReferenceNumber(referenceType, referenceId, client);

      // Decrement reserved stock
      const updatedInv = await inventoryRepository.updateQuantities(
        productId,
        whId,
        { qtyReservedChange: -qty },
        client
      );

      const whRes = await client.query('SELECT name FROM warehouses WHERE id = $1', [whId]);
      const whName = whRes.rows[0]?.name || 'Main Warehouse';

      // Record deallocation ledger log
      await inventoryRepository.createLedgerEntry({
        product_id: productId,
        warehouse_id: whId,
        transaction_type: TRANSACTION_TYPES.DEALLOCATION,
        reference_type: referenceType,
        reference_id: referenceId,
        qty_change: -qty,
        unit_cost: unitCost,
        user_id: userId,
        reason,
        notes,
        qty_previous: inv.qtyReserved,
        qty_new: inv.qtyReserved - qty,
        location: whName,
        reference_number: refNumber
      }, client);

      await client.query('COMMIT');
      return updatedInv;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Ship reserved stock.
   */
  async shipReservedStock(productId, warehouseIdOrQty, qtyOrRefType, referenceTypeOrId, referenceIdOrUserId, userIdOrReason, reasonOrNotes, notesVal = null) {
    const { warehouseId, qty, referenceType, referenceId, userId, reason, notes } = this._parseArgs(
      productId, warehouseIdOrQty, qtyOrRefType, referenceTypeOrId, referenceIdOrUserId, userIdOrReason, reasonOrNotes, notesVal, arguments
    );

    if (qty <= 0) throw new Error('Shipment quantity must be positive.');

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const targetInv = await inventoryRepository.findOrCreateInventory(productId, warehouseId, client);
      const whId = targetInv.warehouse_id;

      const inv = await this._getInventory(productId, whId, client);
      
      if (inv.qtyOnHand < qty || inv.qtyReserved < qty) {
        const err = new Error(`Cannot ship stock: Requested shipment of ${qty}, but current status has On Hand: ${inv.qtyOnHand}, Reserved: ${inv.qtyReserved}.`);
        err.statusCode = 400;
        throw err;
      }

      const unitCost = await this._getProductCost(productId, client);
      const refNumber = await this._getReferenceNumber(referenceType, referenceId, client);

      // Decrement both physical stock AND reserved stock
      const updatedInv = await inventoryRepository.updateQuantities(
        productId,
        whId,
        { qtyOnHandChange: -qty, qtyReservedChange: -qty },
        client
      );

      const whRes = await client.query('SELECT name FROM warehouses WHERE id = $1', [whId]);
      const whName = whRes.rows[0]?.name || 'Main Warehouse';

      // Record transaction ledger log
      await inventoryRepository.createLedgerEntry({
        product_id: productId,
        warehouse_id: whId,
        transaction_type: TRANSACTION_TYPES.ISSUE,
        reference_type: referenceType,
        reference_id: referenceId,
        qty_change: -qty,
        unit_cost: unitCost,
        user_id: userId,
        reason,
        notes,
        qty_previous: inv.qtyOnHand,
        qty_new: inv.qtyOnHand - qty,
        location: whName,
        reference_number: refNumber
      }, client);

      await notificationService.checkAndTriggerLowStock(productId, client);

      await client.query('COMMIT');
      return updatedInv;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Stock Adjustment.
   */
  async adjustStock(productId, warehouseIdOrQty, qtyChangeOrRefType, referenceTypeOrId, referenceIdOrUserId, userIdOrReason, reasonOrNotes, notesVal = null) {
    // Shifting arguments dynamically for adjustStock
    let warehouseId = null;
    let qtyChange = 0;
    let referenceType, referenceId, userId, reason, notes;

    const isLegacy = typeof warehouseIdOrQty === 'number' || !isNaN(parseFloat(warehouseIdOrQty)) && (
      typeof qtyChangeOrRefType === 'string' && (
        qtyChangeOrRefType === 'SALES_ORDER' || 
        qtyChangeOrRefType === 'PURCHASE_ORDER' || 
        qtyChangeOrRefType === 'MANUFACTURING_ORDER' || 
        qtyChangeOrRefType === 'MANUAL' ||
        qtyChangeOrRefType === 'TRANSFER'
      )
    );

    if (isLegacy) {
      qtyChange = parseFloat(warehouseIdOrQty);
      referenceType = qtyChangeOrRefType;
      referenceId = referenceTypeOrId;
      userId = referenceIdOrUserId;
      reason = userIdOrReason;
      notes = reasonOrNotes || null;
    } else {
      warehouseId = warehouseIdOrQty;
      qtyChange = parseFloat(qtyChangeOrRefType);
      referenceType = referenceIdOrUserId;
      referenceId = userIdOrReason;
      userId = reasonOrNotes;
      reason = notesVal;
      notes = arguments[7] || null;
    }

    if (qtyChange === 0) throw new Error('Stock adjustment quantity cannot be zero.');

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const targetInv = await inventoryRepository.findOrCreateInventory(productId, warehouseId, client);
      const whId = targetInv.warehouse_id;

      const inv = await this._getInventory(productId, whId, client);

      if (inv.qtyOnHand + qtyChange < inv.qtyReserved) {
        const err = new Error(`Cannot adjust stock: Adjustment of ${qtyChange} would drive On Hand stock to ${inv.qtyOnHand + qtyChange}, which is less than the active reserved stock (${inv.qtyReserved}).`);
        err.statusCode = 400;
        throw err;
      }

      const unitCost = await this._getProductCost(productId, client);
      const refNumber = await this._getReferenceNumber(referenceType, referenceId, client);

      // Adjust physical stock
      const updatedInv = await inventoryRepository.updateQuantities(
        productId,
        whId,
        { qtyOnHandChange: qtyChange },
        client
      );

      const whRes = await client.query('SELECT name FROM warehouses WHERE id = $1', [whId]);
      const whName = whRes.rows[0]?.name || 'Main Warehouse';

      // Record adjustment ledger log
      await inventoryRepository.createLedgerEntry({
        product_id: productId,
        warehouse_id: whId,
        transaction_type: TRANSACTION_TYPES.ADJUSTMENT,
        reference_type: referenceType,
        reference_id: referenceId,
        qty_change: qtyChange,
        unit_cost: unitCost,
        user_id: userId,
        reason,
        notes,
        qty_previous: inv.qtyOnHand,
        qty_new: inv.qtyOnHand + qtyChange,
        location: whName,
        reference_number: refNumber
      }, client);

      await notificationService.checkAndTriggerLowStock(productId, client);

      await client.query('COMMIT');
      return updatedInv;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Fetch inventory levels (filtered by warehouseId if provided).
   */
  async getInventoryLevels(queryParams) {
    const { search, warehouseId, page = 1, limit = 50 } = queryParams;
    const parsedPage = Math.max(1, parseInt(page, 10));
    const parsedLimit = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const offset = (parsedPage - 1) * parsedLimit;

    const { inventory, total } = await inventoryRepository.getInventoryLevels({
      search: search ? search.trim() : null,
      warehouseId: warehouseId ? warehouseId.trim() : null,
      limit: parsedLimit,
      offset
    });

    return {
      inventory,
      pagination: {
        totalItems: total,
        itemsPerPage: parsedLimit,
        currentPage: parsedPage,
        totalPages: Math.ceil(total / parsedLimit)
      }
    };
  }

  /**
   * Fetch specific stock ledger log.
   */
  async getLedgerHistory(productId, queryParams) {
    const { page = 1, limit = 50 } = queryParams;
    const parsedPage = Math.max(1, parseInt(page, 10));
    const parsedLimit = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const offset = (parsedPage - 1) * parsedLimit;

    const { history, total } = await inventoryRepository.getLedgerHistory(productId, {
      limit: parsedLimit,
      offset
    });

    return {
      history,
      pagination: {
        totalItems: total,
        itemsPerPage: parsedLimit,
        currentPage: parsedPage,
        totalPages: Math.ceil(total / parsedLimit)
      }
    };
  }

  /**
   * Fetch global stock ledger logs (filtered by warehouseId if provided).
   */
  async getGlobalLedgerHistory(queryParams) {
    const { page = 1, limit = 50, transaction_type, search, warehouseId } = queryParams;
    const parsedPage = Math.max(1, parseInt(page, 10));
    const parsedLimit = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const offset = (parsedPage - 1) * parsedLimit;

    const { history, total } = await inventoryRepository.getGlobalLedgerHistory({
      limit: parsedLimit,
      offset,
      transaction_type: transaction_type ? transaction_type.toUpperCase() : null,
      search: search ? search.trim() : null,
      warehouseId: warehouseId ? warehouseId.trim() : null
    });

    return {
      history,
      pagination: {
        totalItems: total,
        itemsPerPage: parsedLimit,
        currentPage: parsedPage,
        totalPages: Math.ceil(total / parsedLimit)
      }
    };
  }
}

module.exports = new InventoryService();
