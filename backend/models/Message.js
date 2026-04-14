import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    // Message Content
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null for group messages
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      default: null, // null for 1-to-1 messages
    },
    content: {
      type: String,
      maxlength: [5000, 'Message cannot exceed 5000 characters'],
      default: '',
    },

    // Media
    media: [
      {
        url: String, // S3/R2 URL
        type: {
          type: String,
          enum: ['image', 'video', 'audio', 'file'],
        },
        fileName: String,
        fileSize: Number,
        duration: Number, // for audio/video
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Message Status
    status: {
      type: String,
      enum: ['sending', 'sent', 'delivered', 'read'],
      default: 'sending',
    },
    sentAt: Date,
    deliveredAt: Date,
    readAt: Date,

    // Message Type
    messageType: {
      type: String,
      enum: ['text', 'image', 'video', 'audio', 'file', 'call', 'system'],
      default: 'text',
    },

    // Reactions
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

    // Reply To
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },

    // Forwarded
    isForwarded: {
      type: Boolean,
      default: false,
    },
    forwardedFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },

    // Edited
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: Date,
    editHistory: [
      {
        content: String,
        editedAt: Date,
      },
    ],

    // Deleted
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
    isDeletedForEveryone: {
      type: Boolean,
      default: false,
    },

    // Metadata
    mentions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    hashtags: [String],
  },
  {
    timestamps: true,
    indexes: [
      { sender: 1, createdAt: -1 },
      { receiver: 1, createdAt: -1 },
      { group: 1, createdAt: -1 },
      { status: 1 },
      { messageType: 1 },
      { 'sender': 1, 'receiver': 1, 'createdAt': -1 },
    ],
  }
);

// Compound index for 1-to-1 conversations
messageSchema.index(
  { sender: 1, receiver: 1, createdAt: -1 },
  { name: 'conversation_index' }
);

// Compound index for group conversations
messageSchema.index(
  { group: 1, createdAt: -1 },
  { name: 'group_conversation_index' }
);

// Method to mark as delivered
messageSchema.methods.markAsDelivered = async function () {
  this.status = 'delivered';
  this.deliveredAt = new Date();
  return await this.save();
};

// Method to mark as read
messageSchema.methods.markAsRead = async function () {
  this.status = 'read';
  this.readAt = new Date();
  return await this.save();
};

// Method to get conversation key (for 1-to-1 chats)
messageSchema.methods.getConversationKey = function () {
  if (this.group) return `group_${this.group}`;
  const ids = [this.sender.toString(), this.receiver.toString()].sort();
  return `${ids[0]}_${ids[1]}`;
};

export default mongoose.model('Message', messageSchema);
