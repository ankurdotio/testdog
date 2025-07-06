import Product from '../models/product.model.js';

/**
 * Data Access Object for Product operations.
 * Handles all direct interactions with the Product collection.
 */
class ProductDAO {
  /**
   * Create a new product document in the database.
   * @param {Object} productData - Contains product details like name, price, etc.
   * @returns {Promise<Object>} - Newly created product document.
   */
  async createProduct(productData) {
    return await Product.create(productData);
  }

  /**
   * Count all products in the database.
   * @returns {Promise<number>} - Total count of products.
   */
  async countAllProducts() {
    return await Product.countDocuments();
  }
  /**
   * Find a product by ID.
   * @param {string} productId - MongoDB product ID.
   * @returns {Promise<Object|null>} - Found product document or null.
   */
  async findProductById(productId) {
    return await Product.findById(productId);
  }
  /**
   * Find products by category.
   * @param {string} category - Product category.
   * @returns {Promise<Array>} - Array of found product documents.
   */
  async findProductsByCategory(category) {
    return await Product.find({ category });
  }
  /**
   * Update a product by ID.
   * @param {string} productId - MongoDB product ID.
   * @param {Object} updateData - Fields to update.
   * @returns {Promise<Object|null>} - Updated product document or null if not found.
   *
   */
  async updateProductById(productId, updateData) {
    return await Product.findByIdAndUpdate(productId, updateData, {
      new: true,
      runValidators: true,
    });
  }
  /**
   * Delete a product by ID.
   * @param {string} productId - MongoDB product ID.
   * @returns {Promise<Object|null>} - Deleted product document or null if not found.
   */
  async deleteProductById(productId) {
    return await Product.findByIdAndDelete(productId);
  }
  /**
   * Find all products with pagination.
   * @param {number} page - Page number for pagination.
   * @param {number} limit - Number of products per page.
   * @returns {Promise<Array>} - Array of found product documents.
   */
  async findAllProducts(page = 0, limit = 20) {
    const skip = page * limit;
    return await Product.find().skip(skip).limit(limit);
  }
  /**
   * Fuzzy search for products based on a keyword.
   * Uses MongoDB Atlas Search for advanced text search capabilities.
   * @param {string} keyword - Search keyword.
   * @param {number} limit - Number of products per page.
   * @returns {Promise<Array>} - Array of found product documents.
   */
  async fuzzySearch(keyword, limit = 20) {
    const results = await Product.aggregate([
      {
        $search: {
          index: 'productSearchIndex',
          text: {
            query: keyword,
            path: [
              'product_name',
              'description',
              'category_tree',
              'other_attributes.name',
              'other_attributes.value',
            ],
            fuzzy: {
              maxEdits: 2, // 1 or 2 is common
              prefixLength: 2, // minimum characters before fuzziness kicks in
            },
          },
        },
      },
      {
        $sort: { score: { $meta: 'textScore' } },
      },
      {
        $project: {
          _id: 1,
          product_name: 1,
          description: 1,
          initial_price: 1,
          final_price: 1,
          currency: 1,
          in_stock: 1,
          color: 1,
          size: 1,
          main_image: 1,
        },
      },
      {
        $limit: limit,
      },
    ]);

    return results;
  }
  /**
   * Autocomplete search for products using MongoDB Atlas Search.
   * @param {string} keyword - The search term typed by the user.
   * @param {number} limit - Max number of results to return.
   * @returns {Promise<Array>} Matching products with lightweight projection.
   */
  async autocompleteSearch(keyword, limit = 7) {
    const results = await Product.aggregate([
      {
        $search: {
          index: 'productSearchIndex',
          autocomplete: {
            query: keyword,
            path: ['product_name'],
            fuzzy: {
              maxEdits: 1,
              prefixLength: 2,
            },
          },
        },
      },
      {
        $project: {
          product_name: 1,
          score: { $meta: 'searchScore' },
        },
      },
      { $sort: { score: -1 } },
      { $limit: limit },
    ]);

    return results.map((product) => product.product_name);
  }
  /**
   * Get a random product from the database.
   * @returns {Promise<Object|null>} - Random product document or null if no products exist.
   */
  async getRandomProduct() {
    const randomProduct = await Product.aggregate([{ $sample: { size: 1 } }]);
    return randomProduct.length > 0 ? randomProduct[0] : null;
  }
  /**
   * Find products by name using basic text search (fallback method)
   * @param {string} keyword - Search keyword
   * @param {number} limit - Number of results
   * @returns {Promise<Array>} - Search results
   */
  async findProductsByName(keyword, limit = 20) {
    const results = await Product.find({
      $or: [
        { product_name: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
        { category: { $regex: keyword, $options: 'i' } },
        { root_category: { $regex: keyword, $options: 'i' } },
      ],
    }).limit(limit);

    return results.map((product) => product.product_name);
  }
}

export default new ProductDAO();
