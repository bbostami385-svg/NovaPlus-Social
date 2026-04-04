const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(cors());
app.use(express.json());

// =====================
// DB CONNECT
// =====================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected ✅"))
  .catch(err => console.log(err));

// =====================
// MODELS
// =====================
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  friends: [String],
  isOnline: { type: Boolean, default: false },
  lastSeen: { type: Date, default: Date.now }
});

const StorySchema = new mongoose.Schema({
  userId: String,
  media: String,
  text: String,
  createdAt: { type: Date, default: Date.now }
});

const GroupSchema = new mongoose.Schema({
  name: String,
  members: [String],
  createdBy: String
});

const NotificationSchema = new mongoose.Schema({
  userId: String,
  type: String,
  text: String,
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model("User", UserSchema);
const Story = mongoose.model("Story", StorySchema);
const Group = mongoose.model("Group", GroupSchema);
const Notification = mongoose.model("Notification", NotificationSchema);

// =====================
// AUTH MIDDLEWARE
// =====================
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

// =====================
// ONLINE USERS
// =====================
const onlineUsers = {};

// =====================
// SOCKET.IO
// =====================
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("addUser", async (userId) => {
    onlineUsers[userId] = socket.id;

    await User.findByIdAndUpdate(userId, { isOnline: true });

    io.emit("getUsers", Object.keys(onlineUsers));
  });

  socket.on("joinRoom", ({ senderId, receiverId }) => {
    const roomId = [senderId, receiverId].sort().join("_");
    socket.join(roomId);
  });

  socket.on("sendMessage", async (data) => {
    const roomId = [data.senderId, data.receiverId].sort().join("_");

    io.to(roomId).emit("receiveMessage", data);

    // 🔔 Notification
    const notif = new Notification({
      userId: data.receiverId,
      type: "message",
      text: "New message received"
    });

    await notif.save();

    const socketId = onlineUsers[data.receiverId];
    if (socketId) {
      io.to(socketId).emit("newNotification", notif);
    }
  });

  socket.on("sendGroupMessage", (data) => {
    io.to(data.groupId).emit("receiveGroupMessage", data);
  });

  socket.on("typing", (data) => {
    const roomId = [data.senderId, data.receiverId].sort().join("_");
    socket.to(roomId).emit("typing", data);
  });

  // =====================
  // VIDEO CALL
  // =====================
  socket.on("callUser", ({ from, to, signal }) => {
    const toSocket = onlineUsers[to];
    if (toSocket) {
      io.to(toSocket).emit("incomingCall", { from, signal });
    }
  });

  socket.on("answerCall", ({ to, signal }) => {
    const toSocket = onlineUsers[to];
    if (toSocket) {
      io.to(toSocket).emit("callAccepted", { signal });
    }
  });

  // =====================
  // DISCONNECT
  // =====================
  socket.on("disconnect", async () => {
    for (const userId in onlineUsers) {
      if (onlineUsers[userId] === socket.id) {
        delete onlineUsers[userId];

        await User.findByIdAndUpdate(userId, {
          isOnline: false,
          lastSeen: new Date()
        });
      }
    }

    io.emit("getUsers", Object.keys(onlineUsers));
  });
});

// =====================
// AUTH ROUTES
// =====================
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const exist = await User.findOne({ email });
    if (exist) return res.status(400).json({ msg: "Email exists" });

    const hash = await bcrypt.hash(password, 10);

    const user = new User({ name, email, password: hash });
    await user.save();

    res.json(user);
  } catch {
    res.status(500).json({ msg: "Error" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "User not found" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ msg: "Wrong password" });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, user });
  } catch {
    res.status(500).json({ msg: "Error" });
  }
});

// =====================
// FRIENDS
// =====================
app.get("/api/users/friends", auth, async (req, res) => {
  const me = await User.findById(req.user.id);

  const friends = await User.find({
    _id: { $in: me.friends }
  });

  res.json(friends);
});

// =====================
// GROUPS
// =====================
app.post("/api/groups", auth, async (req, res) => {
  const group = new Group({
    name: req.body.name,
    members: [...req.body.members, req.user.id],
    createdBy: req.user.id
  });

  await group.save();
  res.json(group);
});

app.get("/api/groups", auth, async (req, res) => {
  const groups = await Group.find({
    members: req.user.id
  });

  res.json(groups);
});

// =====================
// STORIES
// =====================
app.post("/api/story", auth, async (req, res) => {
  const { media, text } = req.body;

  const story = new Story({
    userId: req.user.id,
    media,
    text
  });

  await story.save();
  res.json(story);
});

app.get("/api/story", auth, async (req, res) => {
  const stories = await Story.find()
    .sort({ createdAt: -1 })
    .limit(50);

  res.json(stories);
});

// =====================
// NOTIFICATIONS
// =====================
app.post("/api/notification", auth, async (req, res) => {
  const { userId, type, text } = req.body;

  const notif = new Notification({
    userId,
    type,
    text
  });

  await notif.save();

  const socketId = onlineUsers[userId];
  if (socketId) {
    io.to(socketId).emit("newNotification", notif);
  }

  res.json(notif);
});

app.get("/api/notification", auth, async (req, res) => {
  const notifs = await Notification.find({
    userId: req.user.id
  }).sort({ createdAt: -1 });

  res.json(notifs);
});

// =====================
app.get("/", (req, res) => {
  res.send("Backend Running 🚀");
});

// =====================
server.listen(process.env.PORT || 5000, () => {
  console.log("Server running 🚀");
});
