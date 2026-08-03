import { createContext, useContext, useEffect, useMemo } from "react";
import { useAuth as useClerkAuth, useUser } from "@clerk/clerk-react";
import runtimeConfig from "../config/runtimeConfig";
import { setClerkTokenProvider } from "../services/apiClient";

const AuthContext = createContext(null);

function ClerkAuthProvider({ children }) {
  const { isLoaded, isSignedIn, getToken, signOut } = useClerkAuth();
  const { user } = useUser();

  useEffect(() => {
    setClerkTokenProvider(() =>
      getToken({
        template: runtimeConfig.clerkJwtTemplate || undefined,
      })
    );

    return () => {
      setClerkTokenProvider(null);
    };
  }, [getToken]);

  const value = useMemo(
    () => ({
      user: user
        ? {
            id: user.id,
            email: user.primaryEmailAddress?.emailAddress || "",
            full_name: user.fullName || user.firstName || null,
          }
        : null,
      isAuthenticated: Boolean(isSignedIn),
      isLoading: !isLoaded,
      logout: () => signOut(),
      getAuthToken: async () =>
        getToken({
          template: runtimeConfig.clerkJwtTemplate || undefined,
        }),
    }),
    [getToken, isLoaded, isSignedIn, signOut, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function AuthProvider({ children }) {
  return <ClerkAuthProvider>{children}</ClerkAuthProvider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }
  return context;
}
