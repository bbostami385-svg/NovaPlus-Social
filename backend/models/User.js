import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    // Basic Info
    username: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      index: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      index: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    firstName: String,
    lastName: String,
    bio: {
      type: String,
      maxlength: 500,
    },
    profilePicture: String,
    coverPhoto: String,
    dateOfBirth: Date,
    location: String,
    website: String,

    // Account Status
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    role: {
      type: String,
      enum: ['user', 'creator', 'admin'],
      default: 'user',
    },

    // Social Info
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    blockedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    // Stats
    postsCount: {
      type: Number,
      default: 0,
    },
    followersCount: {
      type: Number,
      default: 0,
    },
    followingCount: {
      type: Number,
      default: 0,
    },

    // Preferences
    privacySettings: {
      profileVisibility: {
        type: String,
        enum: ['public', 'private', 'friends'],
        default: 'public',
      },
      allowMessages: {
        type: String,
        enum: ['everyone', 'followers', 'none'],
        default: 'everyone',
      },
      allowComments: {
        type: String,
        enum: ['everyone', 'followers', 'none'],
        default: 'everyone',
      },
    },
    notificationSettings: {
      emailNotifications: {
        type: Boolean,
        default: true,
      },
      pushNotifications: {
        type: Boolean,
        default: true,
      },
      messageNotifications: {
        type: Boolean,
        default: true,
      },
    },

    // Creator Info
    isCreator: {
      type: Boolean,
      default: false,
    },
    creatorInfo: {
      category: String,
      description: String,
      totalEarnings: {
        type: Number,
        default: 0,
      },
      monthlyEarnings: {
        type: Number,
        default: 0,
      },
      subscribers: {
        type: Number,
        default: 0,
      },
    },

    // Firebase
    firebaseUid: String,
    firebaseEmail: String,

    // Timestamps
    lastLogin: Date,
    lastActive: Date,
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// Indexes
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ followers: 1 });
userSchema.index({ following: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function () {
  return `${this.firstName || ''} ${this.lastName || ''}`.trim();
});

export default mongoose.model('User', userSchema);
