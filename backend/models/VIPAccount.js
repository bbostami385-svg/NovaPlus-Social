import mongoose from 'mongoose';

const vipAccountSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },

    // VIP Tier
    vipTier: {
      type: String,
      enum: ['silver', 'gold', 'platinum', 'diamond'],
      required: true,
    },
    tierLevel: {
      type: Number,
      required: true,
    }, // 1-4

    // Subscription Details
    subscriptionStatus: {
      type: String,
      enum: ['active', 'expired', 'cancelled', 'suspended'],
      default: 'active',
    },
    subscriptionStartDate: {
      type: Date,
      default: Date.now,
    },
    subscriptionEndDate: {
      type: Date,
      required: true,
    },
    subscriptionDuration: {
      type: String,
      enum: ['1-month', '3-months', '6-months', '1-year'],
      required: true,
    },

    // Payment Information
    paymentMethod: {
      type: String,
      enum: ['credit_card', 'debit_card', 'diamond', 'coin', 'wallet', 'paypal', 'stripe'],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    paymentId: String,
    transactionId: String,
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'USD',
    },

    // Auto-Renewal
    autoRenewal: {
      type: Boolean,
      default: true,
    },
    renewalDate: Date,
    renewalAmount: Number,

    // VIP Features
    features: {
      advancedAnalytics: {
        type: Boolean,
        default: false,
      },
      customBranding: {
        type: Boolean,
        default: false,
      },
      priorityVisibilityBoost: {
        type: Boolean,
        default: false,
      },
      prioritySearchListing: {
        type: Boolean,
        default: false,
      },
      advancedCommunicationTools: {
        type: Boolean,
        default: false,
      },
      secureMessaging: {
        type: Boolean,
        default: false,
      },
      exclusiveUIThemes: {
        type: Boolean,
        default: false,
      },
      prioritySupport: {
        type: Boolean,
        default: false,
      },
      customDomain: {
        type: Boolean,
        default: false,
      },
      advancedReporting: {
        type: Boolean,
        default: false,
      },
    },

    // Custom Branding
    customBrandingSettings: {
      profileTheme: String,
      accentColor: String,
      customLogo: String,
      customBanner: String,
      customDomain: String,
    },

    // Analytics Access
    analyticsAccess: {
      detailedMetrics: {
        type: Boolean,
        default: false,
      },
      customReports: {
        type: Boolean,
        default: false,
      },
      predictiveAnalytics: {
        type: Boolean,
        default: false,
      },
      competitorAnalysis: {
        type: Boolean,
        default: false,
      },
      audienceInsights: {
        type: Boolean,
        default: false,
      },
    },

    // Priority Settings
    priorityBoost: {
      searchRanking: {
        type: Number,
        default: 0,
      }, // 0-100 boost percentage
      visibilityBoost: {
        type: Number,
        default: 0,
      }, // 0-100 boost percentage
      recommendationFrequency: {
        type: Number,
        default: 0,
      }, // times per week
      boostStartDate: Date,
      boostEndDate: Date,
    },

    // VIP Badge
    vipBadge: {
      type: Boolean,
      default: true,
    },
    badgeColor: {
      type: String,
      default: '#FFD700',
    }, // Gold color by default

    // Support
    supportLevel: {
      type: String,
      enum: ['standard', 'priority', 'dedicated'],
      default: 'priority',
    },
    dedicatedManager: String, // User ID of assigned manager
    supportHoursPerMonth: {
      type: Number,
      default: 0,
    },
    consultationAvailable: {
      type: Boolean,
      default: false,
    },

    // Usage Tracking
    usage: {
      analyticsReportsGenerated: {
        type: Number,
        default: 0,
      },
      customizationsApplied: {
        type: Number,
        default: 0,
      },
      supportTicketsUsed: {
        type: Number,
        default: 0,
      },
      consultationHoursUsed: {
        type: Number,
        default: 0,
      },
    },

    // Billing History
    billingHistory: [
      {
        date: Date,
        amount: Number,
        status: String,
        paymentMethod: String,
        transactionId: String,
        description: String,
      },
    ],

    // Discounts & Promotions
    promoCode: String,
    discountPercentage: {
      type: Number,
      default: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },

    // Notifications
    expiryNotifications: {
      sevenDaysNotified: {
        type: Boolean,
        default: false,
      },
      threeDaysNotified: {
        type: Boolean,
        default: false,
      },
      oneDayNotified: {
        type: Boolean,
        default: false,
      },
    },

    // Feedback & Rating
    feedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
      },
      review: String,
      wouldRenew: Boolean,
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
vipAccountSchema.index({ userId: 1 });
vipAccountSchema.index({ vipTier: 1 });
vipAccountSchema.index({ subscriptionStatus: 1 });
vipAccountSchema.index({ subscriptionEndDate: 1 });

// Methods
vipAccountSchema.methods.isExpired = function () {
  return new Date() > this.subscriptionEndDate;
};

vipAccountSchema.methods.isActive = function () {
  return this.subscriptionStatus === 'active' && !this.isExpired();
};

vipAccountSchema.methods.daysRemaining = function () {
  const now = new Date();
  if (this.isExpired()) return 0;
  const diff = this.subscriptionEndDate - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

vipAccountSchema.methods.renewSubscription = function (newTier, newDuration, newAmount) {
  this.vipTier = newTier;
  this.subscriptionStartDate = new Date();
  this.subscriptionEndDate = new Date(Date.now() + this.getDurationInDays(newDuration) * 24 * 60 * 60 * 1000);
  this.subscriptionDuration = newDuration;
  this.amount = newAmount;
  this.subscriptionStatus = 'active';
  return this.save();
};

vipAccountSchema.methods.getDurationInDays = function (duration) {
  const durationMap = {
    '1-month': 30,
    '3-months': 90,
    '6-months': 180,
    '1-year': 365,
  };
  return durationMap[duration] || 30;
};

vipAccountSchema.methods.cancelSubscription = function (reason = '') {
  this.subscriptionStatus = 'cancelled';
  return this.save();
};

vipAccountSchema.methods.addBillingRecord = function (billingData) {
  this.billingHistory.push({
    ...billingData,
    date: new Date(),
  });
  return this.save();
};

vipAccountSchema.methods.updateUsage = function (usageType) {
  if (usageType === 'report') {
    this.usage.analyticsReportsGenerated += 1;
  } else if (usageType === 'customization') {
    this.usage.customizationsApplied += 1;
  } else if (usageType === 'support') {
    this.usage.supportTicketsUsed += 1;
  } else if (usageType === 'consultation') {
    this.usage.consultationHoursUsed += 1;
  }
  return this.save();
};

vipAccountSchema.methods.applyPriorityBoost = function (durationDays) {
  this.priorityBoost.searchRanking = 50;
  this.priorityBoost.visibilityBoost = 50;
  this.priorityBoost.recommendationFrequency = 3;
  this.priorityBoost.boostStartDate = new Date();
  this.priorityBoost.boostEndDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
  return this.save();
};

vipAccountSchema.methods.submitFeedback = function (feedbackData) {
  this.feedback = feedbackData;
  return this.save();
};

export default mongoose.model('VIPAccount', vipAccountSchema);
