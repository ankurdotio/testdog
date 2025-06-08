/**
 * Async handler wrapper to avoid try-catch blocks in route controllers
 * Uses promise chaining with .then() and .catch() as requested
 *
 * @param {Function} fn - The async function to wrap
 * @returns {Function} - Express middleware function
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((error) => {
    next(error); // Pass any errors to Express error handling middleware
  });
};

export default asyncHandler;
