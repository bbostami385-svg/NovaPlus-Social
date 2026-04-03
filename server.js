const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// 🔥 SOCKET
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

// 🔥 SOCKET INIT
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

// -----------------------
const PORT = process.env.PORT || 5000;

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
  friends: [String],

  isOnline: { type: Boolean, default: false },

  lastSeen: { type: Date, default: Date.now }
});

const User = mongoose.model("User", UserSchema);

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
// 🔥 ONLINE USERS MAP
// -----------------------
const onlineUsers = {};

// -----------------------
// 🔥 SOCKET SYSTEM (PRO)
// -----------------------
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // ✅ REGISTER USER
  socket.on("addUser", async (userId) => {
    onlineUsers[userId] = socket.id;

    await User.findByIdAndUpdate(userId, {
      isOnline: true
    });

    io.emit("getUsers", Object.keys(onlineUsers));
  });

  // ✅ JOIN ROOM (PRIVATE CHAT)
  socket.on("joinRoom", ({ senderId, receiverId }) => {
    const roomId = [senderId, receiverId].sort().join("_");
    socket.join(roomId);
  });

  // ✅ SEND MESSAGE
  socket.on("sendMessage", (data) => {
    const roomId = [data.senderId, data.receiverId].sort().join("_");

    io.to(roomId).emit("receiveMessage", {
      ...data,
      status: "delivered"
    });
  });

  // ✅ TYPING
  socket.on("typing", (data) => {
    const roomId = [data.senderId, data.receiverId].sort().join("_");

    socket.to(roomId).emit("typing", data);
  });

  // ✅ SEEN STATUS
  socket.on("seen", (data) => {
    const roomId = [data.senderId, data.receiverId].sort().join("_");

    socket.to(roomId).emit("seen", data);
  });

  // ❌ DISCONNECT
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
// USERS API
// -----------------------
app.get("/api/users/friends", auth, async (req, res) => {
  const me = await User.findById(req.user.id);
  const friends = await User.find({
    _id: { $in: me.friends }
  });

  res.json(friends);
});

// -----------------------
// POSTS ROUTES
// -----------------------
const postRoutes = require("./routes/postRoutes");
app.use("/api/posts", postRoutes);

// -----------------------
app.get("/", (req, res) => {
  res.send("NovaPlus Social Backend 🚀");
});

// -----------------------
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 🚀`);
});
