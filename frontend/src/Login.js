import React, { useState } from "react";

// ✅ API from .env
const API = process.env.REACT_APP_API;

function Login({ goToSignup, goToFeed }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Enter email and password");
      return;
    }

    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (res.ok) {
        // ✅ Save token + userId
        localStorage.setItem("token", data.token);
        localStorage.setItem("userId", data.user._id);

        alert("Login successful ✅");
        goToFeed();
      } else {
        alert(data.msg || "Login failed ❌");
      }

    } catch (err) {
      alert("Server error ❌");
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "50px" }}>
      <h2>Login 🔐</h2>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      /><br />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      /><br />

      <button onClick={handleLogin}>Login 🚀</button>

      <p>
        Don't have an account?{" "}
        <span
          style={{ color: "blue", cursor: "pointer" }}
          onClick={goToSignup}
        >
          Sign Up
        </span>
      </p>
    </div>
  );
}

export default Login;
