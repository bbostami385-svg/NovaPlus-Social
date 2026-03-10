import React, { useState } from "react";

function Chat() {
  const [message, setMessage] = useState("");
  const [chatLog, setChatLog] = useState([]);

  const handleSend = () => {
    if (message.trim() === "") return;

    setChatLog([
      ...chatLog,
      { sender: "You", text: message }
    ]);

    setMessage("");
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h2>NovaPlus AI Chat 🤖</h2>

      <div
        style={{
          border: "1px solid #ccc",
          padding: "10px",
          minHeight: "200px",
          margin: "10px auto",
          width: "80%",
          textAlign: "left"
        }}
      >
        {chatLog.map((msg, index) => (
          <p key={index}>
            <strong>{msg.sender}: </strong>{msg.text}
          </p>
        ))}
      </div>

      <input
        type="text"
        placeholder="Type a message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      <button onClick={handleSend} style={{ marginLeft: "10px" }}>
        Send
      </button>
    </div>
  );
}

export default Chat;
