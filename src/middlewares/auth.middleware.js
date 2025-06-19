import jwt from 'jsonwebtoken';
import { promisify } from 'util';
import AppError from '../utils/appError.js';
import config from '../config/config.js';
import userService from '../services/user.service.js';

/**
 * Middleware to protect routes that require authentication
 * Verifies the JWT token from the request headers or cookies
 */
export const protect = async (req, res, next) => {
  try {
    // 1) Get token from authorization header or cookies
    let token;

    if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    } else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(
        new AppError('You are not logged in. Please log in to get access.', 401)
      );
    }

    // 2) Verify token
    const decoded = await promisify(jwt.verify)(token, config.JWT_SECRET);

    // 3) Check if user still exists
    const currentUser = await userService.getMe(decoded.id, 'role');

    if (!currentUser) {
      return next(
        new AppError('The user belonging to this token no longer exists.', 401)
      );
    }

    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = currentUser;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new AppError('Invalid token. Please log in again.', 401));
    }
    if (error instanceof jwt.TokenExpiredError) {
      return next(
        new AppError('Your token has expired. Please log in again.', 401)
      );
    }
    next(error);
  }
};

/**
 * Middleware to restrict access based on user roles
 * @param  {...string} roles - Roles allowed to access the route
 */
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles is an array: ['admin', 'user']
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }

    next();
  };
};
