import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';

class PostService {
  // Create post
  async createPost(userId, postData) {
    try {
      const post = new Post({
        author: userId,
        content: postData.content,
        images: postData.images || [],
        videos: postData.videos || [],
        visibility: postData.visibility || 'public',
        location: postData.location,
        hashtags: postData.hashtags || [],
        mentions: postData.mentions || [],
      });

      await post.save();
      await post.populate('author', 'username firstName lastName profilePicture');

      // Update user posts count
      await User.findByIdAndUpdate(userId, { $inc: { postsCount: 1 } });

      return post;
    } catch (error) {
      throw new Error(`Failed to create post: ${error.message}`);
    }
  }

  // Get post by ID
  async getPostById(postId) {
    try {
      const post = await Post.findById(postId)
        .populate('author', 'username firstName lastName profilePicture bio')
        .populate('mentions', 'username profilePicture')
        .populate('comments');

      if (!post) {
        throw new Error('Post not found');
      }

      return post;
    } catch (error) {
      throw new Error(`Failed to get post: ${error.message}`);
    }
  }

  // Get user feed
  async getUserFeed(userId, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;

      // Get user's following list
      const user = await User.findById(userId).select('following friends');
      const followingIds = [...user.following, ...user.friends, userId];

      const posts = await Post.find({
        author: { $in: followingIds },
        visibility: { $in: ['public', 'friends'] },
      })
        .populate('author', 'username firstName lastName profilePicture bio')
        .populate('mentions', 'username profilePicture')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Post.countDocuments({
        author: { $in: followingIds },
        visibility: { $in: ['public', 'friends'] },
      });

      return {
        posts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new Error(`Failed to get feed: ${error.message}`);
    }
  }

  // Get user posts
  async getUserPosts(userId, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;

      const posts = await Post.find({ author: userId })
        .populate('author', 'username firstName lastName profilePicture bio')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Post.countDocuments({ author: userId });

      return {
        posts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new Error(`Failed to get user posts: ${error.message}`);
    }
  }

  // Like post
  async likePost(postId, userId) {
    try {
      const post = await Post.findById(postId);

      if (!post) {
        throw new Error('Post not found');
      }

      // Check if already liked
      const alreadyLiked = post.likes.find((like) => like.userId.toString() === userId);

      if (alreadyLiked) {
        throw new Error('Post already liked');
      }

      post.likes.push({ userId });
      post.likesCount = post.likes.length;
      post.calculateEngagementScore();

      await post.save();

      // Create notification
      if (post.author.toString() !== userId) {
        const user = await User.findById(userId);
        await Notification.createNotification({
          recipient: post.author,
          actor: userId,
          type: 'like_post',
          title: `${user.firstName} liked your post`,
          message: `${user.firstName} ${user.lastName} liked your post`,
          image: user.profilePicture,
          relatedPost: postId,
          actionUrl: `/post/${postId}`,
        });
      }

      return {
        success: true,
        likesCount: post.likesCount,
      };
    } catch (error) {
      throw new Error(`Failed to like post: ${error.message}`);
    }
  }

  // Unlike post
  async unlikePost(postId, userId) {
    try {
      const post = await Post.findById(postId);

      if (!post) {
        throw new Error('Post not found');
      }

      post.likes = post.likes.filter((like) => like.userId.toString() !== userId);
      post.likesCount = post.likes.length;
      post.calculateEngagementScore();

      await post.save();

      return {
        success: true,
        likesCount: post.likesCount,
      };
    } catch (error) {
      throw new Error(`Failed to unlike post: ${error.message}`);
    }
  }

  // Add comment
  async addComment(postId, userId, content, parentCommentId = null) {
    try {
      const post = await Post.findById(postId);

      if (!post) {
        throw new Error('Post not found');
      }

      const comment = new Comment({
        post: postId,
        author: userId,
        content,
        parentComment: parentCommentId,
      });

      await comment.save();

      // Add comment to post
      post.comments.push(comment._id);
      post.commentsCount = post.comments.length;
      post.calculateEngagementScore();

      await post.save();

      // If replying to a comment, update parent comment
      if (parentCommentId) {
        const parentComment = await Comment.findById(parentCommentId);
        if (parentComment) {
          parentComment.replies.push(comment._id);
          parentComment.repliesCount = parentComment.replies.length;
          await parentComment.save();
        }
      }

      // Create notification
      if (post.author.toString() !== userId) {
        const user = await User.findById(userId);
        await Notification.createNotification({
          recipient: post.author,
          actor: userId,
          type: 'comment_post',
          title: `${user.firstName} commented on your post`,
          message: content.substring(0, 100),
          image: user.profilePicture,
          relatedPost: postId,
          relatedComment: comment._id,
          actionUrl: `/post/${postId}`,
        });
      }

      return comment;
    } catch (error) {
      throw new Error(`Failed to add comment: ${error.message}`);
    }
  }

  // Delete post
  async deletePost(postId, userId) {
    try {
      const post = await Post.findById(postId);

      if (!post) {
        throw new Error('Post not found');
      }

      if (post.author.toString() !== userId) {
        throw new Error('Not authorized to delete this post');
      }

      // Delete all comments
      await Comment.deleteMany({ post: postId });

      // Delete post
      await Post.findByIdAndDelete(postId);

      // Update user posts count
      await User.findByIdAndUpdate(userId, { $inc: { postsCount: -1 } });

      return {
        success: true,
        message: 'Post deleted successfully',
      };
    } catch (error) {
      throw new Error(`Failed to delete post: ${error.message}`);
    }
  }

  // Edit post
  async editPost(postId, userId, updateData) {
    try {
      const post = await Post.findById(postId);

      if (!post) {
        throw new Error('Post not found');
      }

      if (post.author.toString() !== userId) {
        throw new Error('Not authorized to edit this post');
      }

      const allowedFields = ['content', 'images', 'videos', 'visibility', 'location', 'hashtags'];

      allowedFields.forEach((field) => {
        if (updateData[field] !== undefined) {
          post[field] = updateData[field];
        }
      });

      post.isEdited = true;
      post.editedAt = new Date();

      await post.save();

      return post;
    } catch (error) {
      throw new Error(`Failed to edit post: ${error.message}`);
    }
  }

  // Share post
  async sharePost(postId, userId, shareData = {}) {
    try {
      const originalPost = await Post.findById(postId);

      if (!originalPost) {
        throw new Error('Post not found');
      }

      // Create shared post
      const sharedPost = new Post({
        author: userId,
        content: shareData.content || `Shared from ${originalPost.author}`,
        visibility: shareData.visibility || 'public',
        sharedPostId: postId,
        sharedPostAuthor: originalPost.author,
      });

      await sharedPost.save();

      // Update original post shares count
      originalPost.shares.push({ userId });
      originalPost.sharesCount = originalPost.shares.length;
      originalPost.calculateEngagementScore();

      await originalPost.save();

      // Create notification
      if (originalPost.author.toString() !== userId) {
        const user = await User.findById(userId);
        await Notification.createNotification({
          recipient: originalPost.author,
          actor: userId,
          type: 'share_post',
          title: `${user.firstName} shared your post`,
          message: `${user.firstName} ${user.lastName} shared your post`,
          image: user.profilePicture,
          relatedPost: postId,
          actionUrl: `/post/${postId}`,
        });
      }

      return sharedPost;
    } catch (error) {
      throw new Error(`Failed to share post: ${error.message}`);
    }
  }

  // Save post
  async savePost(postId, userId) {
    try {
      const post = await Post.findById(postId);

      if (!post) {
        throw new Error('Post not found');
      }

      if (post.saves.includes(userId)) {
        throw new Error('Post already saved');
      }

      post.saves.push(userId);
      post.savesCount = post.saves.length;

      await post.save();

      return {
        success: true,
        savesCount: post.savesCount,
      };
    } catch (error) {
      throw new Error(`Failed to save post: ${error.message}`);
    }
  }

  // Unsave post
  async unsavePost(postId, userId) {
    try {
      const post = await Post.findById(postId);

      if (!post) {
        throw new Error('Post not found');
      }

      post.saves = post.saves.filter((id) => id.toString() !== userId);
      post.savesCount = post.saves.length;

      await post.save();

      return {
        success: true,
        savesCount: post.savesCount,
      };
    } catch (error) {
      throw new Error(`Failed to unsave post: ${error.message}`);
    }
  }

  // Search posts
  async searchPosts(query, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;

      const posts = await Post.find(
        { $text: { $search: query } },
        { score: { $meta: 'textScore' } }
      )
        .sort({ score: { $meta: 'textScore' } })
        .skip(skip)
        .limit(limit)
        .populate('author', 'username firstName lastName profilePicture');

      const total = await Post.countDocuments({ $text: { $search: query } });

      return {
        posts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new Error(`Failed to search posts: ${error.message}`);
    }
  }
}

export default new PostService();
