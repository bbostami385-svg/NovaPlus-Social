import React from "react";

function Splash({ goToLogin }) {
  return (
    <div style={{ textAlign: "center", padding: "50px" }}>
      <h1>NovaPlus Social 🚀</h1>
      <button onClick={goToLogin}>Get Started</button>
    </div>
  );
}

export default Splash;
