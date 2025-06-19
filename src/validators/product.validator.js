import { body } from 'express-validator';

export const createProductValidator = [
  body('product_name')
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Product name must be between 3 and 100 characters')
    .trim(),

  body('description')
    .notEmpty()
    .withMessage('Product description is required')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters')
    .trim(),

  body('initial_price')
    .notEmpty()
    .withMessage('Initial price is required')
    .isFloat({ min: 0 })
    .withMessage('Initial price must be a positive number')
    .toFloat(),

  body('final_price')
    .notEmpty()
    .withMessage('Final price is required')
    .isFloat({ min: 0 })
    .withMessage('Final price must be a positive number')
    .toFloat()
    .custom((value, { req }) => {
      if (value > req.body.initial_price) {
        throw new Error('Final price cannot be greater than initial price');
      }
      return true;
    }),

  body('currency')
    .notEmpty()
    .withMessage('Currency is required')
    .isIn(['USD', 'INR', 'EUR', 'GBP'])
    .withMessage('Currency must be one of: USD, INR, EUR, GBP'),

  body('in_stock')
    .optional()
    .isBoolean()
    .withMessage('In stock must be a boolean value')
    .toBoolean(),

  body('color')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Color must not exceed 50 characters')
    .trim(),

  body('size')
    .optional()
    .isLength({ max: 20 })
    .withMessage('Size must not exceed 20 characters')
    .trim(),

  body('main_image')
    .notEmpty()
    .withMessage('Main image URL is required')
    .isURL()
    .withMessage('Main image must be a valid URL'),

  body('category_tree')
    .optional()
    .isArray()
    .withMessage('Category tree must be an array')
    .custom((value) => {
      if (value && value.length > 10) {
        throw new Error('Category tree cannot have more than 10 levels');
      }
      return true;
    }),

  body('category_tree.*')
    .optional()
    .isString()
    .withMessage('Each category in tree must be a string')
    .isLength({ min: 1, max: 50 })
    .withMessage('Each category must be between 1 and 50 characters')
    .trim(),

  body('image_count')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Image count must be between 1 and 20')
    .toInt(),

  body('image_urls')
    .optional()
    .isArray()
    .withMessage('Image URLs must be an array')
    .custom((value) => {
      if (value && value.length > 20) {
        throw new Error('Cannot have more than 20 image URLs');
      }
      return true;
    }),

  body('image_urls.*')
    .optional()
    .isURL()
    .withMessage('Each image URL must be valid'),

  body('other_attributes')
    .optional()
    .isArray()
    .withMessage('Other attributes must be an array')
    .custom((value) => {
      if (value && value.length > 50) {
        throw new Error('Cannot have more than 50 other attributes');
      }
      return true;
    }),

  body('other_attributes.*.name')
    .optional()
    .isString()
    .withMessage('Attribute name must be a string')
    .isLength({ min: 1, max: 100 })
    .withMessage('Attribute name must be between 1 and 100 characters')
    .trim(),

  body('other_attributes.*.value')
    .optional()
    .isString()
    .withMessage('Attribute value must be a string')
    .isLength({ min: 1, max: 200 })
    .withMessage('Attribute value must be between 1 and 200 characters')
    .trim(),

  body('root_category')
    .optional()
    .isString()
    .withMessage('Root category must be a string')
    .isLength({ min: 1, max: 100 })
    .withMessage('Root category must be between 1 and 100 characters')
    .trim(),

  body('category')
    .optional()
    .isString()
    .withMessage('Category must be a string')
    .isLength({ min: 1, max: 100 })
    .withMessage('Category must be between 1 and 100 characters')
    .trim(),

  body('all_available_sizes')
    .optional()
    .isArray()
    .withMessage('Available sizes must be an array'),

  body('all_available_sizes.*')
    .optional()
    .isString()
    .withMessage('Each size must be a string')
    .isLength({ min: 1, max: 20 })
    .withMessage('Each size must be between 1 and 20 characters')
    .trim(),
];
