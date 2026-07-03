const { pool } = require('../config/db');
const bomRepository = require('../repositories/bomRepository');

/**
 * Bill of Materials (BoM) Service.
 * Implements business logical controls and total material cost calculations.
 */
class BomService {
  /**
   * Helper to compute total material cost for a BoM.
   */
  _calculateTotalCost(items) {
    let total = 0.00;
    for (const item of items) {
      const qty = parseFloat(item.quantity_required);
      const cost = parseFloat(item.unit_cost || 0.00);
      total += qty * cost;
    }
    return Math.round(total * 100) / 100;
  }

  /**
   * Fetch BoM details by ID.
   */
  async getBomById(id) {
    const bom = await bomRepository.findById(id);
    if (!bom) {
      const error = new Error(`BoM recipe with ID '${id}' not found.`);
      error.statusCode = 404;
      throw error;
    }
    
    bom.total_material_cost = this._calculateTotalCost(bom.items);
    return bom;
  }

  /**
   * Fetch BoM details by Finished Good ID.
   */
  async getBomByFinishedGoodId(finishedGoodId) {
    const bom = await bomRepository.findByFinishedGoodId(finishedGoodId);
    if (!bom) {
      const error = new Error(`No BoM recipe registered for finished good product ID '${finishedGoodId}'.`);
      error.statusCode = 404;
      throw error;
    }

    bom.total_material_cost = this._calculateTotalCost(bom.items);
    return bom;
  }

  /**
   * Fetch paginated list of all recipes.
   */
  async getAllBoms(queryParams) {
    const { search, page = 1, limit = 50 } = queryParams;
    const parsedPage = Math.max(1, parseInt(page, 10));
    const parsedLimit = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const offset = (parsedPage - 1) * parsedLimit;

    const { boms, total } = await bomRepository.findAll({
      search,
      limit: parsedLimit,
      offset
    });

    return {
      boms,
      pagination: {
        totalItems: total,
        itemsPerPage: parsedLimit,
        currentPage: parsedPage,
        totalPages: Math.ceil(total / parsedLimit)
      }
    };
  }

  /**
   * Create a new Bill of Materials recipe.
   */
  async createBom(bomData) {
    const { finished_good_id, name, version, labor_cost, overhead_cost, items } = bomData;

    const existing = await bomRepository.findByFinishedGoodId(finished_good_id);
    if (existing) {
      const error = new Error(`BoM creation conflict: A BoM recipe already exists for finished good product ID '${finished_good_id}'.`);
      error.statusCode = 409;
      throw error;
    }

    const prodRes = await pool.query('SELECT type FROM products WHERE id = $1', [finished_good_id]);
    if (prodRes.rows.length === 0) {
      const error = new Error('The target finished good product profile does not exist.');
      error.statusCode = 400;
      throw error;
    }
    if (prodRes.rows[0].type !== 'FINISHED_GOOD') {
      const error = new Error('Cannot create BoM: The target product type is not FINISHED_GOOD.');
      error.statusCode = 400;
      throw error;
    }

    const rawMaterialIds = new Set();
    const validatedItems = [];

    for (const item of items) {
      const rawId = item.raw_material_id;

      if (rawMaterialIds.has(rawId)) {
        const error = new Error(`BoM validation conflict: Component ID '${rawId}' is duplicated in the items list.`);
        error.statusCode = 400;
        throw error;
      }
      rawMaterialIds.add(rawId);

      const componentRes = await pool.query('SELECT type FROM products WHERE id = $1', [rawId]);
      if (componentRes.rows.length === 0) {
        const error = new Error(`Raw material component ID '${rawId}' does not exist in catalog.`);
        error.statusCode = 400;
        throw error;
      }
      if (componentRes.rows[0].type !== 'RAW_MATERIAL') {
        const error = new Error(`Raw material component ID '${rawId}' is not categorised as RAW_MATERIAL.`);
        error.statusCode = 400;
        throw error;
      }

      validatedItems.push({
        raw_material_id: rawId,
        quantity_required: parseFloat(item.quantity_required)
      });
    }

    const payload = {
      finished_good_id,
      name: name.trim(),
      version: version ? version.trim() : '1.0',
      labor_cost: parseFloat(labor_cost || 0.00),
      overhead_cost: parseFloat(overhead_cost || 0.00)
    };

    const newBom = await bomRepository.create(payload, validatedItems);
    return await this.getBomById(newBom.id);
  }

  /**
   * Update BoM components.
   */
  async updateBom(id, bomData) {
    const { name, version, labor_cost, overhead_cost, items } = bomData;

    const bom = await bomRepository.findById(id);
    if (!bom) {
      const error = new Error(`Update failed: BoM recipe with ID '${id}' not found.`);
      error.statusCode = 404;
      throw error;
    }

    const rawMaterialIds = new Set();
    const validatedItems = [];

    for (const item of items) {
      const rawId = item.raw_material_id;

      if (rawMaterialIds.has(rawId)) {
        const error = new Error(`BoM validation conflict: Component ID '${rawId}' is duplicated in the items list.`);
        error.statusCode = 400;
        throw error;
      }
      rawMaterialIds.add(rawId);

      const componentRes = await pool.query('SELECT type FROM products WHERE id = $1', [rawId]);
      if (componentRes.rows.length === 0) {
        const error = new Error(`Raw material component ID '${rawId}' does not exist in catalog.`);
        error.statusCode = 400;
        throw error;
      }
      if (componentRes.rows[0].type !== 'RAW_MATERIAL') {
        const error = new Error(`Raw material component ID '${rawId}' is not categorised as RAW_MATERIAL.`);
        error.statusCode = 400;
        throw error;
      }

      validatedItems.push({
        raw_material_id: rawId,
        quantity_required: parseFloat(item.quantity_required)
      });
    }

    const payload = {
      name: name.trim(),
      version: version.trim(),
      labor_cost: parseFloat(labor_cost || 0.00),
      overhead_cost: parseFloat(overhead_cost || 0.00)
    };

    await bomRepository.update(id, payload, validatedItems);
    return await this.getBomById(id);
  }

  /**
   * Delete BoM.
   */
  async deleteBom(id) {
    const bom = await bomRepository.findById(id);
    if (!bom) {
      const error = new Error(`Delete failed: BoM recipe with ID '${id}' not found.`);
      error.statusCode = 404;
      throw error;
    }

    return await bomRepository.delete(id);
  }

  /**
   * Calculate dynamic cost analysis for a manufactured finished good.
   */
  async getManufacturingCostAnalysis(finishedGoodId) {
    // Assert finished good product exists and is finished good
    const prodRes = await pool.query('SELECT name, sku, unit_price, unit_cost FROM products WHERE id = $1', [finishedGoodId]);
    if (prodRes.rows.length === 0) {
      const error = new Error('Product not found.');
      error.statusCode = 404;
      throw error;
    }
    const product = prodRes.rows[0];

    const bom = await bomRepository.findByFinishedGoodId(finishedGoodId);
    
    const materialCost = bom ? this._calculateTotalCost(bom.items) : 0.00;
    const laborCost = bom ? parseFloat(bom.labor_cost) : 0.00;
    const overheadCost = bom ? parseFloat(bom.overhead_cost) : 0.00;
    const productionCost = materialCost + laborCost + overheadCost;
    const sellingPrice = parseFloat(product.unit_price);
    const profit = sellingPrice - productionCost;
    const profitMargin = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;

    return {
      product_id: finishedGoodId,
      name: product.name,
      sku: product.sku,
      has_bom: !!bom,
      bom_id: bom ? bom.id : null,
      bom_name: bom ? bom.name : null,
      materials: bom ? bom.items.map(item => ({
        raw_material_id: item.raw_material_id,
        sku: item.sku,
        name: item.name,
        uom: item.uom,
        qty_required: parseFloat(item.quantity_required),
        unit_cost: parseFloat(item.unit_cost),
        total_cost: Math.round((parseFloat(item.quantity_required) * parseFloat(item.unit_cost)) * 100) / 100
      })) : [],
      material_cost: materialCost,
      labor_cost: laborCost,
      overhead_cost: overheadCost,
      production_cost: productionCost,
      selling_price: sellingPrice,
      profit: Math.round(profit * 100) / 100,
      profit_margin: Math.round(profitMargin * 100) / 100
    };
  }
}

module.exports = new BomService();
