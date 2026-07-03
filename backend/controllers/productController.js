const productService = require('../services/productService');
const productValidation = require('../validations/productValidation');
const { sendSuccess, sendError } = require('../utils/response');

class ProductController {
  getProductById = async (req, res, next) => {
    try {
      const id = Number(req.params.id);

      if (!Number.isInteger(id) || id <= 0) {
        return sendError(res, 'Invalid product ID.', 400);
      }

      const product = await productService.getProductById(id);

      return sendSuccess(
        res,
        'Product retrieved successfully.',
        product
      );
    } catch (error) {
      next(error);
    }
  };

  getAllProducts = async (req, res, next) => {
    try {
      const products = await productService.getAllProducts(req.query);

      return sendSuccess(
        res,
        'Products retrieved successfully.',
        products
      );
    } catch (error) {
      next(error);
    }
  };

  createProduct = async (req, res, next) => {
    try {
      const { isValid, errors } =
        productValidation.validateCreate(req.body);

      if (!isValid) {
        return sendError(
          res,
          'Validation failed.',
          400,
          errors
        );
      }

      const product = await productService.createProduct(
        req.body,
        req.user
      );

      return sendSuccess(
        res,
        'Product created successfully.',
        product,
        201
      );
    } catch (error) {
      next(error);
    }
  };

  updateProduct = async (req, res, next) => {
    try {
      const id = Number(req.params.id);

      if (!Number.isInteger(id) || id <= 0) {
        return sendError(res, 'Invalid product ID.', 400);
      }

      const { isValid, errors } =
        productValidation.validateUpdate(req.body);

      if (!isValid) {
        return sendError(
          res,
          'Validation failed.',
          400,
          errors
        );
      }

      const product = await productService.updateProduct(
        id,
        req.body,
        req.user
      );

      return sendSuccess(
        res,
        'Product updated successfully.',
        product
      );
    } catch (error) {
      next(error);
    }
  };

  deleteProduct = async (req, res, next) => {
    try {
      const id = Number(req.params.id);

      if (!Number.isInteger(id) || id <= 0) {
        return sendError(res, 'Invalid product ID.', 400);
      }

      await productService.deleteProduct(
        id,
        req.user
      );

      return sendSuccess(
        res,
        'Product deleted successfully.'
      );
    } catch (error) {
      next(error);
    }
  };

  getProductByBarcode = async (req, res, next) => {
    try {
      const barcode = req.params.barcode?.trim();

      if (!barcode) {
        return sendError(
          res,
          'Invalid barcode.',
          400
        );
      }

      const product =
        await productService.getProductByBarcode(barcode);

      return sendSuccess(
        res,
        'Product retrieved successfully.',
        product
      );
    } catch (error) {
      next(error);
    }
  };

  getProductTemplates = async (req, res, next) => {
    try {
      const templates =
        await productService.getProductTemplates();

      return sendSuccess(
        res,
        'Product templates retrieved successfully.',
        templates
      );
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new ProductController();