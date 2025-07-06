import dotenv from 'dotenv';

dotenv.config();

const _config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 3000,
  DB_URL: process.env.DB_URL || 'mongodb://localhost:27017/mydatabase',
  JWT_SECRET: process.env.JWT_SECRET,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_REFRESH_TOKEN: process.env.GOOGLE_REFRESH_TOKEN,
  GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL,
  GMAIL_USER: process.env.GMAIL_USER,
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || '',
    username: process.env.REDIS_USERNAME || '',
    db: process.env.REDIS_DB || 0,
  },
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
  },
};

let finalConfig;
if (process.env.NODE_ENV === 'testing') {
  finalConfig = _config; // Don't freeze in testing mode
} else {
  finalConfig = Object.freeze(_config);
}

export default finalConfig;
