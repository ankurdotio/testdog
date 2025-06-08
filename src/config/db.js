import mongoose from 'mongoose';
import config from './config.js';
import logger from '../loggers/winston.logger.js';

function connectToDatabase() {
  const dbURI = config.DB_URL;

  mongoose
    .connect(dbURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      logger.info('Connected to MongoDB');
    })
    .catch((err) => {
      logger.error('Error connecting to MongoDB:', err);
    });
}

export default connectToDatabase;
