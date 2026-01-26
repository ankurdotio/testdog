import { ERROR_CATALOG } from '../constants/simulation.constants.js';

class SimulationService {
  /**
   * Selects a random error from the catalog, optionally filtered by type.
   * @param {string} type - (Optional) Error category to filter by (e.g., 'auth', 'database')
   * @returns {Object} Random error object
   */
  getRandomError(type) {
    let pool = ERROR_CATALOG;

    // If a type is provided, we filter the errors
    if (type) {
      const filtered = ERROR_CATALOG.filter((err) => err.type === type);

      // If the developer asks for a category that doesn't exist or has no errors,
      // we should let them know instead of just returning a random one.
      if (filtered.length === 0) {
        // Find available types for the hint
        const availableTypes = [
          ...new Set(ERROR_CATALOG.map((e) => e.type)),
        ].join(', ');

        return {
          statusCode: 400,
          error: true,
          type: 'validation', // This corresponds to a validation error on the *simulation API* itself
          message: `Invalid error type: '${type}'`,
          hint: `Available types are: ${availableTypes}`,
        };
      }

      pool = filtered;
    }

    const randomIndex = Math.floor(Math.random() * pool.length);
    return pool[randomIndex];
  }

  /**
   * Generates a custom error response based on the provided status code.
   * @param {number|string} code - The HTTP status code to simulate
   * @returns {Object} Custom error object
   */
  getCustomError(code) {
    const statusCode = parseInt(code, 10);

    if (isNaN(statusCode) || statusCode < 100 || statusCode > 599) {
      return {
        statusCode: 400,
        error: true,
        type: 'validation',
        message: 'Invalid Status Code',
        hint: 'Please provide a valid HTTP status code between 100 and 599.',
      };
    }

    return {
      statusCode,
      error: statusCode >= 400, // Only consider 4xx and 5xx as "errors" for the error flag
      type: 'custom',
      message: `Simulated ${statusCode} Response`,
      hint: `You asked for a ${statusCode}, you got a ${statusCode}.`,
    };
  }

  /**
   * Simulates a network delay.
   * @param {number} ms - Milliseconds to delay (default 1000)
   * @returns {Promise<number>} Resolves with the delay time
   */
  async simulateDelay(ms = 1000) {
    return new Promise((resolve) => {
      setTimeout(() => resolve(ms), ms);
    });
  }

  /**
   * Chaos mode! Randomly returns success, error, or a delayed response.
   * Distribution:
   * - 40% Success
   * - 40% Error
   * - 20% High Latency (Slow response)
   */
  async getChaosResponse() {
    const roll = Math.random();
    // 40% Chance: Success
    if (roll < 0.4) {
      return {
        type: 'mode_chaos_success',
        statusCode: 200,
        message: 'Survived the chaos! Operation successful.',
      };
    }

    // 40% Chance: Random Error (re-using existing random logic)
    if (roll < 0.8) {
      const error = this.getRandomError();
      return {
        ...error,
        type: 'mode_chaos_error', // Tagging it so distinct from normal random
        originalType: error.type,
      };
    }

    // 20% Chance: Latency Spike
    // Random delay between 1s and 5s
    const delay = Math.floor(Math.random() * 4000) + 1000;

    // We wait here to simulate the server actually hanging
    await this.simulateDelay(delay);

    return {
      type: 'mode_chaos_delay',
      statusCode: 200,
      message: `Phew! Request lagged for ${delay}ms but finally made it.`,
      delay,
    };
  }
}

export default new SimulationService();
