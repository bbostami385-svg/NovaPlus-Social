import Group from '../models/Group.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

class GroupService {
  // Create group
  static async createGroup(creatorId, groupData) {
    try {
      const group = new Group({
        ...groupData,
        creator: creatorId,
        members: [creatorId],
        moderators: [creatorId],
      });

      await group.save();

      return {
        success: true,
        message: 'Group created successfully',
        data: group,
      };
    } catch (error) {
      throw new Error(`Failed to create group: ${error.message}`);
    }
  }

  // Get all groups
  static async getAllGroups(filter = {}, limit = 50, skip = 0) {
    try {
      const groups = await Group.find(filter)
        .populate('creator', 'firstName lastName profilePicture')
        .populate('members', 'firstName lastName profilePicture')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);

      const total = await Group.countDocuments(filter);

      return {
        success: true,
        data: groups,
        pagination: {
          total,
          limit,
          skip,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new Error(`Failed to fetch groups: ${error.message}`);
    }
  }

  // Get group by ID
  static async getGroupById(groupId) {
    try {
      const group = await Group.findById(groupId)
        .populate('creator', 'firstName lastName profilePicture')
        .populate('members', 'firstName lastName profilePicture')
        .populate('moderators', 'firstName lastName profilePicture');

      if (!group) {
        throw new Error('Group not found');
      }

      return group;
    } catch (error) {
      throw new Error(`Failed to fetch group: ${error.message}`);
    }
  }

  // Get user's groups
  static async getUserGroups(userId) {
    try {
      const groups = await Group.find({ members: userId })
        .populate('creator', 'firstName lastName profilePicture')
        .sort({ createdAt: -1 });

      return groups;
    } catch (error) {
      throw new Error(`Failed to fetch user groups: ${error.message}`);
    }
  }

  // Join group
  static async joinGroup(groupId, userId) {
    try {
      const group = await Group.findById(groupId);
      if (!group) {
        throw new Error('Group not found');
      }

      if (group.members.includes(userId)) {
        return {
          success: false,
          message: 'User is already a member of this group',
        };
      }

      group.members.push(userId);
      group.memberCount = group.members.length;
      await group.save();

      // Notify group creator
      await Notification.create({
        userId: group.creator,
        type: 'group_new_member',
        title: 'New Group Member',
        message: `A new member joined your group: ${group.name}`,
        relatedGroup: groupId,
        read: false,
      });

      return {
        success: true,
        message: 'Joined group successfully',
        data: group,
      };
    } catch (error) {
      throw new Error(`Failed to join group: ${error.message}`);
    }
  }

  // Leave group
  static async leaveGroup(groupId, userId) {
    try {
      const group = await Group.findById(groupId);
      if (!group) {
        throw new Error('Group not found');
      }

      if (!group.members.includes(userId)) {
        return {
          success: false,
          message: 'User is not a member of this group',
        };
      }

      // Remove user from members
      group.members = group.members.filter((id) => id.toString() !== userId);
      group.memberCount = group.members.length;

      // Remove user from moderators if they are one
      group.moderators = group.moderators.filter((id) => id.toString() !== userId);

      await group.save();

      return {
        success: true,
        message: 'Left group successfully',
        data: group,
      };
    } catch (error) {
      throw new Error(`Failed to leave group: ${error.message}`);
    }
  }

  // Add moderator
  static async addModerator(groupId, userId, moderatorId) {
    try {
      const group = await Group.findById(groupId);
      if (!group) {
        throw new Error('Group not found');
      }

      // Check if user is creator
      if (group.creator.toString() !== userId) {
        throw new Error('Only group creator can add moderators');
      }

      if (group.moderators.includes(moderatorId)) {
        return {
          success: false,
          message: 'User is already a moderator',
        };
      }

      group.moderators.push(moderatorId);
      await group.save();

      return {
        success: true,
        message: 'Moderator added successfully',
        data: group,
      };
    } catch (error) {
      throw new Error(`Failed to add moderator: ${error.message}`);
    }
  }

  // Remove moderator
  static async removeModerator(groupId, userId, moderatorId) {
    try {
      const group = await Group.findById(groupId);
      if (!group) {
        throw new Error('Group not found');
      }

      // Check if user is creator
      if (group.creator.toString() !== userId) {
        throw new Error('Only group creator can remove moderators');
      }

      group.moderators = group.moderators.filter((id) => id.toString() !== moderatorId);
      await group.save();

      return {
        success: true,
        message: 'Moderator removed successfully',
        data: group,
      };
    } catch (error) {
      throw new Error(`Failed to remove moderator: ${error.message}`);
    }
  }

  // Update group
  static async updateGroup(groupId, userId, updateData) {
    try {
      const group = await Group.findById(groupId);
      if (!group) {
        throw new Error('Group not found');
      }

      // Check if user is creator or moderator
      if (group.creator.toString() !== userId && !group.moderators.includes(userId)) {
        throw new Error('Only creator or moderators can update group');
      }

      Object.assign(group, updateData);
      await group.save();

      return {
        success: true,
        message: 'Group updated successfully',
        data: group,
      };
    } catch (error) {
      throw new Error(`Failed to update group: ${error.message}`);
    }
  }

  // Delete group
  static async deleteGroup(groupId, userId) {
    try {
      const group = await Group.findById(groupId);
      if (!group) {
        throw new Error('Group not found');
      }

      // Check if user is creator
      if (group.creator.toString() !== userId) {
        throw new Error('Only group creator can delete the group');
      }

      await Group.findByIdAndDelete(groupId);

      return {
        success: true,
        message: 'Group deleted successfully',
      };
    } catch (error) {
      throw new Error(`Failed to delete group: ${error.message}`);
    }
  }

  // Search groups
  static async searchGroups(query, limit = 20) {
    try {
      const groups = await Group.find({
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
        ],
      })
        .populate('creator', 'firstName lastName profilePicture')
        .limit(limit);

      return groups;
    } catch (error) {
      throw new Error(`Failed to search groups: ${error.message}`);
    }
  }

  // Get trending groups
  static async getTrendingGroups(limit = 10) {
    try {
      const groups = await Group.find()
        .populate('creator', 'firstName lastName profilePicture')
        .sort({ memberCount: -1 })
        .limit(limit);

      return groups;
    } catch (error) {
      throw new Error(`Failed to fetch trending groups: ${error.message}`);
    }
  }

  // Get group members
  static async getGroupMembers(groupId, limit = 50) {
    try {
      const group = await Group.findById(groupId).populate(
        'members',
        'firstName lastName profilePicture email'
      );

      if (!group) {
        throw new Error('Group not found');
      }

      return group.members.slice(0, limit);
    } catch (error) {
      throw new Error(`Failed to fetch group members: ${error.message}`);
    }
  }

  // Ban member from group
  static async banMember(groupId, userId, memberId) {
    try {
      const group = await Group.findById(groupId);
      if (!group) {
        throw new Error('Group not found');
      }

      // Check if user is creator or moderator
      if (group.creator.toString() !== userId && !group.moderators.includes(userId)) {
        throw new Error('Only creator or moderators can ban members');
      }

      // Remove member
      group.members = group.members.filter((id) => id.toString() !== memberId);
      group.memberCount = group.members.length;

      // Add to banned list
      if (!group.bannedMembers) {
        group.bannedMembers = [];
      }
      group.bannedMembers.push(memberId);

      await group.save();

      return {
        success: true,
        message: 'Member banned successfully',
        data: group,
      };
    } catch (error) {
      throw new Error(`Failed to ban member: ${error.message}`);
    }
  }

  // Unban member
  static async unbanMember(groupId, userId, memberId) {
    try {
      const group = await Group.findById(groupId);
      if (!group) {
        throw new Error('Group not found');
      }

      // Check if user is creator
      if (group.creator.toString() !== userId) {
        throw new Error('Only group creator can unban members');
      }

      if (!group.bannedMembers) {
        group.bannedMembers = [];
      }

      group.bannedMembers = group.bannedMembers.filter((id) => id.toString() !== memberId);
      await group.save();

      return {
        success: true,
        message: 'Member unbanned successfully',
        data: group,
      };
    } catch (error) {
      throw new Error(`Failed to unban member: ${error.message}`);
    }
  }

  // Get group statistics
  static async getGroupStats(groupId) {
    try {
      const group = await Group.findById(groupId);
      if (!group) {
        throw new Error('Group not found');
      }

      return {
        totalMembers: group.members.length,
        totalModerators: group.moderators.length,
        totalBanned: group.bannedMembers?.length || 0,
        createdAt: group.createdAt,
        updatedAt: group.updatedAt,
      };
    } catch (error) {
      throw new Error(`Failed to fetch group stats: ${error.message}`);
    }
  }
}

export default GroupService;
