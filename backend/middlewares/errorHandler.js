const { sendError } = require('../utils/response');

/**
 * Global Error Handler
 * Handles application, PostgreSQL, JWT, Multer,
 * JSON parsing and unexpected server errors.
 */
const errorHandler = (err, req, res, next) => {
  // =====================================================
  // Logging
  // =====================================================
  if (process.env.NODE_ENV === 'development') {
    console.error('\n========== ERROR ==========');
    console.error(err);
    console.error('===========================\n');
  } else {
    console.error({
      message: err.message,
      code: err.code,
      path: req.originalUrl,
      method: req.method,
      timestamp: new Date().toISOString(),
    });
  }

  let statusCode = err.statusCode || 500;
  let message = 'Internal Server Error';
  let errors = null;

  // =====================================================
  // Custom Application Errors
  // =====================================================
  if (err.message && statusCode !== 500) {
    message = err.message;
  }

  // =====================================================
  // PostgreSQL Errors
  // =====================================================
  switch (err.code) {
    case '23505':
      statusCode = 409;
      message = 'Duplicate record already exists.';
      errors = {
        detail: err.detail,
      };
      break;

    case '23503':
      statusCode = 400;
      message = 'Referenced record does not exist.';
      errors = {
        detail: err.detail,
      };
      break;

    case '23514':
      statusCode = 400;
      message = 'Data violates database validation rules.';
      errors = {
        detail: err.detail,
      };
      break;

    case '22P02':
      statusCode = 400;
      message = 'Invalid input format.';
      break;

    case '40001':
      statusCode = 409;
      message = 'Database transaction conflict. Please retry.';
      break;

    case '40P01':
      statusCode = 409;
      message = 'Database deadlock detected. Please retry.';
      break;
  }

  // =====================================================
  // JWT Errors
  // =====================================================
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token.';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired.';
  }

  // =====================================================
  // Multer Errors
  // =====================================================
  if (err.name === 'MulterError') {
    statusCode = 400;

    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'Uploaded file is too large.';
        break;

      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected uploaded file.';
        break;

      default:
        message = err.message;
    }
  }

  // =====================================================
  // Invalid JSON
  // =====================================================
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    message = 'Malformed JSON request body.';
  }

  // =====================================================
  // Validation Errors (Joi/Zod/Class Validator)
  // =====================================================
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed.';
    errors = err.details || err.errors || null;
  }

  // =====================================================
  // Final Response
  // =====================================================
  return sendError(
    res,
    message,
    statusCode,
    process.env.NODE_ENV === 'development' ? errors : null
  );
};

module.exports = errorHandler;