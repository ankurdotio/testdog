import productDAO from '../dao/product.dao.js';
import AppError from '../utils/appError.js';
import logger from '../loggers/winston.logger.js';

class ProductService {
  /**
   * Create a new product with validation and business logic
   * @param {Object} productData - Product data from request
   * @returns {Promise<Object>} - Created product
   */
  async createProduct(productData) {
    try {
      // Business logic validations
      await this.validateProductBusinessRules(productData);

      // Set default values if not provided
      const processedData = this.processProductData(productData);

      // Create product through DAO
      const createdProduct = await productDAO.createProduct(processedData);

      // Return sanitized product data
      return this.sanitizeProductResponse(createdProduct);
    } catch (error) {
      if (error.code === 11000) {
        // Handle duplicate key error
        throw new AppError('Product with this name already exists', 409);
      }
      throw error;
    }
  }

  /**
   * Validate business rules for product creation
   * @param {Object} productData - Product data to validate
   */
  async validateProductBusinessRules(productData) {
    // Check if final price is reasonable compared to initial price
    if (productData.final_price > productData.initial_price) {
      throw new AppError(
        'Final price cannot be greater than initial price',
        400
      );
    }

    // Check for minimum discount if prices are different
    if (productData.initial_price !== productData.final_price) {
      const discountPercentage =
        ((productData.initial_price - productData.final_price) /
          productData.initial_price) *
        100;
      if (discountPercentage < 1) {
        throw new AppError('Minimum discount should be at least 1%', 400);
      }
    }

    // Validate image consistency
    if (productData.image_urls && productData.image_count) {
      if (productData.image_urls.length !== productData.image_count) {
        throw new AppError(
          'Image count must match the number of image URLs provided',
          400
        );
      }
    }

    // Validate category hierarchy
    if (productData.category_tree && productData.category_tree.length > 0) {
      if (
        productData.root_category &&
        !productData.category_tree.includes(productData.root_category)
      ) {
        throw new AppError(
          'Root category must be present in category tree',
          400
        );
      }
    }
  }

  /**
   * Process and set default values for product data
   * @param {Object} productData - Raw product data
   * @returns {Object} - Processed product data
   */
  processProductData(productData) {
    const processedData = { ...productData };

    // Set image count based on image URLs if not provided
    if (processedData.image_urls && !processedData.image_count) {
      processedData.image_count = processedData.image_urls.length;
    }

    // Set default image count if not provided
    if (!processedData.image_count) {
      processedData.image_count = 1;
    }

    // Ensure main image is included in image URLs
    if (processedData.main_image && processedData.image_urls) {
      if (!processedData.image_urls.includes(processedData.main_image)) {
        processedData.image_urls.unshift(processedData.main_image);
        processedData.image_count = processedData.image_urls.length;
      }
    }

    // Set root category from category tree if not provided
    if (
      !processedData.root_category &&
      processedData.category_tree &&
      processedData.category_tree.length > 0
    ) {
      processedData.root_category = processedData.category_tree[0];
    }

    // Set category from category tree if not provided
    if (
      !processedData.category &&
      processedData.category_tree &&
      processedData.category_tree.length > 0
    ) {
      processedData.category =
        processedData.category_tree[processedData.category_tree.length - 1];
    }

    // Add current size to available sizes if not present
    if (processedData.size && processedData.all_available_sizes) {
      if (!processedData.all_available_sizes.includes(processedData.size)) {
        processedData.all_available_sizes.push(processedData.size);
      }
    } else if (processedData.size && !processedData.all_available_sizes) {
      processedData.all_available_sizes = [processedData.size];
    }

    return processedData;
  }

  /**
   * Remove sensitive data from product response
   * @param {Object} product - Product document
   * @returns {Object} - Sanitized product data
   */
  sanitizeProductResponse(product) {
    const productObj = product.toObject ? product.toObject() : product;

    // Add calculated fields
    if (productObj.initial_price && productObj.final_price) {
      const discount = productObj.initial_price - productObj.final_price;
      const discountPercentage = (discount / productObj.initial_price) * 100;

      productObj.discount_amount = parseFloat(discount.toFixed(2));
      productObj.discount_percentage = parseFloat(
        discountPercentage.toFixed(2)
      );
    }

    return productObj;
  }

  /**
   * Get product by ID
   * @param {string} productId - Product ID
   * @returns {Promise<Object>} - Product data
   */
  async getProductById(productId) {
    const product = await productDAO.findProductById(productId);
    if (!product) {
      throw new AppError('Product not found', 404);
    }
    return this.sanitizeProductResponse(product);
  }

  /**
   * Get all products with pagination
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {Promise<Object>} - Products with pagination info
   */
  async getAllProducts(page = 0, limit = 20) {
    const products = await productDAO.findAllProducts(page, limit);
    const totalProducts = await productDAO.countAllProducts();

    return {
      products: products.map((product) =>
        this.sanitizeProductResponse(product)
      ),
      pagination: {
        currentPage: page,
        limit,
        totalProducts,
        totalPages: Math.ceil(totalProducts / limit),
        hasNextPage: (page + 1) * limit < totalProducts,
        hasPrevPage: page > 0,
      },
    };
  }

  /**
   * Search products using fuzzy search
   * @param {string} keyword - Search keyword
   * @param {number} limit - Number of results
   * @returns {Promise<Array>} - Search results
   */
  async searchProducts(keyword, limit = 20) {
    try {
      const products = await productDAO.fuzzySearch(keyword, limit);
      return products.map((product) => this.sanitizeProductResponse(product));
    } catch (error) {
      // Fallback to basic text search if Atlas Search is not available
      logger.warn(
        'Atlas Search not available, falling back to basic search:',
        error.message
      );
      const products = await productDAO.findProductsByName(keyword, limit);
      return products.map((product) => this.sanitizeProductResponse(product));
    }
  }

  /**
   * Get autocomplete suggestions
   * @param {string} keyword - Search keyword
   * @param {number} limit - Number of suggestions
   * @returns {Promise<Array>} - Autocomplete suggestions
   */
  async getAutocompleteSuggestions(keyword, limit = 7) {
    try {
      const suggestions = await productDAO.autocompleteSearch(keyword, limit);
      return suggestions;
    } catch (error) {
      // Fallback to basic search if Atlas Search is not available
      logger.warn(
        'Atlas Search autocomplete not available, falling back to basic search:',
        error.message
      );
      const products = await productDAO.findProductsByName(keyword, limit);
      return products.map((product) => ({
        product_name: product.product_name,
        final_price: product.final_price,
        main_image: product.main_image,
        rating: product.rating,
        _id: product._id,
      }));
    }
  }

  /**
   * Get random product
   * @returns {Promise<Object>} - Random product
   */
  async getRandomProduct() {
    const product = await productDAO.getRandomProduct();
    return product ? this.sanitizeProductResponse(product) : null;
  }
}

export default new ProductService();
