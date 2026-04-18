import Bookmark from '../models/Bookmark.js';
import Post from '../models/Post.js';
import Video from '../models/Video.js';
import Reel from '../models/Reel.js';

class BookmarkService {
  // Create bookmark
  static async createBookmark(userId, bookmarkData) {
    try {
      const bookmark = new Bookmark({
        ...bookmarkData,
        userId,
      });

      await bookmark.save();

      return {
        success: true,
        message: 'Bookmark created successfully',
        data: bookmark,
      };
    } catch (error) {
      throw new Error(`Failed to create bookmark: ${error.message}`);
    }
  }

  // Add item to bookmark
  static async addItemToBookmark(userId, bookmarkId, itemId, itemType) {
    try {
      const bookmark = await Bookmark.findById(bookmarkId);
      if (!bookmark) {
        throw new Error('Bookmark not found');
      }

      if (bookmark.userId.toString() !== userId) {
        throw new Error('Unauthorized to modify this bookmark');
      }

      // Check if item already exists
      const itemExists = bookmark.items.some(
        (item) => item.itemId.toString() === itemId && item.itemType === itemType
      );

      if (itemExists) {
        return {
          success: false,
          message: 'Item already in bookmark',
        };
      }

      bookmark.items.push({
        itemId,
        itemType,
        savedAt: new Date(),
      });

      await bookmark.save();

      return {
        success: true,
        message: 'Item added to bookmark',
        data: bookmark,
      };
    } catch (error) {
      throw new Error(`Failed to add item to bookmark: ${error.message}`);
    }
  }

  // Remove item from bookmark
  static async removeItemFromBookmark(userId, bookmarkId, itemId) {
    try {
      const bookmark = await Bookmark.findById(bookmarkId);
      if (!bookmark) {
        throw new Error('Bookmark not found');
      }

      if (bookmark.userId.toString() !== userId) {
        throw new Error('Unauthorized to modify this bookmark');
      }

      bookmark.items = bookmark.items.filter((item) => item.itemId.toString() !== itemId);
      await bookmark.save();

      return {
        success: true,
        message: 'Item removed from bookmark',
        data: bookmark,
      };
    } catch (error) {
      throw new Error(`Failed to remove item from bookmark: ${error.message}`);
    }
  }

  // Get user bookmarks
  static async getUserBookmarks(userId, limit = 20, skip = 0) {
    try {
      const bookmarks = await Bookmark.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);

      const total = await Bookmark.countDocuments({ userId });

      return {
        success: true,
        data: bookmarks,
        pagination: {
          total,
          limit,
          skip,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new Error(`Failed to fetch user bookmarks: ${error.message}`);
    }
  }

  // Get bookmark by ID
  static async getBookmarkById(bookmarkId) {
    try {
      const bookmark = await Bookmark.findById(bookmarkId);
      if (!bookmark) {
        throw new Error('Bookmark not found');
      }

      return bookmark;
    } catch (error) {
      throw new Error(`Failed to fetch bookmark: ${error.message}`);
    }
  }

  // Get bookmark items with details
  static async getBookmarkItemsWithDetails(bookmarkId) {
    try {
      const bookmark = await Bookmark.findById(bookmarkId);
      if (!bookmark) {
        throw new Error('Bookmark not found');
      }

      const itemsWithDetails = await Promise.all(
        bookmark.items.map(async (item) => {
          let itemData;

          if (item.itemType === 'post') {
            itemData = await Post.findById(item.itemId)
              .populate('author', 'firstName lastName profilePicture')
              .select('-__v');
          } else if (item.itemType === 'video') {
            itemData = await Video.findById(item.itemId)
              .populate('uploader', 'firstName lastName profilePicture')
              .select('-__v');
          } else if (item.itemType === 'reel') {
            itemData = await Reel.findById(item.itemId)
              .populate('creator', 'firstName lastName profilePicture')
              .select('-__v');
          }

          return {
            ...item.toObject(),
            itemData,
          };
        })
      );

      return {
        ...bookmark.toObject(),
        items: itemsWithDetails,
      };
    } catch (error) {
      throw new Error(`Failed to fetch bookmark items: ${error.message}`);
    }
  }

  // Update bookmark
  static async updateBookmark(userId, bookmarkId, updateData) {
    try {
      const bookmark = await Bookmark.findById(bookmarkId);
      if (!bookmark) {
        throw new Error('Bookmark not found');
      }

      if (bookmark.userId.toString() !== userId) {
        throw new Error('Unauthorized to modify this bookmark');
      }

      Object.assign(bookmark, updateData);
      await bookmark.save();

      return {
        success: true,
        message: 'Bookmark updated successfully',
        data: bookmark,
      };
    } catch (error) {
      throw new Error(`Failed to update bookmark: ${error.message}`);
    }
  }

  // Delete bookmark
  static async deleteBookmark(userId, bookmarkId) {
    try {
      const bookmark = await Bookmark.findById(bookmarkId);
      if (!bookmark) {
        throw new Error('Bookmark not found');
      }

      if (bookmark.userId.toString() !== userId) {
        throw new Error('Unauthorized to delete this bookmark');
      }

      await Bookmark.findByIdAndDelete(bookmarkId);

      return {
        success: true,
        message: 'Bookmark deleted successfully',
      };
    } catch (error) {
      throw new Error(`Failed to delete bookmark: ${error.message}`);
    }
  }

  // Quick save item (create default bookmark if needed)
  static async quickSaveItem(userId, itemId, itemType) {
    try {
      // Find or create default bookmark
      let bookmark = await Bookmark.findOne({
        userId,
        name: 'Saved Items',
        isDefault: true,
      });

      if (!bookmark) {
        bookmark = new Bookmark({
          userId,
          name: 'Saved Items',
          description: 'Your saved posts, videos, and reels',
          isDefault: true,
          items: [],
        });
      }

      // Check if item already exists
      const itemExists = bookmark.items.some(
        (item) => item.itemId.toString() === itemId && item.itemType === itemType
      );

      if (itemExists) {
        return {
          success: false,
          message: 'Item already saved',
        };
      }

      bookmark.items.push({
        itemId,
        itemType,
        savedAt: new Date(),
      });

      await bookmark.save();

      return {
        success: true,
        message: 'Item saved successfully',
        data: bookmark,
      };
    } catch (error) {
      throw new Error(`Failed to save item: ${error.message}`);
    }
  }

  // Quick remove item
  static async quickRemoveItem(userId, itemId) {
    try {
      const bookmark = await Bookmark.findOne({
        userId,
        isDefault: true,
      });

      if (!bookmark) {
        throw new Error('Default bookmark not found');
      }

      bookmark.items = bookmark.items.filter((item) => item.itemId.toString() !== itemId);
      await bookmark.save();

      return {
        success: true,
        message: 'Item removed from saved items',
        data: bookmark,
      };
    } catch (error) {
      throw new Error(`Failed to remove item: ${error.message}`);
    }
  }

  // Check if item is bookmarked
  static async isItemBookmarked(userId, itemId) {
    try {
      const bookmark = await Bookmark.findOne({
        userId,
        'items.itemId': itemId,
      });

      return bookmark ? true : false;
    } catch (error) {
      throw new Error(`Failed to check bookmark status: ${error.message}`);
    }
  }

  // Get bookmark statistics
  static async getBookmarkStats(userId) {
    try {
      const bookmarks = await Bookmark.find({ userId });

      const stats = {
        totalBookmarks: bookmarks.length,
        totalItems: bookmarks.reduce((sum, b) => sum + b.items.length, 0),
        bookmarksByType: {
          posts: 0,
          videos: 0,
          reels: 0,
        },
      };

      bookmarks.forEach((bookmark) => {
        bookmark.items.forEach((item) => {
          if (item.itemType === 'post') stats.bookmarksByType.posts++;
          else if (item.itemType === 'video') stats.bookmarksByType.videos++;
          else if (item.itemType === 'reel') stats.bookmarksByType.reels++;
        });
      });

      return stats;
    } catch (error) {
      throw new Error(`Failed to fetch bookmark stats: ${error.message}`);
    }
  }
}

export default BookmarkService;
