import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      max: 50,
      default: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    // Store selected product attributes
    selectedSize: {
      type: String,
    },
    selectedColor: {
      type: String,
    },
  },
  { _id: true }
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // One cart per user
      index: true, // Single index definition
    },
    items: [cartItemSchema],
    totalItems: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'INR', 'EUR', 'GBP'],
    },
  },
  {
    timestamps: true,
  }
);

// Additional indexes
cartSchema.index({ 'items.product': 1 });

// Calculate totals before saving
cartSchema.pre('save', function (next) {
  if (this.items && this.items.length > 0) {
    this.totalItems = this.items.reduce(
      (total, item) => total + item.quantity,
      0
    );
    this.totalAmount = this.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  } else {
    this.totalItems = 0;
    this.totalAmount = 0;
  }
  next();
});

const Cart = mongoose.model('Cart', cartSchema);

export default Cart;
