import asyncHandler from '../utils/asyncHandler.js';
import cartService from '../services/cart.service.js';
import logger from '../loggers/winston.logger.js';

class CartController {
  /**
   * Add product to cart
   * @route POST /api/v1/store/cart
   * @access Private (Authenticated users)
   */
  addToCart = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { productId, quantity, selectedSize, selectedColor } = req.body;

    logger.info('Adding product to cart', {
      userId,
      productId,
      quantity,
    });

    const cart = await cartService.addToCart(userId, {
      productId,
      quantity,
      selectedSize,
      selectedColor,
    });

    logger.info('Product added to cart successfully', {
      userId,
      productId,
      totalItems: cart.totalItems,
    });

    res.status(200).json({
      success: true,
      message: 'Product added to cart successfully',
      data: {
        cart,
      },
    });
  });

  /**
   * Get user's cart
   * @route GET /api/v1/store/cart
   * @access Private (Authenticated users)
   */
  getCart = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    logger.info('Fetching user cart', { userId });

    const cart = await cartService.getCart(userId);

    res.status(200).json({
      success: true,
      message: 'Cart retrieved successfully',
      data: {
        cart,
      },
    });
  });

  /**
   * Update cart item quantity
   * @route PATCH /api/v1/store/cart/:id
   * @access Private (Authenticated users)
   */
  updateCartItem = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { id: itemId } = req.params;
    const { quantity } = req.body;

    logger.info('Updating cart item', {
      userId,
      itemId,
      newQuantity: quantity,
    });

    const cart = await cartService.updateCartItem(userId, itemId, quantity);

    logger.info('Cart item updated successfully', {
      userId,
      itemId,
      newQuantity: quantity,
    });

    res.status(200).json({
      success: true,
      message: 'Cart item updated successfully',
      data: {
        cart,
      },
    });
  });

  /**
   * Remove item from cart
   * @route DELETE /api/v1/store/cart/:id
   * @access Private (Authenticated users)
   */
  removeCartItem = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { id: itemId } = req.params;

    logger.info('Removing cart item', {
      userId,
      itemId,
    });

    const cart = await cartService.removeCartItem(userId, itemId);

    logger.info('Cart item removed successfully', {
      userId,
      itemId,
    });

    res.status(200).json({
      success: true,
      message: 'Cart item removed successfully',
      data: {
        cart,
      },
    });
  });

  /**
   * Clear entire cart
   * @route DELETE /api/v1/store/cart
   * @access Private (Authenticated users)
   */
  clearCart = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    logger.info('Clearing cart', { userId });

    const cart = await cartService.clearCart(userId);

    logger.info('Cart cleared successfully', { userId });

    res.status(200).json({
      success: true,
      message: 'Cart cleared successfully',
      data: {
        cart,
      },
    });
  });

  /**
   * Get cart summary (items count and total)
   * @route GET /api/v1/store/cart/summary
   * @access Private (Authenticated users)
   */
  getCartSummary = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    logger.info('Fetching cart summary', { userId });

    const cart = await cartService.getCart(userId);

    res.status(200).json({
      success: true,
      message: 'Cart summary retrieved successfully',
      data: {
        summary: {
          totalItems: cart.totalItems,
          totalAmount: cart.totalAmount,
          currency: cart.currency,
          itemCount: cart.items ? cart.items.length : 0,
        },
      },
    });
  });
}

export default new CartController();
