import Cart from '../models/cart.model.js';

/**
 * Data Access Object for Cart operations.
 * Handles all direct interactions with the Cart collection.
 */
class CartDAO {
  /**
   * Find cart by user ID
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} - Found cart document or null
   */
  async findCartByUserId(userId) {
    return await Cart.findOne({ user: userId }).populate({
      path: 'items.product',
      select:
        'product_name final_price main_image in_stock all_available_sizes color currency',
    });
  }

  /**
   * Create a new cart for user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Created cart document
   */
  async createCart(userId) {
    return await Cart.create({
      user: userId,
      items: [],
      totalItems: 0,
      totalAmount: 0,
    });
  }

  /**
   * Add item to cart or update existing item
   * @param {string} userId - User ID
   * @param {Object} itemData - Item data to add
   * @returns {Promise<Object>} - Updated cart document
   */
  async addItemToCart(userId, itemData) {
    const updatedCart = await Cart.findOneAndUpdate(
      { user: userId },
      { $push: { items: itemData } },
      {
        new: true,
        runValidators: true,
        upsert: true,
      }
    ).populate({
      path: 'items.product',
      select:
        'product_name final_price main_image in_stock all_available_sizes color currency',
    });

    // Manually calculate totals since findOneAndUpdate doesn't trigger pre('save')
    if (updatedCart && updatedCart.items) {
      updatedCart.totalItems = updatedCart.items.reduce(
        (total, item) => total + item.quantity,
        0
      );
      updatedCart.totalAmount = updatedCart.items.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      );

      // Save to persist the calculated totals
      await updatedCart.save();
    }

    return updatedCart;
  }

  /**
   * Update cart item quantity
   * @param {string} userId - User ID
   * @param {string} itemId - Cart item ID
   * @param {number} quantity - New quantity
   * @returns {Promise<Object|null>} - Updated cart document or null
   */
  async updateCartItemQuantity(userId, itemId, quantity) {
    const updatedCart = await Cart.findOneAndUpdate(
      {
        user: userId,
        'items._id': itemId,
      },
      {
        $set: { 'items.$.quantity': quantity },
      },
      {
        new: true,
        runValidators: true,
      }
    ).populate({
      path: 'items.product',
      select:
        'product_name final_price main_image in_stock all_available_sizes color currency',
    });

    // Manually calculate totals since findOneAndUpdate doesn't trigger pre('save')
    if (updatedCart && updatedCart.items) {
      updatedCart.totalItems = updatedCart.items.reduce(
        (total, item) => total + item.quantity,
        0
      );
      updatedCart.totalAmount = updatedCart.items.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      );

      // Save to persist the calculated totals
      await updatedCart.save();
    }

    return updatedCart;
  }

  /**
   * Remove item from cart
   * @param {string} userId - User ID
   * @param {string} itemId - Cart item ID
   * @returns {Promise<Object|null>} - Updated cart document or null
   */
  async removeCartItem(userId, itemId) {
    const updatedCart = await Cart.findOneAndUpdate(
      { user: userId },
      {
        $pull: { items: { _id: itemId } },
      },
      {
        new: true,
        runValidators: true,
      }
    ).populate({
      path: 'items.product',
      select:
        'product_name final_price main_image in_stock all_available_sizes color currency',
    });

    // Manually calculate totals since findOneAndUpdate doesn't trigger pre('save')
    if (updatedCart && updatedCart.items) {
      updatedCart.totalItems = updatedCart.items.reduce(
        (total, item) => total + item.quantity,
        0
      );
      updatedCart.totalAmount = updatedCart.items.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      );

      // Save to persist the calculated totals
      await updatedCart.save();
    }

    return updatedCart;
  }

  /**
   * Clear entire cart
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} - Updated cart document or null
   */
  async clearCart(userId) {
    return await Cart.findOneAndUpdate(
      { user: userId },
      {
        $set: {
          items: [],
          totalItems: 0,
          totalAmount: 0,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );
  }

  /**
   * Check if item exists in cart
   * @param {string} userId - User ID
   * @param {string} productId - Product ID
   * @param {string} selectedSize - Selected size (optional)
   * @param {string} selectedColor - Selected color (optional)
   * @returns {Promise<Object|null>} - Found cart with matching item or null
   */
  async findCartItemByProduct(
    userId,
    productId,
    selectedSize = null,
    selectedColor = null
  ) {
    const query = {
      user: userId,
      'items.product': productId,
    };

    if (selectedSize) {
      query['items.selectedSize'] = selectedSize;
    }
    if (selectedColor) {
      query['items.selectedColor'] = selectedColor;
    }

    return await Cart.findOne(query);
  }

  /**
   * Update existing cart item quantity by incrementing
   * @param {string} userId - User ID
   * @param {string} productId - Product ID
   * @param {string} selectedSize - Selected size (optional)
   * @param {string} selectedColor - Selected color (optional)
   * @param {number} quantityToAdd - Quantity to add
   * @returns {Promise<Object|null>} - Updated cart document or null
   */
  async incrementCartItemQuantity(
    userId,
    productId,
    selectedSize,
    selectedColor,
    quantityToAdd
  ) {
    const matchQuery = {
      user: userId,
      'items.product': productId,
    };

    if (selectedSize) {
      matchQuery['items.selectedSize'] = selectedSize;
    }
    if (selectedColor) {
      matchQuery['items.selectedColor'] = selectedColor;
    }

    const updatedCart = await Cart.findOneAndUpdate(
      matchQuery,
      {
        $inc: { 'items.$.quantity': quantityToAdd },
      },
      {
        new: true,
        runValidators: true,
      }
    ).populate({
      path: 'items.product',
      select:
        'product_name final_price main_image in_stock all_available_sizes color currency',
    });

    // Manually calculate totals since findOneAndUpdate doesn't trigger pre('save')
    if (updatedCart && updatedCart.items) {
      updatedCart.totalItems = updatedCart.items.reduce(
        (total, item) => total + item.quantity,
        0
      );
      updatedCart.totalAmount = updatedCart.items.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      );

      // Save to persist the calculated totals
      await updatedCart.save();
    }

    return updatedCart;
  }
}

export default new CartDAO();
