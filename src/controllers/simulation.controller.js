import asyncHandler from '../utils/asyncHandler.js';
import simulationService from '../services/simulation.service.js';

class SimulationController {
  /**
   * Get a random error response.
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getRandomError = asyncHandler(async (req, res) => {
    // Extract the 'type' query parameter (e.g. /random?type=auth)
    const { type } = req.query;

    const error = simulationService.getRandomError(type);

    // We want to simulate the error, so we return the status code from the error object
    // But we wrap it in a JSON response so the developer can see the details
    res.status(error.statusCode).json({
      error: true,
      ...error,
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * Get a custom error based on status code.
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getCustomError = asyncHandler(async (req, res) => {
    const { code } = req.query;

    // Default to 400 if no code is provided
    if (!code) {
      return res.status(400).json({
        error: true,
        type: 'validation',
        statusCode: 400,
        message: 'Missing Status Code',
        hint: 'Please provide a "code" query parameter (e.g., ?code=418).',
        timestamp: new Date().toISOString(),
      });
    }

    const error = simulationService.getCustomError(code);

    res.status(error.statusCode).json({
      ...error,
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * Delayed response simulation.
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getDelayedResponse = asyncHandler(async (req, res) => {
    let { ms } = req.query;

    // Parse and set defaults/limits
    ms = parseInt(ms, 10);
    if (isNaN(ms) || ms < 0) ms = 1000; // Default 1s
    if (ms > 10000) ms = 10000; // Cap at 10s to preserve server sanity

    await simulationService.simulateDelay(ms);

    res.status(200).json({
      error: false,
      message: `Sorry for the wait! I was napping for ${ms}ms.`,
      delay: ms,
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * Chaos mode endpoint.
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getChaosResponse = asyncHandler(async (req, res) => {
    // Determine the result from the service
    const result = await simulationService.getChaosResponse();

    // The status code comes from the result (could be 200, 4xx, or 5xx)
    res.status(result.statusCode).json({
      // Error flag only true if status is 4xx or 5xx
      error: result.statusCode >= 400,
      ...result,
      timestamp: new Date().toISOString(),
    });
  });
}

export default new SimulationController();
