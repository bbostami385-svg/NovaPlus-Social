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

// -----------------------
app.use(cors());
app.use(express.json());

// -----------------------
// MONGO DB
// -----------------------
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected ✅"))
  .catch(err => console.log("MongoDB error ❌", err));

// -----------------------
// USER MODEL
// -----------------------
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
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
// ONLINE USERS MAP
// -----------------------
const onlineUsers = {};

// -----------------------
// SOCKET.IO (FULL PRO)
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

  // ✅ JOIN ROOM
  socket.on("joinRoom", ({ senderId, receiverId }) => {
    const roomId = [senderId, receiverId].sort().join("_");
    socket.join(roomId);
  });

  // ✅ SEND MESSAGE
  socket.on("sendMessage", (data) => {
    const roomId = [data.senderId, data.receiverId].sort().join("_");

    io.to(roomId).emit("receiveMessage", {
      ...data,
      status: "delivered",
      createdAt: new Date()
    });
  });

  // ✅ TYPING
  socket.on("typing", (data) => {
    const roomId = [data.senderId, data.receiverId].sort().join("_");
    socket.to(roomId).emit("typing", data);
  });

  // ✅ SEEN
  socket.on("seen", (data) => {
    const roomId = [data.senderId, data.receiverId].sort().join("_");
    socket.to(roomId).emit("seen", data);
  });

  // ======================
  // 🔥 VIDEO CALL SYSTEM
  // ======================

  // CALL USER
  socket.on("callUser", ({ from, to, signal }) => {
    const toSocketId = onlineUsers[to];
    if (toSocketId) {
      io.to(toSocketId).emit("incomingCall", {
        from,
        signal
      });
    }
  });

  // ACCEPT CALL
  socket.on("answerCall", ({ to, signal }) => {
    const toSocketId = onlineUsers[to];
    if (toSocketId) {
      io.to(toSocketId).emit("callAccepted", { signal });
    }
  });

  // ICE (advanced)
  socket.on("iceCandidate", ({ to, candidate }) => {
    const toSocketId = onlineUsers[to];
    if (toSocketId) {
      io.to(toSocketId).emit("iceCandidate", { candidate });
    }
  });

  // END CALL
  socket.on("endCall", ({ to }) => {
    const toSocketId = onlineUsers[to];
    if (toSocketId) {
      io.to(toSocketId).emit("callEnded");
    }
  });

  // REJECT CALL
  socket.on("rejectCall", ({ to }) => {
    const toSocketId = onlineUsers[to];
    if (toSocketId) {
      io.to(toSocketId).emit("callRejected");
    }
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

    const user = new User({
      name,
      email,
      password: hash
    });

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
// USER STATUS
// -----------------------
app.get("/api/users/status/:id", async (req, res) => {
  const user = await User.findById(req.params.id);

  res.json({
    isOnline: user.isOnline,
    lastSeen: user.lastSeen
  });
});

// -----------------------
app.get("/", (req, res) => {
  res.send("NovaPlus Backend 🚀");
});

// -----------------------
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 🚀`);
});
