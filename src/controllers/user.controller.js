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
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 5;

    let responseMessage;
    if (limit > 5) {
      limit = 5;
      res.set('X-Limit-Adjusted', true);
      responseMessage = `Limit capped to 5. You requested ${req.query.limit}.`;
    }

    const { data, total, totalPages } = await userServices.getAllUsersPaginated(
      page,
      limit
    );

    if (page > totalPages && total > 0) {
      return res.status(400).json({
        success: false,
        message: `Only ${totalPages} page(s) available. You requested page ${page}.`,
      });
    }

    res.status(200).json({
      success: true,
      ...(responseMessage && { message: responseMessage }),
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    });
  });
}

export default new UserController();
