import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema(
  {
    channel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Video title is required'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
      trim: true,
    },
    description: {
      type: String,
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
      default: '',
    },
    thumbnail: {
      type: String, // S3/R2 URL
      default: null,
    },
    videoUrl: {
      type: String, // S3/R2 URL
      required: [true, 'Video URL is required'],
    },
    duration: {
      type: Number, // in seconds
      required: true,
    },
    resolution: {
      type: String,
      enum: ['360p', '480p', '720p', '1080p', '2160p', '4k'],
      default: '720p',
    },
    fileSize: {
      type: Number, // in bytes
      default: 0,
    },
    mimeType: {
      type: String,
      default: 'video/mp4',
    },

    // Video Details
    hashtags: [String],
    category: {
      type: String,
      enum: [
        'entertainment',
        'music',
        'sports',
        'gaming',
        'education',
        'news',
        'vlog',
        'tutorial',
        'other',
      ],
      default: 'other',
    },
    visibility: {
      type: String,
      enum: ['public', 'unlisted', 'private'],
      default: 'public',
    },
    allowComments: {
      type: Boolean,
      default: true,
    },
    allowRatings: {
      type: Boolean,
      default: true,
    },
    allowSharing: {
      type: Boolean,
      default: true,
    },

    // Processing Status
    processingStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    processingProgress: {
      type: Number,
      default: 0,
    },
    processingError: String,

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
    dislikes: [
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
    dislikesCount: {
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

    // Engagement
    viewsCount: {
      type: Number,
      default: 0,
    },
    watchTime: {
      type: Number, // in seconds
      default: 0,
    },
    averageWatchDuration: {
      type: Number, // percentage
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
    isMonetized: {
      type: Boolean,
      default: false,
    },
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
      { channel: 1, createdAt: -1 },
      { visibility: 1, createdAt: -1 },
      { category: 1 },
      { hashtags: 1 },
      { createdAt: -1 },
      { engagementScore: -1 },
      { processingStatus: 1 },
    ],
  }
);

// Index for full-text search
videoSchema.index({ title: 'text', description: 'text', hashtags: 'text' });

// Calculate engagement score
videoSchema.methods.calculateEngagementScore = function () {
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

export default mongoose.model('Video', videoSchema);
