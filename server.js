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

// -----------------------
const PORT = process.env.PORT || 5000;

// -----------------------
// SOCKET INIT
// -----------------------
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

app.use(cors());
app.use(express.json());

// -----------------------
// MONGO DB
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
  friends: [String],
  isOnline: { type: Boolean, default: false },
  lastSeen: { type: Date, default: Date.now }
});

const GroupSchema = new mongoose.Schema({
  name: String,
  members: [String],
  createdBy: String,
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model("User", UserSchema);
const Group = mongoose.model("Group", GroupSchema);

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
// ONLINE USERS
// -----------------------
const onlineUsers = {};

// -----------------------
// SOCKET SYSTEM
// -----------------------
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // REGISTER USER
  socket.on("addUser", async (userId) => {
    onlineUsers[userId] = socket.id;

    await User.findByIdAndUpdate(userId, { isOnline: true });

    io.emit("getUsers", Object.keys(onlineUsers));
  });

  // JOIN PRIVATE ROOM
  socket.on("joinRoom", ({ senderId, receiverId }) => {
    const roomId = [senderId, receiverId].sort().join("_");
    socket.join(roomId);
  });

  // SEND PRIVATE MESSAGE
  socket.on("sendMessage", (data) => {
    const roomId = [data.senderId, data.receiverId].sort().join("_");

    io.to(roomId).emit("receiveMessage", {
      ...data,
      status: "delivered"
    });
  });

  // GROUP JOIN
  socket.on("joinGroup", (groupId) => {
    socket.join(groupId);
  });

  // GROUP MESSAGE
  socket.on("sendGroupMessage", (data) => {
    io.to(data.groupId).emit("receiveGroupMessage", data);
  });

  // TYPING
  socket.on("typing", (data) => {
    const roomId = [data.senderId, data.receiverId].sort().join("_");
    socket.to(roomId).emit("typing", data);
  });

  // SEEN
  socket.on("seen", (data) => {
    const roomId = [data.senderId, data.receiverId].sort().join("_");
    socket.to(roomId).emit("seen", data);
  });

  // -----------------------
  // VIDEO CALL
  // -----------------------
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

  socket.on("rejectCall", ({ to }) => {
    const toSocket = onlineUsers[to];
    if (toSocket) {
      io.to(toSocket).emit("callRejected");
    }
  });

  socket.on("endCall", ({ to }) => {
    const toSocket = onlineUsers[to];
    if (toSocket) {
      io.to(toSocket).emit("callEnded");
    }
  });

  // DISCONNECT
  socket.on("disconnect", async () => {
    for (const userId in onlineUsers) {
      if (onlineUsers[userId] === socket.id) {
        delete onlineUsers[userId];

        await User.findByIdAndUpdate(userId, {
          isOnline: false,
          lastSeen: new Date()
        });

        break;
      }
    }

    io.emit("getUsers", Object.keys(onlineUsers));
    console.log("User disconnected:", socket.id);
  });
});

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

    const user = await User.findOne({ email });
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
// FRIENDS API
// -----------------------
app.get("/api/users/friends", auth, async (req, res) => {
  const me = await User.findById(req.user.id);

  const friends = await User.find({
    _id: { $in: me.friends }
  });

  res.json(friends);
});

// -----------------------
// GROUP API
// -----------------------
app.post("/api/groups", auth, async (req, res) => {
  const { name, members } = req.body;

  const group = new Group({
    name,
    members: [...members, req.user.id],
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

// -----------------------
app.get("/", (req, res) => {
  res.send("NovaPlus Backend 🚀");
});

// -----------------------
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 🚀`);
});
