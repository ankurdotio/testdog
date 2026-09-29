export const ERROR_TYPES = {
  AUTH: 'auth',
  DATABASE: 'database',
  NETWORK: 'network',
  VALIDATION: 'validation',
  PAYMENT: 'payment',
  SERVER: 'server',
};

export const ERROR_CATALOG = [
  // --- AUTH ERRORS ---
  {
    type: ERROR_TYPES.AUTH,
    statusCode: 401,
    message: 'Whoops! Authentication Failed.',
    hint: 'Missing or invalid token. did you forget to add "Bearer <token>" in the header?',
  },
  {
    type: ERROR_TYPES.AUTH,
    statusCode: 401,
    message: 'Token Expired',
    hint: 'Your session expired. Hit the refresh endpoint to get a shiny new token.',
  },
  {
    type: ERROR_TYPES.AUTH,
    statusCode: 403,
    message: 'Access Denied!',
    hint: 'You are trying to touch something above your pay grade (insufficient permissions).',
  },

  // --- DATABASE ERRORS ---
  {
    type: ERROR_TYPES.DATABASE,
    statusCode: 503,
    message: 'DB Connection Timeout',
    hint: 'Database is taking a nap (timeout). Check your connection string or network.',
  },
  {
    type: ERROR_TYPES.DATABASE,
    statusCode: 409,
    message: 'Duplicate Entry',
    hint: 'This record already exists. Unique constraint violation.',
  },
  {
    type: ERROR_TYPES.DATABASE,
    statusCode: 422,
    message: 'Invalid ID Format',
    hint: "That doesn't look like a valid MongoDB ObjectId.",
  },

  // --- NETWORK ERRORS ---
  {
    type: ERROR_TYPES.NETWORK,
    statusCode: 504,
    message: 'Gateway Timeout',
    hint: 'Upstream server is ghosting us. It took too long to respond.',
  },
  {
    type: ERROR_TYPES.NETWORK,
    statusCode: 502,
    message: 'Bad Gateway',
    hint: "Received garbage from the upstream server. Maybe it's down?",
  },
  {
    type: ERROR_TYPES.NETWORK,
    statusCode: 503,
    message: 'Service Unavailable',
    hint: 'Server is overloaded or under maintenance. Try again in a bit.',
  },

  // --- VALIDATION ERRORS ---
  {
    type: ERROR_TYPES.VALIDATION,
    statusCode: 400,
    message: 'Validation Error',
    hint: 'You missed some required fields. Check the docs!',
  },
  {
    type: ERROR_TYPES.VALIDATION,
    statusCode: 400,
    message: 'Invalid Email',
    hint: "That doesn't look like a real email address.",
  },
  {
    type: ERROR_TYPES.VALIDATION,
    statusCode: 422,
    message: 'Weak Password',
    hint: 'Password is too weak. Add some spice (special chars, numbers).',
  },

  // --- PAYMENT ERRORS ---
  {
    type: ERROR_TYPES.PAYMENT,
    statusCode: 402,
    message: 'Payment Required',
    hint: 'Card declined or insufficient funds. Money makes the world go round.',
  },
  {
    type: ERROR_TYPES.PAYMENT,
    statusCode: 422,
    message: 'Invalid Card Info',
    hint: 'Check the card number, CVV or expiry. Something is off.',
  },
  {
    type: ERROR_TYPES.PAYMENT,
    statusCode: 409,
    message: 'Double Charge Prevented',
    hint: 'Transaction already processed. Idempotency saved you from paying twice.',
  },

  // --- SERVER ERRORS ---
  {
    type: ERROR_TYPES.SERVER,
    statusCode: 500,
    message: 'Internal Server Error',
    hint: 'Something exploded on our end. Check the server logs.',
  },
];
