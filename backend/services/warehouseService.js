const { pool, query } = require('../config/db');
const warehouseRepository = require('../repositories/warehouseRepository');
const auditService = require('./auditService');

class WarehouseService {
  async getWarehouseById(id) {
    const wh = await warehouseRepository.findById(id);
    if (!wh) {
      const error = new Error(`Warehouse with ID '${id}' not found.`);
      error.statusCode = 404;
      throw error;
    }
    return wh;
  }

  async getAllWarehouses(queryParams) {
    const { search, page = 1, limit = 50 } = queryParams;
    const parsedPage = Math.max(1, parseInt(page, 10));
    const parsedLimit = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const offset = (parsedPage - 1) * parsedLimit;

    const { warehouses, total } = await warehouseRepository.findAll({
      search: search ? search.trim() : null,
      limit: parsedLimit,
      offset
    });

    return {
      warehouses,
      pagination: {
        totalItems: total,
        itemsPerPage: parsedLimit,
        currentPage: parsedPage,
        totalPages: Math.ceil(total / parsedLimit)
      }
    };
  }

  async createWarehouse(whData, userId) {
    const { name, code, address, is_active } = whData;

    if (!name || name.trim() === '') throw new Error('Warehouse name is required.');
    if (!code || code.trim() === '') throw new Error('Warehouse code is required.');

    // Check duplicate code
    const existing = await warehouseRepository.findByCode(code.trim().toUpperCase());
    if (existing) {
      const error = new Error(`Warehouse with code '${code}' already exists.`);
      error.statusCode = 400;
      throw error;
    }

    const payload = {
      name: name.trim(),
      code: code.trim().toUpperCase(),
      address: address ? address.trim() : null,
      is_active: is_active !== false
    };

    const newWh = await warehouseRepository.create(payload);

    await auditService.log({
      user_id: userId,
      action: 'CREATE_WAREHOUSE',
      entity_type: 'warehouses',
      entity_id: newWh.id,
      new_value: payload,
      ip_address: 'System Service'
    });

    return newWh;
  }

  async updateWarehouse(id, whData, userId) {
    const wh = await this.getWarehouseById(id);
    const { name, code, address, is_active } = whData;

    if (!name || name.trim() === '') throw new Error('Warehouse name is required.');
    if (!code || code.trim() === '') throw new Error('Warehouse code is required.');

    const cleanCode = code.trim().toUpperCase();
    const existing = await warehouseRepository.findByCode(cleanCode);
    if (existing && existing.id !== id) {
      const error = new Error(`Warehouse with code '${code}' already exists.`);
      error.statusCode = 400;
      throw error;
    }

    const payload = {
      name: name.trim(),
      code: cleanCode,
      address: address ? address.trim() : null,
      is_active: is_active !== false
    };

    const updatedWh = await warehouseRepository.update(id, payload);

    await auditService.log({
      user_id: userId,
      action: 'UPDATE_WAREHOUSE',
      entity_type: 'warehouses',
      entity_id: id,
      old_value: wh,
      new_value: payload,
      ip_address: 'System Service'
    });

    return updatedWh;
  }

  async disableWarehouse(id, userId) {
    const wh = await this.getWarehouseById(id);
    const updatedWh = await warehouseRepository.setStatus(id, false);

    await auditService.log({
      user_id: userId,
      action: 'DISABLE_WAREHOUSE',
      entity_type: 'warehouses',
      entity_id: id,
      old_value: wh,
      new_value: { ...wh, is_active: false },
      ip_address: 'System Service'
    });

    return updatedWh;
  }

  async enableWarehouse(id, userId) {
    const wh = await this.getWarehouseById(id);
    const updatedWh = await warehouseRepository.setStatus(id, true);

    await auditService.log({
      user_id: userId,
      action: 'ENABLE_WAREHOUSE',
      entity_type: 'warehouses',
      entity_id: id,
      old_value: wh,
      new_value: { ...wh, is_active: true },
      ip_address: 'System Service'
    });

    return updatedWh;
  }

  async getWarehouseStockSummary(warehouseId) {
    // Assert warehouse exists
    await this.getWarehouseById(warehouseId);

    const sql = `
      SELECT i.product_id, p.sku, p.name, p.category, p.uom,
             i.qty_on_hand, i.qty_reserved, i.qty_incoming, i.reorder_point,
             (i.qty_on_hand - i.qty_reserved) AS qty_available,
             (i.qty_on_hand * p.unit_cost) AS stock_value
      FROM inventory i
      INNER JOIN products p ON i.product_id = p.id
      WHERE i.warehouse_id = $1
      ORDER BY p.name ASC;
    `;
    const res = await query(sql, [warehouseId]);
    return res.rows;
  }

  async getWarehouseDashboardStats() {
    const sql = `
      SELECT w.id, w.name, w.code, w.is_active,
             COALESCE(SUM(i.qty_on_hand), 0) AS total_items,
             COALESCE(SUM(i.qty_on_hand * p.unit_cost), 0) AS total_valuation,
             COUNT(DISTINCT i.product_id) AS unique_products
      FROM warehouses w
      LEFT JOIN inventory i ON w.id = i.warehouse_id
      LEFT JOIN products p ON i.product_id = p.id
      GROUP BY w.id, w.name, w.code, w.is_active
      ORDER BY w.name ASC;
    `;
    const res = await query(sql);
    return res.rows;
  }
}

module.exports = new WarehouseService();
