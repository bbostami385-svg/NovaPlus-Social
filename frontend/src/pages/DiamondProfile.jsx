import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './DiamondProfile.css';

const DiamondProfile = () => {
  const [diamondData, setDiamondData] = useState(null);
  const [profileEvolution, setProfileEvolution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchDiamondProfile();
  }, []);

  const fetchDiamondProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const [diamondRes, profileRes] = await Promise.all([
        axios.get('/api/diamond/profile', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get('/api/profile-evolution/my/profile', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setDiamondData(diamondRes.data.profile.diamond);
      setProfileEvolution(profileRes.data.profileEvolution);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch profile');
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const claimDailyBonus = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/diamond/claim-daily-bonus', {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        fetchDiamondProfile();
        alert(`✨ Claimed ${res.data.diamonds} diamonds! Streak: ${res.data.streak}`);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to claim bonus');
    }
  };

  if (loading) {
    return (
      <div className="diamond-profile-container loading">
        <div className="spinner"></div>
        <p>Loading your Diamond Profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="diamond-profile-container error">
        <p>{error}</p>
        <button onClick={fetchDiamondProfile}>Retry</button>
      </div>
    );
  }

  if (!diamondData) {
    return <div className="diamond-profile-container">No data available</div>;
  }

  const progressPercentage = (diamondData.experience / diamondData.experienceToNextLevel) * 100;
  const levelProgress = Math.min(progressPercentage, 100);

  return (
    <div className="diamond-profile-container">
      {/* Header with Diamond Counter */}
      <div className="diamond-header">
        <div className="diamond-counter">
          <div className="diamond-icon">💎</div>
          <div className="diamond-info">
            <h2>{diamondData.totalDiamonds.toLocaleString()}</h2>
            <p>Total Diamonds</p>
          </div>
        </div>

        <div className="level-badge">
          <div className="level-number">{diamondData.level}</div>
          <p>Level</p>
        </div>

        <div className="streak-badge">
          <div className="streak-number">🔥 {diamondData.dailyLoginStreak}</div>
          <p>Day Streak</p>
        </div>
      </div>

      {/* Level Progress Bar */}
      <div className="level-progress-section">
        <div className="progress-header">
          <h3>Level {diamondData.level} Progress</h3>
          <span className="exp-text">
            {diamondData.experience.toLocaleString()} / {diamondData.experienceToNextLevel.toLocaleString()} XP
          </span>
        </div>
        <div className="progress-bar-container">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${levelProgress}%` }}
            >
              <div className="progress-glow"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Bonus Button */}
      <div className="daily-bonus-section">
        <button 
          className="daily-bonus-btn"
          onClick={claimDailyBonus}
        >
          <span className="bonus-icon">🎁</span>
          <span className="bonus-text">Claim Daily Bonus</span>
          <span className="bonus-amount">+{5 + Math.min(diamondData.dailyLoginStreak - 1, 10)}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab ${activeTab === 'evolution' ? 'active' : ''}`}
          onClick={() => setActiveTab('evolution')}
        >
          Evolution
        </button>
        <button 
          className={`tab ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          Statistics
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">📤</div>
                <div className="stat-content">
                  <h4>Diamonds Earned</h4>
                  <p>{diamondData.diamondsEarned.toLocaleString()}</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">📥</div>
                <div className="stat-content">
                  <h4>Diamonds Spent</h4>
                  <p>{diamondData.diamondsSpent.toLocaleString()}</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">⬆️</div>
                <div className="stat-content">
                  <h4>Total Experience</h4>
                  <p>{diamondData.totalExperienceEarned.toLocaleString()}</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <div className="stat-content">
                  <h4>Referrals</h4>
                  <p>{diamondData.referralCount}</p>
                </div>
              </div>
            </div>

            {/* Earning Breakdown */}
            <div className="earning-breakdown">
              <h3>Earning Breakdown</h3>
              <div className="breakdown-grid">
                <div className="breakdown-item">
                  <span className="breakdown-label">From Posts</span>
                  <span className="breakdown-value">{diamondData.earningStats.fromPosts}</span>
                </div>
                <div className="breakdown-item">
                  <span className="breakdown-label">From Likes</span>
                  <span className="breakdown-value">{diamondData.earningStats.fromLikes}</span>
                </div>
                <div className="breakdown-item">
                  <span className="breakdown-label">From Shares</span>
                  <span className="breakdown-value">{diamondData.earningStats.fromShares}</span>
                </div>
                <div className="breakdown-item">
                  <span className="breakdown-label">From Daily Login</span>
                  <span className="breakdown-value">{diamondData.earningStats.fromDailyLogin}</span>
                </div>
                <div className="breakdown-item">
                  <span className="breakdown-label">From Invites</span>
                  <span className="breakdown-value">{diamondData.earningStats.fromInvites}</span>
                </div>
                <div className="breakdown-item">
                  <span className="breakdown-label">From Bonuses</span>
                  <span className="breakdown-value">{diamondData.earningStats.fromBonuses}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'evolution' && profileEvolution && (
          <div className="evolution-tab">
            <div className="current-design">
              <h3>Current Profile Design</h3>
              <div className="design-showcase">
                <div className={`profile-frame ${profileEvolution.currentDesign}`}>
                  <div className={`profile-border ${profileEvolution.currentBorder}`}>
                    <div className="profile-placeholder">👤</div>
                  </div>
                </div>
              </div>
              <p className="design-name">{profileEvolution.currentDesign.toUpperCase()}</p>
            </div>

            {/* Next Evolution Teaser */}
            {profileEvolution.nextEvolutionTeaser && (
              <div className="next-evolution-teaser">
                <h3>🔮 Next Evolution Unlock</h3>
                <div className="teaser-card">
                  <div className="teaser-level">Level {profileEvolution.nextEvolutionTeaser.level}</div>
                  <div className="teaser-item">{profileEvolution.nextEvolutionTeaser.previewItem}</div>
                  <p className="teaser-description">{profileEvolution.nextEvolutionTeaser.previewDescription}</p>
                  <div className="teaser-requirements">
                    <span>💎 {profileEvolution.nextEvolutionTeaser.diamondsNeeded} Diamonds</span>
                    <span>⭐ {profileEvolution.nextEvolutionTeaser.experienceNeeded} XP</span>
                  </div>
                </div>
              </div>
            )}

            {/* Unlocked Items */}
            <div className="unlocked-items">
              <h3>Unlocked Items</h3>
              
              {profileEvolution.unlockedDesigns.length > 0 && (
                <div className="items-section">
                  <h4>🎨 Designs ({profileEvolution.unlockedDesigns.length})</h4>
                  <div className="items-grid">
                    {profileEvolution.unlockedDesigns.map((design, idx) => (
                      <div key={idx} className={`item-card ${design.rarity}`}>
                        <div className="item-name">{design.design}</div>
                        <div className="item-rarity">{design.rarity}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {profileEvolution.unlockedBorders.length > 0 && (
                <div className="items-section">
                  <h4>✨ Borders ({profileEvolution.unlockedBorders.length})</h4>
                  <div className="items-grid">
                    {profileEvolution.unlockedBorders.map((border, idx) => (
                      <div key={idx} className={`item-card ${border.rarity}`}>
                        <div className="item-name">{border.border}</div>
                        <div className="item-rarity">{border.rarity}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {profileEvolution.unlockedBadges.length > 0 && (
                <div className="items-section">
                  <h4>🏆 Badges ({profileEvolution.unlockedBadges.length})</h4>
                  <div className="items-grid">
                    {profileEvolution.unlockedBadges.map((badge, idx) => (
                      <div key={idx} className={`item-card ${badge.rarity}`}>
                        <div className="item-name">{badge.badge}</div>
                        <div className="item-rarity">{badge.rarity}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {profileEvolution.unlockedEffects.length > 0 && (
                <div className="items-section">
                  <h4>⚡ Effects ({profileEvolution.unlockedEffects.length})</h4>
                  <div className="items-grid">
                    {profileEvolution.unlockedEffects.map((effect, idx) => (
                      <div key={idx} className={`item-card ${effect.rarity}`}>
                        <div className="item-name">{effect.effect}</div>
                        <div className="item-rarity">{effect.rarity}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="stats-tab">
            <div className="stats-container">
              <div className="stat-box">
                <h4>Profile Views</h4>
                <p className="stat-number">{profileEvolution?.profileViews || 0}</p>
              </div>
              <div className="stat-box">
                <h4>Profile Likes</h4>
                <p className="stat-number">{profileEvolution?.profileLikes || 0}</p>
              </div>
              <div className="stat-box">
                <h4>Customizations</h4>
                <p className="stat-number">{profileEvolution?.customizationCount || 0}</p>
              </div>
              <div className="stat-box">
                <h4>Mystery Unlocks</h4>
                <p className="stat-number">{profileEvolution?.mysteryUnlocks?.length || 0}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiamondProfile;
