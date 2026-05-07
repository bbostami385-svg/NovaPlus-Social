import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './RewardShop.css';

const RewardShop = () => {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedRarity, setSelectedRarity] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [userDiamonds, setUserDiamonds] = useState(0);
  const [purchasing, setPurchasing] = useState(null);

  useEffect(() => {
    fetchShopItems();
    fetchUserDiamonds();
  }, []);

  useEffect(() => {
    filterItems();
  }, [items, selectedCategory, selectedRarity, searchQuery]);

  const fetchShopItems = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/reward-shop/items');
      setItems(res.data.items || []);
      setError(null);
    } catch (err) {
      setError('Failed to fetch shop items');
      console.error('Error fetching items:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDiamonds = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/diamond/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserDiamonds(res.data.profile.diamond.totalDiamonds);
    } catch (err) {
      console.error('Error fetching user diamonds:', err);
    }
  };

  const filterItems = () => {
    let filtered = items;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((item) => item.category === selectedCategory);
    }

    if (selectedRarity !== 'all') {
      filtered = filtered.filter((item) => item.rarity === selectedRarity);
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (item) =>
          item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.itemDescription.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredItems(filtered);
  };

  const purchaseItem = async (itemId, itemName, price) => {
    if (userDiamonds < price) {
      alert('❌ Insufficient diamonds!');
      return;
    }

    try {
      setPurchasing(itemId);
      const token = localStorage.getItem('token');
      const res = await axios.post(
        '/api/reward-shop/purchase',
        { itemId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        alert(`✨ Successfully purchased ${itemName}!`);
        setUserDiamonds(res.data.newBalance);
        fetchShopItems();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to purchase item');
    } finally {
      setPurchasing(null);
    }
  };

  const getRarityColor = (rarity) => {
    const colors = {
      common: '#b0b0b0',
      rare: '#06ffa5',
      epic: '#8338ec',
      legendary: '#ffbe0b',
    };
    return colors[rarity] || '#b0b0b0';
  };

  if (loading) {
    return (
      <div className="reward-shop-container loading">
        <div className="spinner"></div>
        <p>Loading Reward Shop...</p>
      </div>
    );
  }

  return (
    <div className="reward-shop-container">
      {/* Header */}
      <div className="shop-header">
        <h1>💎 Reward Shop</h1>
        <div className="diamond-balance">
          <span className="diamond-icon">💎</span>
          <span className="balance-text">{userDiamonds.toLocaleString()} Diamonds</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="shop-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <span className="search-icon">🔍</span>
        </div>

        <div className="filter-group">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Categories</option>
            <option value="profile">Profile</option>
            <option value="effects">Effects</option>
            <option value="boosts">Boosts</option>
            <option value="mystery">Mystery</option>
            <option value="premium">Premium</option>
          </select>

          <select
            value={selectedRarity}
            onChange={(e) => setSelectedRarity(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Rarities</option>
            <option value="common">Common</option>
            <option value="rare">Rare</option>
            <option value="epic">Epic</option>
            <option value="legendary">Legendary</option>
          </select>
        </div>
      </div>

      {/* Items Grid */}
      {filteredItems.length > 0 ? (
        <div className="items-grid">
          {filteredItems.map((item) => (
            <div key={item._id} className={`item-card ${item.rarity}`}>
              {/* Discount Badge */}
              {item.discountPercentage > 0 && (
                <div className="discount-badge">-{item.discountPercentage}%</div>
              )}

              {/* Item Header */}
              <div className="item-header">
                <div className="item-icon">
                  {item.itemType === 'design' && '🎨'}
                  {item.itemType === 'border' && '✨'}
                  {item.itemType === 'badge' && '🏆'}
                  {item.itemType === 'effect' && '⚡'}
                  {item.itemType === 'boost' && '🚀'}
                  {item.itemType === 'mystery_box' && '🎁'}
                  {item.itemType === 'premium_pack' && '👑'}
                </div>
                <div className="rarity-badge" style={{ borderColor: getRarityColor(item.rarity) }}>
                  {item.rarity.toUpperCase()}
                </div>
              </div>

              {/* Item Content */}
              <div className="item-content">
                <h3 className="item-name">{item.itemName}</h3>
                <p className="item-description">{item.itemDescription}</p>

                {/* Rating */}
                {item.averageRating > 0 && (
                  <div className="item-rating">
                    <span className="stars">{'⭐'.repeat(Math.round(item.averageRating))}</span>
                    <span className="rating-text">({item.reviewCount})</span>
                  </div>
                )}
              </div>

              {/* Item Footer */}
              <div className="item-footer">
                <div className="price-section">
                  {item.discountPercentage > 0 ? (
                    <>
                      <span className="original-price">{item.diamondPrice}</span>
                      <span className="discounted-price">
                        {Math.floor(item.diamondPrice * (1 - item.discountPercentage / 100))}
                      </span>
                    </>
                  ) : (
                    <span className="price">{item.diamondPrice}</span>
                  )}
                  <span className="diamond-icon-small">💎</span>
                </div>

                <button
                  className={`purchase-btn ${userDiamonds < item.actualPrice ? 'disabled' : ''}`}
                  onClick={() => purchaseItem(item._id, item.itemName, item.actualPrice)}
                  disabled={purchasing === item._id || userDiamonds < item.actualPrice}
                >
                  {purchasing === item._id ? 'Purchasing...' : 'Buy'}
                </button>
              </div>

              {/* Stock Info */}
              {item.stock !== -1 && (
                <div className="stock-info">
                  {item.stock > 0 ? (
                    <span className="in-stock">In Stock ({item.stock})</span>
                  ) : (
                    <span className="out-of-stock">Out of Stock</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="no-items">
          <p>No items found matching your filters.</p>
          <button onClick={() => { setSearchQuery(''); setSelectedCategory('all'); setSelectedRarity('all'); }}>
            Clear Filters
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={fetchShopItems}>Retry</button>
        </div>
      )}
    </div>
  );
};

export default RewardShop;
