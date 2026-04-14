import mongoose from 'mongoose';

const friendRequestSchema = new mongoose.Schema(
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
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'cancelled'],
      default: 'pending',
      index: true,
    },
    message: {
      type: String,
      maxlength: [500, 'Message cannot exceed 500 characters'],
      default: '',
    },
    respondedAt: Date,
  },
  {
    timestamps: true,
    indexes: [
      { sender: 1, receiver: 1 },
      { receiver: 1, status: 1, createdAt: -1 },
      { sender: 1, status: 1 },
    ],
  }
);

// Prevent duplicate friend requests
friendRequestSchema.index(
  { sender: 1, receiver: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ['pending', 'accepted'] } },
  }
);

// Method to accept friend request
friendRequestSchema.methods.accept = async function () {
  this.status = 'accepted';
  this.respondedAt = new Date();
  return await this.save();
};

// Method to decline friend request
friendRequestSchema.methods.decline = async function () {
  this.status = 'declined';
  this.respondedAt = new Date();
  return await this.save();
};

// Method to cancel friend request
friendRequestSchema.methods.cancel = async function () {
  this.status = 'cancelled';
  this.respondedAt = new Date();
  return await this.save();
};

export default mongoose.model('FriendRequest', friendRequestSchema);
