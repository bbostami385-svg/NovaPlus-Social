import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Profile.css';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [diamond, setDiamond] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stats');

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');

      if (!token || !userId) {
        window.location.href = '/login';
        return;
      }

      // Fetch user data
      const userRes = await axios.get(`/api/auth/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(userRes.data);

      // Fetch diamond data
      try {
        const diamondRes = await axios.get(`/api/diamond/profile/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDiamond(diamondRes.data);
      } catch (err) {
        console.log('Diamond profile not found, creating default');
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="profile-loading">Loading profile...</div>;
  }

  if (!user) {
    return <div className="profile-error">User not found</div>;
  }

  return (
    <div className="profile-container">
      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-cover">
          <div className="cover-image"></div>
        </div>

        <div className="profile-info">
          <div className="profile-avatar">
            <img
              src={user.avatar || 'https://via.placeholder.com/120'}
              alt={user.name}
              className="avatar-image"
            />
            <div className="avatar-badge">
              {diamond?.tier === 'premium' && <span className="premium-badge">⭐</span>}
            </div>
          </div>

          <div className="profile-details">
            <h1 className="profile-name">{user.name}</h1>
            <p className="profile-username">@{user.username}</p>
            <p className="profile-bio">{user.bio || 'No bio yet'}</p>

            <div className="profile-stats">
              <div className="stat">
                <span className="stat-value">{user.followers || 0}</span>
                <span className="stat-label">Followers</span>
              </div>
              <div className="stat">
                <span className="stat-value">{user.following || 0}</span>
                <span className="stat-label">Following</span>
              </div>
              <div className="stat">
                <span className="stat-value">{user.posts || 0}</span>
                <span className="stat-label">Posts</span>
              </div>
            </div>
          </div>

          <button className="edit-profile-btn">Edit Profile</button>
        </div>
      </div>

      {/* Diamond Profile Section */}
      {diamond && (
        <div className="diamond-section">
          <div className="diamond-header">
            <h2>💎 Diamond Profile</h2>
          </div>

          <div className="diamond-stats">
            <div className="diamond-card">
              <div className="diamond-icon">💎</div>
              <div className="diamond-info">
                <p className="diamond-label">Diamonds</p>
                <p className="diamond-value">{diamond.totalDiamonds}</p>
              </div>
            </div>

            <div className="diamond-card">
              <div className="diamond-icon">⭐</div>
              <div className="diamond-info">
                <p className="diamond-label">Level</p>
                <p className="diamond-value">{diamond.level}</p>
              </div>
            </div>

            <div className="diamond-card">
              <div className="diamond-icon">🎯</div>
              <div className="diamond-info">
                <p className="diamond-label">Experience</p>
                <p className="diamond-value">{diamond.experience}</p>
              </div>
            </div>
          </div>

          {/* Level Progress */}
          <div className="level-progress">
            <div className="progress-header">
              <span>Level {diamond.level}</span>
              <span>{diamond.experience} / {diamond.nextLevelExp} XP</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${(diamond.experience / diamond.nextLevelExp) * 100}%`,
                }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="profile-tabs">
        <button
          className={`tab ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          Stats
        </button>
        <button
          className={`tab ${activeTab === 'posts' ? 'active' : ''}`}
          onClick={() => setActiveTab('posts')}
        >
          Posts
        </button>
        <button
          className={`tab ${activeTab === 'media' ? 'active' : ''}`}
          onClick={() => setActiveTab('media')}
        >
          Media
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'stats' && (
          <div className="stats-content">
            <div className="stat-item">
              <span className="stat-icon">👍</span>
              <span className="stat-text">Total Likes: {user.totalLikes || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">💬</span>
              <span className="stat-text">Total Comments: {user.totalComments || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">🔄</span>
              <span className="stat-text">Total Shares: {user.totalShares || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">👁️</span>
              <span className="stat-text">Total Views: {user.totalViews || 0}</span>
            </div>
          </div>
        )}

        {activeTab === 'posts' && (
          <div className="posts-content">
            <p className="empty-message">No posts yet</p>
          </div>
        )}

        {activeTab === 'media' && (
          <div className="media-content">
            <p className="empty-message">No media yet</p>
          </div>
        )}
      </div>

      {/* Bottom padding for navigation */}
      <div className="profile-bottom-padding"></div>
    </div>
  );
};

export default Profile;
