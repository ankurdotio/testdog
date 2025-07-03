import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    razorpayOrderId: {
      type: String,
      required: true,
      unique: true,
    },
    razorpayPaymentId: {
      type: String,
      sparse: true, // Allow null values but ensure uniqueness when present
    },
    razorpaySignature: {
      type: String,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: 'INR',
      enum: ['USD', 'INR', 'EUR', 'GBP'],
    },
    status: {
      type: String,
      required: true,
      enum: ['created', 'attempted', 'paid', 'failed', 'cancelled', 'refunded'],
      default: 'created',
    },
    orderType: {
      type: String,
      required: true,
      enum: ['cart', 'single_product'],
    },
    // For cart payments
    cartItems: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
        },
        quantity: {
          type: Number,
          min: 1,
        },
        price: {
          type: Number,
          min: 0,
        },
        priceInINR: {
          type: Number,
          min: 0,
        },
        originalCurrency: {
          type: String,
          enum: ['USD', 'INR', 'EUR', 'GBP'],
        },
        selectedSize: String,
        selectedColor: String,
      },
    ],
    // For single product payments
    singleProduct: {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
      quantity: {
        type: Number,
        min: 1,
      },
      price: {
        type: Number,
        min: 0,
      },
      priceInINR: {
        type: Number,
        min: 0,
      },
      originalCurrency: {
        type: String,
        enum: ['USD', 'INR', 'EUR', 'GBP'],
      },
      selectedSize: String,
      selectedColor: String,
    },
    // Delivery information
    shippingAddress: {
      fullName: String,
      address: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
      phone: String,
    },
    notes: {
      type: String,
      maxlength: 500,
    },
    // Payment timestamps
    createdAt: {
      type: Date,
      default: Date.now,
    },
    paidAt: {
      type: Date,
    },
    failedAt: {
      type: Date,
    },
    // Razorpay webhook data
    webhookData: {
      type: mongoose.Schema.Types.Mixed,
    },
    // Refund information
    refundInfo: {
      refundId: String,
      refundAmount: Number,
      refundReason: String,
      refundedAt: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
paymentSchema.index({ user: 1, status: 1 });
paymentSchema.index({ createdAt: -1 });

// Virtual for formatted amount
paymentSchema.virtual('formattedAmount').get(function () {
  return `${this.currency} ${(this.amount / 100).toFixed(2)}`;
});

// Methods
paymentSchema.methods.markAsPaid = function (paymentId, signature) {
  this.status = 'paid';
  this.razorpayPaymentId = paymentId;
  this.razorpaySignature = signature;
  this.paidAt = new Date();
  return this.save();
};

paymentSchema.methods.markAsFailed = function (reason) {
  this.status = 'failed';
  this.failedAt = new Date();
  this.notes = reason;
  return this.save();
};

paymentSchema.methods.markAsRefunded = function (refundData) {
  this.status = 'refunded';
  this.refundInfo = {
    refundId: refundData.refundId,
    refundAmount: refundData.amount,
    refundReason: refundData.reason,
    refundedAt: new Date(),
  };
  return this.save();
};

// Static methods
paymentSchema.statics.findByOrderId = function (orderId) {
  return this.findOne({ orderId });
};

paymentSchema.statics.findByRazorpayOrderId = function (razorpayOrderId) {
  return this.findOne({ razorpayOrderId });
};

paymentSchema.statics.getUserPayments = function (userId, status = null) {
  const query = { user: userId };
  if (status) query.status = status;
  return this.find(query)
    .populate('cartItems.product', 'product_name main_image final_price')
    .populate('singleProduct.product', 'product_name main_image final_price')
    .sort({ createdAt: -1 });
};

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
