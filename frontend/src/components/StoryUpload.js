import React, { useState } from "react";

function StoryUpload() {
  const [image, setImage] = useState("");
  const token = localStorage.getItem("token");

  const uploadStory = async () => {
    await fetch("https://novaplus-social.onrender.com/api/stories", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token
      },
      body: JSON.stringify({ image })
    });

    alert("Story uploaded 🚀");
  };

  return (
    <div>
      <input
        placeholder="Image URL"
        value={image}
        onChange={(e) => setImage(e.target.value)}
      />
      <button onClick={uploadStory}>Upload Story</button>
    </div>
  );
}

export default StoryUpload;
