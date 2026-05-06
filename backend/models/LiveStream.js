import mongoose from 'mongoose';

const liveStreamSchema = new mongoose.Schema(
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
    description: String,
    thumbnailUrl: String,
    streamUrl: String,
    streamKey: {
      type: String,
      unique: true,
      sparse: true,
    },
    status: {
      type: String,
      enum: ['scheduled', 'live', 'ended', 'cancelled'],
      default: 'scheduled',
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: Date,
    scheduledDuration: Number, // In minutes
    actualDuration: Number,
    viewers: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        joinedAt: Date,
        leftAt: Date,
      },
    ],
    peakViewers: Number,
    totalViews: {
      type: Number,
      default: 0,
    },
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
    gifts: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        giftId: String,
        giftValue: Number,
        sentAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    totalGiftValue: {
      type: Number,
      default: 0,
    },
    category: {
      type: String,
      enum: ['gaming', 'music', 'sports', 'education', 'entertainment', 'other'],
      default: 'entertainment',
    },
    hashtags: [String],
    isPublic: {
      type: Boolean,
      default: true,
    },
    allowComments: {
      type: Boolean,
      default: true,
    },
    allowGifts: {
      type: Boolean,
      default: true,
    },
    recordingUrl: String,
    isRecorded: {
      type: Boolean,
      default: false,
    },
    recordingExpiry: Date,
    replayViews: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Indexes
liveStreamSchema.index({ userId: 1, createdAt: -1 });
liveStreamSchema.index({ status: 1 });
liveStreamSchema.index({ startTime: 1 });
liveStreamSchema.index({ totalViews: -1 });

export default mongoose.model('LiveStream', liveStreamSchema);
