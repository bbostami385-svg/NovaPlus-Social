import mongoose from 'mongoose';

const storySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    mediaUrl: String,
    mediaType: {
      type: String,
      enum: ['image', 'video'],
      required: true,
    },
    mediaSize: Number,
    mediaDuration: Number, // For videos
    textOverlay: {
      text: String,
      color: String,
      fontSize: Number,
      position: String,
    },
    stickers: [
      {
        type: String,
        position: { x: Number, y: Number },
        scale: Number,
      },
    ],
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
    isPublic: {
      type: Boolean,
      default: true,
    },
    allowComments: {
      type: Boolean,
      default: true,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      index: { expireAfterSeconds: 0 }, // Auto-delete after expiry
    },
  },
  { timestamps: true }
);

// Index for faster queries
storySchema.index({ userId: 1, createdAt: -1 });
storySchema.index({ expiresAt: 1 });

export default mongoose.model('Story', storySchema);
