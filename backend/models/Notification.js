import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Notification Type
    type: {
      type: String,
      enum: [
        'like_post',
        'like_video',
        'like_reel',
        'like_comment',
        'comment_post',
        'comment_video',
        'comment_reel',
        'reply_comment',
        'mention_post',
        'mention_comment',
        'follow_user',
        'friend_request',
        'friend_accepted',
        'message',
        'group_invite',
        'group_post',
        'story_view',
        'video_upload',
        'reel_upload',
        'story_upload',
        'system',
      ],
      required: true,
    },

    // Related Content
    relatedPost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      default: null,
    },
    relatedVideo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Video',
      default: null,
    },
    relatedReel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reel',
      default: null,
    },
    relatedComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
    },
    relatedMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    relatedGroup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      default: null,
    },
    relatedStory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Story',
      default: null,
    },

    // Notification Content
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      maxlength: [500, 'Message cannot exceed 500 characters'],
    },
    image: {
      type: String, // S3/R2 URL
      default: null,
    },

    // Status
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: Date,

    // Action URL
    actionUrl: String,

    // Notification Channel
    channels: {
      inApp: {
        type: Boolean,
        default: true,
      },
      email: {
        type: Boolean,
        default: false,
      },
      push: {
        type: Boolean,
        default: true,
      },
      sms: {
        type: Boolean,
        default: false,
      },
    },

    // Delivery Status
    deliveryStatus: {
      email: {
        type: String,
        enum: ['pending', 'sent', 'failed', 'skipped'],
        default: 'pending',
      },
      push: {
        type: String,
        enum: ['pending', 'sent', 'failed', 'skipped'],
        default: 'pending',
      },
      sms: {
        type: String,
        enum: ['pending', 'sent', 'failed', 'skipped'],
        default: 'pending',
      },
    },

    // Metadata
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    indexes: [
      { recipient: 1, isRead: 1, createdAt: -1 },
      { recipient: 1, createdAt: -1 },
      { actor: 1 },
      { type: 1 },
      { isRead: 1 },
      { createdAt: -1 },
    ],
  }
);

// Method to mark as read
notificationSchema.methods.markAsRead = async function () {
  this.isRead = true;
  this.readAt = new Date();
  return await this.save();
};

// Method to mark as unread
notificationSchema.methods.markAsUnread = async function () {
  this.isRead = false;
  this.readAt = null;
  return await this.save();
};

// Static method to create notification
notificationSchema.statics.createNotification = async function (data) {
  try {
    const notification = new this({
      recipient: data.recipient,
      actor: data.actor,
      type: data.type,
      title: data.title,
      message: data.message,
      image: data.image,
      actionUrl: data.actionUrl,
      relatedPost: data.relatedPost,
      relatedVideo: data.relatedVideo,
      relatedReel: data.relatedReel,
      relatedComment: data.relatedComment,
      relatedMessage: data.relatedMessage,
      relatedGroup: data.relatedGroup,
      relatedStory: data.relatedStory,
      channels: data.channels || {},
      priority: data.priority || 'normal',
    });
    return await notification.save();
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

export default mongoose.model('Notification', notificationSchema);
