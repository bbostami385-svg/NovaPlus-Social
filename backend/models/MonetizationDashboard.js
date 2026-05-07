import mongoose from 'mongoose';

const monetizationDashboardSchema = new mongoose.Schema(
  {
    athleteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AthleteProfile',
      required: true,
      unique: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Total Earnings
    totalEarnings: {
      type: Number,
      default: 0,
    },
    totalEarningsThisMonth: {
      type: Number,
      default: 0,
    },
    totalEarningsThisYear: {
      type: Number,
      default: 0,
    },

    // Revenue Streams
    revenueStreams: {
      sponsorships: {
        total: {
          type: Number,
          default: 0,
        },
        thisMonth: {
          type: Number,
          default: 0,
        },
        activeDeals: {
          type: Number,
          default: 0,
        },
        pendingOffers: {
          type: Number,
          default: 0,
        },
      },
      fanSubscription: {
        total: {
          type: Number,
          default: 0,
        },
        thisMonth: {
          type: Number,
          default: 0,
        },
        activeSubscribers: {
          type: Number,
          default: 0,
        },
        monthlyRecurring: {
          type: Number,
          default: 0,
        },
      },
      nftSales: {
        total: {
          type: Number,
          default: 0,
        },
        thisMonth: {
          type: Number,
          default: 0,
        },
        cardsSold: {
          type: Number,
          default: 0,
        },
        royalties: {
          type: Number,
          default: 0,
        },
      },
      merchandise: {
        total: {
          type: Number,
          default: 0,
        },
        thisMonth: {
          type: Number,
          default: 0,
        },
        itemsSold: {
          type: Number,
          default: 0,
        },
      },
      premiumContent: {
        total: {
          type: Number,
          default: 0,
        },
        thisMonth: {
          type: Number,
          default: 0,
        },
        contentViews: {
          type: Number,
          default: 0,
        },
      },
      advertising: {
        total: {
          type: Number,
          default: 0,
        },
        thisMonth: {
          type: Number,
          default: 0,
        },
        impressions: {
          type: Number,
          default: 0,
        },
      },
      donations: {
        total: {
          type: Number,
          default: 0,
        },
        thisMonth: {
          type: Number,
          default: 0,
        },
        donorCount: {
          type: Number,
          default: 0,
        },
      },
      coaching: {
        total: {
          type: Number,
          default: 0,
        },
        thisMonth: {
          type: Number,
          default: 0,
        },
        activeClients: {
          type: Number,
          default: 0,
        },
      },
    },

    // Expenses & Deductions
    expenses: {
      platformFee: {
        type: Number,
        default: 0,
      },
      paymentProcessingFee: {
        type: Number,
        default: 0,
      },
      taxDeductions: {
        type: Number,
        default: 0,
      },
      refunds: {
        type: Number,
        default: 0,
      },
      chargebacks: {
        type: Number,
        default: 0,
      },
      other: {
        type: Number,
        default: 0,
      },
    },

    // Net Earnings
    netEarnings: {
      type: Number,
      default: 0,
    },
    netEarningsThisMonth: {
      type: Number,
      default: 0,
    },

    // Wallet & Balance
    wallet: {
      balance: {
        type: Number,
        default: 0,
      },
      currency: {
        type: String,
        default: 'USD',
      },
      lastUpdated: Date,
    },

    // Pending Payouts
    pendingPayouts: [
      {
        amount: Number,
        currency: String,
        source: String,
        dueDate: Date,
        status: {
          type: String,
          enum: ['pending', 'processing', 'completed', 'failed'],
          default: 'pending',
        },
      },
    ],

    // Payout History
    payoutHistory: [
      {
        date: Date,
        amount: Number,
        currency: String,
        method: String, // 'bank_transfer', 'paypal', 'crypto'
        status: String,
        transactionId: String,
        description: String,
      },
    ],

    // Performance Metrics
    metrics: {
      profileViews: {
        type: Number,
        default: 0,
      },
      profileViewsThisMonth: {
        type: Number,
        default: 0,
      },
      engagement: {
        type: Number,
        default: 0,
      },
      engagementThisMonth: {
        type: Number,
        default: 0,
      },
      followers: {
        type: Number,
        default: 0,
      },
      followersGainedThisMonth: {
        type: Number,
        default: 0,
      },
      conversionRate: {
        type: Number,
        default: 0,
      },
    },

    // Sponsorship Info
    sponsorships: [
      {
        sponsorId: mongoose.Schema.Types.ObjectId,
        sponsorName: String,
        dealAmount: Number,
        startDate: Date,
        endDate: Date,
        status: String,
        paymentSchedule: String,
      },
    ],

    // Tax Information
    taxInfo: {
      taxId: String,
      taxRate: {
        type: Number,
        default: 0,
      },
      taxFilingStatus: String,
      lastTaxYear: Number,
    },

    // Bank Details (Encrypted)
    bankDetails: {
      accountHolderName: String,
      accountNumber: String, // Encrypted
      routingNumber: String, // Encrypted
      bankName: String,
      accountType: String,
      isVerified: Boolean,
    },

    // Settings
    minimumPayoutThreshold: {
      type: Number,
      default: 100,
    },
    payoutFrequency: {
      type: String,
      enum: ['weekly', 'bi-weekly', 'monthly'],
      default: 'monthly',
    },
    autoPayoutEnabled: {
      type: Boolean,
      default: false,
    },

    // Analytics
    analytics: {
      topRevenueSource: String,
      bestPerformingMonth: String,
      averageMonthlyEarnings: Number,
      growthRate: Number,
      lastUpdated: Date,
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
monetizationDashboardSchema.index({ athleteId: 1 });
monetizationDashboardSchema.index({ userId: 1 });

// Methods
monetizationDashboardSchema.methods.calculateNetEarnings = function () {
  const totalExpenses =
    this.expenses.platformFee +
    this.expenses.paymentProcessingFee +
    this.expenses.taxDeductions +
    this.expenses.refunds +
    this.expenses.chargebacks +
    this.expenses.other;

  this.netEarnings = this.totalEarnings - totalExpenses;
  return this.netEarnings;
};

monetizationDashboardSchema.methods.addRevenue = function (source, amount, month = new Date()) {
  this.totalEarnings += amount;
  this.revenueStreams[source].total += amount;

  const currentMonth = new Date();
  if (month.getMonth() === currentMonth.getMonth() && month.getFullYear() === currentMonth.getFullYear()) {
    this.totalEarningsThisMonth += amount;
    this.revenueStreams[source].thisMonth += amount;
  }

  this.calculateNetEarnings();
  return this.save();
};

monetizationDashboardSchema.methods.addExpense = function (expenseType, amount) {
  this.expenses[expenseType] += amount;
  this.calculateNetEarnings();
  return this.save();
};

monetizationDashboardSchema.methods.requestPayout = function (amount, method = 'bank_transfer') {
  this.pendingPayouts.push({
    amount,
    currency: this.wallet.currency,
    source: method,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    status: 'pending',
  });
  return this.save();
};

monetizationDashboardSchema.methods.recordPayout = function (payoutData) {
  this.payoutHistory.push({
    ...payoutData,
    date: new Date(),
  });
  this.wallet.balance -= payoutData.amount;
  return this.save();
};

monetizationDashboardSchema.methods.updateMetrics = function (metricsData) {
  Object.assign(this.metrics, metricsData);
  return this.save();
};

monetizationDashboardSchema.methods.getTopRevenueSource = function () {
  const sources = Object.keys(this.revenueStreams);
  let topSource = sources[0];
  let maxEarnings = this.revenueStreams[topSource].total;

  sources.forEach((source) => {
    if (this.revenueStreams[source].total > maxEarnings) {
      topSource = source;
      maxEarnings = this.revenueStreams[source].total;
    }
  });

  return topSource;
};

export default mongoose.model('MonetizationDashboard', monetizationDashboardSchema);
