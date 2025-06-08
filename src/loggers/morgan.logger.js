import morgan from 'morgan';
import logger from './winston.logger.js';

// Create a custom token format for the log
const format =
  ':remote-addr :method :url :status :res[content-length] - :response-time ms';

// Create Morgan middleware using Winston for logging
const morganLogger = morgan(format, {
  stream: logger.stream,
});

export default morganLogger;
