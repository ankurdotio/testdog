# Validation System Documentation

## Overview

This project uses `express-validator` for input validation at the routes level. The validation system ensures that all data coming into the API meets the expected format and constraints before being processed by controllers.

## Structure

- `src/validators/` - Contains validation schemas for different domains (auth, user, etc.)
- `src/middlewares/validator.middleware.js` - Contains the validation middleware and custom validators

## How to Use

### Basic Route Validation

```javascript
import { validate } from '../middlewares/validator.middleware.js';
import { loginValidator } from '../validators/auth.validator.js';

router.route('/login').post(validate(loginValidator), authController.login);
```

### Custom Validators

You can create custom validation rules in `validator.middleware.js` and use them in your validators:

```javascript
// In validator.middleware.js
export const customValidators = {
  isStrongPassword: (value) => {
    // Custom validation logic
    return passwordRegex.test(value);
  },
};

// In your validator file
body('password').custom((value) => {
  if (!customValidators.isStrongPassword(value)) {
    throw new Error('Password is not strong enough');
  }
  return true;
});
```

### Validation Error Handling

The validation middleware automatically formats errors and returns them in a consistent structure:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "email": "Email is required",
    "password": "Password must be at least 8 characters"
  }
}
```

## Available Validators

- **Auth Validators**

  - `registerValidator` - Validates user registration data
  - `loginValidator` - Validates login credentials
  - `verifyEmailValidator` - Validates email verification requests
  - `verifyEmailTokenValidator` - Validates email verification tokens
  - `forgotPasswordValidator` - Validates forgot password requests
  - `resetPasswordValidator` - Validates password reset requests

- **User Validators**

  - `updateUserValidator` - Validates user profile updates

- **Common Validators**
  - `validateMongoId` - Validates MongoDB ObjectId parameters
  - `validateObjectId` - Customizable ObjectId validator for any parameter name

### Custom Validators

- **isStrongPassword** - Validates that a password meets complexity requirements
- **isValidPhone** - Validates international phone numbers using libphonenumber-js

### Usage Example for Phone Validation

```javascript
// With country code (more accurate)
body('phoneNumber').custom((value, { req }) => {
  if (!customValidators.isValidPhone(value, { req })) {
    throw new Error('Invalid phone number format');
  }
  return true;
});

// To improve validation accuracy, include a countryCode in your request
// Example form data: { phoneNumber: '9876543210', countryCode: 'US' }
```

## Best Practices

1. **Create domain-specific validators** - Keep validators organized by domain (auth, user, etc.)
2. **Use custom validators for complex rules** - Extract complex validation logic into custom validators
3. **Chain validators** - Use the middleware chaining pattern for cleaner route definitions
4. **Sanitize inputs** - Use `.trim()`, `.escape()`, and `.normalizeEmail()` to clean input data
