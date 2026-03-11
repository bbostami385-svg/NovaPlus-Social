import React, { useState } from "react";

function Login() {

  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");

  return (
    <div style={{textAlign:"center"}}>

      <h2>Login</h2>

      <input
        placeholder="Email"
        value={email}
        onChange={(e)=>setEmail(e.target.value)}
      />

      <br/><br/>

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e)=>setPassword(e.target.value)}
      />

      <br/><br/>

      <button>Login</button>

    </div>
  );
}

export default Login;
