import mongoose from 'mongoose';

const fanSubscriptionSchema = new mongoose.Schema(
  {
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Subscription Tier
    tierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FanTier',
      required: true,
    },
    tierName: {
      type: String,
      required: true,
    },
    tierPrice: {
      type: Number,
      required: true,
    },
    tierBenefits: [String],

    // Subscription Details
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
    },
    duration: {
      type: String,
      enum: ['1-month', '3-months', '6-months', '1-year'],
      required: true,
    },
    durationInDays: {
      type: Number,
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

    // Renewal Settings
    autoRenewal: {
      type: Boolean,
      default: true,
    },
    renewalDate: Date,
    renewalAmount: Number,

    // Status
    status: {
      type: String,
      enum: ['active', 'expired', 'cancelled', 'suspended'],
      default: 'active',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    cancellationDate: Date,
    cancellationReason: String,

    // Exclusive Content Access
    exclusiveContent: [
      {
        contentId: mongoose.Schema.Types.ObjectId,
        title: String,
        type: {
          type: String,
          enum: ['post', 'video', 'image', 'document', 'live_stream'],
        },
        accessedAt: Date,
      },
    ],

    // Perks & Benefits
    perks: {
      exclusivePostsAccess: Boolean,
      earlyContentAccess: Boolean,
      personalMessages: Boolean,
      monthlyAMA: Boolean,
      discountCode: String,
      customBadge: Boolean,
      shoutout: Boolean,
      personalVideo: Boolean,
      mentorship: Boolean,
      customRequest: Boolean,
    },

    // Engagement Tracking
    engagement: {
      messagesReceived: {
        type: Number,
        default: 0,
      },
      contentAccessed: {
        type: Number,
        default: 0,
      },
      eventsAttended: {
        type: Number,
        default: 0,
      },
      lastEngagementDate: Date,
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

    // Feedback & Rating
    fanFeedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
      },
      review: String,
      wouldRenew: Boolean,
    },
    creatorFeedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
      },
      review: String,
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
fanSubscriptionSchema.index({ creatorId: 1 });
fanSubscriptionSchema.index({ fanId: 1 });
fanSubscriptionSchema.index({ status: 1 });
fanSubscriptionSchema.index({ endDate: 1 });

// Methods
fanSubscriptionSchema.methods.isExpired = function () {
  return new Date() > this.endDate;
};

fanSubscriptionSchema.methods.isActive = function () {
  return this.status === 'active' && !this.isExpired();
};

fanSubscriptionSchema.methods.daysRemaining = function () {
  const now = new Date();
  if (this.isExpired()) return 0;
  const diff = this.endDate - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

fanSubscriptionSchema.methods.renewSubscription = function (newTierId, newDuration, newAmount) {
  this.startDate = new Date();
  this.endDate = new Date(Date.now() + this.durationInDays * 24 * 60 * 60 * 1000);
  this.duration = newDuration;
  this.tierId = newTierId;
  this.amount = newAmount;
  this.status = 'active';
  this.isActive = true;
  return this.save();
};

fanSubscriptionSchema.methods.cancelSubscription = function (reason = '') {
  this.status = 'cancelled';
  this.isActive = false;
  this.cancellationDate = new Date();
  this.cancellationReason = reason;
  return this.save();
};

fanSubscriptionSchema.methods.addBillingRecord = function (billingData) {
  this.billingHistory.push({
    ...billingData,
    date: new Date(),
  });
  return this.save();
};

fanSubscriptionSchema.methods.recordEngagement = function (engagementType) {
  if (engagementType === 'message') {
    this.engagement.messagesReceived += 1;
  } else if (engagementType === 'content') {
    this.engagement.contentAccessed += 1;
  } else if (engagementType === 'event') {
    this.engagement.eventsAttended += 1;
  }
  this.engagement.lastEngagementDate = new Date();
  return this.save();
};

fanSubscriptionSchema.methods.submitFeedback = function (feedbackData, feedbackType = 'fan') {
  if (feedbackType === 'fan') {
    this.fanFeedback = feedbackData;
  } else if (feedbackType === 'creator') {
    this.creatorFeedback = feedbackData;
  }
  return this.save();
};

export default mongoose.model('FanSubscription', fanSubscriptionSchema);
