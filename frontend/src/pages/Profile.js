import React, { useEffect, useState } from "react";

const API = process.env.REACT_APP_API;

function Profile() {
  const [user, setUser] = useState(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    const loadProfile = async () => {
      const res = await fetch(`${API}/api/profile/me`, {
        headers: {
          Authorization: "Bearer " + token
        }
      });

      const data = await res.json();
      setUser(data);
      setName(data.name);
      setBio(data.bio || "");
      setAvatar(data.avatar || "");
    };

    loadProfile();
  }, []);

  const updateProfile = async () => {
    await fetch(`${API}/api/profile/update`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token
      },
      body: JSON.stringify({
        name,
        bio,
        avatar
      })
    });

    alert("Profile Updated ✅");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>👤 Profile</h2>

      {avatar && (
        <img src={avatar} width="100" style={{ borderRadius: "50%" }} />
      )}

      <div>
        <input
          placeholder="Avatar URL"
          value={avatar}
          onChange={(e) => setAvatar(e.target.value)}
        />
      </div>

      <div>
        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div>
        <textarea
          placeholder="Bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />
      </div>

      <button onClick={updateProfile}>Update Profile</button>
    </div>
  );
}

export default Profile;
