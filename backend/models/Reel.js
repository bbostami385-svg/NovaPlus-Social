import mongoose from 'mongoose';

const reelSchema = new mongoose.Schema(
  {
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    caption: {
      type: String,
      maxlength: [500, 'Caption cannot exceed 500 characters'],
      default: '',
    },
    videoUrl: {
      type: String, // S3/R2 URL
      required: [true, 'Video URL is required'],
    },
    thumbnail: {
      type: String, // S3/R2 URL
      default: null,
    },
    duration: {
      type: Number, // in seconds
      required: true,
    },
    music: {
      audioUrl: String, // S3/R2 URL
      title: String,
      artist: String,
      duration: Number,
    },
    effects: [
      {
        name: String,
        parameters: mongoose.Schema.Types.Mixed,
      },
    ],
    hashtags: [String],
    mentions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    location: String,

    // Visibility
    visibility: {
      type: String,
      enum: ['public', 'friends', 'private'],
      default: 'public',
    },
    allowComments: {
      type: Boolean,
      default: true,
    },
    allowDuets: {
      type: Boolean,
      default: true,
    },
    allowStitches: {
      type: Boolean,
      default: true,
    },

    // Interactions
    likes: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    likesCount: {
      type: Number,
      default: 0,
    },
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
      },
    ],
    commentsCount: {
      type: Number,
      default: 0,
    },
    shares: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        sharedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    sharesCount: {
      type: Number,
      default: 0,
    },
    saves: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    savesCount: {
      type: Number,
      default: 0,
    },

    // Engagement
    viewsCount: {
      type: Number,
      default: 0,
    },
    watchTime: {
      type: Number, // in seconds
      default: 0,
    },
    engagementScore: {
      type: Number,
      default: 0,
    },

    // Metadata
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: Date,
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
    isSponsored: {
      type: Boolean,
      default: false,
    },

    // Analytics
    views: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        watchedDuration: Number,
        viewedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
    indexes: [
      { creator: 1, createdAt: -1 },
      { visibility: 1, createdAt: -1 },
      { hashtags: 1 },
      { createdAt: -1 },
      { engagementScore: -1 },
    ],
  }
);

// Index for full-text search
reelSchema.index({ caption: 'text', hashtags: 'text' });

// Calculate engagement score
reelSchema.methods.calculateEngagementScore = function () {
  const likeWeight = 1;
  const commentWeight = 2;
  const shareWeight = 3;
  const viewWeight = 0.1;

  this.engagementScore =
    this.likesCount * likeWeight +
    this.commentsCount * commentWeight +
    this.sharesCount * shareWeight +
    this.viewsCount * viewWeight;

  return this.engagementScore;
};

export default mongoose.model('Reel', reelSchema);
