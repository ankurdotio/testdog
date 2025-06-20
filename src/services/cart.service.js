import cartDAO from '../dao/cart.dao.js';
import productDAO from '../dao/product.dao.js';
import AppError from '../utils/appError.js';
import logger from '../loggers/winston.logger.js';

class CartService {
  /**
   * Add product to cart with validation and business logic
   * @param {string} userId - User ID
   * @param {Object} cartData - Cart item data
   * @returns {Promise<Object>} - Updated cart
   */
  async addToCart(userId, cartData) {
    const { productId, quantity = 1, selectedSize, selectedColor } = cartData;

    try {
      // Validate product exists and is available
      const product = await productDAO.findProductById(productId);
      if (!product) {
        throw new AppError('Product not found', 404);
      }

      if (!product.in_stock) {
        throw new AppError('Product is currently out of stock', 400);
      }

      // Validate selected size if provided
      if (
        selectedSize &&
        product.all_available_sizes &&
        product.all_available_sizes.length > 0
      ) {
        if (!product.all_available_sizes.includes(selectedSize)) {
          throw new AppError(
            `Size ${selectedSize} is not available for this product`,
            400
          );
        }
      }

      // Check if item already exists in cart with same attributes
      const existingCartWithItem = await cartDAO.findCartItemByProduct(
        userId,
        productId,
        selectedSize,
        selectedColor
      );

      if (existingCartWithItem) {
        // Update quantity of existing item
        const existingItem = existingCartWithItem.items.find(
          (item) =>
            item.product.toString() === productId &&
            item.selectedSize === selectedSize &&
            item.selectedColor === selectedColor
        );

        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity > 50) {
          throw new AppError(
            'Cannot add more than 50 items of the same product',
            400
          );
        }

        const updatedCart = await cartDAO.incrementCartItemQuantity(
          userId,
          productId,
          selectedSize,
          selectedColor,
          quantity
        );

        logger.info('Cart item quantity updated', {
          userId,
          productId,
          newQuantity,
        });

        return this.sanitizeCartResponse(updatedCart);
      }

      // Add new item to cart
      const itemData = {
        product: productId,
        quantity,
        price: product.final_price,
        selectedSize,
        selectedColor,
      };

      // Check if cart exists, if not create one
      let cart = await cartDAO.findCartByUserId(userId);
      if (!cart) {
        cart = await cartDAO.createCart(userId);
      }

      const updatedCart = await cartDAO.addItemToCart(userId, itemData);

      logger.info('Product added to cart', {
        userId,
        productId,
        quantity,
      });

      return this.sanitizeCartResponse(updatedCart);
    } catch (error) {
      logger.error('Error adding product to cart:', error);
      throw error;
    }
  }

  /**
   * Get user's cart
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - User's cart
   */
  async getCart(userId) {
    try {
      let cart = await cartDAO.findCartByUserId(userId);

      if (!cart) {
        // Create empty cart if doesn't exist
        cart = await cartDAO.createCart(userId);
      }

      // Validate cart items and remove unavailable products
      const validatedCart = await this.validateCartItems(cart);

      return this.sanitizeCartResponse(validatedCart);
    } catch (error) {
      logger.error('Error fetching cart:', error);
      throw error;
    }
  }

  /**
   * Update cart item quantity
   * @param {string} userId - User ID
   * @param {string} itemId - Cart item ID
   * @param {number} quantity - New quantity
   * @returns {Promise<Object>} - Updated cart
   */
  async updateCartItem(userId, itemId, quantity) {
    try {
      const cart = await cartDAO.findCartByUserId(userId);
      if (!cart) {
        throw new AppError('Cart not found', 404);
      }

      const item = cart.items.find((item) => item._id.toString() === itemId);
      if (!item) {
        throw new AppError('Cart item not found', 404);
      }

      // Validate product availability
      const product = await productDAO.findProductById(
        item.product._id || item.product
      );
      if (!product || !product.in_stock) {
        throw new AppError('Product is no longer available', 400);
      }

      const updatedCart = await cartDAO.updateCartItemQuantity(
        userId,
        itemId,
        quantity
      );
      if (!updatedCart) {
        throw new AppError('Failed to update cart item', 400);
      }

      logger.info('Cart item updated', {
        userId,
        itemId,
        newQuantity: quantity,
      });

      return this.sanitizeCartResponse(updatedCart);
    } catch (error) {
      logger.error('Error updating cart item:', error);
      throw error;
    }
  }

  /**
   * Remove item from cart
   * @param {string} userId - User ID
   * @param {string} itemId - Cart item ID
   * @returns {Promise<Object>} - Updated cart
   */
  async removeCartItem(userId, itemId) {
    try {
      const cart = await cartDAO.findCartByUserId(userId);
      if (!cart) {
        throw new AppError('Cart not found', 404);
      }

      const item = cart.items.find((item) => item._id.toString() === itemId);
      if (!item) {
        throw new AppError('Cart item not found', 404);
      }

      const updatedCart = await cartDAO.removeCartItem(userId, itemId);

      logger.info('Cart item removed', {
        userId,
        itemId,
      });

      return this.sanitizeCartResponse(updatedCart);
    } catch (error) {
      logger.error('Error removing cart item:', error);
      throw error;
    }
  }

  /**
   * Clear entire cart
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Cleared cart
   */
  async clearCart(userId) {
    try {
      const clearedCart = await cartDAO.clearCart(userId);

      logger.info('Cart cleared', { userId });

      return this.sanitizeCartResponse(clearedCart);
    } catch (error) {
      logger.error('Error clearing cart:', error);
      throw error;
    }
  }

  /**
   * Validate cart items and remove unavailable products
   * @param {Object} cart - Cart document
   * @returns {Promise<Object>} - Validated cart
   */
  async validateCartItems(cart) {
    if (!cart.items || cart.items.length === 0) {
      return cart;
    }

    const validItems = [];
    let hasRemovedItems = false;

    for (const item of cart.items) {
      try {
        const product = await productDAO.findProductById(
          item.product._id || item.product
        );

        if (product && product.in_stock) {
          // Update price if it has changed
          if (item.price !== product.final_price) {
            item.price = product.final_price;
          }
          validItems.push(item);
        } else {
          hasRemovedItems = true;
          logger.warn('Removed unavailable product from cart', {
            userId: cart.user,
            productId: item.product._id || item.product,
          });
        }
      } catch (error) {
        hasRemovedItems = true;
        logger.warn('Removed invalid product from cart', {
          userId: cart.user,
          productId: item.product._id || item.product,
          error: error.message,
        });
      }
    }

    if (hasRemovedItems) {
      cart.items = validItems;
      await cart.save();
    }

    return cart;
  }

  /**
   * Sanitize cart response for client
   * @param {Object} cart - Cart document
   * @returns {Object} - Sanitized cart data
   */
  sanitizeCartResponse(cart) {
    if (!cart) {
      return {
        items: [],
        totalItems: 0,
        totalAmount: 0,
        currency: 'USD',
      };
    }

    const cartObj = cart.toObject ? cart.toObject() : cart;

    // Add calculated fields for each item
    if (cartObj.items) {
      cartObj.items = cartObj.items.map((item) => ({
        ...item,
        subtotal: parseFloat((item.price * item.quantity).toFixed(2)),
      }));
    }

    return {
      _id: cartObj._id,
      items: cartObj.items || [],
      totalItems: cartObj.totalItems || 0,
      totalAmount: parseFloat((cartObj.totalAmount || 0).toFixed(2)),
      currency: cartObj.currency || 'USD',
      updatedAt: cartObj.updatedAt,
    };
  }
}

export default new CartService();
