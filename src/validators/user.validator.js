import { body, query } from 'express-validator';

export const updateUserValidator = [
  body('username')
    .optional()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .trim()
    .escape(),
  body('name')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .trim(),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('avatar')
    .optional()
    .isURL()
    .withMessage('Avatar must be a valid URL')
    .trim(),
  // Password field removed as it cannot be updated through this route
  // Use dedicated password reset functionality instead
];

export const getAllUsersValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer starting from 1.'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50.'),
];
