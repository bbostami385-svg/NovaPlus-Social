import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import Peer from "simple-peer/simplepeer.min.js";
import { storage } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const API = process.env.REACT_APP_API;
const socket = io(API);

function Messenger() {

  const [friends, setFriends] = useState([]);
  const [groups, setGroups] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);

  const [currentChat, setCurrentChat] = useState(null);
  const [isGroup, setIsGroup] = useState(false);

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const [media, setMedia] = useState(null);
  const [preview, setPreview] = useState(null);

  const [typingUser, setTypingUser] = useState("");

  // 🔥 VIDEO
  const [stream, setStream] = useState(null);
  const [call, setCall] = useState(null);
  const [callerSignal, setCallerSignal] = useState(null);

  const myVideo = useRef();
  const userVideo = useRef();
  const peerRef = useRef();

  const token = localStorage.getItem("token");
  const myId = localStorage.getItem("userId");

  const mediaRecorder = useRef(null);
  const chunks = useRef([]);
  const chatRef = useRef();

  // -----------------------
  // LOAD FRIENDS + GROUPS
  // -----------------------
  useEffect(() => {
    const loadData = async () => {
      try {
        const f = await fetch(`${API}/api/users/friends`, {
          headers: { Authorization: "Bearer " + token }
        });
        setFriends(await f.json());

        const g = await fetch(`${API}/api/groups`, {
          headers: { Authorization: "Bearer " + token }
        });
        setGroups(await g.json());

      } catch {
        console.log("Load error");
      }
    };

    loadData();
  }, []);

  // -----------------------
  // SOCKET
  // -----------------------
  useEffect(() => {
    if (!myId) return;

    socket.emit("addUser", myId);

    socket.on("getUsers", (users) => {
      setOnlineUsers(users);
    });

    socket.on("receiveMessage", (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    socket.on("receiveGroupMessage", (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    socket.on("typing", (data) => {
      setTypingUser(data.senderId);
      setTimeout(() => setTypingUser(""), 1000);
    });

    // CALL
    socket.on("incomingCall", ({ from, signal }) => {
      setCall({ from });
      setCallerSignal(signal);
    });

    socket.on("callAccepted", ({ signal }) => {
      peerRef.current.signal(signal);
    });

    return () => socket.off();
  }, [myId]);

  // -----------------------
  // SELECT USER
  // -----------------------
  const openChat = (id) => {
    setCurrentChat(id);
    setIsGroup(false);

    socket.emit("joinRoom", {
      senderId: myId,
      receiverId: id
    });

    setMessages([]);
  };

  // -----------------------
  // SELECT GROUP
  // -----------------------
  const openGroup = (group) => {
    setCurrentChat(group._id);
    setIsGroup(true);

    socket.emit("joinGroup", group._id);
    setMessages([]);
  };

  // -----------------------
  // SCROLL
  // -----------------------
  useEffect(() => {
    chatRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // -----------------------
  // UPLOAD
  // -----------------------
  const uploadFile = async (file) => {
    const fileRef = ref(storage, "chat/" + Date.now());
    await uploadBytes(fileRef, file);
    return await getDownloadURL(fileRef);
  };

  // -----------------------
  // SEND MESSAGE
  // -----------------------
  const sendMessage = async () => {
    if (!currentChat) return;

    let fileUrl = "";
    if (media) fileUrl = await uploadFile(media);

    const msg = {
      senderId: myId,
      receiverId: currentChat,
      text,
      media: fileUrl
    };

    socket.emit("sendMessage", msg);
    setMessages(prev => [...prev, msg]);

    setText("");
    setMedia(null);
    setPreview(null);
  };

  // -----------------------
  // SEND GROUP
  // -----------------------
  const sendGroupMessage = () => {
    const msg = {
      groupId: currentChat,
      senderId: myId,
      text
    };

    socket.emit("sendGroupMessage", msg);
    setMessages(prev => [...prev, msg]);
    setText("");
  };

  // -----------------------
  // VOICE
  // -----------------------
  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    mediaRecorder.current = new MediaRecorder(stream);

    mediaRecorder.current.ondataavailable = (e) => {
      chunks.current.push(e.data);
    };

    mediaRecorder.current.onstop = async () => {
      const blob = new Blob(chunks.current);
      const url = await uploadFile(blob);

      const msg = {
        senderId: myId,
        receiverId: currentChat,
        audio: url
      };

      socket.emit("sendMessage", msg);
      setMessages(prev => [...prev, msg]);

      chunks.current = [];
    };

    mediaRecorder.current.start();
  };

  const stopRecording = () => {
    mediaRecorder.current.stop();
  };

  // -----------------------
  // VIDEO
  // -----------------------
  const startVideo = async () => {
    const mediaStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });

    setStream(mediaStream);
    myVideo.current.srcObject = mediaStream;
  };

  const callUser = () => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream
    });

    peer.on("signal", (signal) => {
      socket.emit("callUser", {
        from: myId,
        to: currentChat,
        signal
      });
    });

    peer.on("stream", (remoteStream) => {
      userVideo.current.srcObject = remoteStream;
    });

    peerRef.current = peer;
  };

  const acceptCall = () => {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream
    });

    peer.on("signal", (signal) => {
      socket.emit("answerCall", {
        to: call.from,
        signal
      });
    });

    peer.on("stream", (remoteStream) => {
      userVideo.current.srcObject = remoteStream;
    });

    peer.signal(callerSignal);
    peerRef.current = peer;
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>

      {/* LEFT */}
      <div style={{ width: "30%", borderRight: "1px solid gray" }}>
        <h3>Friends</h3>
        {friends.map(f => (
          <div key={f._id} onClick={() => openChat(f._id)}>
            {onlineUsers.includes(f._id) ? "🟢" : "⚪"} {f.name}
          </div>
        ))}

        <h3>Groups</h3>
        {groups.map(g => (
          <div key={g._id} onClick={() => openGroup(g)}>
            👥 {g.name}
          </div>
        ))}
      </div>

      {/* RIGHT */}
      <div style={{ width: "70%", padding: "10px" }}>
        <h3>Chat</h3>

        <div style={{ height: "60%", overflowY: "scroll" }}>
          {messages.map((m, i) => (
            <div key={i} style={{
              textAlign: m.senderId === myId ? "right" : "left"
            }}>
              {m.text && <p>{m.text}</p>}
              {m.media && <video src={m.media} controls width="150" />}
              {m.audio && <audio src={m.audio} controls />}
            </div>
          ))}
          <div ref={chatRef}></div>
        </div>

        <input value={text} onChange={(e) => {
          setText(e.target.value);
          socket.emit("typing", {
            senderId: myId,
            receiverId: currentChat
          });
        }} />

        <input type="file" onChange={(e) => {
          const file = e.target.files[0];
          setMedia(file);
          setPreview(URL.createObjectURL(file));
        }} />

        {preview && <img src={preview} width="80" alt="" />}

        <button onClick={isGroup ? sendGroupMessage : sendMessage}>
          Send
        </button>

        <button onMouseDown={startRecording} onMouseUp={stopRecording}>
          🎤
        </button>

        {/* VIDEO */}
        <div>
          <button onClick={startVideo}>🎥</button>
          <button onClick={callUser}>📞</button>
        </div>

        {call && (
          <div>
            <p>Incoming Call</p>
            <button onClick={acceptCall}>Accept</
