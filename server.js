import app from './src/app.js';
import config from './src/config/config.js';
import logger from './src/loggers/winston.logger.js';
import connectToDatabase from './src/config/db.js';
import redisService from './src/config/redis.js';

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error(`Uncaught Exception: ${error.message}`, { stack: error.stack });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
  process.exit(1);
});

// Connect to database
connectToDatabase();

// Connect to Redis explicitly - this ensures a single connection
redisService.connect().then((connected) => {
  if (connected) {
    logger.info('Redis client successfully connected');
  } else {
    logger.warn('Failed to connect to Redis - check your configuration');
  }
});

// Start the server
const server = app.listen(config.PORT, () => {
  logger.info(`Server is running on port ${config.PORT}`);
  logger.debug(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
const gracefulShutdown = async () => {
  logger.info('Starting graceful shutdown...');

  // Close the server
  server.close(async () => {
    logger.info('HTTP server closed');

    // Disconnect from Redis
    await redisService.disconnect();

    logger.info('Graceful shutdown completed');
    process.exit(0);
  });

  // Force shutdown after timeout
  setTimeout(() => {
    logger.error('Forcing shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Listen for termination signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
