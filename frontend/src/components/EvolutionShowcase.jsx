import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './EvolutionShowcase.css';

const EvolutionShowcase = ({ userId }) => {
  const [profileEvolution, setProfileEvolution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('designs');
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    fetchProfileEvolution();
  }, [userId]);

  const fetchProfileEvolution = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/profile-evolution/${userId}`);
      setProfileEvolution(res.data.profileEvolution);
    } catch (err) {
      console.error('Error fetching profile evolution:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="evolution-showcase loading">Loading...</div>;
  }

  if (!profileEvolution) {
    return <div className="evolution-showcase error">Profile evolution not found</div>;
  }

  const getItemsByCategory = () => {
    switch (selectedCategory) {
      case 'designs':
        return profileEvolution.unlockedDesigns;
      case 'borders':
        return profileEvolution.unlockedBorders;
      case 'badges':
        return profileEvolution.unlockedBadges;
      case 'effects':
        return profileEvolution.unlockedEffects;
      default:
        return [];
    }
  };

  const items = getItemsByCategory();
  const categoryIcons = {
    designs: '🎨',
    borders: '✨',
    badges: '🏆',
    effects: '⚡',
  };

  return (
    <div className="evolution-showcase">
      {/* Category Tabs */}
      <div className="showcase-tabs">
        {Object.entries(categoryIcons).map(([category, icon]) => (
          <button
            key={category}
            className={`showcase-tab ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => {
              setSelectedCategory(category);
              setSelectedItem(null);
            }}
          >
            <span className="tab-icon">{icon}</span>
            <span className="tab-label">{category}</span>
            <span className="tab-count">({getItemsByCategory().length})</span>
          </button>
        ))}
      </div>

      {/* Items Grid */}
      <div className="showcase-grid">
        {items.length > 0 ? (
          items.map((item, idx) => (
            <div
              key={idx}
              className={`showcase-item ${item.rarity} ${selectedItem?.id === idx ? 'selected' : ''}`}
              onClick={() => setSelectedItem({ ...item, id: idx })}
            >
              <div className="item-visual">
                {selectedCategory === 'designs' && <div className="design-preview">🎨</div>}
                {selectedCategory === 'borders' && <div className="border-preview">✨</div>}
                {selectedCategory === 'badges' && <div className="badge-preview">🏆</div>}
                {selectedCategory === 'effects' && <div className="effect-preview">⚡</div>}
              </div>

              <div className="item-info">
                <h4 className="item-name">{item[selectedCategory.slice(0, -1)] || item.effect}</h4>
                <span className="item-rarity">{item.rarity}</span>
                <span className="item-level">Lvl {item.unlockedByLevel}</span>
              </div>

              <div className="item-shine"></div>
            </div>
          ))
        ) : (
          <div className="no-items">
            <p>No {selectedCategory} unlocked yet</p>
            <p className="hint">Keep progressing to unlock more items!</p>
          </div>
        )}
      </div>

      {/* Item Details */}
      {selectedItem && (
        <div className="item-details">
          <div className="details-header">
            <h3>Item Details</h3>
            <button className="close-btn" onClick={() => setSelectedItem(null)}>✕</button>
          </div>

          <div className="details-content">
            <div className="detail-row">
              <span className="detail-label">Name:</span>
              <span className="detail-value">{selectedItem[selectedCategory.slice(0, -1)] || selectedItem.effect}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Rarity:</span>
              <span className={`detail-value rarity-${selectedItem.rarity}`}>{selectedItem.rarity.toUpperCase()}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Unlocked At:</span>
              <span className="detail-value">Level {selectedItem.unlockedByLevel}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Unlocked Date:</span>
              <span className="detail-value">{new Date(selectedItem.unlockedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Stats Summary */}
      <div className="showcase-stats">
        <div className="stat">
          <span className="stat-label">Total Unlocked</span>
          <span className="stat-value">{items.length}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Rarest Item</span>
          <span className="stat-value">
            {items.length > 0
              ? items.reduce((max, item) => {
                  const rarityOrder = { common: 0, rare: 1, epic: 2, legendary: 3 };
                  return rarityOrder[item.rarity] > rarityOrder[max.rarity] ? item : max;
                }).rarity.toUpperCase()
              : 'N/A'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default EvolutionShowcase;
