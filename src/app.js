import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import morganLogger from './loggers/morgan.logger.js';
import './config/passport.js'; // Ensure passport strategies are loaded
import errorHandler from './middlewares/errorHandler.js';
import config from './config/config.js';
import { generalRateLimiter } from './middlewares/rateLimiter.middleware.js';

const app = express();

// Middleware
app.use(cors());
app.use(morganLogger);
app.use(helmet());
app.use(
  express.json({
    limit: '100kb', // Limit JSON body size to 100KB
  })
);
app.use(express.urlencoded({ extended: true, limit: '100kb' })); // Limit URL-encoded body size to 100KB
app.use(cookieParser());

// Rate limiting
app.use(generalRateLimiter);
app.use(passport.initialize());

// Routes
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import productRoutes from './routes/product.routes.js';
import cartRoutes from './routes/cart.routes.js';
import paymentRoutes from './routes/payment.routes.js';

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/store/products', productRoutes);
app.use('/api/v1/store/cart', cartRoutes);
app.use('/api/v1/payments', paymentRoutes);

// // Simple route for checking server status
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Welcome to the TestDog API',
    environment: config.NODE_ENV,
    documentation: 'docs.testdog.in',
  });
});

// // 404 route handler for undefined routes
app.all('*name', (req, res, next) => {
  const err = new Error(`Can't find ${req.originalUrl} on this server!`);
  err.statusCode = 404;
  err.status = 'fail';
  next(err);
});

app.use(errorHandler);

export default app;
