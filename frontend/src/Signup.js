import React, { useState } from "react";

function Signup({ goToLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = () => {
    if (name && email && password) {
      alert("Signup successful! Please login.");
      goToLogin();
    } else {
      alert("Fill all fields");
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "50px" }}>
      <h2>Sign Up</h2>
      <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} /><br />
      <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} /><br />
      <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} /><br />
      <button onClick={handleSignup}>Sign Up</button>
      <p>
        Already have an account? <span style={{color:"blue", cursor:"pointer"}} onClick={goToLogin}>Login</span>
      </p>
    </div>
  );
}

export default Signup;
