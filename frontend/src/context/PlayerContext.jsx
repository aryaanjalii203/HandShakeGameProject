import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ACHIEVEMENTS } from '../data/achievements.js';

const PlayerContext = createContext(null);

const DEFAULT_GUEST_STATS = {
  matchesPlayed: 0,
  wins: 0,
  losses: 0,
  highScores: {}
};

export function PlayerProvider({ children }) {
  // Stored registered users database
  const [registeredUsers, setRegisteredUsers] = useState(() => {
    const saved = localStorage.getItem('playforge_registered_users');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    // Default pre-seeded demo user for immediate instant login testing
    return [
      {
        id: 'usr_demo_101',
        name: 'Alex Mercer',
        username: 'CyberPilot_401',
        email: 'alex@playforge.io',
        password: 'password123',
        avatar: '👾',
        color: '#00f0ff',
        isGuest: false,
        joinedAt: '2026-01-15',
        stats: { matchesPlayed: 19, wins: 12, losses: 7, highScores: { 'cyber-pong': 1200, 'survival-arena': 2500 } },
        favorites: ['cyber-pong', 'survival-arena', 'tank-arena'],
        achievements: ACHIEVEMENTS
      }
    ];
  });

  // Current session user
  const [currentUser, setCurrentUser] = useState(() => {
    const activeToken = localStorage.getItem('playforge_auth_session');
    if (activeToken) {
      const savedUsers = localStorage.getItem('playforge_registered_users');
      if (savedUsers) {
        try {
          const parsed = JSON.parse(savedUsers);
          const found = parsed.find(u => u.id === activeToken);
          if (found) return found;
        } catch (e) {}
      }
    }
    // Fallback to Guest
    const guestHandle = localStorage.getItem('playforge_username') || `CyberPilot_${Math.floor(100 + Math.random() * 900)}`;
    const guestAvatar = localStorage.getItem('playforge_avatar') || '⚡';
    const guestColor = localStorage.getItem('playforge_color') || '#00f0ff';
    return {
      id: 'guest_' + Math.random().toString(36).substring(2, 9),
      name: 'Guest Player',
      username: guestHandle,
      email: '',
      avatar: guestAvatar,
      color: guestColor,
      isGuest: true,
      joinedAt: new Date().toISOString().split('T')[0],
      stats: DEFAULT_GUEST_STATS,
      favorites: ['cyber-pong', 'neon-drift'],
      achievements: ACHIEVEMENTS
    };
  });

  const [username, setUsernameState] = useState(currentUser.username);
  const [avatar, setAvatarState] = useState(currentUser.avatar);
  const [color, setColorState] = useState(currentUser.color);
  const [stats, setStats] = useState(currentUser.stats || DEFAULT_GUEST_STATS);
  const [favorites, setFavorites] = useState(currentUser.favorites || ['cyber-pong', 'neon-drift']);
  const [achievements, setAchievements] = useState(currentUser.achievements || ACHIEVEMENTS);

  // Keep registered users in localStorage
  useEffect(() => {
    localStorage.setItem('playforge_registered_users', JSON.stringify(registeredUsers));
  }, [registeredUsers]);

  // Sync user state changes
  useEffect(() => {
    setUsernameState(currentUser.username);
    setAvatarState(currentUser.avatar);
    setColorState(currentUser.color);
    setStats(currentUser.stats || DEFAULT_GUEST_STATS);
    setFavorites(currentUser.favorites || ['cyber-pong', 'neon-drift']);
    setAchievements(currentUser.achievements || ACHIEVEMENTS);

    if (currentUser.isGuest) {
      localStorage.setItem('playforge_username', currentUser.username);
      localStorage.setItem('playforge_avatar', currentUser.avatar);
      localStorage.setItem('playforge_color', currentUser.color);
    }
  }, [currentUser]);

  // Save current active user modifications back to user database
  const persistUserChanges = useCallback((updatedUser) => {
    setCurrentUser(updatedUser);
    if (!updatedUser.isGuest) {
      setRegisteredUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    }
  }, []);

  const setUsername = (newUsername) => {
    const updated = { ...currentUser, username: newUsername };
    persistUserChanges(updated);
    setUsernameState(newUsername);
  };

  const setAvatar = (newAvatar) => {
    const updated = { ...currentUser, avatar: newAvatar };
    persistUserChanges(updated);
    setAvatarState(newAvatar);
  };

  const setColor = (newColor) => {
    const updated = { ...currentUser, color: newColor };
    persistUserChanges(updated);
    setColorState(newColor);
  };

  // Sign In
  const signIn = (identifier, password, rememberMe = true) => {
    const cleanId = String(identifier || '').trim().toLowerCase();
    const cleanPass = String(password || '');

    const user = registeredUsers.find(
      u => u.email.toLowerCase() === cleanId || u.username.toLowerCase() === cleanId
    );

    if (!user) {
      return { success: false, message: 'No account found with this email or username.' };
    }

    if (user.password !== cleanPass) {
      return { success: false, message: 'Incorrect password. Please try again.' };
    }

    const sessionUser = { ...user, isGuest: false };
    setCurrentUser(sessionUser);
    if (rememberMe) {
      localStorage.setItem('playforge_auth_session', sessionUser.id);
    }
    return { success: true, user: sessionUser };
  };

  // Sign Up / Register
  const signUp = ({ name, username, email, password, avatar = '👾', color = '#00f0ff' }) => {
    const cleanName = String(name || '').trim();
    const cleanUsername = String(username || '').trim().replace(/\s+/g, '_');
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanPass = String(password || '');

    if (!cleanName) return { success: false, message: 'Full name / display name is required.' };
    if (!cleanUsername || cleanUsername.length < 3) return { success: false, message: 'Username must be at least 3 characters.' };
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) return { success: false, message: 'Please enter a valid email address.' };
    if (!cleanPass || cleanPass.length < 6) return { success: false, message: 'Password must be at least 6 characters.' };

    const emailExists = registeredUsers.some(u => u.email.toLowerCase() === cleanEmail);
    if (emailExists) {
      return { success: false, message: 'An account with this email already exists. Please Sign In.' };
    }

    const usernameExists = registeredUsers.some(u => u.username.toLowerCase() === cleanUsername.toLowerCase());
    if (usernameExists) {
      return { success: false, message: 'This handle is already taken. Please choose another.' };
    }

    const newUser = {
      id: 'usr_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      name: cleanName,
      username: cleanUsername,
      email: cleanEmail,
      password: cleanPass,
      avatar,
      color,
      isGuest: false,
      joinedAt: new Date().toISOString().split('T')[0],
      stats: { matchesPlayed: 0, wins: 0, losses: 0, highScores: {} },
      favorites: ['cyber-pong', 'survival-arena'],
      achievements: ACHIEVEMENTS
    };

    setRegisteredUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);
    localStorage.setItem('playforge_auth_session', newUser.id);

    return { success: true, user: newUser };
  };

  // Sign Out
  const signOut = () => {
    localStorage.removeItem('playforge_auth_session');
    const guestHandle = `CyberPilot_${Math.floor(100 + Math.random() * 900)}`;
    const guestUser = {
      id: 'guest_' + Math.random().toString(36).substring(2, 9),
      name: 'Guest Player',
      username: guestHandle,
      email: '',
      avatar: '⚡',
      color: '#00f0ff',
      isGuest: true,
      joinedAt: new Date().toISOString().split('T')[0],
      stats: DEFAULT_GUEST_STATS,
      favorites: ['cyber-pong', 'neon-drift'],
      achievements: ACHIEVEMENTS
    };
    setCurrentUser(guestUser);
  };

  // Forgot Password / Reset
  const forgotPassword = (email) => {
    const cleanEmail = String(email || '').trim().toLowerCase();
    const user = registeredUsers.find(u => u.email.toLowerCase() === cleanEmail);
    if (!user) {
      return { success: false, message: 'No registered user found with that email.' };
    }
    return { success: true, message: `Password reset instructions have been dispatched to ${cleanEmail}.` };
  };

  const toggleFavorite = (gameId) => {
    setFavorites(prev => {
      const next = prev.includes(gameId) ? prev.filter(id => id !== gameId) : [...prev, gameId];
      const updated = { ...currentUser, favorites: next };
      persistUserChanges(updated);
      return next;
    });
  };

  const recordMatchResult = (gameId, isWin, score = 0) => {
    setStats(prev => {
      const currentHigh = prev.highScores[gameId] || 0;
      const nextStats = {
        ...prev,
        matchesPlayed: prev.matchesPlayed + 1,
        wins: isWin ? prev.wins + 1 : prev.wins,
        losses: isWin ? prev.losses : prev.losses + 1,
        highScores: {
          ...prev.highScores,
          [gameId]: Math.max(currentHigh, score)
        }
      };
      const updated = { ...currentUser, stats: nextStats };
      persistUserChanges(updated);
      return nextStats;
    });
  };

  return (
    <PlayerContext.Provider
      value={{
        currentUser,
        isAuthenticated: !currentUser.isGuest,
        username,
        setUsername,
        avatar,
        setAvatar,
        color,
        setColor,
        stats,
        favorites,
        toggleFavorite,
        recordMatchResult,
        achievements,
        setAchievements,
        signIn,
        signUp,
        signOut,
        forgotPassword
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export const usePlayer = () => useContext(PlayerContext);
