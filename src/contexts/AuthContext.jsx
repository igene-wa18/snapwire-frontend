import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await authAPI.getMe();
      setUser(res.data.data.user);
      connectSocket(token);
    } catch {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
    setLoading(false);
  }

  async function login(email, password) {
    const res = await authAPI.login({ email, password });
    const { user: userData, accessToken, refreshToken } = res.data.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    setUser(userData);
    setIsNewUser(false);
    connectSocket(accessToken);
    return userData;
  }

  async function register(username, email, password, displayName) {
    const res = await authAPI.register({ username, email, password, displayName });
    const { user: userData, accessToken, refreshToken } = res.data.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    setUser(userData);
    setIsNewUser(true);
    connectSocket(accessToken);
    return userData;
  }

  function logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    disconnectSocket();
    setUser(null);
    setIsNewUser(false);
  }

  function updateUser(data) {
    setUser(prev => prev ? { ...prev, ...data } : prev);
  }

  function clearNewUser() {
    setIsNewUser(false);
  }

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout, updateUser, isNewUser, clearNewUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
