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
   * @param {Object} req
   * @param {Object} res
   */
  getAllUsers = asyncHandler(async (req, res) => {
    const MAX_LIMIT = 5;

    // Parse values safely
    const rawPage = req.query.page;
    const rawLimit = req.query.limit;

    let page = parseInt(rawPage);
    let limit = parseInt(rawLimit);

    // Page validation (before using it)
    if (!page || isNaN(page) || page <= 0) {
      return res.status(400).json({
        success: false,
        message: `Page must be a positive number starting from 1.`,
      });
    }

    // Limit validation
    if (!limit || isNaN(limit) || limit <= 0) {
      return res.status(400).json({
        success: false,
        message: `Limit must be a positive number between 1 and ${MAX_LIMIT}.`,
      });
    }

    let responseMessage;
    if (limit > MAX_LIMIT) {
      limit = MAX_LIMIT;
      res.set('X-Limit-Adjusted', true);
      responseMessage = `Limit capped to ${MAX_LIMIT}. You requested ${rawLimit}.`;
    }

    const { data, total } = await userServices.getAllUsersPaginated(
      page,
      limit
    );
    const totalPages = Math.ceil(total / limit);

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
