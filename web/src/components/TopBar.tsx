import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Shield, Globe, LogOut, UserCheck, Menu, X, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { NotificationBell } from './NotificationBell';
import { UserRole, ROLE_DEFAULT_ROUTES } from '@shared/types';

interface TopBarProps {
  onToggleNav?: () => void;
  navOpen?: boolean;
}

const ROLE_OPTIONS: { role: UserRole; label: string; badge: string }[] = [
  { role: 'district_sp', label: 'District SP', badge: 'SP-8821' },
  { role: 'crime_analyst', label: 'Crime Analyst', badge: 'ANALYST-104' },
  { role: 'investigating_officer', label: 'Investigating Officer', badge: 'IO-402' },
  { role: 'akka_pade_officer', label: 'Akka Pade Officer', badge: 'AKKA-55' },
];

export const TopBar: React.FC<TopBarProps> = ({ onToggleNav, navOpen = false }) => {
  const { user, logout, switchRole } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const navigate = useNavigate();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const roleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (roleRef.current && !roleRef.current.contains(e.target as Node)) setRoleMenuOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const handleSwitchRole = (role: UserRole) => {
    switchRole(role);
    setRoleMenuOpen(false);
    navigate(ROLE_DEFAULT_ROUTES[role] || '/command-center');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'super_admin': return 'bg-purple-900/60 text-purple-300 border-purple-600/50';
      case 'superintendent': return 'bg-amber-900/60 text-amber-300 border-amber-600/50';
      case 'police_admin': return 'bg-blue-900/60 text-blue-300 border-blue-600/50';
      default: return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <header className="h-16 shrink-0 bg-navy-900 border-b border-navy-600 px-3 sm:px-4 md:px-6 flex items-center justify-between sticky top-0 z-50 shadow-ops-panel">
      {/* Brand & Logo */}
      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
        {/* Mobile hamburger — toggles the sidebar drawer */}
        <button
          onClick={onToggleNav}
          className="lg:hidden p-2 -ml-1 rounded-lg text-slate-300 hover:bg-navy-800 hover:text-amber-400 transition-colors"
          aria-label="Toggle navigation menu"
          aria-expanded={navOpen}
        >
          {navOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-ops-glow border border-amber-400/40 shrink-0">
          <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-navy-950 stroke-[2.5]" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center space-x-2">
            <h1 className="text-lg sm:text-xl font-bold tracking-wider text-slate-100 uppercase font-outfit">SAHASRA</h1>
            <span className="hidden xs:inline text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
              KSP AI Ops
            </span>
          </div>
          <p className="text-xs text-slate-400 hidden md:block truncate">
            {t('Karnataka State Police Intelligence Platform', 'ಕರ್ನಾಟಕ ರಾಜ್ಯ ಪೊಲೀಸ್ ಕ್ರೈಮ್ ವಿಶ್ಲೇಷಣೆ')}
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 shrink-0">
        {/* Live Pulse Indicator */}
        <div className="hidden lg:flex items-center space-x-2 px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>{t('Live Telemetry: Online', 'ಲೈವ್ ಸಿಂಕ್: ಸಕ್ರಿಯ')}</span>
        </div>

        {/* Role Switcher — assume any KSP role to explore its full dashboard set */}
        {user && (
          <div className="relative" ref={roleRef}>
            <button
              onClick={() => setRoleMenuOpen((o) => !o)}
              className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-lg border transition-colors ${getRoleBadgeColor(user.role)} hover:brightness-125`}
              title="Switch role (demo)"
            >
              <UserCheck className="w-3.5 h-3.5 shrink-0" />
              <div className="hidden sm:block text-left leading-tight">
                <p className="text-[11px] font-semibold uppercase tracking-wider">{user.role.replace(/_/g, ' ')}</p>
                <p className="text-[10px] opacity-70 font-mono">{user.badgeNumber}</p>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${roleMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {roleMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl bg-navy-900 border border-navy-600 shadow-ops-panel overflow-hidden z-50">
                <div className="px-3 py-2 text-[10px] uppercase tracking-widest text-slate-500 border-b border-navy-700 bg-navy-800/60">
                  Switch Role · RBAC Demo
                </div>
                {ROLE_OPTIONS.map((opt) => {
                  const active = user.role === opt.role;
                  return (
                    <button
                      key={opt.role}
                      onClick={() => handleSwitchRole(opt.role)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 text-left transition-colors ${active ? 'bg-amber-500/10' : 'hover:bg-navy-800'}`}
                    >
                      <div>
                        <p className={`text-sm font-semibold ${active ? 'text-amber-400' : 'text-slate-200'}`}>{opt.label}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{opt.badge}</p>
                      </div>
                      {active && <span className="text-[9px] uppercase font-bold text-amber-400 tracking-wider">Active</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Live WebSocket Alert Bell */}
        <NotificationBell />

        {/* Language Toggle Button */}
        <button
          onClick={() => setLang(lang === 'en' ? 'kn' : 'en')}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-navy-800 hover:bg-navy-700 border border-navy-600 text-xs font-medium text-slate-200 transition-colors"
          title="Toggle Language"
        >
          <Globe className="w-4 h-4 text-amber-400" />
          <span className="font-semibold">{lang === 'en' ? 'ಕನ್ನಡ' : 'English'}</span>
        </button>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-600/40 text-rose-300 text-xs font-medium transition-colors"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden md:inline">{t('Logout', 'ನಿರ್ಗಮನ')}</span>
        </button>
      </div>
    </header>
  );
};
