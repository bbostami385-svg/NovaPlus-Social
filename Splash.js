import React from "react";
import SplashLogo from "../assets/splash_logo.png";

function Splash() {
  return (
    <div style={{ textAlign: "center", background: "#000", height: "100vh" }}>
      <img src={SplashLogo} alt="Splash Logo" style={{ width: "200px", marginTop: "40vh" }} />
    </div>
  );
}

export default Splash;
