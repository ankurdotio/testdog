import userServices from '../services/user.service.js';
import asyncHandler from '../utils/asyncHandler.js';

class UserController {
  /**
   * Update user details.
   * @param {Object} req - Express request object with user ID in the token and updated data in body.
   * @param {Object} res - Express response object.
   */
  updateUser = asyncHandler(async (req, res) => {
    const user = await userServices.updateUser(req.user._id, req.body);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, data: user });
  });

  /**
   * Get a random user.
   * @param {Object} req - Express request object.
   * @param {Object} res - Express response object.
   */
  getRandomUser = asyncHandler(async (req, res) => {
    const user = await userServices.getRandomUser();
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'No users found' });
    }
    res.status(200).json({ success: true, data: user });
  });

  /**
 * Get paginated users.
 * Handles query parameters: `page`, `limit`
 * Delegates pagination, validation, and capping logic to the service layer.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
  getAllUsers = asyncHandler(async (req, res) => {
    const rawPage = req.query.page;
    const rawLimit = req.query.limit;

    const result = await userServices.getAllUsersPaginated(rawPage, rawLimit);

    // In case of validation failure, service will return status and message
    if (!result.success) {
      return res.status(result.statusCode || 400).json({
        success: false,
        message: result.message,
      });
    }

    const { data, pagination, message } = result;

    res.status(200).json({
      success: true,
      ...(message && { message }),
      data,
      pagination,
    });
  });
}

export default new UserController();
