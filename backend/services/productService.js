const productRepository = require('../repositories/productRepository');
const auditService = require('./auditService');
const { pool } = require('../config/db');
const {
  PAGINATION,
  PRODUCT_TYPES,
  PROCUREMENT_TYPES,
  AUDIT_ACTIONS,
} = require('../config/constants');

/**
 * ==========================================================
 * Product Service
 * Implements business rules for Product Management.
 * ==========================================================
 */
class ProductService {
  /**
   * Format and sanitize product data.
   */
  formatProductData(productData) {
    return {
      ...productData,
      sku: productData.sku?.trim(),
      name: productData.name?.trim(),
      category: productData.category?.trim() || null,
      uom: productData.uom?.trim(),
      barcode: productData.barcode?.trim() || null,
      variant_attributes: productData.variant_attributes || {},
    };
  }

  /**
   * Get Product by ID
   */
  async getProductById(id) {
    const product = await productRepository.findById(id);

    if (!product) {
      const error = new Error('Product not found.');
      error.statusCode = 404;
      throw error;
    }

    return product;
  }

  /**
   * Get Product by Barcode
   */
  async getProductByBarcode(barcode) {
    const product = await productRepository.findByBarcode(barcode.trim());

    if (!product) {
      const error = new Error('Product not found.');
      error.statusCode = 404;
      throw error;
    }

    return product;
  }

  /**
   * Get Products
   */
  async getAllProducts(queryParams = {}) {
    let {
      search,
      type,
      procurement_type,
      parent_template_id,
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

    if (
      type &&
      !Object.values(PRODUCT_TYPES).includes(type.toUpperCase())
    ) {
      const error = new Error('Invalid product type.');
      error.statusCode = 400;
      throw error;
    }

    if (
      procurement_type &&
      !Object.values(PROCUREMENT_TYPES).includes(
        procurement_type.toUpperCase()
      )
    ) {
      const error = new Error('Invalid procurement type.');
      error.statusCode = 400;
      throw error;
    }

    const offset = (page - 1) * limit;

    const result = await productRepository.findAll({
      search: search?.trim() || null,
      type: type?.toUpperCase() || null,
      procurement_type: procurement_type?.toUpperCase() || null,
      parent_template_id: parent_template_id || null,
      limit,
      offset,
    });

    return {
      products: result.products || [],
      pagination: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems: result.total || 0,
        totalPages: Math.ceil((result.total || 0) / limit),
      },
    };
  }

  /**
   * Product Templates
   */
  async getProductTemplates() {
    return productRepository.findAllTemplates();
  }

  /**
   * Create Product
   */
  async createProduct(productData, user = null) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const data = this.formatProductData(productData);

      const existingSku = await productRepository.findBySku(
        data.sku,
        client
      );

      if (existingSku) {
        const error = new Error('SKU already exists.');
        error.statusCode = 409;
        throw error;
      }

      if (data.barcode) {
        const existingBarcode =
          await productRepository.findByBarcode(
            data.barcode,
            client
          );

        if (existingBarcode) {
          const error = new Error('Barcode already exists.');
          error.statusCode = 409;
          throw error;
        }
      }

      const product = await productRepository.create(
        data,
        client
      );

      await auditService.log(
        {
          user_id: user?.id,
          action: AUDIT_ACTIONS.CREATE,
          entity_type: 'Product',
          entity_id: product.id,
          new_value: product,
        },
        client
      );

      await client.query('COMMIT');

      return product;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Update Product
   */
  async updateProduct(id, productData, user = null) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const oldProduct = await productRepository.findById(
        id,
        client
      );

      if (!oldProduct) {
        const error = new Error('Product not found.');
        error.statusCode = 404;
        throw error;
      }

      const data = this.formatProductData(productData);

      if (
        data.barcode &&
        data.barcode !== oldProduct.barcode
      ) {
        const existing =
          await productRepository.findByBarcode(
            data.barcode,
            client
          );

        if (existing && existing.id !== id) {
          const error = new Error('Barcode already exists.');
          error.statusCode = 409;
          throw error;
        }
      }

      const updated = await productRepository.update(
        id,
        data,
        client
      );

      await auditService.log(
        {
          user_id: user?.id,
          action: AUDIT_ACTIONS.UPDATE,
          entity_type: 'Product',
          entity_id: id,
          old_value: oldProduct,
          new_value: updated,
        },
        client
      );

      await client.query('COMMIT');

      return updated;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Delete Product
   */
  async deleteProduct(id, user = null) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const product = await productRepository.findById(
        id,
        client
      );

      if (!product) {
        const error = new Error('Product not found.');
        error.statusCode = 404;
        throw error;
      }

      await productRepository.delete(id, client);

      await auditService.log(
        {
          user_id: user?.id,
          action: AUDIT_ACTIONS.DELETE,
          entity_type: 'Product',
          entity_id: id,
          old_value: product,
        },
        client
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = new ProductService();