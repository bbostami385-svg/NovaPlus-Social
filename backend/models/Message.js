import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read'],
      default: 'sent',
    },
    readAt: Date,
    attachments: [
      {
        url: String,
        type: String,
        name: String,
      },
    ],
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: Date,
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
messageSchema.index({ receiver: 1, status: 1 });

export default mongoose.model('Message', messageSchema);
