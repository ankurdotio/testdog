import winston from 'winston';
import config from '../config/config.js';

// Define custom log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define different log level based on environment
const getLevel = () => {
  const env = config.NODE_ENV || 'development';

  switch (env) {
    case 'production':
      return 'info'; // Only logs info and above in production
    case 'testing':
      return 'warn'; // Only logs warn and above in testing
    default:
      return 'debug'; // Logs everything in development
  }
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'blue',
  http: 'white',
  debug: 'white',
};

// Add colors to winston
winston.addColors(colors);

// Define format for console logs with colors
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} [${info.level}]: ${info.message}`
  )
);

// Create the logger with only console transport
const logger = winston.createLogger({
  level: getLevel(),
  levels,
  transports: [
    // Console transport only
    new winston.transports.Console({
      format: consoleFormat,
    }),
  ],
  // Don't exit on uncaught exceptions
  exitOnError: false,
});

// Create a stream object for morgan integration
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

export default logger;
