const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// -----------------------
app.use(cors());
app.use(express.json());

// -----------------------
// MongoDB
// -----------------------
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected ✅"))
  .catch(err => console.log("MongoDB error ❌", err));

// -----------------------
// MODELS
// -----------------------
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,

  followers: [String],
  following: [String],

  friendRequests: [String],
  sentRequests: [String],
  friends: [String],

  notifications: [
    {
      text: String,
      createdAt: { type: Date, default: Date.now }
    }
  ],

  isProfessional: { type: Boolean, default: false },

  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model("User", UserSchema);

const PostSchema = new mongoose.Schema({
  userId: String,
  text: String,
  image: String,
  video: String,

  likes: [String],

  comments: [
    {
      userId: String,
      text: String,
      createdAt: { type: Date, default: Date.now },
      replies: [
        {
          userId: String,
          text: String,
          createdAt: { type: Date, default: Date.now }
        }
      ]
    }
  ],

  sharedFrom: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
});
const Post = mongoose.model("Post", PostSchema);

// Story
const StorySchema = new mongoose.Schema({
  userId: String,
  image: String,
  video: String,
  createdAt: { type: Date, default: Date.now, expires: 86400 }
});
const Story = mongoose.model("Story", StorySchema);

// Message
const MessageSchema = new mongoose.Schema({
  senderId: String,
  receiverId: String,
  text: String,
  createdAt: { type: Date, default: Date.now }
});
const Message = mongoose.model("Message", MessageSchema);

// -----------------------
// AUTH MIDDLEWARE
// -----------------------
const auth = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];
  if (!token) return res.status(401).json({ msg: "No token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ msg: "Invalid token" });
  }
};

// -----------------------
// AUTH ROUTES
// -----------------------
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const exist = await User.findOne({ email });
    if (exist) return res.status(400).json({ msg: "Email exists" });

    const hash = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hash });

    await user.save();
    res.json({ msg: "Signup success", user });

  } catch {
    res.status(500).json({ msg: "Server error" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }); // ✅ FIXED
    if (!user) return res.status(400).json({ msg: "User not found" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ msg: "Wrong password" });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ msg: "Login success", token, user });

  } catch {
    res.status(500).json({ msg: "Server error" });
  }
});

// -----------------------
// POSTS
// -----------------------
app.post("/api/posts", auth, async (req, res) => {
  try {
    const { text, image, video } = req.body;

    const post = new Post({
      userId: req.user.id,
      text,
      image,
      video
    });

    await post.save();
    res.json(post);

  } catch {
    res.status(500).json({ msg: "Error creating post" });
  }
});

app.get("/api/posts", async (req, res) => {
  const posts = await Post.find().sort({ createdAt: -1 });
  res.json(posts);
});

app.put("/api/posts/:id/like", auth, async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post.likes.includes(req.user.id)) {
    post.likes.push(req.user.id);
  } else {
    post.likes = post.likes.filter(id => id !== req.user.id);
  }

  await post.save();
  res.json(post);
});

// COMMENT
app.post("/api/posts/:id/comment", auth, async (req, res) => {
  const post = await Post.findById(req.params.id);

  post.comments.push({
    userId: req.user.id,
    text: req.body.text
  });

  await post.save();
  res.json(post);
});

// DELETE COMMENT
app.delete("/api/posts/:postId/comment/:commentId", auth, async (req, res) => {
  const post = await Post.findById(req.params.postId);

  post.comments = post.comments.filter(
    c => c._id.toString() !== req.params.commentId
  );

  await post.save();
  res.json(post);
});

// REPLY COMMENT
app.post("/api/posts/:postId/comment/:commentId/reply", auth, async (req, res) => {
  const post = await Post.findById(req.params.postId);
  const comment = post.comments.id(req.params.commentId);

  comment.replies.push({
    userId: req.user.id,
    text: req.body.text
  });

  await post.save();
  res.json(post);
});

// DELETE POST
app.delete("/api/posts/:id", auth, async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (post.userId !== req.user.id)
    return res.status(403).json({ msg: "Not allowed" });

  await post.deleteOne();
  res.json({ msg: "Deleted" });
});

// SHARE
app.post("/api/posts/:id/share", auth, async (req, res) => {
  const original = await Post.findById(req.params.id);

  const post = new Post({
    userId: req.user.id,
    text: original.text,
    image: original.image,
    video: original.video,
    sharedFrom: original._id
  });

  await post.save();
  res.json(post);
});

// -----------------------
// STORY
// -----------------------
app.post("/api/stories", auth, async (req, res) => {
  const story = new Story({
    userId: req.user.id,
    image: req.body.image,
    video: req.body.video
  });

  await story.save();
  res.json(story);
});

app.get("/api/stories", async (req, res) => {
  const stories = await Story.find().sort({ createdAt: -1 });
  res.json(stories);
});

// -----------------------
// CHAT
// -----------------------
app.post("/api/messages", auth, async (req, res) => {
  const msg = new Message({
    senderId: req.user.id,
    receiverId: req.body.receiverId,
    text: req.body.text
  });

  await msg.save();
  res.json(msg);
});

app.get("/api/messages/:userId", auth, async (req, res) => {
  const msgs = await Message.find({
    $or: [
      { senderId: req.user.id, receiverId: req.params.userId },
      { senderId: req.params.userId, receiverId: req.user.id }
    ]
  }).sort({ createdAt: 1 });

  res.json(msgs);
});

// -----------------------
// USERS
// -----------------------
app.post("/api/users/:id/follow", auth, async (req, res) => {
  const user = await User.findById(req.params.id);
  const me = await User.findById(req.user.id);

  if (!user.followers.includes(me._id.toString())) {
    user.followers.push(me._id);
    me.following.push(user._id);
  } else {
    user.followers = user.followers.filter(f => f !== me._id.toString());
    me.following = me.following.filter(f => f !== user._id.toString());
  }

  await user.save();
  await me.save();

  res.json({ msg: "Follow updated" });
});

// FRIEND REQUEST
app.post("/api/users/:id/add-friend", auth, async (req, res) => {
  const target = await User.findById(req.params.id);
  const me = await User.findById(req.user.id);

  target.friendRequests.push(me._id);
  me.sentRequests.push(target._id);

  await target.save();
  await me.save();

  res.json({ msg: "Request sent" });
});

// ACCEPT FRIEND
app.post("/api/users/:id/accept", auth, async (req, res) => {
  const me = await User.findById(req.user.id);
  const sender = await User.findById(req.params.id);

  me.friends.push(sender._id);
  sender.friends.push(me._id);

  await me.save();
  await sender.save();

  res.json({ msg: "Friend added" });
});

// PROFESSIONAL MODE
app.put("/api/users/professional", auth, async (req, res) => {
  const user = await User.findById(req.user.id);

  user.isProfessional = !user.isProfessional;
  await user.save();

  res.json({ isProfessional: user.isProfessional });
});

// -----------------------
app.get("/", (req, res) => {
  res.send("NovaPlus Social Backend 🚀");
});

// -----------------------
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 🚀`);
});
