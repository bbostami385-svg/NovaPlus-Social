import mongoose from 'mongoose';

const reelSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    videoUrl: {
      type: String,
      required: true,
    },
    thumbnailUrl: String,
    duration: {
      type: Number,
      required: true,
    },
    videoSize: Number,
    aspectRatio: {
      type: String,
      enum: ['9:16', '16:9', '1:1'],
      default: '9:16',
    },
    hashtags: [String],
    mentions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    music: {
      title: String,
      artist: String,
      audioUrl: String,
    },
    effects: [String],
    filters: String,
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    comments: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        text: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
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
    views: {
      type: Number,
      default: 0,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    allowComments: {
      type: Boolean,
      default: true,
    },
    allowSharing: {
      type: Boolean,
      default: true,
    },
    isSponsored: {
      type: Boolean,
      default: false,
    },
    sponsorInfo: {
      sponsorId: mongoose.Schema.Types.ObjectId,
      budget: Number,
      impressions: Number,
    },
  },
  { timestamps: true }
);

// Indexes
reelSchema.index({ userId: 1, createdAt: -1 });
reelSchema.index({ hashtags: 1 });
reelSchema.index({ views: -1 });
reelSchema.index({ likes: 1 });

export default mongoose.model('Reel', reelSchema);
