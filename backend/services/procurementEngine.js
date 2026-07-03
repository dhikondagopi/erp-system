const { pool } = require('../config/db');
const procurementRepository = require('../repositories/procurementRepository');
const { PO_STATUS, MO_STATUS } = require('../config/constants');

/**
 * Procurement Automation Engine.
 * Automatically runs stock level analysis and triggers replenishment documents.
 */
class ProcurementEngine {
  /**
   * Handle inventory shortage for a specific product.
   * Automatically launches a Manufacturing Order or drafts a Purchase Order.
   */
  async handleShortage(productId, shortageQty, sourceType, sourceId, userId, externalClient = null) {
    const client = externalClient || await pool.connect();
    const mustManageTransaction = !externalClient;

    try {
      if (mustManageTransaction) {
        await client.query('BEGIN');
      }

      // Fetch product replenishment specifications
      const product = await procurementRepository.findProductProcurementDetails(productId, client);
      if (!product) {
        throw new Error(`Procurement error: Product ID '${productId}' not found.`);
      }

      const result = {
        product_id: productId,
        sku: product.sku,
        name: product.name,
        shortage_qty: shortageQty,
        action: null,
        document_id: null,
        document_number: null
      };

      if (product.procurement_type === 'MANUFACTURE') {
        // Scenario 2: Create Manufacturing Order
        const bom = await procurementRepository.findActiveBomForFinishedGood(productId, client);
        if (!bom) {
          throw new Error(`Procurement failed: Product '${product.name}' is set to MANUFACTURE but has no active Bill of Materials (BoM) recipe.`);
        }

        // Generate serial: MO-YYYYMMDD-XXXX
        const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const randSuffix = Math.floor(1000 + Math.random() * 9000);
        const moNumber = `MO-${todayStr}-${randSuffix}`;

        const moSql = `
          INSERT INTO manufacturing_orders (
            mo_number, finished_good_id, bom_id, quantity, status, source_type, source_id, created_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *;
        `;
        const moRes = await client.query(moSql, [
          moNumber,
          productId,
          bom.id,
          shortageQty,
          MO_STATUS.DRAFT,
          sourceType,
          sourceId,
          userId
        ]);

        result.action = 'MANUFACTURE';
        result.document_id = moRes.rows[0].id;
        result.document_number = moRes.rows[0].mo_number;

      } else if (product.procurement_type === 'PURCHASE') {
        // Scenario 1: Create Purchase Order Draft
        const vendor = await procurementRepository.findVendorForProduct(productId, client);
        if (!vendor) {
          throw new Error(`Procurement failed: Product '${product.name}' is set to PURCHASE but has no vendor mapping in vendor_products.`);
        }

        // Generate serial: PO-YYYYMMDD-XXXX
        const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const randSuffix = Math.floor(1000 + Math.random() * 9000);
        const poNumber = `PO-${todayStr}-${randSuffix}`;
        
        // Use vendor-specific pricing
        const unitCost = parseFloat(vendor.vendor_price);
        const totalCost = shortageQty * unitCost;

        // 1. Insert parent PO
        const poSql = `
          INSERT INTO purchase_orders (order_number, vendor_id, status, total_amount, created_by)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *;
        `;
        const poRes = await client.query(poSql, [
          poNumber,
          vendor.id,
          PO_STATUS.DRAFT,
          totalCost,
          userId
        ]);
        const newPo = poRes.rows[0];

        // 2. Insert PO line items
        const itemSql = `
          INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, unit_cost)
          VALUES ($1, $2, $3, $4);
        `;
        await client.query(itemSql, [
          newPo.id,
          productId,
          shortageQty,
          unitCost
        ]);

        result.action = 'PURCHASE';
        result.document_id = newPo.id;
        result.document_number = newPo.order_number;
        result.vendor_name = vendor.name;
      }

      if (mustManageTransaction) {
        await client.query('COMMIT');
      }

      return result;
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
   * Scenario 3: Check low stock reorder thresholds for raw materials.
   * Returns a list of active procurement alerts.
   */
  async getProcurementAlerts() {
    return await procurementRepository.findLowStockProducts();
  }

  /**
   * Run automated procurement replenishment.
   * Identifies all low-stock raw materials, groups them by vendor, and creates draft Purchase Orders.
   */
  async runAutoReplenishment(userId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const lowStockItems = await procurementRepository.findLowStockProducts(client);
      if (lowStockItems.length === 0) {
        await client.query('COMMIT');
        return { message: 'Inventory is healthy. No low-stock items detected.', purchaseOrdersCreated: [] };
      }

      // Group items by vendor (based on vendor_products mapping)
      const itemsByVendor = {};

      for (const item of lowStockItems) {
        const vendor = await procurementRepository.findVendorForProduct(item.product_id, client);
        if (!vendor) {
          throw new Error(`Automated replenishment failed: Product '${item.name}' is set to PURCHASE but has no vendor mapping in vendor_products.`);
        }

        const vendorId = vendor.id;
        if (!itemsByVendor[vendorId]) {
          itemsByVendor[vendorId] = {
            vendor: {
              id: vendor.id,
              name: vendor.name,
              email: vendor.email,
              lead_time_days: vendor.lead_time_days
            },
            items: []
          };
        }

        itemsByVendor[vendorId].items.push({
          product_id: item.product_id,
          sku: item.sku,
          name: item.name,
          quantity: parseFloat(item.recommended_restock_qty),
          unit_cost: parseFloat(vendor.vendor_price)
        });
      }

      const createdPOs = [];

      // Generate Purchase Order for each vendor group
      for (const vendorId of Object.keys(itemsByVendor)) {
        const { vendor, items } = itemsByVendor[vendorId];
        
        let totalPoCost = 0.00;
        for (const item of items) {
          totalPoCost += item.quantity * item.unit_cost;
        }

        // Generate serial: AUTO-PO-YYYYMMDD-XXXX
        const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const randSuffix = Math.floor(1000 + Math.random() * 9000);
        const poNumber = `AUTO-PO-${todayStr}-${randSuffix}`;

        // 1. Insert parent Purchase Order
        const poSql = `
          INSERT INTO purchase_orders (order_number, vendor_id, status, total_amount, created_by)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *;
        `;
        const poRes = await client.query(poSql, [
          poNumber,
          vendor.id,
          PO_STATUS.DRAFT,
          totalPoCost,
          userId
        ]);
        const newPo = poRes.rows[0];

        // 2. Insert PO line items
        const itemSql = `
          INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, unit_cost)
          VALUES ($1, $2, $3, $4);
        `;
        for (const item of items) {
          await client.query(itemSql, [
            newPo.id,
            item.product_id,
            item.quantity,
            item.unit_cost
          ]);
        }

        createdPOs.push({
          id: newPo.id,
          order_number: newPo.order_number,
          vendor_name: vendor.name,
          total_amount: newPo.total_amount,
          items: items
        });
      }

      await client.query('COMMIT');

      return {
        message: `Successfully generated auto-replenishment draft Purchase Orders for ${lowStockItems.length} low-stock items across ${createdPOs.length} vendors.`,
        purchaseOrdersCreated: createdPOs
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = new ProcurementEngine();
