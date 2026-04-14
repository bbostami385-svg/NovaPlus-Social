import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: [true, 'Post content is required'],
      maxlength: [5000, 'Post content cannot exceed 5000 characters'],
      trim: true,
    },
    images: [
      {
        url: String, // S3/R2 URL
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    videos: [
      {
        url: String, // S3/R2 URL
        thumbnailUrl: String,
        duration: Number, // in seconds
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    visibility: {
      type: String,
      enum: ['public', 'friends', 'private'],
      default: 'public',
    },
    location: {
      type: String,
      default: null,
    },
    hashtags: [String],
    mentions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

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
    isArchived: {
      type: Boolean,
      default: false,
    },

    // Shared Post
    sharedPostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      default: null,
    },
    sharedPostAuthor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
    indexes: [
      { author: 1, createdAt: -1 },
      { visibility: 1, createdAt: -1 },
      { hashtags: 1 },
      { createdAt: -1 },
      { engagementScore: -1 },
    ],
  }
);

// Index for full-text search
postSchema.index({ content: 'text', hashtags: 'text' });

// Calculate engagement score
postSchema.methods.calculateEngagementScore = function () {
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

// Method to get post with author details
postSchema.methods.toJSON = function () {
  const postObject = this.toObject();
  return postObject;
};

export default mongoose.model('Post', postSchema);
