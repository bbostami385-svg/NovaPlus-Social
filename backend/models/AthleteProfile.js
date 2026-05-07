import mongoose from 'mongoose';

const athleteProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    // Basic Information
    athleteName: {
      type: String,
      required: true,
      trim: true,
    },
    bio: {
      type: String,
      maxlength: 500,
      default: '',
    },
    profileImage: {
      type: String,
      default: null,
    },
    coverImage: {
      type: String,
      default: null,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    nationality: {
      type: String,
      required: true,
    },
    city: String,
    state: String,
    country: String,

    // Cricket Information
    role: {
      type: String,
      enum: ['batsman', 'bowler', 'all-rounder', 'wicket-keeper'],
      required: true,
    },
    battingStyle: {
      type: String,
      enum: ['right-handed', 'left-handed'],
      default: 'right-handed',
    },
    bowlingStyle: {
      type: String,
      enum: ['right-arm-fast', 'right-arm-medium', 'right-arm-off-break', 'right-arm-leg-break', 'left-arm-fast', 'left-arm-medium', 'left-arm-orthodox', 'left-arm-chinaman', 'none'],
      default: 'none',
    },
    jerseyNumber: Number,
    height: String, // e.g., "6'2\""
    weight: String, // e.g., "85 kg"

    // Verification Status
    verificationStatus: {
      type: String,
      enum: ['unverified', 'pending', 'verified', 'rejected'],
      default: 'unverified',
    },
    verificationDocuments: [
      {
        documentType: String, // 'id_proof', 'cricket_certificate', 'photo'
        documentUrl: String,
        uploadedAt: Date,
        status: {
          type: String,
          enum: ['pending', 'approved', 'rejected'],
          default: 'pending',
        },
      },
    ],
    verificationDate: Date,
    verifiedBadge: {
      type: Boolean,
      default: false,
    },

    // Professional Status
    isAthlete: {
      type: Boolean,
      default: true,
    },
    professionalStatus: {
      type: String,
      enum: ['amateur', 'semi-professional', 'professional', 'international'],
      default: 'amateur',
    },
    currentTeam: String,
    currentAcademy: String,

    // Career Information
    careerStartYear: Number,
    totalMatches: {
      type: Number,
      default: 0,
    },
    totalRuns: {
      type: Number,
      default: 0,
    },
    totalWickets: {
      type: Number,
      default: 0,
    },
    highestScore: {
      type: Number,
      default: 0,
    },
    bestBowlingFigures: String, // e.g., "5/20"
    battingAverage: {
      type: Number,
      default: 0,
    },
    bowlingAverage: {
      type: Number,
      default: 0,
    },

    // Profile Stats
    profileViews: {
      type: Number,
      default: 0,
    },
    profileLikes: {
      type: Number,
      default: 0,
    },
    followers: {
      type: Number,
      default: 0,
    },
    following: {
      type: Number,
      default: 0,
    },

    // Achievements & Badges
    achievements: [
      {
        achievementId: mongoose.Schema.Types.ObjectId,
        name: String,
        description: String,
        icon: String,
        unlockedAt: Date,
      },
    ],
    badges: [
      {
        badgeType: String, // 'verified', 'top_performer', 'rising_star', 'legend'
        name: String,
        icon: String,
        earnedAt: Date,
      },
    ],

    // Subscription & Premium
    subscriptionStatus: {
      type: String,
      enum: ['free', 'professional', 'elite', 'legend'],
      default: 'free',
    },
    subscriptionExpiryDate: Date,
    isPremium: {
      type: Boolean,
      default: false,
    },
    premiumBadge: {
      type: Boolean,
      default: false,
    },

    // Social Links
    socialLinks: {
      instagram: String,
      twitter: String,
      facebook: String,
      youtube: String,
      website: String,
    },

    // Contact Information
    email: {
      type: String,
      required: true,
    },
    phone: String,
    contactEmail: String,
    contactPhone: String,

    // Settings
    profileVisibility: {
      type: String,
      enum: ['public', 'private', 'friends-only'],
      default: 'public',
    },
    allowMessages: {
      type: Boolean,
      default: true,
    },
    allowSponsorshipOffers: {
      type: Boolean,
      default: true,
    },
    allowHiringOffers: {
      type: Boolean,
      default: true,
    },

    // Metadata
    profileCompleteness: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    lastUpdated: Date,
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index for faster queries
athleteProfileSchema.index({ userId: 1 });
athleteProfileSchema.index({ athleteName: 'text' });
athleteProfileSchema.index({ verificationStatus: 1 });
athleteProfileSchema.index({ subscriptionStatus: 1 });
athleteProfileSchema.index({ role: 1 });
athleteProfileSchema.index({ professionalStatus: 1 });

// Methods
athleteProfileSchema.methods.getProfileCompletion = function () {
  let completeness = 0;
  const fields = [
    'bio',
    'profileImage',
    'coverImage',
    'dateOfBirth',
    'nationality',
    'city',
    'state',
    'country',
    'role',
    'battingStyle',
    'bowlingStyle',
    'jerseyNumber',
    'height',
    'weight',
    'currentTeam',
    'currentAcademy',
    'careerStartYear',
  ];

  const filledFields = fields.filter((field) => this[field]);
  completeness = Math.round((filledFields.length / fields.length) * 100);

  this.profileCompleteness = completeness;
  return completeness;
};

athleteProfileSchema.methods.recordProfileView = function () {
  this.profileViews += 1;
  return this.save();
};

athleteProfileSchema.methods.recordProfileLike = function () {
  this.profileLikes += 1;
  return this.save();
};

athleteProfileSchema.methods.addAchievement = function (achievementData) {
  this.achievements.push({
    ...achievementData,
    unlockedAt: new Date(),
  });
  return this.save();
};

athleteProfileSchema.methods.addBadge = function (badgeData) {
  this.badges.push({
    ...badgeData,
    earnedAt: new Date(),
  });
  return this.save();
};

athleteProfileSchema.methods.updateStats = function (statsData) {
  Object.assign(this, statsData);
  this.lastUpdated = new Date();
  return this.save();
};

athleteProfileSchema.methods.isPremiumActive = function () {
  if (!this.subscriptionExpiryDate) return false;
  return new Date() < this.subscriptionExpiryDate;
};

export default mongoose.model('AthleteProfile', athleteProfileSchema);
