import mongoose from 'mongoose';

const storySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    mediaUrl: {
      type: String, // S3/R2 URL
      required: [true, 'Media URL is required'],
    },
    mediaType: {
      type: String,
      enum: ['image', 'video'],
      required: true,
    },
    thumbnail: {
      type: String, // S3/R2 URL for video thumbnails
      default: null,
    },
    duration: {
      type: Number, // in seconds, for videos
      default: null,
    },
    caption: {
      type: String,
      maxlength: [200, 'Caption cannot exceed 200 characters'],
      default: '',
    },
    location: String,

    // Story Details
    visibility: {
      type: String,
      enum: ['public', 'friends', 'private'],
      default: 'public',
    },
    allowReplies: {
      type: Boolean,
      default: true,
    },
    allowSharing: {
      type: Boolean,
      default: true,
    },

    // Expiration (24 hours)
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },

    // Interactions
    views: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        viewedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    viewsCount: {
      type: Number,
      default: 0,
    },
    reactions: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        emoji: String,
        reactedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    replies: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        message: String,
        repliedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Metadata
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    indexes: [
      { user: 1, createdAt: -1 },
      { expiresAt: 1 },
      { visibility: 1 },
    ],
  }
);

// TTL Index for automatic deletion after 24 hours
storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Method to check if story is expired
storySchema.methods.isExpired = function () {
  return new Date() > this.expiresAt;
};

// Method to get viewers list
storySchema.methods.getViewers = async function () {
  return this.views.map((view) => view.userId);
};

export default mongoose.model('Story', storySchema);
