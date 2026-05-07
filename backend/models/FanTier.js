import mongoose from 'mongoose';

const fanTierSchema = new mongoose.Schema(
  {
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Tier Information
    tierName: {
      type: String,
      required: true,
    },
    tierLevel: {
      type: Number,
      required: true,
    }, // 1, 2, 3, 4, etc.
    description: String,
    icon: String,
    color: String,

    // Pricing
    monthlyPrice: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    diamondPrice: Number,
    coinPrice: Number,

    // Tier Limits
    maxSubscribers: Number, // null for unlimited
    currentSubscribers: {
      type: Number,
      default: 0,
    },

    // Benefits & Perks
    benefits: [
      {
        benefitName: String,
        description: String,
        icon: String,
      },
    ],

    // Specific Perks
    perks: {
      exclusivePostsPerMonth: {
        type: Number,
        default: 0,
      },
      earlyContentAccess: {
        type: Boolean,
        default: false,
      },
      personalMessagesPerMonth: {
        type: Number,
        default: 0,
      },
      monthlyAMA: {
        type: Boolean,
        default: false,
      },
      discountPercentage: {
        type: Number,
        default: 0,
      },
      customBadge: {
        type: Boolean,
        default: false,
      },
      monthlyShoutout: {
        type: Boolean,
        default: false,
      },
      personalVideo: {
        type: Boolean,
        default: false,
      },
      mentorship: {
        type: Boolean,
        default: false,
      },
      customRequest: {
        type: Boolean,
        default: false,
      },
      prioritySupport: {
        type: Boolean,
        default: false,
      },
      accessToPrivateGroup: {
        type: Boolean,
        default: false,
      },
      exclusiveEvents: {
        type: Boolean,
        default: false,
      },
    },

    // Content Access
    contentAccess: [
      {
        contentType: String,
        accessLevel: {
          type: String,
          enum: ['none', 'limited', 'full'],
        },
      },
    ],

    // Discount & Promotions
    discountCode: String,
    promotionalOffer: String,
    discountPercentage: {
      type: Number,
      default: 0,
    },

    // Status
    isActive: {
      type: Boolean,
      default: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },

    // Analytics
    totalSubscribers: {
      type: Number,
      default: 0,
    },
    totalRevenue: {
      type: Number,
      default: 0,
    },
    averageRetention: {
      type: Number,
      default: 0,
    },
    conversionRate: {
      type: Number,
      default: 0,
    },

    // Metadata
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

// Index
fanTierSchema.index({ creatorId: 1 });
fanTierSchema.index({ tierLevel: 1 });
fanTierSchema.index({ isActive: 1 });

// Methods
fanTierSchema.methods.isFull = function () {
  if (!this.maxSubscribers) return false;
  return this.currentSubscribers >= this.maxSubscribers;
};

fanTierSchema.methods.addSubscriber = function () {
  if (!this.isFull()) {
    this.currentSubscribers += 1;
    this.totalSubscribers += 1;
    return this.save();
  }
  return Promise.reject(new Error('Tier is full'));
};

fanTierSchema.methods.removeSubscriber = function () {
  if (this.currentSubscribers > 0) {
    this.currentSubscribers -= 1;
    return this.save();
  }
  return this.save();
};

fanTierSchema.methods.addRevenue = function (amount) {
  this.totalRevenue += amount;
  return this.save();
};

fanTierSchema.methods.updateAnalytics = function (analyticsData) {
  Object.assign(this, analyticsData);
  return this.save();
};

export default mongoose.model('FanTier', fanTierSchema);
