import AppError from '../utils/appError.js';
import logger from '../loggers/winston.logger.js';
import config from '../config/config.js';

/**
 * Global error handling middleware
 * Handles errors passed from controllers or thrown in the application
 */
const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  let error = { ...err };
  error.message = err.message;

  // Set default values if not available
  error.statusCode = error.statusCode || 500;
  error.status = error.status || 'error';

  // Choose appropriate log level based on error type
  if (error.statusCode >= 500) {
    // 5xx errors are server errors and should be logged as errors
    logger.error('SERVER ERROR 💥', err);
  } else if (error.statusCode >= 400 && error.statusCode < 500) {
    // 4xx errors are client errors
    if (err.isOperational) {
      // Expected operational errors (like validation errors) use info level
      logger.info('CLIENT ERROR (Operational) 🔍', err);
    } else {
      // Unexpected client errors use warn level
      logger.warn('CLIENT ERROR 🚨', err);
    }
  } else {
    // Fallback for any other cases
    logger.error('UNHANDLED ERROR 💥', err);
  }

  // Handle specific error types
  if (err.name === 'ValidationError') {
    error = new AppError(err.message, 400);
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error = new AppError(
      `Duplicate field value: ${field}. Please use another value.`,
      400
    );
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    error = new AppError(`Invalid ${err.path}: ${err.value}.`, 400);
  }

  // Send error response
  res.status(error.statusCode).json({
    status: error.status,
    message: error.message,
    stack: config.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

export default errorHandler;
