import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { apiUrl } from "@/lib/config";
import {
  loadTokens, setTokens, clearTokens, getRefreshToken, authFetch,
} from "@/lib/auth";

/** The 3 roles. Citizen + emergency_staff removed. */
export type Role = "officer" | "station_head" | "super_admin";

export interface User {
  id: string;
  badge: string;
  name: string;
  role: Role;
  rank: string;
  stationId: string | null;
  station?: string; // station name (for legacy intel screens); "" for super admin
  district?: string; // station district (for legacy intel screens)
  phone: string;
  active: boolean;
}

interface AuthContextType {
  user: User | null;
  /** true while we resolve the persisted session on cold start. */
  isLoading: boolean;
  login: (badge: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Cold-start: load persisted tokens, then verify with the server (authFetch
  // silently refreshes an expired access token). Never trust a cached role —
  // /me returns the server-authoritative user.
  useEffect(() => {
    (async () => {
      try {
        const { accessToken, refreshToken } = await loadTokens();
        if (!accessToken && !refreshToken) {
          setUser(null);
          return;
        }
        const res = await authFetch(apiUrl("/api/v2/auth/me"));
        if (res.ok) {
          const data = await res.json();
          setUser(data.user as User);
        } else {
          await clearTokens();
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (badge: string, password: string) => {
    const res = await fetch(apiUrl("/api/v2/auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ badge, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: "Login failed" }));
      throw new Error(err.message || "Invalid badge or password");
    }
    const data = await res.json();
    await setTokens(data.accessToken, data.refreshToken);
    // Route off the SERVER-returned role, not a client-decoded JWT.
    setUser(data.user as User);
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken();
    try {
      await fetch(apiUrl("/api/v2/auth/logout"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
    } catch {
      /* best-effort server invalidation */
    }
    await clearTokens();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const res = await authFetch(apiUrl("/api/v2/auth/me"));
    if (res.ok) {
      const data = await res.json();
      setUser(data.user as User);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
