import mongoose from 'mongoose';

const diamondTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Transaction Type
    transactionType: {
      type: String,
      enum: ['earn', 'spend', 'refund', 'bonus', 'purchase', 'gift', 'reward'],
      required: true,
    },

    // Transaction Details
    amount: {
      type: Number,
      required: true,
    },
    source: {
      type: String,
      enum: [
        'post',
        'like',
        'share',
        'daily_login',
        'invite',
        'bonus',
        'level_up',
        'shop_purchase',
        'gift_received',
        'referral',
        'event',
        'achievement',
        'admin',
      ],
      required: true,
    },
    description: String,

    // Related Data
    relatedPostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
    },
    relatedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    relatedShopItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RewardShop',
    },

    // Balance Information
    balanceBefore: Number,
    balanceAfter: Number,

    // Multiplier Applied
    multiplier: {
      type: Number,
      default: 1,
    },
    baseAmount: Number,

    // Status
    status: {
      type: String,
      enum: ['completed', 'pending', 'failed', 'cancelled', 'refunded'],
      default: 'completed',
    },
    failureReason: String,

    // Metadata
    ipAddress: String,
    deviceInfo: String,
    location: String,

    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: Date,
    refundedAt: Date,
  },
  { timestamps: true }
);

// Indexes
diamondTransactionSchema.index({ userId: 1 });
diamondTransactionSchema.index({ transactionType: 1 });
diamondTransactionSchema.index({ source: 1 });
diamondTransactionSchema.index({ createdAt: -1 });
diamondTransactionSchema.index({ status: 1 });
diamondTransactionSchema.index({ userId: 1, createdAt: -1 });

// Method to get transaction summary
diamondTransactionSchema.statics.getUserSummary = async function (userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const summary = await this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        createdAt: { $gte: startDate },
        status: 'completed',
      },
    },
    {
      $group: {
        _id: '$transactionType',
        count: { $sum: 1 },
        total: { $sum: '$amount' },
      },
    },
  ]);

  return summary;
};

// Method to get earning breakdown
diamondTransactionSchema.statics.getEarningBreakdown = async function (userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const breakdown = await this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        transactionType: 'earn',
        createdAt: { $gte: startDate },
        status: 'completed',
      },
    },
    {
      $group: {
        _id: '$source',
        count: { $sum: 1 },
        total: { $sum: '$amount' },
      },
    },
    {
      $sort: { total: -1 },
    },
  ]);

  return breakdown;
};

// Method to get spending breakdown
diamondTransactionSchema.statics.getSpendingBreakdown = async function (userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const breakdown = await this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        transactionType: 'spend',
        createdAt: { $gte: startDate },
        status: 'completed',
      },
    },
    {
      $group: {
        _id: '$source',
        count: { $sum: 1 },
        total: { $sum: '$amount' },
      },
    },
    {
      $sort: { total: -1 },
    },
  ]);

  return breakdown;
};

// Method to get daily earning trend
diamondTransactionSchema.statics.getDailyEarningTrend = async function (userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const trend = await this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        transactionType: 'earn',
        createdAt: { $gte: startDate },
        status: 'completed',
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
        },
        count: { $sum: 1 },
        total: { $sum: '$amount' },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);

  return trend;
};

// Method to check fraud
diamondTransactionSchema.statics.checkFraud = async function (userId, timeWindowMinutes = 5) {
  const timeWindow = new Date(Date.now() - timeWindowMinutes * 60 * 1000);

  const recentTransactions = await this.countDocuments({
    userId: new mongoose.Types.ObjectId(userId),
    transactionType: 'earn',
    createdAt: { $gte: timeWindow },
    status: 'completed',
  });

  // Flag if more than 10 transactions in 5 minutes
  return recentTransactions > 10;
};

export default mongoose.model('DiamondTransaction', diamondTransactionSchema);
