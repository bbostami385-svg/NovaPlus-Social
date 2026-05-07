import mongoose from 'mongoose';

const achievementSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Achievement Definition
    achievementId: {
      type: String,
      required: true,
    }, // e.g., 'first_post', 'hundred_followers'
    achievementName: {
      type: String,
      required: true,
    },
    description: String,
    category: {
      type: String,
      enum: ['social', 'content', 'engagement', 'monetization', 'verification', 'skill', 'milestone', 'special'],
      required: true,
    },

    // Achievement Details
    icon: String,
    badge: String,
    rarity: {
      type: String,
      enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
      default: 'common',
    },
    points: {
      type: Number,
      default: 0,
    },
    diamondReward: {
      type: Number,
      default: 0,
    },
    coinReward: {
      type: Number,
      default: 0,
    },

    // Progress
    progress: {
      current: {
        type: Number,
        default: 0,
      },
      target: {
        type: Number,
        required: true,
      },
      percentage: {
        type: Number,
        default: 0,
      },
    },

    // Status
    isUnlocked: {
      type: Boolean,
      default: false,
    },
    unlockedAt: Date,

    // Conditions
    conditions: {
      minFollowers: Number,
      minPosts: Number,
      minEngagement: Number,
      minVerificationLevel: String,
      minSubscriptionTier: String,
      requiredSkills: [String],
      requiredAchievements: [String],
      timeFrame: String, // e.g., '7_days', '30_days', '365_days'
    },

    // Visibility
    isPublic: {
      type: Boolean,
      default: true,
    },
    displayOnProfile: {
      type: Boolean,
      default: true,
    },

    // Metadata
    createdAt: {
      type: Date,
      default: Date.now,
    },
    unlockedDate: Date,
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index
achievementSchema.index({ userId: 1 });
achievementSchema.index({ achievementId: 1 });
achievementSchema.index({ isUnlocked: 1 });
achievementSchema.index({ category: 1 });

// Methods
achievementSchema.methods.updateProgress = function (currentValue) {
  this.progress.current = currentValue;
  this.progress.percentage = Math.round((currentValue / this.progress.target) * 100);

  if (this.progress.current >= this.progress.target && !this.isUnlocked) {
    this.isUnlocked = true;
    this.unlockedAt = new Date();
  }

  return this.save();
};

achievementSchema.methods.incrementProgress = function (amount = 1) {
  this.progress.current += amount;
  this.progress.percentage = Math.round((this.progress.current / this.progress.target) * 100);

  if (this.progress.current >= this.progress.target && !this.isUnlocked) {
    this.isUnlocked = true;
    this.unlockedAt = new Date();
  }

  return this.save();
};

achievementSchema.methods.unlock = function () {
  if (!this.isUnlocked) {
    this.isUnlocked = true;
    this.unlockedAt = new Date();
    this.progress.current = this.progress.target;
    this.progress.percentage = 100;
  }
  return this.save();
};

achievementSchema.methods.getRewards = function () {
  if (!this.isUnlocked) {
    return {
      points: 0,
      diamonds: 0,
      coins: 0,
    };
  }

  return {
    points: this.points,
    diamonds: this.diamondReward,
    coins: this.coinReward,
  };
};

export default mongoose.model('Achievement', achievementSchema);
