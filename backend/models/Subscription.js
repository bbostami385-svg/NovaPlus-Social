import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    athleteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AthleteProfile',
      required: true,
    },
    tierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubscriptionTier',
      required: true,
    },
    tierName: {
      type: String,
      enum: ['free', 'professional', 'elite', 'legend'],
      required: true,
    },

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
    diamondSpent: {
      type: Number,
      default: 0,
    },

    // Renewal Settings
    autoRenewal: {
      type: Boolean,
      default: true,
    },
    renewalDate: Date,
    renewalAmount: Number,
    renewalPaymentMethod: String,

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
    suspensionDate: Date,
    suspensionReason: String,

    // Usage Tracking
    usage: {
      videoUploads: {
        type: Number,
        default: 0,
      },
      storageUsedGB: {
        type: Number,
        default: 0,
      },
      connectionsCount: {
        type: Number,
        default: 0,
      },
      sponsorOffers: {
        type: Number,
        default: 0,
      },
      hiringOffers: {
        type: Number,
        default: 0,
      },
      lastUpdated: Date,
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
    appliedCoupon: String,

    // Features Enabled
    enabledFeatures: [String],

    // Metadata
    notes: String,
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
subscriptionSchema.index({ userId: 1 });
subscriptionSchema.index({ athleteId: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ endDate: 1 });
subscriptionSchema.index({ paymentStatus: 1 });

// Methods
subscriptionSchema.methods.isExpired = function () {
  return new Date() > this.endDate;
};

subscriptionSchema.methods.isActive = function () {
  return this.status === 'active' && !this.isExpired();
};

subscriptionSchema.methods.daysRemaining = function () {
  const now = new Date();
  if (this.isExpired()) return 0;
  const diff = this.endDate - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

subscriptionSchema.methods.renewSubscription = function (newTierId, newDuration) {
  this.startDate = new Date();
  this.endDate = new Date(Date.now() + this.durationInDays * 24 * 60 * 60 * 1000);
  this.duration = newDuration;
  this.tierId = newTierId;
  this.status = 'active';
  this.isActive = true;
  return this.save();
};

subscriptionSchema.methods.cancelSubscription = function (reason = '') {
  this.status = 'cancelled';
  this.isActive = false;
  this.cancellationDate = new Date();
  this.cancellationReason = reason;
  return this.save();
};

subscriptionSchema.methods.suspendSubscription = function (reason = '') {
  this.status = 'suspended';
  this.isActive = false;
  this.suspensionDate = new Date();
  this.suspensionReason = reason;
  return this.save();
};

subscriptionSchema.methods.recordUsage = function (usageData) {
  Object.assign(this.usage, usageData);
  this.usage.lastUpdated = new Date();
  return this.save();
};

subscriptionSchema.methods.addBillingRecord = function (billingData) {
  this.billingHistory.push({
    ...billingData,
    date: new Date(),
  });
  return this.save();
};

subscriptionSchema.methods.applyDiscount = function (discountData) {
  this.promoCode = discountData.promoCode;
  this.discountPercentage = discountData.percentage || 0;
  this.discountAmount = discountData.amount || 0;
  return this.save();
};

export default mongoose.model('Subscription', subscriptionSchema);
