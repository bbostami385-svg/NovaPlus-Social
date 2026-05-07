import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './DiamondCounter.css';

const DiamondCounter = () => {
  const [diamonds, setDiamonds] = useState(0);
  const [level, setLevel] = useState(1);
  const [showAnimation, setShowAnimation] = useState(false);
  const [animationAmount, setAnimationAmount] = useState(0);

  useEffect(() => {
    fetchDiamondData();
    const interval = setInterval(fetchDiamondData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchDiamondData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await axios.get('/api/diamond/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.profile.diamond) {
        setDiamonds(res.data.profile.diamond.totalDiamonds);
        setLevel(res.data.profile.diamond.level);
      }
    } catch (err) {
      console.error('Error fetching diamond data:', err);
    }
  };

  const triggerAnimation = (amount) => {
    setAnimationAmount(amount);
    setShowAnimation(true);
    setTimeout(() => setShowAnimation(false), 1500);
  };

  // Expose function for other components to trigger animation
  useEffect(() => {
    window.triggerDiamondAnimation = triggerAnimation;
    return () => delete window.triggerDiamondAnimation;
  }, []);

  return (
    <div className="diamond-counter-widget">
      <div className="counter-content">
        <div className="diamond-icon">💎</div>
        <div className="counter-info">
          <div className="diamond-amount">{diamonds.toLocaleString()}</div>
          <div className="level-badge">Lv {level}</div>
        </div>
      </div>

      {showAnimation && (
        <div className="animation-float">
          <span className="animation-text">+{animationAmount}</span>
        </div>
      )}

      <div className="counter-glow"></div>
    </div>
  );
};

export default DiamondCounter;
