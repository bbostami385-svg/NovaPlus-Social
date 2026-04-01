import React, { useState } from "react";

function Messenger() {
  const [userId, setUserId] = useState("");
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const token = localStorage.getItem("token");

  const loadMessages = async () => {
    try {
      const res = await fetch(`https://novaplus-social.onrender.com/api/messages/${userId}`, {
        headers: { Authorization: "Bearer " + token }
      });

      const data = await res.json();
      setMessages(data || []);
    } catch {
      alert("Error loading messages");
    }
  };

  const sendMessage = async () => {
    if (!text) return;

    try {
      await fetch("https://novaplus-social.onrender.com/api/messages", {
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

      setText("");
      loadMessages();
    } catch {
      alert("Send failed");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Messenger 💬</h2>

      <input
        placeholder="Enter userId"
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
      />

      <button onClick={loadMessages}>Load Chat</button>

      <div style={{
        border: "1px solid gray",
        marginTop: "10px",
        padding: "10px",
        height: "300px",
        overflowY: "scroll"
      }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            textAlign: m.senderId === userId ? "left" : "right"
          }}>
            <p>{m.text}</p>
          </div>
        ))}
      </div>

      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type message..."
      />

      <button onClick={sendMessage}>Send</button>
    </div>
  );
}

export default Messenger;
