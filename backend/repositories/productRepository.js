const { pool, query } = require('../config/db');

/**
 * Product Repository.
 * Handles database operations for products (variants) and base product templates.
 */
class ProductRepository {
  async findById(id) {
    const text = `
      SELECT p.*, 
             pt.name AS template_name, 
             pt.description AS template_description,
             pt.category AS template_category,
             pt.uom AS template_uom
      FROM products p
      LEFT JOIN product_templates pt ON p.parent_template_id = pt.id
      WHERE p.id = $1
    `;
    const res = await query(text, [id]);
    return res.rows[0] || null;
  }

  async findBySku(sku) {
    const text = `
      SELECT p.*, 
             pt.name AS template_name, 
             pt.description AS template_description
      FROM products p
      LEFT JOIN product_templates pt ON p.parent_template_id = pt.id
      WHERE p.sku = $1
    `;
    const res = await query(text, [sku]);
    return res.rows[0] || null;
  }

  async findByBarcode(barcode) {
    const text = `
      SELECT p.*, 
             pt.name AS template_name, 
             pt.description AS template_description
      FROM products p
      LEFT JOIN product_templates pt ON p.parent_template_id = pt.id
      WHERE p.barcode = $1
    `;
    const res = await query(text, [barcode]);
    return res.rows[0] || null;
  }

  async findOrCreateTemplate(name, description, type, category, uom, client = null) {
    const db = client || pool;
    const selectSql = 'SELECT * FROM product_templates WHERE name = $1 AND type = $2';
    const selRes = await db.query(selectSql, [name, type]);
    if (selRes.rows.length > 0) return selRes.rows[0];

    const insertSql = `
      INSERT INTO product_templates (name, description, type, category, uom)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const insRes = await db.query(insertSql, [name, description || null, type, category || null, uom]);
    return insRes.rows[0];
  }

  async findAll({ search, type, procurement_type, parent_template_id, limit = 50, offset = 0 }) {
    let baseQuery = `
      SELECT p.*, 
             pt.name AS template_name, 
             pt.category AS template_category
      FROM products p
      LEFT JOIN product_templates pt ON p.parent_template_id = pt.id
    `;
    let countQuery = `
      SELECT COUNT(*) 
      FROM products p
      LEFT JOIN product_templates pt ON p.parent_template_id = pt.id
    `;
    const conditions = [];
    const values = [];
    let paramIndex = 1;

    if (search) {
      conditions.push(`(p.sku ILIKE $${paramIndex} OR p.name ILIKE $${paramIndex} OR p.category ILIKE $${paramIndex} OR p.barcode ILIKE $${paramIndex})`);
      values.push(`%${search}%`);
      paramIndex++;
    }

    if (type) {
      conditions.push(`p.type = $${paramIndex}`);
      values.push(type);
      paramIndex++;
    }

    if (procurement_type) {
      conditions.push(`p.procurement_type = $${paramIndex}`);
      values.push(procurement_type);
      paramIndex++;
    }

    if (parent_template_id) {
      conditions.push(`p.parent_template_id = $${paramIndex}`);
      values.push(parent_template_id);
      paramIndex++;
    }

    if (conditions.length > 0) {
      const whereClause = ' WHERE ' + conditions.join(' AND ');
      baseQuery += whereClause;
      countQuery += whereClause;
    }

    baseQuery += ` ORDER BY p.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    
    const countRes = await query(countQuery, values);
    const total = parseInt(countRes.rows[0].count, 10);

    const productValues = [...values, limit, offset];
    const dataRes = await query(baseQuery, productValues);

    return {
      products: dataRes.rows,
      total
    };
  }

  async create(productData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Resolve parent template
      let templateId = productData.parent_template_id;
      if (!templateId) {
        const template = await this.findOrCreateTemplate(
          productData.name,
          productData.description,
          productData.type,
          productData.category,
          productData.uom,
          client
        );
        templateId = template.id;
      }

      const productSql = `
        INSERT INTO products (
          sku, name, description, type, procurement_type, replenishment_strategy,
          category, uom, unit_cost, unit_price, reorder_point, image_url,
          parent_template_id, barcode, variant_attributes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *;
      `;

      const barcodeVal = productData.barcode || productData.sku;
      const attributesVal = productData.variant_attributes ? 
        (typeof productData.variant_attributes === 'string' ? productData.variant_attributes : JSON.stringify(productData.variant_attributes)) 
        : '{}';

      const productParams = [
        productData.sku,
        productData.name,
        productData.description || null,
        productData.type,
        productData.procurement_type,
        productData.replenishment_strategy,
        productData.category || null,
        productData.uom,
        productData.unit_cost || 0.00,
        productData.unit_price || 0.00,
        productData.reorder_point || 0.00,
        productData.image_url || null,
        templateId,
        barcodeVal,
        attributesVal
      ];

      const productRes = await client.query(productSql, productParams);
      const newProduct = productRes.rows[0];

      // Initialize default inventory configuration context in the same transaction block
      // Link to default Main Warehouse (WH-MAIN)
      const inventorySql = `
        INSERT INTO inventory (product_id, warehouse_id, qty_on_hand, qty_reserved, qty_incoming, reorder_point)
        VALUES ($1, (SELECT id FROM warehouses WHERE code = 'WH-MAIN' LIMIT 1), 0.00, 0.00, 0.00, $2);
      `;
      await client.query(inventorySql, [newProduct.id, productData.reorder_point || 0.00]);

      await client.query('COMMIT');
      return newProduct;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async update(id, productData) {
    const sql = `
      UPDATE products
      SET name = $1, description = $2, category = $3, uom = $4,
          unit_cost = $5, unit_price = $6, reorder_point = $7,
          image_url = $8, procurement_type = $9, replenishment_strategy = $10,
          parent_template_id = $11, barcode = $12, variant_attributes = $13,
          updated_at = now()
      WHERE id = $14
      RETURNING *;
    `;
    const barcodeVal = productData.barcode || productData.sku;
    const attributesVal = productData.variant_attributes ? 
      (typeof productData.variant_attributes === 'string' ? productData.variant_attributes : JSON.stringify(productData.variant_attributes)) 
      : '{}';

    const params = [
      productData.name,
      productData.description || null,
      productData.category || null,
      productData.uom,
      productData.unit_cost || 0.00,
      productData.unit_price || 0.00,
      productData.reorder_point || 0.00,
      productData.image_url || null,
      productData.procurement_type,
      productData.replenishment_strategy,
      productData.parent_template_id || null,
      barcodeVal,
      attributesVal,
      id
    ];
    const res = await query(sql, params);
    return res.rows[0] || null;
  }

  async delete(id) {
    const sql = 'DELETE FROM products WHERE id = $1 RETURNING id';
    const res = await query(sql, [id]);
    return res.rowCount > 0;
  }

  async findAllTemplates() {
    const res = await query('SELECT * FROM product_templates ORDER BY name ASC;');
    return res.rows;
  }
}

module.exports = new ProductRepository();
