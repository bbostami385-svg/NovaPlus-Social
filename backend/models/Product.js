import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['electronics', 'fashion', 'home', 'sports', 'books', 'other'],
    },
    subcategory: String,
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    originalPrice: Number,
    discount: {
      type: Number,
      min: 0,
      max: 100,
    },
    images: [
      {
        url: String,
        alt: String,
        isPrimary: Boolean,
      },
    ],
    stock: {
      type: Number,
      required: true,
      min: 0,
    },
    sku: {
      type: String,
      unique: true,
      sparse: true,
    },
    variants: [
      {
        name: String,
        options: [String],
      },
    ],
    specifications: {
      type: Map,
      of: String,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    reviews: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        rating: Number,
        title: String,
        comment: String,
        images: [String],
        helpful: Number,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    tags: [String],
    shipping: {
      weight: Number,
      dimensions: {
        length: Number,
        width: Number,
        height: Number,
      },
      shippingCost: Number,
      freeShippingAbove: Number,
      estimatedDelivery: Number, // In days
    },
    warranty: {
      duration: Number, // In months
      type: String,
    },
    returnPolicy: {
      days: Number,
      condition: String,
    },
    seo: {
      metaTitle: String,
      metaDescription: String,
      metaKeywords: [String],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    views: {
      type: Number,
      default: 0,
    },
    wishlistCount: {
      type: Number,
      default: 0,
    },
    cartCount: {
      type: Number,
      default: 0,
    },
    salesCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Indexes
productSchema.index({ sellerId: 1, createdAt: -1 });
productSchema.index({ category: 1 });
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ rating: -1 });
productSchema.index({ price: 1 });
productSchema.index({ isActive: 1 });

export default mongoose.model('Product', productSchema);
