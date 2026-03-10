import React, { useState } from "react";

function Login() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {

    const res = await fetch("/api/auth/login", {

      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        email,
        password
      })

    });

    const data = await res.json();

    alert(data.msg);

  };

  return (

    <div style={{ textAlign: "center" }}>

      <h2>Login</h2>

      <input
      type="email"
      placeholder="Email"
      onChange={(e)=>setEmail(e.target.value)}
      />

      <br/><br/>

      <input
      type="password"
      placeholder="Password"
      onChange={(e)=>setPassword(e.target.value)}
      />

      <br/><br/>

      <button onClick={handleLogin}>Login</button>

    </div>

  );
}

export default Login;
