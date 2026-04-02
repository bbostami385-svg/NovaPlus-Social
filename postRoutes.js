const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

// -----------------------
// POST MODEL
// -----------------------
const PostSchema = new mongoose.Schema({
  userId: String,
  text: String,
  image: String,
  video: String,
  category: String,

  likes: [String],

  reactions: [
    {
      userId: String,
      emoji: String
    }
  ],

  comments: [
    {
      userId: String,
      text: String,
      createdAt: { type: Date, default: Date.now }
    }
  ],

  createdAt: { type: Date, default: Date.now }
});

const Post = mongoose.model("Post", PostSchema);

// -----------------------
// AUTH MIDDLEWARE
// -----------------------
const auth = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];
  if (!token) return res.status(401).json({ msg: "No token" });

  try {
    const jwt = require("jsonwebtoken");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ msg: "Invalid token" });
  }
};

// -----------------------
// CREATE POST
// -----------------------
router.post("/", auth, async (req, res) => {
  try {
    const { text, image, video, category } = req.body;

    const post = new Post({
      userId: req.user.id,
      text,
      image,
      video,
      category
    });

    await post.save();
    res.json(post);

  } catch {
    res.status(500).json({ msg: "Post create error" });
  }
});

// -----------------------
// GET POSTS
// -----------------------
router.get("/", async (req, res) => {
  const posts = await Post.find().sort({ createdAt: -1 });
  res.json(posts);
});

// -----------------------
// LIKE
// -----------------------
router.put("/:id/like", auth, async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post.likes.includes(req.user.id)) {
    post.likes.push(req.user.id);
  } else {
    post.likes = post.likes.filter(id => id !== req.user.id);
  }

  await post.save();
  res.json(post);
});

// -----------------------
// REACTION (🔥 NEW)
// -----------------------
router.post("/:id/react", auth, async (req, res) => {
  const { emoji } = req.body;
  const post = await Post.findById(req.params.id);

  // remove old reaction
  post.reactions = post.reactions.filter(r => r.userId !== req.user.id);

  // add new reaction
  post.reactions.push({
    userId: req.user.id,
    emoji
  });

  await post.save();
  res.json(post);
});

// -----------------------
// COMMENT
// -----------------------
router.post("/:id/comment", auth, async (req, res) => {
  const post = await Post.findById(req.params.id);

  post.comments.push({
    userId: req.user.id,
    text: req.body.text
  });

  await post.save();
  res.json(post);
});

// -----------------------
// DELETE POST
// -----------------------
router.delete("/:id", auth, async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (post.userId !== req.user.id)
    return res.status(403).json({ msg: "Not allowed" });

  await post.deleteOne();
  res.json({ msg: "Deleted" });
});

module.exports = router;
