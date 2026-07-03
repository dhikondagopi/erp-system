/**
 * ============================================================
 * API Response Utility
 * Standardizes all API responses across the application.
 * ============================================================
 */

/**
 * Send Success Response
 *
 * @param {object} res - Express Response
 * @param {string} message
 * @param {*} data
 * @param {number} statusCode
 * @param {object|null} meta
 */
const sendSuccess = (
  res,
  message = "Success",
  data = null,
  statusCode = 200,
  meta = null
) => {
  const response = {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  };

  if (meta) {
    response.meta = meta;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send Error Response
 *
 * @param {object} res - Express Response
 * @param {string} message
 * @param {number} statusCode
 * @param {object|array|null} errors
 */
const sendError = (
  res,
  message = "Internal Server Error",
  statusCode = 500,
  errors = null
) => {
  const response = {
    success: false,
    message,
    timestamp: new Date().toISOString(),
  };

  if (errors) {
    response.errors = errors;
  }

  // Show stack trace ONLY during development
  if (
    process.env.NODE_ENV === "development" &&
    errors instanceof Error
  ) {
    response.stack = errors.stack;
  }

  return res.status(statusCode).json(response);
};

module.exports = {
  sendSuccess,
  sendError,
};