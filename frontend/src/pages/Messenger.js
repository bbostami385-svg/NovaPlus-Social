import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { storage } from "./firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const API = process.env.REACT_APP_API;
const socket = io(API);

function Messenger() {
  const [friends, setFriends] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [media, setMedia] = useState(null);

  const token = localStorage.getItem("token");
  const myId = localStorage.getItem("userId");

  const mediaRecorder = useRef(null);
  const chunks = useRef([]);

  // -----------------------
  // LOAD FRIENDS
  // -----------------------
  const loadFriends = async () => {
    const res = await fetch(`${API}/api/users/friends`, {
      headers: { Authorization: "Bearer " + token }
    });
    const data = await res.json();
    setFriends(data);
  };

  useEffect(() => {
    loadFriends();
  }, []);

  // -----------------------
  // SOCKET
  // -----------------------
  useEffect(() => {
    socket.emit("addUser", myId);

    socket.on("receiveMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => socket.off("receiveMessage");
  }, [myId]);

  // -----------------------
  // LOAD CHAT
  // -----------------------
  const loadMessages = async (id) => {
    setCurrentChat(id);

    const res = await fetch(`${API}/api/messages/${id}`, {
      headers: { Authorization: "Bearer " + token }
    });

    const data = await res.json();
    setMessages(data);
  };

  // -----------------------
  // UPLOAD FILE (Firebase)
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
    if (!text && !media) return;

    let fileUrl = "";
    if (media) {
      fileUrl = await uploadFile(media);
    }

    const msg = {
      senderId: myId,
      receiverId: currentChat,
      text,
      media: fileUrl,
      status: "sent"
    };

    socket.emit("sendMessage", msg);

    await fetch(`${API}/api/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token
      },
      body: JSON.stringify(msg)
    });

    setMessages((prev) => [...prev, msg]);
    setText("");
    setMedia(null);
  };

  // -----------------------
  // VOICE RECORD 🎤
  // -----------------------
  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder.current = new MediaRecorder(stream);

    mediaRecorder.current.ondataavailable = (e) => {
      chunks.current.push(e.data);
    };

    mediaRecorder.current.onstop = async () => {
      const blob = new Blob(chunks.current, { type: "audio/mp3" });
      const url = await uploadFile(blob);

      sendVoice(url);
      chunks.current = [];
    };

    mediaRecorder.current.start();
  };

  const stopRecording = () => {
    mediaRecorder.current.stop();
  };

  const sendVoice = async (url) => {
    const msg = {
      senderId: myId,
      receiverId: currentChat,
      audio: url
    };

    socket.emit("sendMessage", msg);
    setMessages((prev) => [...prev, msg]);
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      
      {/* FRIEND LIST */}
      <div style={{ width: "30%", borderRight: "1px solid gray" }}>
        <h3>Friends</h3>
        {friends.map((f) => (
          <div key={f._id} onClick={() => loadMessages(f._id)}>
            🟢 {f.name}
          </div>
        ))}
      </div>

      {/* CHAT */}
      <div style={{ width: "70%", padding: "10px" }}>
        <h3>Chat</h3>

        <div style={{ height: "70%", overflowY: "scroll" }}>
          {messages.map((m, i) => (
            <div key={i} style={{
              textAlign: m.senderId === myId ? "right" : "left"
            }}>
              {m.text && <p>{m.text}</p>}
              {m.media && <video src={m.media} controls width="200" />}
              {m.audio && <audio src={m.audio} controls />}
              
              {/* STATUS */}
              <span>
                {m.status === "sent" && "✔"}
                {m.status === "delivered" && "✔✔"}
                {m.status === "seen" && "✔✔ (blue)"}
              </span>
            </div>
          ))}
        </div>

        {/* INPUT */}
        <input value={text} onChange={(e) => setText(e.target.value)} />

        <input type="file" onChange={(e) => setMedia(e.target.files[0])} />

        <button onClick={sendMessage}>Send</button>

        {/* VOICE */}
        <button onMouseDown={startRecording} onMouseUp={stopRecording}>
          🎤 Hold to Talk
        </button>
      </div>
    </div>
  );
}

export default Messenger;
