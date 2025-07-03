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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    const { data, total } = await userServices.getAllUsersPaginated(
      page,
      limit
    );

    res.status(200).json({
      success: true,
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  });
}

export default new UserController();
