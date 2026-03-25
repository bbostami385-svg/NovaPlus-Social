import React, { useEffect, useState } from "react";

function Feed() {
  const [posts, setPosts] = useState([]);

  const getPosts = async () => {
    try {
      const res = await fetch("https://novaplus-social.onrender.com/api/posts");
      const data = await res.json();
      setPosts(data);
    } catch (err) {
      console.log("Error loading posts");
    }
  };

  useEffect(() => {
    getPosts();
  }, []);

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h2>Feed</h2>

      {posts.length === 0 ? (
        <p>No posts yet...</p>
      ) : (
        posts.map((post) => (
          <div key={post._id} style={{ border: "1px solid gray", margin: "10px", padding: "10px" }}>
            <p>{post.text}</p>
            <small>{new Date(post.createdAt).toLocaleString()}</small>
          </div>
        ))
      )}

    </div>
  );
}

export default Feed;
