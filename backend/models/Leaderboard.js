import mongoose from 'mongoose';

const leaderboardSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    profileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AthleteProfile',
    },

    // Ranking Information
    globalRank: {
      type: Number,
      default: 0,
    },
    categoryRank: {
      type: Number,
      default: 0,
    },
    category: {
      type: String,
      enum: ['cricket', 'football', 'basketball', 'tennis', 'fitness', 'general', 'creator', 'influencer'],
      default: 'general',
    },
    timeFrameRank: {
      type: Number,
      default: 0,
    },
    timeFrame: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly', 'all_time'],
      default: 'all_time',
    },

    // Score Calculation
    totalScore: {
      type: Number,
      default: 0,
    },
    scoreBreakdown: {
      engagement: {
        type: Number,
        default: 0,
      },
      content: {
        type: Number,
        default: 0,
      },
      followers: {
        type: Number,
        default: 0,
      },
      verification: {
        type: Number,
        default: 0,
      },
      monetization: {
        type: Number,
        default: 0,
      },
      achievements: {
        type: Number,
        default: 0,
      },
      skills: {
        type: Number,
        default: 0,
      },
      reputation: {
        type: Number,
        default: 0,
      },
    },

    // Metrics
    metrics: {
      totalPosts: {
        type: Number,
        default: 0,
      },
      totalLikes: {
        type: Number,
        default: 0,
      },
      totalComments: {
        type: Number,
        default: 0,
      },
      totalShares: {
        type: Number,
        default: 0,
      },
      totalFollowers: {
        type: Number,
        default: 0,
      },
      engagementRate: {
        type: Number,
        default: 0,
      },
      averageLikesPerPost: {
        type: Number,
        default: 0,
      },
      averageCommentsPerPost: {
        type: Number,
        default: 0,
      },
    },

    // Ranking History
    rankingHistory: [
      {
        date: Date,
        rank: Number,
        score: Number,
        category: String,
        timeFrame: String,
      },
    ],

    // Performance Trend
    trend: {
      type: String,
      enum: ['rising', 'stable', 'declining'],
      default: 'stable',
    },
    trendPercentage: {
      type: Number,
      default: 0,
    },
    previousRank: Number,
    rankChange: Number,

    // Badges & Recognition
    badges: [
      {
        badgeName: String,
        badgeType: String, // 'top_10', 'top_100', 'rising_star', 'consistent_performer'
        earnedAt: Date,
      },
    ],

    // Tier
    tier: {
      type: String,
      enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'legend'],
      default: 'bronze',
    },
    tierPoints: {
      type: Number,
      default: 0,
    },

    // Achievements Count
    achievementsCount: {
      type: Number,
      default: 0,
    },
    unlockedAchievements: {
      type: Number,
      default: 0,
    },

    // Last Updated
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    nextUpdateSchedule: Date,

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
leaderboardSchema.index({ userId: 1 });
leaderboardSchema.index({ globalRank: 1 });
leaderboardSchema.index({ category: 1 });
leaderboardSchema.index({ totalScore: -1 });
leaderboardSchema.index({ tier: 1 });

// Methods
leaderboardSchema.methods.calculateScore = function () {
  const weights = {
    engagement: 0.25,
    content: 0.15,
    followers: 0.2,
    verification: 0.15,
    monetization: 0.1,
    achievements: 0.1,
    skills: 0.03,
    reputation: 0.02,
  };

  let totalScore = 0;
  Object.keys(this.scoreBreakdown).forEach((key) => {
    totalScore += this.scoreBreakdown[key] * (weights[key] || 0);
  });

  this.totalScore = Math.round(totalScore);
  return this.totalScore;
};

leaderboardSchema.methods.updateMetrics = function (metricsData) {
  Object.assign(this.metrics, metricsData);
  this.calculateScore();
  return this.save();
};

leaderboardSchema.methods.updateRank = function (newRank, newScore) {
  this.previousRank = this.globalRank;
  this.globalRank = newRank;
  this.totalScore = newScore;

  if (this.previousRank && this.globalRank < this.previousRank) {
    this.trend = 'rising';
    this.rankChange = this.previousRank - this.globalRank;
    this.trendPercentage = (this.rankChange / this.previousRank) * 100;
  } else if (this.previousRank && this.globalRank > this.previousRank) {
    this.trend = 'declining';
    this.rankChange = this.globalRank - this.previousRank;
    this.trendPercentage = (this.rankChange / this.previousRank) * 100;
  } else {
    this.trend = 'stable';
    this.rankChange = 0;
  }

  this.lastUpdated = new Date();
  return this.save();
};

leaderboardSchema.methods.updateTier = function () {
  if (this.globalRank <= 10) {
    this.tier = 'legend';
  } else if (this.globalRank <= 100) {
    this.tier = 'diamond';
  } else if (this.globalRank <= 1000) {
    this.tier = 'platinum';
  } else if (this.globalRank <= 10000) {
    this.tier = 'gold';
  } else if (this.globalRank <= 100000) {
    this.tier = 'silver';
  } else {
    this.tier = 'bronze';
  }
  return this.save();
};

leaderboardSchema.methods.addBadge = function (badgeName, badgeType) {
  this.badges.push({
    badgeName,
    badgeType,
    earnedAt: new Date(),
  });
  return this.save();
};

leaderboardSchema.methods.recordRankingHistory = function () {
  this.rankingHistory.push({
    date: new Date(),
    rank: this.globalRank,
    score: this.totalScore,
    category: this.category,
    timeFrame: this.timeFrame,
  });

  if (this.rankingHistory.length > 100) {
    this.rankingHistory.shift();
  }

  return this.save();
};

export default mongoose.model('Leaderboard', leaderboardSchema);
