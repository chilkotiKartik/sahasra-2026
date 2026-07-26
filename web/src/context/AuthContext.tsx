import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole, UserProfile, AuthSession } from '@shared/types';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  login: (badge: string, pass: string) => Promise<{ success: boolean; message?: string; role?: UserRole }>;
  applySession: (session: AuthSession) => UserRole | undefined;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<AuthSession | null>(() => {
    const saved = localStorage.getItem('sahasra_auth_session');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    // Default Auto-Bypass Session (District SP Role)
    return {
      token: "demo-sp-token-8821",
      user: {
        id: "usr-8821",
        badgeNumber: "SP-8821",
        name: "Superintendent of Police",
        role: "district_sp",
        jurisdictionDistrict: "Bengaluru Urban",
        stationId: "SP-HQ-01"
      },
      expiresAt: new Date(Date.now() + 86400000).toISOString()
    };
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
