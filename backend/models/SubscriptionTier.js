import mongoose from 'mongoose';

const subscriptionTierSchema = new mongoose.Schema(
  {
    tierName: {
      type: String,
      enum: ['free', 'professional', 'elite', 'legend'],
      required: true,
      unique: true,
    },
    displayName: {
      type: String,
      required: true,
    },
    description: String,
    icon: String,
    color: String, // Color code for UI

    // Pricing
    pricing: {
      monthlyPrice: {
        type: Number,
        default: 0,
      },
      quarterlyPrice: {
        type: Number,
        default: 0,
      },
      annualPrice: {
        type: Number,
        default: 0,
      },
      currency: {
        type: String,
        default: 'USD',
      },
      // Diamond pricing alternative
      diamondPrice: {
        monthly: Number,
        quarterly: Number,
        annual: Number,
      },
    },

    // Duration Options
    durationOptions: [
      {
        duration: {
          type: String,
          enum: ['1-month', '3-months', '6-months', '1-year'],
        },
        days: Number,
        discount: {
          type: Number,
          default: 0,
        },
      },
    ],

    // Features
    features: [
      {
        featureName: String,
        description: String,
        included: Boolean,
        limit: Number, // null for unlimited
      },
    ],

    // Specific Features
    profileFeatures: {
      customProfileDesign: Boolean,
      animatedThemes: Boolean,
      premiumBadge: Boolean,
      highlightedProfile: Boolean,
      profileAnalytics: Boolean,
      advancedStats: Boolean,
      customBio: Boolean,
      multipleProfileImages: Boolean,
    },

    // Performance Features
    performanceFeatures: {
      videoHighlights: Boolean,
      matchAnalytics: Boolean,
      performanceTrends: Boolean,
      skillRatings: Boolean,
      fitnessTracking: Boolean,
      advancedMetrics: Boolean,
    },

    // Networking Features
    networkingFeatures: {
      sponsorshipOffers: Boolean,
      hiringOpportunities: Boolean,
      directMessaging: Boolean,
      networkingEvents: Boolean,
      coachAccess: Boolean,
      mentorshipProgram: Boolean,
    },

    // Monetization Features
    monetizationFeatures: {
      fanSubscription: Boolean,
      nftCards: Boolean,
      merchandise: Boolean,
      premiumContent: Boolean,
      donationLink: Boolean,
      affiliateProgram: Boolean,
    },

    // Analytics Features
    analyticsFeatures: {
      basicAnalytics: Boolean,
      advancedAnalytics: Boolean,
      customReports: Boolean,
      aiInsights: Boolean,
      competitorAnalysis: Boolean,
      forecastingTools: Boolean,
    },

    // Support Features
    supportFeatures: {
      emailSupport: Boolean,
      prioritySupport: Boolean,
      dedicatedManager: Boolean,
      consultationHours: Number, // hours per month
    },

    // Limits
    limits: {
      videoUploadsPerMonth: Number,
      storageGB: Number,
      maxConnections: Number,
      maxSponsors: Number,
      maxOffers: Number,
    },

    // Perks
    perks: [
      {
        perkName: String,
        description: String,
        value: String,
      },
    ],

    // Renewal Settings
    autoRenewal: {
      type: Boolean,
      default: true,
    },
    cancellationNotice: {
      type: Number,
      default: 7,
    }, // days before renewal

    // Status
    isActive: {
      type: Boolean,
      default: true,
    },
    displayOrder: {
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
subscriptionTierSchema.index({ tierName: 1 });
subscriptionTierSchema.index({ isActive: 1 });

// Methods
subscriptionTierSchema.methods.getPrice = function (duration, paymentMethod = 'fiat') {
  if (paymentMethod === 'diamond') {
    const durationMap = {
      '1-month': 'monthly',
      '3-months': 'quarterly',
      '6-months': 'quarterly',
      '1-year': 'annual',
    };
    return this.pricing.diamondPrice[durationMap[duration]];
  }

  const priceMap = {
    '1-month': this.pricing.monthlyPrice,
    '3-months': this.pricing.quarterlyPrice,
    '6-months': this.pricing.quarterlyPrice,
    '1-year': this.pricing.annualPrice,
  };

  return priceMap[duration] || 0;
};

subscriptionTierSchema.methods.getDurationInDays = function (duration) {
  const durationMap = {
    '1-month': 30,
    '3-months': 90,
    '6-months': 180,
    '1-year': 365,
  };
  return durationMap[duration] || 30;
};

subscriptionTierSchema.methods.getFeaturesList = function () {
  return this.features.filter((f) => f.included);
};

subscriptionTierSchema.methods.hasFeature = function (featureName) {
  return this.features.some((f) => f.featureName === featureName && f.included);
};

export default mongoose.model('SubscriptionTier', subscriptionTierSchema);
