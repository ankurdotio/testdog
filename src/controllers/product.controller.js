import asyncHandler from '../utils/asyncHandler.js';
import productService from '../services/product.service.js';
import logger from '../loggers/winston.logger.js';

class ProductController {
  /**
   * Create a new product
   * @route POST /api/v1/store/products
   * @access Private (Admin/Store Manager)
   */
  createProduct = asyncHandler(async (req, res) => {
    logger.info('Creating new product', {
      productName: req.body.product_name,
      userId: req.user?.id,
    });

    const product = await productService.createProduct(req.body);

    logger.info('Product created successfully', {
      productId: product._id,
      productName: product.product_name,
      userId: req.user?.id,
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: {
        product,
      },
    });
  });

  /**
   * Get product by ID
   * @route GET /api/v1/store/products/:id
   * @access Public
   */
  getProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;

    logger.info('Fetching product by ID', { productId: id });

    const product = await productService.getProductById(id);

    res.status(200).json({
      success: true,
      message: 'Product retrieved successfully',
      data: {
        product,
      },
    });
  });

  /**
   * Get all products with pagination
   * @route GET /api/v1/store/products
   * @access Public
   */
  getAllProducts = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 20;

    // Validate pagination parameters
    if (page < 0) {
      return res.status(400).json({
        success: false,
        message: 'Page number must be non-negative',
      });
    }

    if (limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        message: 'Limit must be between 1 and 100',
      });
    }

    logger.info('Fetching products with pagination', { page, limit });

    const result = await productService.getAllProducts(page, limit);

    res.status(200).json({
      success: true,
      message: 'Products retrieved successfully',
      data: result,
    });
  });

  /**
   * Search products
   * @route GET /api/v1/store/products/search
   * @access Public
   */
  searchProducts = asyncHandler(async (req, res) => {
    const { q: keyword, limit = 20 } = req.query;

    if (!keyword || keyword.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Search keyword is required',
      });
    }

    logger.info('Searching products', { keyword, limit });

    const products = await productService.searchProducts(
      keyword,
      parseInt(limit)
    );

    res.status(200).json({
      success: true,
      message: 'Search completed successfully',
      data: {
        keyword,
        products,
        total: products.length,
      },
    });
  });

  /**
   * Get product autocomplete suggestions
   * @route GET /api/v1/store/products/autocomplete
   * @access Public
   */
  getAutocomplete = asyncHandler(async (req, res) => {
    const { q: keyword, limit = 7 } = req.query;

    if (!keyword || keyword.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search keyword must be at least 2 characters long',
      });
    }

    logger.info('Getting autocomplete suggestions', { keyword, limit });

    const suggestions = await productService.getAutocompleteSuggestions(
      keyword,
      parseInt(limit)
    );

    res.status(200).json({
      success: true,
      message: 'Autocomplete suggestions retrieved successfully',
      data: {
        keyword,
        suggestions,
      },
    });
  });

  /**
   * Get random product
   * @route GET /api/v1/store/products/random
   * @access Public
   */
  getRandomProduct = asyncHandler(async (req, res) => {
    logger.info('Fetching random product');

    const product = await productService.getRandomProduct();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'No products available',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Random product retrieved successfully',
      data: {
        product,
      },
    });
  });
}

export default new ProductController();
