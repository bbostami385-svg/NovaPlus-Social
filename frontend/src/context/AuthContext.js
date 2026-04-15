import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext();

// Firebase Public Configuration (Safe to expose - for Google OAuth)
const firebaseConfig = {
  apiKey: "AIzaSyAQ1wNehf7efchAliA1ZTJdnKEiqbTww08",
  authDomain: "novaplus-app.firebaseapp.com",
  projectId: "novaplus-app",
  storageBucket: "novaplus-app.firebasestorage.app",
  messagingSenderId: "967183591469",
  appId: "1:967183591469:web:dc4a5e01aa767bf265b0a4",
  measurementId: "G-4QXRE8K8KY"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Configure Google Sign-In scopes
googleProvider.addScope('profile');
googleProvider.addScope('email');

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(!!token);

  // Setup axios interceptor and listen to Firebase auth state
  useEffect(() => {
    // Listen to Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          // Verify token is still valid
          verifyToken();
        } else if (firebaseUser) {
          // Firebase user exists but no local token, try to get new token
          const idToken = await firebaseUser.getIdToken();
          const response = await axios.post(`${API_URL}/api/auth/google`, {
            firebaseToken: idToken,
          });
          const { token: newToken, user: userData } = response.data;
          setToken(newToken);
          setUser(userData);
          localStorage.setItem('token', newToken);
          axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
          setIsAuthenticated(true);
          setLoading(false);
        } else {
          delete axios.defaults.headers.common['Authorization'];
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [token]);

  const verifyToken = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/auth/me`);
      setUser(response.data.user);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Token verification failed:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password,
      });
      
      const { token: newToken, user: userData } = response.data;
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('token', newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      setIsAuthenticated(true);
      
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  };

  const signup = async (email, password, firstName, lastName, username) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/register`, {
        email,
        password,
        firstName,
        lastName,
        username,
      });
      
      const { token: newToken, user: userData } = response.data;
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('token', newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      setIsAuthenticated(true);
      
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      
      const response = await axios.post(`${API_URL}/api/auth/google`, {
        firebaseToken: idToken,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
      });
      
      const { token: newToken, user: userData } = response.data;
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('token', newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      setIsAuthenticated(true);
      
      return response.data;
    } catch (error) {
      console.error('Google login error:', error);
      throw error.response?.data || error;
    }
  }

  const logout = async () => {
    try {
      await axios.post(`${API_URL}/api/auth/logout`);
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await axios.put(`${API_URL}/api/users/profile/update`, profileData);
      setUser(response.data.user);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    login,
    signup,
    loginWithGoogle,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
