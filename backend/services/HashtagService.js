import Hashtag from '../models/Hashtag.js';
import Post from '../models/Post.js';

class HashtagService {
  // Get or create hashtag
  static async getOrCreateHashtag(tag) {
    try {
      let hashtag = await Hashtag.findOne({ tag: tag.toLowerCase() });

      if (!hashtag) {
        hashtag = new Hashtag({
          tag: tag.toLowerCase(),
          displayTag: tag,
          usageCount: 1,
        });
        await hashtag.save();
      } else {
        hashtag.usageCount += 1;
        await hashtag.save();
      }

      return hashtag;
    } catch (error) {
      throw new Error(`Failed to get or create hashtag: ${error.message}`);
    }
  }

  // Get all hashtags
  static async getAllHashtags(limit = 50, skip = 0) {
    try {
      const hashtags = await Hashtag.find()
        .sort({ usageCount: -1 })
        .limit(limit)
        .skip(skip);

      const total = await Hashtag.countDocuments();

      return {
        success: true,
        data: hashtags,
        pagination: {
          total,
          limit,
          skip,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new Error(`Failed to fetch hashtags: ${error.message}`);
    }
  }

  // Get trending hashtags
  static async getTrendingHashtags(limit = 20) {
    try {
      const hashtags = await Hashtag.find()
        .sort({ usageCount: -1 })
        .limit(limit);

      return hashtags;
    } catch (error) {
      throw new Error(`Failed to fetch trending hashtags: ${error.message}`);
    }
  }

  // Search hashtags
  static async searchHashtags(query, limit = 20) {
    try {
      const hashtags = await Hashtag.find({
        tag: { $regex: query.toLowerCase(), $options: 'i' },
      })
        .sort({ usageCount: -1 })
        .limit(limit);

      return hashtags;
    } catch (error) {
      throw new Error(`Failed to search hashtags: ${error.message}`);
    }
  }

  // Get hashtag by ID
  static async getHashtagById(hashtagId) {
    try {
      const hashtag = await Hashtag.findById(hashtagId);
      if (!hashtag) {
        throw new Error('Hashtag not found');
      }

      return hashtag;
    } catch (error) {
      throw new Error(`Failed to fetch hashtag: ${error.message}`);
    }
  }

  // Get hashtag by tag
  static async getHashtagByTag(tag) {
    try {
      const hashtag = await Hashtag.findOne({ tag: tag.toLowerCase() });
      if (!hashtag) {
        throw new Error('Hashtag not found');
      }

      return hashtag;
    } catch (error) {
      throw new Error(`Failed to fetch hashtag: ${error.message}`);
    }
  }

  // Get posts by hashtag
  static async getPostsByHashtag(tag, limit = 20, skip = 0) {
    try {
      const hashtag = await Hashtag.findOne({ tag: tag.toLowerCase() });
      if (!hashtag) {
        return {
          success: true,
          data: [],
          pagination: { total: 0, limit, skip, pages: 0 },
        };
      }

      const posts = await Post.find({ hashtags: hashtag._id })
        .populate('author', 'firstName lastName profilePicture')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);

      const total = await Post.countDocuments({ hashtags: hashtag._id });

      return {
        success: true,
        data: posts,
        pagination: {
          total,
          limit,
          skip,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new Error(`Failed to fetch posts by hashtag: ${error.message}`);
    }
  }

  // Get hashtag statistics
  static async getHashtagStats(hashtagId) {
    try {
      const hashtag = await Hashtag.findById(hashtagId);
      if (!hashtag) {
        throw new Error('Hashtag not found');
      }

      const postsCount = await Post.countDocuments({ hashtags: hashtagId });

      return {
        tag: hashtag.tag,
        displayTag: hashtag.displayTag,
        usageCount: hashtag.usageCount,
        postsCount,
        createdAt: hashtag.createdAt,
        updatedAt: hashtag.updatedAt,
      };
    } catch (error) {
      throw new Error(`Failed to fetch hashtag stats: ${error.message}`);
    }
  }

  // Get related hashtags
  static async getRelatedHashtags(tag, limit = 10) {
    try {
      const hashtag = await Hashtag.findOne({ tag: tag.toLowerCase() });
      if (!hashtag) {
        throw new Error('Hashtag not found');
      }

      // Get posts with this hashtag
      const posts = await Post.find({ hashtags: hashtag._id }).select('hashtags');

      // Get all hashtags from these posts
      const relatedHashtagIds = new Set();
      posts.forEach((post) => {
        post.hashtags.forEach((id) => {
          if (id.toString() !== hashtag._id.toString()) {
            relatedHashtagIds.add(id.toString());
          }
        });
      });

      const relatedHashtags = await Hashtag.find({
        _id: { $in: Array.from(relatedHashtagIds) },
      })
        .sort({ usageCount: -1 })
        .limit(limit);

      return relatedHashtags;
    } catch (error) {
      throw new Error(`Failed to fetch related hashtags: ${error.message}`);
    }
  }

  // Get hashtag categories
  static async getHashtagCategories() {
    try {
      const categories = await Hashtag.distinct('category');
      return categories.filter((c) => c !== null && c !== undefined);
    } catch (error) {
      throw new Error(`Failed to fetch hashtag categories: ${error.message}`);
    }
  }

  // Get hashtags by category
  static async getHashtagsByCategory(category, limit = 20) {
    try {
      const hashtags = await Hashtag.find({ category })
        .sort({ usageCount: -1 })
        .limit(limit);

      return hashtags;
    } catch (error) {
      throw new Error(`Failed to fetch hashtags by category: ${error.message}`);
    }
  }

  // Update hashtag
  static async updateHashtag(hashtagId, updateData) {
    try {
      const hashtag = await Hashtag.findByIdAndUpdate(hashtagId, updateData, {
        new: true,
      });

      if (!hashtag) {
        throw new Error('Hashtag not found');
      }

      return hashtag;
    } catch (error) {
      throw new Error(`Failed to update hashtag: ${error.message}`);
    }
  }

  // Delete hashtag
  static async deleteHashtag(hashtagId) {
    try {
      const hashtag = await Hashtag.findByIdAndDelete(hashtagId);
      if (!hashtag) {
        throw new Error('Hashtag not found');
      }

      // Remove hashtag from all posts
      await Post.updateMany({ hashtags: hashtagId }, { $pull: { hashtags: hashtagId } });

      return {
        success: true,
        message: 'Hashtag deleted successfully',
      };
    } catch (error) {
      throw new Error(`Failed to delete hashtag: ${error.message}`);
    }
  }

  // Get trending hashtags with posts count
  static async getTrendingHashtagsWithStats(limit = 20) {
    try {
      const hashtags = await Hashtag.find().sort({ usageCount: -1 }).limit(limit);

      const hashtagsWithStats = await Promise.all(
        hashtags.map(async (hashtag) => {
          const postsCount = await Post.countDocuments({ hashtags: hashtag._id });
          return {
            ...hashtag.toObject(),
            postsCount,
          };
        })
      );

      return hashtagsWithStats;
    } catch (error) {
      throw new Error(`Failed to fetch trending hashtags with stats: ${error.message}`);
    }
  }
}

export default HashtagService;
