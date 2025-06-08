/**
 * Custom AppError class to standardize error handling.
 * Can be thrown anywhere in the code to trigger error middleware.
 */
class AppError extends Error {
  /**
   * Create an operational error instance.
   * @param {string} message - Error message to show to client.
   * @param {number} statusCode - HTTP status code (e.g., 400, 404).
   */
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    // Capture stack trace excluding constructor call
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
