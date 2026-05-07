import mongoose from 'mongoose';

const rewardShopSchema = new mongoose.Schema(
  {
    // Item Information
    itemName: {
      type: String,
      required: true,
      trim: true,
    },
    itemDescription: {
      type: String,
      required: true,
    },
    itemType: {
      type: String,
      enum: ['design', 'border', 'badge', 'effect', 'boost', 'mystery_box', 'premium_pack'],
      required: true,
    },
    category: {
      type: String,
      enum: ['profile', 'effects', 'boosts', 'mystery', 'premium'],
      default: 'profile',
    },

    // Pricing
    diamondPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    coinPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    realMoneyPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      enum: ['USD', 'BDT', 'INR', 'EUR'],
      default: 'USD',
    },

    // Item Details
    rarity: {
      type: String,
      enum: ['common', 'rare', 'epic', 'legendary'],
      default: 'common',
    },
    itemColor: String,
    itemIcon: String,
    itemPreview: String,

    // Availability
    isAvailable: {
      type: Boolean,
      default: true,
    },
    stock: {
      type: Number,
      default: -1, // -1 means unlimited
    },
    soldCount: {
      type: Number,
      default: 0,
    },

    // Duration & Expiry
    isDuration: {
      type: Boolean,
      default: false,
    },
    durationDays: {
      type: Number,
      default: 30,
    },

    // Discount & Promotion
    discountPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    discountUntil: Date,
    isOnSale: {
      type: Boolean,
      default: false,
    },
    saleStartDate: Date,
    saleEndDate: Date,

    // Boost Details (for boost items)
    boostMultiplier: {
      type: Number,
      default: 1,
    },
    boostType: {
      type: String,
      enum: ['double_diamonds', 'triple_diamonds', 'weekend_bonus', 'event_bonus', 'none'],
      default: 'none',
    },

    // Mystery Box Details
    isMysteryBox: {
      type: Boolean,
      default: false,
    },
    possibleRewards: [
      {
        item: String,
        rarity: String,
        probability: Number, // 0-100
      },
    ],

    // Statistics
    purchaseCount: {
      type: Number,
      default: 0,
    },
    totalDiamondSpent: {
      type: Number,
      default: 0,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },

    // Admin Controls
    requiresApproval: {
      type: Boolean,
      default: false,
    },
    isApproved: {
      type: Boolean,
      default: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: Date,

    // SEO & Discovery
    tags: [String],
    searchKeywords: [String],
    featured: {
      type: Boolean,
      default: false,
    },
    featuredUntil: Date,

    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Indexes
rewardShopSchema.index({ itemType: 1 });
rewardShopSchema.index({ category: 1 });
rewardShopSchema.index({ rarity: 1 });
rewardShopSchema.index({ isAvailable: 1 });
rewardShopSchema.index({ featured: 1 });
rewardShopSchema.index({ isOnSale: 1 });
rewardShopSchema.index({ createdAt: -1 });

// Virtual for discounted price
rewardShopSchema.virtual('discountedPrice').get(function () {
  if (this.discountPercentage > 0) {
    return Math.floor(this.diamondPrice * (1 - this.discountPercentage / 100));
  }
  return this.diamondPrice;
});

// Method to check if item is in stock
rewardShopSchema.methods.isInStock = function () {
  if (this.stock === -1) return true; // Unlimited stock
  return this.stock > 0;
};

// Method to purchase item
rewardShopSchema.methods.purchase = async function () {
  if (!this.isAvailable) {
    throw new Error('Item is not available');
  }

  if (!this.isInStock()) {
    throw new Error('Item is out of stock');
  }

  if (this.stock !== -1) {
    this.stock -= 1;
  }

  this.soldCount += 1;
  this.purchaseCount += 1;
  this.totalDiamondSpent += this.discountedPrice;

  return this.save();
};

// Method to get actual price (considering discounts)
rewardShopSchema.methods.getActualPrice = function () {
  const now = new Date();

  // Check if discount is still active
  if (this.discountPercentage > 0 && this.discountUntil && this.discountUntil > now) {
    return this.discountedPrice;
  }

  // Check if sale is active
  if (this.isOnSale && this.saleStartDate && this.saleEndDate) {
    if (now >= this.saleStartDate && now <= this.saleEndDate) {
      return this.discountedPrice;
    }
  }

  return this.diamondPrice;
};

// Method to apply discount
rewardShopSchema.methods.applyDiscount = async function (percentage, durationDays = 7) {
  this.discountPercentage = percentage;
  this.discountUntil = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
  return this.save();
};

// Method to start sale
rewardShopSchema.methods.startSale = async function (durationDays = 7) {
  this.isOnSale = true;
  this.saleStartDate = new Date();
  this.saleEndDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
  return this.save();
};

// Method to end sale
rewardShopSchema.methods.endSale = async function () {
  this.isOnSale = false;
  this.saleStartDate = null;
  this.saleEndDate = null;
  return this.save();
};

// Method to add review
rewardShopSchema.methods.addReview = async function (rating) {
  if (rating < 0 || rating > 5) {
    throw new Error('Rating must be between 0 and 5');
  }

  const totalRating = this.averageRating * this.reviewCount + rating;
  this.reviewCount += 1;
  this.averageRating = totalRating / this.reviewCount;

  return this.save();
};

// Method to feature item
rewardShopSchema.methods.feature = async function (durationDays = 7) {
  this.featured = true;
  this.featuredUntil = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
  return this.save();
};

// Method to unfeature item
rewardShopSchema.methods.unfeature = async function () {
  this.featured = false;
  this.featuredUntil = null;
  return this.save();
};

export default mongoose.model('RewardShop', rewardShopSchema);
