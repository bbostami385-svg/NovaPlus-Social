import React, { useEffect, useState } from "react";

function Feed() {
  const [posts, setPosts] = useState([]);
  const [text, setText] = useState("");
  const [category, setCategory] = useState("all");
  const [commentText, setCommentText] = useState({});
  const [showComments, setShowComments] = useState({});

  const API = "https://novaplus-social.onrender.com";

  // -----------------------
  // GET POSTS
  // -----------------------
  const getPosts = async () => {
    try {
      const res = await fetch(`${API}/api/posts`);
      const data = await res.json();
      setPosts(data);
    } catch (err) {
      console.log("Error loading posts");
    }
  };

  useEffect(() => {
    getPosts();
  }, []);

  // -----------------------
  // CREATE POST
  // -----------------------
  const createPost = async () => {
    const token = localStorage.getItem("token");

    if (!text) return alert("Write something!");

    try {
      const res = await fetch(`${API}/api/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({
          text,
          image: "",
          video: "",
          category,
        }),
      });

      if (res.ok) {
        setText("");
        getPosts();
      }
    } catch (err) {
      alert("Server error");
    }
  };

  // -----------------------
  // LIKE POST
  // -----------------------
  const likePost = async (id) => {
    const token = localStorage.getItem("token");

    await fetch(`${API}/api/posts/${id}/like`, {
      method: "PUT",
      headers: {
        Authorization: "Bearer " + token,
      },
    });

    getPosts();
  };

  // -----------------------
  // ADD COMMENT
  // -----------------------
  const addComment = async (postId) => {
    const token = localStorage.getItem("token");

    const text = commentText[postId];
    if (!text) return;

    await fetch(`${API}/api/posts/${postId}/comment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({ text }),
    });

    setCommentText({ ...commentText, [postId]: "" });
    getPosts();
  };

  // -----------------------
  // FILTER POSTS (YouTube style)
  // -----------------------
  const filteredPosts =
    category === "all"
      ? posts
      : posts.filter((p) => p.category === category);

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h2>NovaPlus Social 🚀</h2>

      {/* CATEGORY BAR */}
      <div style={{ marginBottom: "15px" }}>
        {["all", "news", "funny", "gaming", "music", "education"].map(
          (cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              style={{
                margin: "5px",
                padding: "6px 12px",
                borderRadius: "20px",
                border: "none",
                background: category === cat ? "black" : "#ccc",
                color: category === cat ? "white" : "black",
              }}
            >
              {cat}
            </button>
          )
        )}
      </div>

      {/* CREATE POST */}
      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="What's on your mind?"
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{ padding: "10px", width: "250px" }}
        />
        <button onClick={createPost} style={{ marginLeft: "10px" }}>
          Post 🚀
        </button>
      </div>

      {/* POSTS */}
      {filteredPosts.map((post) => (
        <div
          key={post._id}
          style={{
            maxWidth: "500px",
            margin: "15px auto",
            border: "1px solid #ddd",
            borderRadius: "10px",
            padding: "15px",
            textAlign: "left",
          }}
        >
          {/* POST TEXT */}
          <p>{post.text}</p>

          {/* LIKE */}
          <button onClick={() => likePost(post._id)}>
            ❤️ Like ({post.likes?.length || 0})
          </button>

          {/* COMMENTS BUTTON */}
          <button
            onClick={() =>
              setShowComments({
                ...showComments,
                [post._id]: !showComments[post._id],
              })
            }
            style={{ marginLeft: "10px" }}
          >
            💬 Comments
          </button>

          {/* COMMENTS SECTION */}
          {showComments[post._id] && (
            <div style={{ marginTop: "10px" }}>
              {/* COMMENT INPUT */}
              <input
                type="text"
                placeholder="Write a comment..."
                value={commentText[post._id] || ""}
                onChange={(e) =>
                  setCommentText({
                    ...commentText,
                    [post._id]: e.target.value,
                  })
                }
                style={{ padding: "5px", width: "70%" }}
              />
              <button onClick={() => addComment(post._id)}>Send</button>

              {/* COMMENTS LIST */}
              <div style={{ marginTop: "10px" }}>
                {post.comments?.map((c, i) => (
                  <p key={i} style={{ fontSize: "14px" }}>
                    💬 {c.text}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* VIDEO */}
          {post.video && (
            <video width="100%" controls style={{ marginTop: "10px" }}>
              <source src={post.video} />
            </video>
          )}

          {/* IMAGE */}
          {post.image && (
            <img
              src={post.image}
              alt=""
              style={{ width: "100%", marginTop: "10px" }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default Feed;
