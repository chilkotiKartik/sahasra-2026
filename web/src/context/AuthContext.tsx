import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole, UserProfile, AuthSession } from '@shared/types';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  login: (badge: string, pass: string) => Promise<{ success: boolean; message?: string; role?: UserRole }>;
  applySession: (session: AuthSession) => UserRole | undefined;
  switchRole: (role: UserRole) => UserRole;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
}

// Demo identities used by the in-portal Role Switcher (mirrors the KSP demo officers).
export const DEMO_IDENTITIES: Record<UserRole, UserProfile> = {
  district_sp: { id: "usr-8821", badgeNumber: "SP-8821", name: "Superintendent of Police", role: "district_sp", jurisdiction: "SP-HQ-01", district: "Bengaluru Urban" },
  crime_analyst: { id: "usr-104", badgeNumber: "ANALYST-104", name: "Crime Analyst", role: "crime_analyst", jurisdiction: "State Crime Cell", district: "Bengaluru Urban" },
  investigating_officer: { id: "usr-402", badgeNumber: "IO-402", name: "Investigating Officer", role: "investigating_officer", jurisdiction: "Peenya PS", district: "Bengaluru Urban" },
  akka_pade_officer: { id: "usr-55", badgeNumber: "AKKA-55", name: "Akka Pade Officer", role: "akka_pade_officer", jurisdiction: "Koramangala PS", district: "Bengaluru Urban" },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<AuthSession | null>(() => {
    const saved = localStorage.getItem('sahasra_auth_session');
    if (saved) {
      try {
        const s = JSON.parse(saved);
        // Restore only a still-valid session; otherwise fall through to login.
        if (s?.token && (!s.expiresAt || s.expiresAt > Date.now())) return s;
      } catch {}
    }
    // No auto-bypass — the officer must authenticate on the login screen.
    return null;
  });
  const [loading, setLoading] = useState(false);

  const login = async (badgeNumber: string, password: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/catalyst/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ badgeNumber, password })
      });
      if (!res.ok) {
        setLoading(false);
        return { success: false, message: `Server error: ${res.statusText || res.status}` };
      }
      const data = await res.json();
      if (!data || !data.success) {
        setLoading(false);
        return { success: false, message: data?.message || 'Authentication Failed' };
      }

      setSession(data.session);
      localStorage.setItem('sahasra_auth_session', JSON.stringify(data.session));
      setLoading(false);
      return { success: true, role: data.session.user.role };
    } catch (e: any) {
      setLoading(false);
      return { success: false, message: e.message || 'Server Connection Failed' };
    }
  };

  // Apply a session obtained out-of-band (e.g. WebAuthn biometric verify).
  const applySession = (s: AuthSession): UserRole | undefined => {
    setSession(s);
    localStorage.setItem('sahasra_auth_session', JSON.stringify(s));
    return s?.user?.role;
  };

  // Demo Role Switcher — instantly assume any KSP role to showcase every dashboard.
  const switchRole = (role: UserRole): UserRole => {
    const user = DEMO_IDENTITIES[role];
    const s: AuthSession = {
      token: `demo-${role}-token`,
      user,
      expiresAt: Date.now() + 86400000,
    };
    setSession(s);
    localStorage.setItem('sahasra_auth_session', JSON.stringify(s));
    return role;
  };

  const logout = async () => {
    if (session?.token) {
      try {
        await fetch('/api/catalyst/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${session.token}` }
        });
      } catch {}
    }
    setSession(null);
    localStorage.removeItem('sahasra_auth_session');
  };

  return (
    <AuthContext.Provider
      value={{
        user: session?.user || null,
        token: session?.token || null,
        login,
        applySession,
        switchRole,
        logout,
        isAuthenticated: !!session?.token,
        loading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
