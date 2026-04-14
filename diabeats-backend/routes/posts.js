const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const { protect } = require('../middleware/auth');

// @route  GET /api/posts
// @desc   Get all community posts (paginated, newest first)
// @access Private
router.get('/', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const skip = (page - 1) * limit;
    const tag = req.query.tag;

    const filter = tag ? { tag } : {};
    const posts = await Post.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Post.countDocuments(filter);

    // Add likeCount and whether current user liked each post
    const postsWithMeta = posts.map(post => ({
      ...post,
      likeCount: post.likes ? post.likes.length : 0,
      likedByMe: post.likes ? post.likes.some(id => id.toString() === req.user._id.toString()) : false,
      replyCount: post.replies ? post.replies.length : 0
    }));

    res.json({ posts: postsWithMeta, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route  POST /api/posts
// @desc   Create a new community post
// @access Private
router.post('/', protect, async (req, res) => {
  try {
    const { content, tag } = req.body;
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Post content is required' });
    }

    const post = await Post.create({
      user: req.user._id,
      authorName: req.user.name,
      content: content.trim(),
      tag: tag || 'General'
    });

    res.status(201).json({
      ...post.toObject(),
      likeCount: 0,
      likedByMe: false,
      replyCount: 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route  PUT /api/posts/:id/like
// @desc   Toggle like on a post
// @access Private
router.put('/:id/like', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const alreadyLiked = post.likes.some(id => id.toString() === req.user._id.toString());
    if (alreadyLiked) {
      post.likes = post.likes.filter(id => id.toString() !== req.user._id.toString());
    } else {
      post.likes.push(req.user._id);
    }
    await post.save();

    res.json({ likeCount: post.likes.length, likedByMe: !alreadyLiked });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route  POST /api/posts/:id/reply
// @desc   Reply to a community post
// @access Private
router.post('/:id/reply', protect, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Reply content is required' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const reply = {
      user: req.user._id,
      authorName: req.user.name,
      content: content.trim()
    };

    post.replies.push(reply);
    await post.save();

    res.status(201).json(post.replies[post.replies.length - 1]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route  DELETE /api/posts/:id
// @desc   Delete a post (only by owner)
// @access Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }
    await post.deleteOne();
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
