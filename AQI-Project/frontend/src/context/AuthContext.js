/**
 * AuthContext — JWT-based auth backed by the FastAPI backend.
 * No Clerk dependency. Token stored in localStorage.
 */
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";

const AuthContext = createContext(null);

const TOKEN_KEY = "aq_access_token";
const USER_KEY  = "aq_user";

export function AuthProvider({ children }) {
  const [token,     setToken]     = useState(() => localStorage.getItem(TOKEN_KEY) || null);
  const [user,      setUser]      = useState(() => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const isLoading = false;

  /* Persist token + user to localStorage whenever they change */
  useEffect(() => {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  }, [user]);

  /**
   * Called right after a successful /auth/login or /auth/signup response.
   * @param {string} accessToken  — JWT from the backend
   * @param {object} userData     — { email, full_name } (partial is fine)
   */
  const login = useCallback((accessToken, userData = {}) => {
    setToken(accessToken);
    setUser(userData);
  }, []);

  /** Clear session */
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  /**
   * Returns the stored JWT — used by apiClient for authenticated requests.
   */
  const getAuthToken = useCallback(async () => token, [token]);

  const value = useMemo(() => ({
    user,
    isAuthenticated: Boolean(token),
    isLoading,
    login,
    logout,
    getAuthToken,
  }), [user, token, isLoading, login, logout, getAuthToken]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }
  return context;
}
