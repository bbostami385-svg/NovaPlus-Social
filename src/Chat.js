import React, { useState } from "react";

function Chat() {
  const [message, setMessage] = useState("");
  const [chatLog, setChatLog] = useState([]);

  const handleSend = () => {
    if (!message) return;
    setChatLog([...chatLog, { sender: "You", text: message }]);
    setMessage("");
  };

  return (
    <div style={{ textAlign: "center", padding: "10px", borderTop: "1px solid #ccc" }}>
      <h3>Chat</h3>
      <div style={{ minHeight: "150px", border: "1px solid #ccc", padding: "5px", marginBottom: "5px" }}>
        {chatLog.map((msg, idx) => (
          <p key={idx}><b>{msg.sender}: </b>{msg.text}</p>
        ))}
      </div>
      <input type="text" placeholder="Type a message..." value={message} onChange={(e) => setMessage(e.target.value)} />
      <button onClick={handleSend}>Send</button>
    </div>
  );
}

export default Chat;
