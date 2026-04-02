import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const API = process.env.REACT_APP_API;
const socket = io(API);

function Messenger() {
  const [userId, setUserId] = useState("");
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);

  const token = localStorage.getItem("token");
  const myId = localStorage.getItem("userId");

  const chatRef = useRef(null);

  // -----------------------
  // JOIN ROOM
  // -----------------------
  useEffect(() => {
    if (myId && userId) {
      socket.emit("joinRoom", {
        senderId: myId,
        receiverId: userId
      });
    }
  }, [userId, myId]);

  // -----------------------
  // SOCKET EVENTS
  // -----------------------
  useEffect(() => {
    socket.on("receiveMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("typing", () => {
      setTyping(true);
      setTimeout(() => setTyping(false), 1000);
    });

    return () => {
      socket.off("receiveMessage");
      socket.off("typing");
    };
  }, []);

  // -----------------------
  // AUTO SCROLL
  // -----------------------
  useEffect(() => {
    chatRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // -----------------------
  // LOAD OLD MESSAGES
  // -----------------------
  const loadMessages = async () => {
    try {
      const res = await fetch(`${API}/api/messages/${userId}`, {
        headers: { Authorization: "Bearer " + token }
      });

      const data = await res.json();
      setMessages(data || []);
    } catch {
      alert("Error loading messages");
    }
  };

  // -----------------------
  // SEND MESSAGE
  // -----------------------
  const sendMessage = async () => {
    if (!text || !userId) return;

    const msg = {
      senderId: myId,
      receiverId: userId,
      text,
      createdAt: new Date()
    };

    // 🔥 REAL-TIME
    socket.emit("sendMessage", msg);

    // 🔥 SAVE DB
    try {
      await fetch(`${API}/api/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token
        },
        body: JSON.stringify({
          receiverId: userId,
          text
        })
      });
    } catch {
      console.log("DB save failed");
    }

    setMessages((prev) => [...prev, msg]);
    setText("");
  };

  return (
    <div style={{
      maxWidth: "500px",
      margin: "auto",
      padding: "20px",
      textAlign: "center"
    }}>
      <h2>💬 Messenger (Private Chat)</h2>

      {/* USER INPUT */}
      <input
        placeholder="Enter userId"
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
        style={{ padding: "8px", width: "70%" }}
      />

      <button onClick={loadMessages} style={{ marginLeft: "10px" }}>
        Load
      </button>

      {/* CHAT BOX */}
      <div style={{
        border: "1px solid #ccc",
        marginTop: "15px",
        padding: "10px",
        height: "350px",
        overflowY: "auto",
        borderRadius: "10px",
        background: "#f9f9f9"
      }}>
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              textAlign: m.senderId === myId ? "right" : "left",
              margin: "5px 0"
            }}
          >
            <span style={{
              display: "inline-block",
              padding: "8px 12px",
              borderRadius: "15px",
              background: m.senderId === myId ? "#dcf8c6" : "#eee",
              maxWidth: "70%"
            }}>
              {m.text}
            </span>
          </div>
        ))}

        {/* TYPING */}
        {typing && (
          <p style={{ fontSize: "12px", color: "gray" }}>
            Typing...
          </p>
        )}

        <div ref={chatRef}></div>
      </div>

      {/* INPUT */}
      <div style={{ marginTop: "10px" }}>
        <input
          value={text}
          onChange={(e) => {
            setText(e.target.value);

            socket.emit("typing", {
              senderId: myId,
              receiverId: userId
            });
          }}
          placeholder="Type message..."
          style={{ padding: "10px", width: "70%" }}
        />

        <button onClick={sendMessage} style={{ marginLeft: "10px" }}>
          Send
        </button>
      </div>
    </div>
  );
}

export default Messenger;
