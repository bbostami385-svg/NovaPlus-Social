import mongoose from 'mongoose';

const profileEvolutionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },

    // Current Profile Customization
    currentDesign: {
      type: String,
      enum: ['classic', 'neon', 'cyberpunk', 'holographic', 'cosmic', 'aurora', 'obsidian', 'platinum'],
      default: 'classic',
    },
    currentBorder: {
      type: String,
      enum: ['none', 'glow', 'neon', 'animated', 'premium', 'exclusive', 'legendary'],
      default: 'none',
    },
    currentBadges: [
      {
        type: String,
        enum: [
          'verified',
          'creator',
          'influencer',
          'diamond_master',
          'level_10',
          'level_25',
          'level_50',
          'legendary',
          'exclusive',
        ],
      },
    ],
    currentEffects: [
      {
        effectType: {
          type: String,
          enum: ['aura', 'glow', 'particles', 'shimmer', 'flame', 'ice', 'lightning', 'cosmic'],
        },
        intensity: {
          type: Number,
          min: 1,
          max: 5,
          default: 3,
        },
        color: String,
      },
    ],

    // Unlocked Items
    unlockedDesigns: [
      {
        design: String,
        unlockedAt: Date,
        unlockedByLevel: Number,
        rarity: {
          type: String,
          enum: ['common', 'rare', 'epic', 'legendary'],
          default: 'common',
        },
      },
    ],
    unlockedBorders: [
      {
        border: String,
        unlockedAt: Date,
        unlockedByLevel: Number,
        rarity: {
          type: String,
          enum: ['common', 'rare', 'epic', 'legendary'],
          default: 'common',
        },
      },
    ],
    unlockedBadges: [
      {
        badge: String,
        unlockedAt: Date,
        unlockedByLevel: Number,
        rarity: {
          type: String,
          enum: ['common', 'rare', 'epic', 'legendary'],
          default: 'common',
        },
      },
    ],
    unlockedEffects: [
      {
        effect: String,
        unlockedAt: Date,
        unlockedByLevel: Number,
        rarity: {
          type: String,
          enum: ['common', 'rare', 'epic', 'legendary'],
          default: 'common',
        },
      },
    ],

    // Evolution Milestones
    evolutionMilestones: [
      {
        level: Number,
        milestone: String,
        description: String,
        unlockedItems: {
          designs: [String],
          borders: [String],
          badges: [String],
          effects: [String],
        },
        unlockedAt: Date,
      },
    ],

    // Mystery Unlocks & Teasers
    nextEvolutionTeaser: {
      level: Number,
      previewItem: String,
      previewDescription: String,
      diamondsNeeded: Number,
      experienceNeeded: Number,
    },
    mysteryUnlocks: [
      {
        unlockedAt: Date,
        item: String,
        itemType: {
          type: String,
          enum: ['design', 'border', 'badge', 'effect'],
        },
        rarity: String,
      },
    ],

    // Customization History
    customizationHistory: [
      {
        timestamp: Date,
        changes: {
          design: String,
          border: String,
          badges: [String],
          effects: [String],
        },
      },
    ],

    // Profile Statistics
    profileViews: {
      type: Number,
      default: 0,
    },
    profileLikes: {
      type: Number,
      default: 0,
    },
    customizationCount: {
      type: Number,
      default: 0,
    },

    // Premium Features
    premiumProfileBorder: {
      enabled: Boolean,
      borderType: String,
      expiresAt: Date,
    },
    animatedProfileFrame: {
      enabled: Boolean,
      animationType: String,
      expiresAt: Date,
    },
    exclusiveEffect: {
      enabled: Boolean,
      effectType: String,
      expiresAt: Date,
    },

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
profileEvolutionSchema.index({ userId: 1 });
profileEvolutionSchema.index({ currentDesign: 1 });
profileEvolutionSchema.index({ 'evolutionMilestones.level': 1 });

// Method to unlock item
profileEvolutionSchema.methods.unlockItem = async function (itemType, itemName, level, rarity = 'common') {
  const now = new Date();

  switch (itemType) {
    case 'design':
      if (!this.unlockedDesigns.find((d) => d.design === itemName)) {
        this.unlockedDesigns.push({
          design: itemName,
          unlockedAt: now,
          unlockedByLevel: level,
          rarity,
        });
      }
      break;
    case 'border':
      if (!this.unlockedBorders.find((b) => b.border === itemName)) {
        this.unlockedBorders.push({
          border: itemName,
          unlockedAt: now,
          unlockedByLevel: level,
          rarity,
        });
      }
      break;
    case 'badge':
      if (!this.unlockedBadges.find((b) => b.badge === itemName)) {
        this.unlockedBadges.push({
          badge: itemName,
          unlockedAt: now,
          unlockedByLevel: level,
          rarity,
        });
      }
      break;
    case 'effect':
      if (!this.unlockedEffects.find((e) => e.effect === itemName)) {
        this.unlockedEffects.push({
          effect: itemName,
          unlockedAt: now,
          unlockedByLevel: level,
          rarity,
        });
      }
      break;
  }

  return this.save();
};

// Method to set current customization
profileEvolutionSchema.methods.setCustomization = async function (design, border, badges, effects) {
  // Validate ownership
  if (design && !this.unlockedDesigns.find((d) => d.design === design)) {
    throw new Error('Design not unlocked');
  }
  if (border && border !== 'none' && !this.unlockedBorders.find((b) => b.border === border)) {
    throw new Error('Border not unlocked');
  }

  // Update current customization
  if (design) this.currentDesign = design;
  if (border !== undefined) this.currentBorder = border;
  if (badges) this.currentBadges = badges;
  if (effects) this.currentEffects = effects;

  // Record history
  this.customizationHistory.push({
    timestamp: new Date(),
    changes: {
      design: this.currentDesign,
      border: this.currentBorder,
      badges: this.currentBadges,
      effects: this.currentEffects,
    },
  });

  this.customizationCount += 1;
  return this.save();
};

// Method to update next evolution teaser
profileEvolutionSchema.methods.updateNextEvolutionTeaser = async function (level, item, description, diamondsNeeded) {
  this.nextEvolutionTeaser = {
    level,
    previewItem: item,
    previewDescription: description,
    diamondsNeeded,
    experienceNeeded: Math.floor(100 * Math.pow(1.1, level)),
  };
  return this.save();
};

// Method to add mystery unlock
profileEvolutionSchema.methods.addMysteryUnlock = async function (item, itemType, rarity = 'rare') {
  this.mysteryUnlocks.push({
    unlockedAt: new Date(),
    item,
    itemType,
    rarity,
  });

  // Also unlock the item in the appropriate category
  await this.unlockItem(itemType, item, 0, rarity);
  return this.save();
};

// Method to record profile view
profileEvolutionSchema.methods.recordProfileView = async function () {
  this.profileViews += 1;
  return this.save();
};

// Method to record profile like
profileEvolutionSchema.methods.recordProfileLike = async function () {
  this.profileLikes += 1;
  return this.save();
};

export default mongoose.model('ProfileEvolution', profileEvolutionSchema);
