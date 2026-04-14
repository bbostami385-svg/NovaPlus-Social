import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Group name is required'],
      maxlength: [100, 'Group name cannot exceed 100 characters'],
      trim: true,
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },
    avatar: {
      type: String, // S3/R2 URL
      default: null,
    },
    coverPhoto: {
      type: String, // S3/R2 URL
      default: null,
    },

    // Group Type
    groupType: {
      type: String,
      enum: ['private', 'public'],
      default: 'private',
    },

    // Members
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    admins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    members: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
        role: {
          type: String,
          enum: ['member', 'moderator', 'admin'],
          default: 'member',
        },
      },
    ],
    membersCount: {
      type: Number,
      default: 0,
    },

    // Settings
    allowMembersToInvite: {
      type: Boolean,
      default: true,
    },
    allowMembersToPost: {
      type: Boolean,
      default: true,
    },
    allowMembersToAddMedia: {
      type: Boolean,
      default: true,
    },
    requireApprovalToJoin: {
      type: Boolean,
      default: false,
    },

    // Pending Members
    pendingMembers: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        requestedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Banned Members
    bannedMembers: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        bannedAt: {
          type: Date,
          default: Date.now,
        },
        reason: String,
      },
    ],

    // Statistics
    messagesCount: {
      type: Number,
      default: 0,
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    lastMessageAt: Date,

    // Metadata
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
  },
  {
    timestamps: true,
    indexes: [
      { creator: 1 },
      { 'members.userId': 1 },
      { groupType: 1 },
      { createdAt: -1 },
      { lastMessageAt: -1 },
    ],
  }
);

// Method to add member
groupSchema.methods.addMember = async function (userId, role = 'member') {
  if (!this.members.find((m) => m.userId.toString() === userId.toString())) {
    this.members.push({ userId, role });
    this.membersCount = this.members.length;
    return await this.save();
  }
  return this;
};

// Method to remove member
groupSchema.methods.removeMember = async function (userId) {
  this.members = this.members.filter((m) => m.userId.toString() !== userId.toString());
  this.membersCount = this.members.length;
  return await this.save();
};

// Method to add admin
groupSchema.methods.addAdmin = async function (userId) {
  if (!this.admins.find((a) => a.toString() === userId.toString())) {
    this.admins.push(userId);
    return await this.save();
  }
  return this;
};

// Method to remove admin
groupSchema.methods.removeAdmin = async function (userId) {
  this.admins = this.admins.filter((a) => a.toString() !== userId.toString());
  return await this.save();
};

// Method to ban member
groupSchema.methods.banMember = async function (userId, reason) {
  this.members = this.members.filter((m) => m.userId.toString() !== userId.toString());
  this.bannedMembers.push({ userId, reason });
  this.membersCount = this.members.length;
  return await this.save();
};

export default mongoose.model('Group', groupSchema);
