import React, { useEffect, useState } from "react";

function Friends() {
  const [users, setUsers] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetch("https://novaplus-social.onrender.com/api/posts")
      .then(res => res.json())
      .then(data => {
        const uniqueUsers = [...new Set(data.map(p => p.userId))];
        setUsers(uniqueUsers);
      });
  }, []);

  const sendRequest = async (id) => {
    await fetch(`https://novaplus-social.onrender.com/api/users/${id}/add-friend`, {
      method: "POST",
      headers: { Authorization: "Bearer " + token }
    });

    alert("Request sent");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>People 👥</h2>

      {users.map(id => (
        <div key={id}>
          <p>{id}</p>
          <button onClick={() => sendRequest(id)}>Add Friend</button>
        </div>
      ))}
    </div>
  );
}

export default Friends;
