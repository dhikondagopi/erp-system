const { pool } = require('../config/db');
const manufacturingRepository = require('../repositories/manufacturingRepository');
const { MO_STATUS, TRANSACTION_TYPES, REFERENCE_TYPES } = require('../config/constants');
const notificationService = require('./notificationService');

/**
 * Manufacturing Order Service.
 * Implements business rules for wood furniture fabrication execution.
 */
class ManufacturingService {
  /**
   * Fetch manufacturing order by ID.
   */
  async getManufacturingOrderById(id) {
    const mo = await manufacturingRepository.findById(id);
    if (!mo) {
      const error = new Error(`Manufacturing Order with ID '${id}' not found.`);
      error.statusCode = 404;
      throw error;
    }
    return mo;
  }

  /**
   * Fetch list of manufacturing orders.
   */
  async getAllManufacturingOrders(queryParams) {
    const { finishedGoodId, status, page = 1, limit = 50 } = queryParams;
    const parsedPage = Math.max(1, parseInt(page, 10));
    const parsedLimit = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const offset = (parsedPage - 1) * parsedLimit;

    const { orders, total } = await manufacturingRepository.findAll({
      finishedGoodId,
      status,
      limit: parsedLimit,
      offset
    });

    return {
      orders,
      pagination: {
        totalItems: total,
        itemsPerPage: parsedLimit,
        currentPage: parsedPage,
        totalPages: Math.ceil(total / parsedLimit)
      }
    };
  }

  /**
   * Plan a new Manufacturing Order.
   */
  async createManufacturingOrder(moData, userId) {
    const { finished_good_id, bom_id, quantity, source_type, source_id } = moData;

    // Generate unique serial formatting: MO-YYYYMMDD-XXXX
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const moNumber = `MO-${todayStr}-${randSuffix}`;

    // Verify finished good exists and is manufacturable
    const prodRes = await pool.query('SELECT type, procurement_type FROM products WHERE id = $1', [finished_good_id]);
    if (prodRes.rows.length === 0) {
      const error = new Error('Target product profile does not exist.');
      error.statusCode = 400;
      throw error;
    }
    if (prodRes.rows[0].type !== 'FINISHED_GOOD') {
      const error = new Error('Cannot manufacture product: Target is not classified as a FINISHED_GOOD.');
      error.statusCode = 400;
      throw error;
    }

    // Verify BoM exists
    const bomRes = await pool.query('SELECT id FROM bills_of_materials WHERE id = $1 AND finished_good_id = $2', [bom_id, finished_good_id]);
    if (bomRes.rows.length === 0) {
      const error = new Error('The specified Bill of Materials (BoM) does not match the target finished good.');
      error.statusCode = 400;
      throw error;
    }

    const payload = {
      mo_number: moNumber,
      finished_good_id,
      bom_id,
      quantity: parseFloat(quantity),
      status: MO_STATUS.DRAFT,
      source_type,
      source_id,
      created_by: userId
    };

    return await manufacturingRepository.create(payload);
  }

  /**
   * Stage Manufacturing Order.
   * Asserts raw material availability and blocks reservations.
   */
  async stageManufacturingOrder(id, userId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const mo = await manufacturingRepository.findById(id, client);
      if (!mo) {
        const error = new Error(`Manufacturing Order with ID '${id}' not found.`);
        error.statusCode = 404;
        throw error;
      }

      if (mo.status !== MO_STATUS.DRAFT) {
        const error = new Error(`Cannot approve order: current status is '${mo.status}'. Only DRAFT orders can be approved.`);
        error.statusCode = 400;
        throw error;
      }

      // 1. Process inventory checks and lock quantities
      for (const comp of mo.components) {
        // Lock component inventory row
        const invRes = await client.query(
          'SELECT qty_on_hand, qty_reserved, location FROM inventory WHERE product_id = $1 FOR UPDATE',
          [comp.raw_material_id]
        );

        if (invRes.rows.length === 0) {
          const error = new Error(`Inventory mapping error: Component SKU '${comp.sku}' has no established inventory profile.`);
          error.statusCode = 400;
          throw error;
        }

        const inv = invRes.rows[0];
        const qtyOnHand = parseFloat(inv.qty_on_hand);
        const qtyReserved = parseFloat(inv.qty_reserved);
        const qtyAvailable = qtyOnHand - qtyReserved;
        const neededQty = parseFloat(comp.total_quantity_required);

        if (qtyAvailable < neededQty) {
          const error = new Error(`Material shortage: Raw material component '${comp.name}' is low. Available: ${qtyAvailable}, Required: ${neededQty}.`);
          error.statusCode = 400;
          throw error;
        }

        // Increment reserved quantities
        await client.query(
          'UPDATE inventory SET qty_reserved = qty_reserved + $2, updated_at = now() WHERE product_id = $1',
          [comp.raw_material_id, neededQty]
        );

        // Log allocation block in stock ledger
        const ledgerSql = `
          INSERT INTO stock_ledger (
            product_id, transaction_type, reference_type, reference_id,
            qty_change, unit_cost, user_id, reason, notes,
            qty_previous, qty_new, location, reference_number
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13);
        `;
        await client.query(ledgerSql, [
          comp.raw_material_id,
          TRANSACTION_TYPES.ALLOCATION,
          REFERENCE_TYPES.MANUFACTURING_ORDER,
          id,
          neededQty,
          parseFloat(comp.unit_cost),
          userId,
          'Manufacturing Material Reservation',
          `Allocated for ${mo.mo_number}`,
          qtyReserved,
          qtyReserved + neededQty,
          inv.location || 'Main Warehouse',
          mo.mo_number
        ]);
      }

      // 2. Transition status to APPROVED
      await manufacturingRepository.updateStatus(id, MO_STATUS.APPROVED, client);

      await client.query('COMMIT');
      return await manufacturingRepository.findById(id);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Launch fabrication production work orders pipeline.
   */
  async startProduction(id, userId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const mo = await manufacturingRepository.findById(id, client);
      if (!mo) {
        const error = new Error(`Manufacturing Order with ID '${id}' not found.`);
        error.statusCode = 404;
        throw error;
      }

      if (mo.status !== MO_STATUS.APPROVED) {
        const error = new Error(`Cannot start production: status is '${mo.status}'. Production can only start from APPROVED status.`);
        error.statusCode = 400;
        throw error;
      }

      await manufacturingRepository.updateStatus(id, MO_STATUS.IN_PRODUCTION, client);

      await client.query('COMMIT');
      return await manufacturingRepository.findById(id);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Complete Manufacturing Order.
   * Consumes raw materials (removes physical stock & clears reservations) and increases finished goods physical stock.
   */
  async completeManufacturingOrder(id, userId, externalClient = null) {
    const client = externalClient || await pool.connect();
    const mustManageTransaction = !externalClient;
    try {
      if (mustManageTransaction) {
        await client.query('BEGIN');
      }

      const mo = await manufacturingRepository.findById(id, client);
      if (!mo) {
        const error = new Error(`Manufacturing Order with ID '${id}' not found.`);
        error.statusCode = 404;
        throw error;
      }

      // Can complete from APPROVED or IN_PRODUCTION states
      if (mo.status !== MO_STATUS.APPROVED && mo.status !== MO_STATUS.IN_PRODUCTION) {
        const error = new Error(`Cannot complete order: status is '${mo.status}'. Only approved or in-production orders can be completed.`);
        error.statusCode = 400;
        throw error;
      }

      // 1. Consume raw materials
      for (const comp of mo.components) {
        // Lock inventory row
        const invRes = await client.query(
          'SELECT qty_on_hand, qty_reserved, location FROM inventory WHERE product_id = $1 FOR UPDATE',
          [comp.raw_material_id]
        );
        const inv = invRes.rows[0];
        const qtyOnHand = parseFloat(inv.qty_on_hand);
        const qtyReserved = parseFloat(inv.qty_reserved);
        const consumeQty = parseFloat(comp.total_quantity_required);

        if (qtyOnHand < consumeQty || qtyReserved < consumeQty) {
          const error = new Error(`Inventory sync mismatch for raw material component '${comp.name}'. On Hand: ${qtyOnHand}, Reserved: ${qtyReserved}.`);
          error.statusCode = 400;
          throw error;
        }

        // Deduct physical AND reserved stock numbers
        await client.query(
          'UPDATE inventory SET qty_on_hand = qty_on_hand - $2, qty_reserved = qty_reserved - $2, updated_at = now() WHERE product_id = $1',
          [comp.raw_material_id, consumeQty]
        );

        // Record stock ledger issue entry (ISSUE)
        const ledgerSql = `
          INSERT INTO stock_ledger (
            product_id, transaction_type, reference_type, reference_id,
            qty_change, unit_cost, user_id, reason, notes,
            qty_previous, qty_new, location, reference_number
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13);
        `;
        await client.query(ledgerSql, [
          comp.raw_material_id,
          TRANSACTION_TYPES.ISSUE,
          REFERENCE_TYPES.MANUFACTURING_ORDER,
          id,
          -consumeQty,
          parseFloat(comp.unit_cost),
          userId,
          'Manufacturing Consumption',
          `Consumed to fabricate ${mo.mo_number}`,
          qtyOnHand,
          qtyOnHand - consumeQty,
          inv.location || 'Main Warehouse',
          mo.mo_number
        ]);
      }

      // 2. Increase finished goods physical stock (Receipt)
      const finishedGoodId = mo.finished_good_id;
      const manufacturedQty = parseFloat(mo.quantity);

      // Lock finished good inventory and get previous quantity/location
      const fgInvRes = await client.query('SELECT qty_on_hand, location FROM inventory WHERE product_id = $1 FOR UPDATE', [finishedGoodId]);
      const fgInv = fgInvRes.rows[0];
      const fgQtyOnHand = fgInv ? parseFloat(fgInv.qty_on_hand) : 0;
      const fgLocation = fgInv ? fgInv.location : 'Main Warehouse';
      
      await client.query(
        'UPDATE inventory SET qty_on_hand = qty_on_hand + $2, updated_at = now() WHERE product_id = $1',
        [finishedGoodId, manufacturedQty]
      );

      // Fetch finished good unit cost (to log asset valuation)
      const fgCostRes = await client.query('SELECT unit_cost FROM products WHERE id = $1', [finishedGoodId]);
      const fgUnitCost = parseFloat(fgCostRes.rows[0].unit_cost);

      // Record stock ledger entry (RECEIPT)
      const fgLedgerSql = `
        INSERT INTO stock_ledger (
          product_id, transaction_type, reference_type, reference_id,
          qty_change, unit_cost, user_id, reason, notes,
          qty_previous, qty_new, location, reference_number
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13);
      `;
      await client.query(fgLedgerSql, [
        finishedGoodId,
        TRANSACTION_TYPES.RECEIPT,
        REFERENCE_TYPES.MANUFACTURING_ORDER,
        id,
        manufacturedQty,
        fgUnitCost,
        userId,
        'Manufacturing Output',
        `Produced finished good via ${mo.mo_number}`,
        fgQtyOnHand,
        fgQtyOnHand + manufacturedQty,
        fgLocation || 'Main Warehouse',
        mo.mo_number
      ]);

      // 3. Set status to COMPLETED
      await manufacturingRepository.updateStatus(id, MO_STATUS.COMPLETED, client);

      await notificationService.createNotification({
        title: 'Manufacturing Order Completed',
        message: `MO-${mo.mo_number} has been completed on the shop floor.`,
        type: 'MO_COMPLETED',
        role: 'Manufacturing User'
      }, client);

      if (mustManageTransaction) {
        await client.query('COMMIT');
      }
      return await manufacturingRepository.findById(id, client);
    } catch (error) {
      if (mustManageTransaction) {
        await client.query('ROLLBACK');
      }
      throw error;
    } finally {
      if (mustManageTransaction) {
        client.release();
      }
    }
  }

  /**
   * Cancel Manufacturing Order (releases reserved materials if staged/in-production).
   */
  async cancelManufacturingOrder(id, userId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const mo = await manufacturingRepository.findById(id, client);
      if (!mo) {
        const error = new Error(`Manufacturing Order with ID '${id}' not found.`);
        error.statusCode = 404;
        throw error;
      }

      if (mo.status === MO_STATUS.COMPLETED || mo.status === MO_STATUS.CANCELLED) {
        const error = new Error(`Cannot cancel Manufacturing Order: order is already in '${mo.status}' status.`);
        error.statusCode = 400;
        throw error;
      }

      const initialStatus = mo.status;

      // If the order had already allocated resources, we must return the reservations
      if (initialStatus === MO_STATUS.APPROVED || initialStatus === MO_STATUS.IN_PRODUCTION) {
        for (const comp of mo.components) {
          // Lock inventory row
          const invRes = await client.query(
            'SELECT qty_reserved, location FROM inventory WHERE product_id = $1 FOR UPDATE',
            [comp.raw_material_id]
          );

          const inv = invRes.rows[0];
          const qtyReserved = parseFloat(inv.qty_reserved);
          const releaseQty = parseFloat(comp.total_quantity_required);

          if (qtyReserved < releaseQty) {
            const error = new Error(`Deallocation reference mismatch: Component '${comp.name}' has insufficient reservations.`);
            error.statusCode = 400;
            throw error;
          }

          // Decrement reserved quantities
          await client.query(
            'UPDATE inventory SET qty_reserved = qty_reserved - $2, updated_at = now() WHERE product_id = $1',
            [comp.raw_material_id, releaseQty]
          );

          // Record stock ledger entry (DEALLOCATION)
          const ledgerSql = `
            INSERT INTO stock_ledger (
              product_id, transaction_type, reference_type, reference_id,
              qty_change, unit_cost, user_id, reason, notes,
              qty_previous, qty_new, location, reference_number
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13);
          `;
          await client.query(ledgerSql, [
            comp.raw_material_id,
            TRANSACTION_TYPES.DEALLOCATION,
            REFERENCE_TYPES.MANUFACTURING_ORDER,
            id,
            -releaseQty,
            parseFloat(comp.unit_cost),
            userId,
            'Manufacturing Reservation Cancellation',
            `Cancelled approval for ${mo.mo_number}`,
            qtyReserved,
            qtyReserved - releaseQty,
            inv.location || 'Main Warehouse',
            mo.mo_number
          ]);
        }
      }

      // Mark status as CANCELLED
      await manufacturingRepository.updateStatus(id, MO_STATUS.CANCELLED, client);

      await client.query('COMMIT');
      return await manufacturingRepository.findById(id);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = new ManufacturingService();
