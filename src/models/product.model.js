import mongoose from 'mongoose';

const otherAttributeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    value: { type: String, required: true },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    product_name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    initial_price: {
      type: Number,
      required: true,
      min: 0,
    },
    final_price: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      enum: ['USD', 'INR', 'EUR', 'GBP'], // extend as needed
    },
    in_stock: {
      type: Boolean,
      default: true,
    },
    color: {
      type: String,
    },
    size: {
      type: String,
    },
    main_image: {
      type: String,
      required: true,
    },
    category_tree: {
      type: [String],
      default: [],
    },
    image_count: {
      type: Number,
      default: 1,
    },
    image_urls: {
      type: [String],
      default: [],
    },
    other_attributes: {
      type: [otherAttributeSchema],
      default: [],
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    root_category: {
      type: String,
    },
    category: {
      type: String,
    },
    all_available_sizes: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model('Product', productSchema);

export default Product;
