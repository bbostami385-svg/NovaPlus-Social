import React, { useState } from "react";

function ChatBox({ receiverId }) {
  const [text, setText] = useState("");
  const token = localStorage.getItem("token");

  const send = async () => {
    await fetch("https://novaplus-social.onrender.com/api/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token
      },
      body: JSON.stringify({
        receiverId,
        text
      })
    });

    setText("");
  };

  return (
    <div>
      <input value={text} onChange={(e) => setText(e.target.value)} />
      <button onClick={send}>Send</button>
    </div>
  );
}

export default ChatBox;
