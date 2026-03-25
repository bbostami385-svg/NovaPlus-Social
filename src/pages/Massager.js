import React, { useEffect, useState } from "react";

function Messenger() {
  const [userId, setUserId] = useState("");
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const token = localStorage.getItem("token");

  const loadMessages = async () => {
    const res = await fetch(`https://novaplus-social.onrender.com/api/messages/${userId}`, {
      headers: { Authorization: "Bearer " + token }
    });
    const data = await res.json();
    setMessages(data);
  };

  const sendMessage = async () => {
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

      <div style={{ border: "1px solid gray", marginTop: "10px", padding: "10px", height: "300px", overflow: "auto" }}>
        {messages.map((m, i) => (
          <p key={i}><b>{m.senderId}</b>: {m.text}</p>
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
