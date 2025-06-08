import { validationResult } from 'express-validator';
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';

/**
 * Middleware to validate request data based on validation rules
 * @param {Array} validations - Array of express-validator validation rules
 * @returns {Function} Express middleware
 */
export const validate = (validations) => {
  return async (req, res, next) => {
    // Execute all validations
    await Promise.all(validations.map((validation) => validation.run(req)));

    // Check if there are validation errors
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    // Format validation errors
    const extractedErrors = {};
    errors.array().forEach((err) => {
      // Group errors by field
      if (!extractedErrors[err.path]) {
        extractedErrors[err.path] = err.msg;
      }
    });

    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: extractedErrors,
    });
  };
};

/**
 * Helper function to check for specific validation rules
 * Can be expanded with more custom validators as needed
 */
export const customValidators = {
  isStrongPassword: (value) => {
    // Check for at least one uppercase, one lowercase, one number, and one special character
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=\[\]{}|;:'",.<>\/\\])[A-Za-z\d@$!%*?&#^()_+\-=\[\]{}|;:'",.<>\/\\]{8,}$/;
    return passwordRegex.test(value);
  },

  isValidPhone: (value, { req }) => {
    // Advanced phone number validation using libphonenumber-js
    try {
      // If country code is provided in the request, use it for better validation
      const countryCode = req?.body?.countryCode || req?.query?.countryCode;

      // If we have a country code, we can do more precise validation
      if (countryCode) {
        return isValidPhoneNumber(value, countryCode);
      }

      // Otherwise try to parse it as an international number
      const phoneNumber = parsePhoneNumber(value);
      return phoneNumber && phoneNumber.isValid();
    } catch (error) {
      // If parsing fails, it's not a valid number
      return false;
    }
  },
};
