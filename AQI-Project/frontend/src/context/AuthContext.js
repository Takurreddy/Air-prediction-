/**
 * AuthContext — JWT-based auth backed by Supabase.
 */
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../utils/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback((accessToken, userData = {}) => {
    // Left for compatibility if called manually, but Supabase handles this automatically via onAuthStateChange
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  /**
   * Returns the stored JWT — used by apiClient for authenticated requests.
   */
  const getAuthToken = useCallback(async () => {
    if (!session) return null;
    
    // Check if token is expired, if so get a fresh session
    const expiresAt = session.expires_at;
    if (expiresAt && expiresAt < (Date.now() / 1000) + 10) {
       const { data } = await supabase.auth.getSession();
       return data.session?.access_token || null;
    }
    return session.access_token;
  }, [session]);

  const value = useMemo(() => ({
    user: user ? { ...user, email: user.email, full_name: user.user_metadata?.full_name } : null,
    isAuthenticated: Boolean(session),
    isLoading,
    login,
    logout,
    getAuthToken,
  }), [user, session, isLoading, login, logout, getAuthToken]);

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
