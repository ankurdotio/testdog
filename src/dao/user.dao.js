import User from '../models/user.model.js';

/**
 * Data Access Object for User operations.
 * Handles all direct interactions with the User collection.
 */
class UserDAO {
  /**
   * Create a new user document in the database.
   * @param {Object} userData - Contains username, email, password, etc.
   * @returns {Promise<Object>} - Newly created user document.
   */
  async createUser(userData) {
    return await User.create(userData);
  }

  /**
   * Find a user by email. Useful during login or password reset.
   * @param {string} email - User's email address.
   * @returns {Promise<Object|null>} - Found user document or null.
   */
  async findByEmail(email) {
    return await User.findOne({ email }).select('+password');
  }

  /**
   * Find a user by Google ID.
   * @param {string} googleId - User's Google ID.
   * @returns {Promise<Object|null>} - Found user document or null.
   */
  async findByGoogleId(googleId) {
    return await User.findOne({ googleId });
  }

  /**
   * Find a user by ID.
   * @param {string} userId - MongoDB user ID.
   * @returns {Promise<Object|null>} - Found user document or null.
   */
  async findById(userId, selectFields = '') {
    if (selectFields) {
      // Add '+' prefix to include fields that have select: false in schema
      const fieldsWithPrefix = selectFields
        .split(' ')
        .map((field) => (field.trim() ? `+${field.trim()}` : ''))
        .filter(Boolean)
        .join(' ');
      return await User.findById(userId).select(fieldsWithPrefix);
    }
    return await User.findById(userId);
  }

  /**
   * Find a user by username.
   * @param {string} username - User's unique username.
   * @returns {Promise<Object|null>} - Found user document or null.
   */
  async findByUsername(username, selectFields = '') {
    return await User.findOne({
      $and: [{ username }, { username: { $ne: null } }],
    }).select(selectFields);
  }

  /**
   * Update user fields by ID.
   * @param {string} userId - MongoDB user ID.
   * @param {Object} updateData - Fields to update.
   * @returns {Promise<Object|null>} - Updated user document or null.
   */
  async updateUserById(userId, updateData) {
    return await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    });
  }

  /**
   * Delete a user by ID.
   * @param {string} userId - MongoDB user ID.
   * @returns {Promise<Object|null>} - Deleted user document or null.
   */
  async deleteUserById(userId) {
    return await User.findByIdAndDelete(userId);
  }

  /**
   * Get a random user from the database.
   * @returns {Promise<Object|null>} - Random user document or null if no users exist.
   */
  async getRandomUser() {
    const user = await User.aggregate([{ $sample: { size: 1 } }]);
    return user.length > 0 ? user[0] : null;
  }

  /**
   * Get all users with optional field selection.
   * @param {string} selectFields - Space-separated list of fields to return.
   * @returns {Promise<Array>} - Array of user documents.
   */
  /**
   * Get paginated list of users.
   * @param {number} page - Page number
   * @param {number} limit - Number of users per page
   * @returns {Promise<Object>} - { data: [], total }
   */
  async getAllUsersPaginated(page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    // Include role but exclude sensitive fields for security
    const selectFields =
      '+role -password -isEmailVerified -forgotPasswordToken -emailVerificationToken -__v';

    const [data, total] = await Promise.all([
      User.find()
        .select(selectFields)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }), // Sort by newest first
      User.countDocuments(),
    ]);
    return { data, total };
  }
}

export default new UserDAO();
