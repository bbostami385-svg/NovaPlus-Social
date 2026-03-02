// fullBackend.js
// Nova Plus Backend - Single File Version
// Powered by Bayojid AI

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

/* =======================
   Models
======================= */
const { Schema, model } = mongoose;

const UserSchema = new Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  profilePic: String,
  createdAt: { type: Date, default: Date.now }
});
const User = model("User", UserSchema);

const PostSchema = new Schema({
  userId: String,
  content: String,
  image: String,
  likes: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});
const Post = model("Post", PostSchema);

const CommentSchema = new Schema({
  postId: String,
  userId: String,
  comment: String,
  createdAt: { type: Date, default: Date.now }
});
const Comment = model("Comment", CommentSchema);

/* =======================
   Controllers
======================= */
const authController = {
  signup: (req, res) => {
    res.send("Signup API placeholder");
  },
  login: (req, res) => {
    res.send("Login API placeholder");
  }
};

const postController = {
  createPost: (req, res) => {
    res.send("Create Post API placeholder");
  },
  getPosts: (req, res) => {
    res.send("Get Posts API placeholder");
  }
};

const chatController = {
  chatWithAI: (req, res) => {
    const { message } = req.body;
    res.json({ reply: `Bayojid AI received: ${message}` });
  }
};

/* =======================
   Routes
======================= */
const router = express.Router();

// Auth Routes
router.post("/api/auth/signup", authController.signup);
router.post("/api/auth/login", authController.login);

// Post Routes
router.post("/api/posts", postController.createPost);
router.get("/api/posts", postController.getPosts);

// Chat Routes
router.post("/api/chat", chatController.chatWithAI);

app.use("/", router);

/* =======================
   Test Route
======================= */
app.get("/", (req, res) => {
  res.send("Nova Plus Full Backend is Running 🚀");
});

/* =======================
   MongoDB Connection
======================= */
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("MongoDB connected"))
  .catch(err => console.log("MongoDB connection error:", err));

/* =======================
   Start Server
======================= */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
