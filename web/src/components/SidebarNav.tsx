import React, { useState, useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { ROLE_ROUTE_PERMISSIONS } from '@shared/types';
import {
  LayoutDashboard,
  MapPin,
  GitFork,
  FileSearch,
  TrendingUp,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Camera,
  Scale,
  Radio,
  Navigation,
  FileText,
  GitBranch,
  Crosshair,
  Grid3x3,
  BookText,
  Siren,
  Package,
  UserSearch,
  CalendarClock,
  Fingerprint,
  Columns3,
  Target,
  Activity,
  FileBarChart,
  Link2,
  CheckSquare,
  CloudOff,
  Bell,
  ScrollText,
  Gauge,
  Camera as CameraIcon,
  Users2,
  ClipboardList,
  Award,
  MessageSquarePlus,
  Zap,
  DatabaseZap,
  NotebookPen,
  CalendarRange,
  Users,
  MapPin as MapPinIcon,
  Handshake,
  Search,
  History
} from 'lucide-react';

interface SidebarNavProps {
  /** Whether the off-canvas drawer is open on mobile (<lg). Ignored on desktop. */
  mobileOpen?: boolean;
  /** Called after a nav item is tapped so the parent can close the mobile drawer. */
  onNavigate?: () => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({ mobileOpen = false, onNavigate }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  // Auto-collapse on tablet/narrow widths (patrol-vehicle use) so field screens
  // get more room; once the officer toggles manually, stop auto-changing.
  // Note: this only governs the DESKTOP rail width. On mobile the drawer is
  // always full-width (w-64) and its visibility is driven by `mobileOpen`.
  const [collapsed, setCollapsed] = useState(() => typeof window !== 'undefined' && window.innerWidth < 1280 && window.innerWidth >= 1024);
  const userSet = useRef(false);
  useEffect(() => {
    const onResize = () => { if (!userSet.current) setCollapsed(window.innerWidth < 1280 && window.innerWidth >= 1024); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const toggleCollapsed = () => { userSet.current = true; setCollapsed((c) => !c); };

  const allNavItems = [
    {
      path: '/command-center',
      icon: LayoutDashboard,
      labelEn: 'Command Center',
      labelKn: 'ಕಮಾಂಡ್ ಸೆಂಟರ್',
      badge: 'LIVE'
    },
    {
      path: '/hotspot-map',
      icon: MapPin,
      labelEn: 'Hotspot Map',
      labelKn: 'ಹಾಟ್‌ಸ್ಪಾಟ್ ಮ್ಯಾಪ್',
      badge: null
    },
    {
      path: '/network-graph',
      icon: GitFork,
      labelEn: 'Network Graph',
      labelKn: 'ಗ್ಯಾಂಗ್ ನೆಟ್‌ವರ್ಕ್',
      badge: 'AI'
    },
    { path: '/patrol-planner', icon: Crosshair, labelEn: 'Patrol Planner', labelKn: 'ಪೆಟ್ರೋಲ್ ಯೋಜನೆ', badge: 'NEW' },
    { path: '/activity', icon: Activity, labelEn: 'Activity Center', labelKn: 'ಚಟುವಟಿಕೆ', badge: 'LIVE' },
    { path: '/geo-temporal', icon: Grid3x3, labelEn: 'Geo-Temporal Matrix', labelKn: 'ಸಮಯ ಮ್ಯಾಟ್ರಿಕ್ಸ್', badge: 'ANALYST' },
    { path: '/case-diary', icon: BookText, labelEn: 'Case Diary', labelKn: 'ಪ್ರಕರಣ ದಿನಚರಿ', badge: 'IO' },
    { path: '/evidence-locker', icon: Package, labelEn: 'Evidence Locker', labelKn: 'ಸಾಕ್ಷ್ಯ ಲಾಕರ್', badge: 'IO' },
    { path: '/repeat-check', icon: UserSearch, labelEn: 'Repeat Auto-Flag', labelKn: 'ಪುನರಾವರ್ತನೆ', badge: 'IO' },
    { path: '/deadlines', icon: CalendarClock, labelEn: 'Deadline Tracker', labelKn: 'ಗಡುವು', badge: 'IO' },
    { path: '/warrant-generator', icon: ScrollText, labelEn: 'Warrant Generator', labelKn: 'ವಾರಂಟ್', badge: 'IO' },
    { path: '/clearance', icon: Gauge, labelEn: 'Clearance Snapshot', labelKn: 'ಕ್ಲಿಯರೆನ್ಸ್', badge: 'IO' },
    { path: '/evidence-capture', icon: CameraIcon, labelEn: 'Evidence Capture', labelKn: 'ಸಾಕ್ಷ್ಯ ಸೆರೆ', badge: 'IO' },
    { path: '/pattern-profiler', icon: Fingerprint, labelEn: 'Pattern Profiler', labelKn: 'ಪ್ಯಾಟರ್ನ್', badge: 'ANALYST' },
    { path: '/case-comparator', icon: Columns3, labelEn: 'Case Comparator', labelKn: 'ಹೋಲಿಕೆ', badge: 'ANALYST' },
    { path: '/suspect-ranking', icon: Target, labelEn: 'Suspect Ranking', labelKn: 'ಶಂಕಿತ ಶ್ರೇಣಿ', badge: 'ANALYST' },
    { path: '/anomaly-explorer', icon: Activity, labelEn: 'Anomaly Explorer', labelKn: 'ಅಸಂಗತತೆ', badge: 'ANALYST' },
    { path: '/report-builder', icon: FileBarChart, labelEn: 'Report Builder', labelKn: 'ವರದಿ ನಿರ್ಮಾಣ', badge: 'ANALYST' },
    { path: '/series-builder', icon: Link2, labelEn: 'Crime Series', labelKn: 'ಸರಣಿ', badge: 'ANALYST' },
    { path: '/beat-checklist', icon: CheckSquare, labelEn: 'Beat Checklist', labelKn: 'ಬೀಟ್ ಪಟ್ಟಿ', badge: 'AKKA' },
    { path: '/offline-queue', icon: CloudOff, labelEn: 'Offline Queue', labelKn: 'ಆಫ್‌ಲೈನ್', badge: 'AKKA' },
    { path: '/beat-feed', icon: Bell, labelEn: "My Beat's Feed", labelKn: 'ಬೀಟ್ ಫೀಡ್', badge: 'AKKA' },
    { path: '/nearby-units', icon: Users2, labelEn: 'Nearby Units', labelKn: 'ಹತ್ತಿರದ ಘಟಕ', badge: 'AKKA' },
    { path: '/shift-handover', icon: ClipboardList, labelEn: 'Shift Handover', labelKn: 'ಶಿಫ್ಟ್ ವರ್ಗಾವಣೆ', badge: 'AKKA' },
    { path: '/commendations', icon: Award, labelEn: 'Commendations', labelKn: 'ಪ್ರಶಂಸೆ', badge: 'AKKA' },
    { path: '/community-tip', icon: MessageSquarePlus, labelEn: 'Community Tip', labelKn: 'ಸಮುದಾಯ ಸುಳಿವು', badge: 'AKKA' },
    { path: '/equipment-checklist', icon: ShieldCheck, labelEn: 'Equipment Check', labelKn: 'ಸಲಕರಣೆ', badge: 'AKKA' },
    { path: '/field-report', icon: Zap, labelEn: 'Quick Field Report', labelKn: 'ಕ್ಷೇತ್ರ ವರದಿ', badge: 'AKKA' },
    { path: '/data-coverage', icon: DatabaseZap, labelEn: 'Data Coverage', labelKn: 'ಡೇಟಾ ಗುಣಮಟ್ಟ', badge: 'ANALYST' },
    { path: '/annotation-notebook', icon: NotebookPen, labelEn: 'Hypothesis Notebook', labelKn: 'ಟಿಪ್ಪಣಿ', badge: 'ANALYST' },
    { path: '/external-correlator', icon: CalendarRange, labelEn: 'External Correlator', labelKn: 'ಬಾಹ್ಯ ಸಂಬಂಧ', badge: 'ANALYST' },
    { path: '/similar-cases', icon: Search, labelEn: 'Cases Like This', labelKn: 'ಸದೃಶ ಪ್ರಕರಣ', badge: 'AI' },
    { path: '/suspect-timeline', icon: History, labelEn: 'Suspect Timeline', labelKn: 'ಸಮಯರೇಖೆ', badge: 'AI' },
    { path: '/witness-manager', icon: Users, labelEn: 'Witness / Informant', labelKn: 'ಸಾಕ್ಷಿ', badge: 'IO' },
    { path: '/beat-notes', icon: MapPinIcon, labelEn: 'Beat Notes', labelKn: 'ಬೀಟ್ ಟಿಪ್ಪಣಿ', badge: 'IO' },
    { path: '/collab-request', icon: Handshake, labelEn: 'Collaboration', labelKn: 'ಸಹಯೋಗ', badge: 'IO' },
    { path: '/panic', icon: Siren, labelEn: 'Panic / SOS', labelKn: 'ತುರ್ತು', badge: 'SOS' },
    {
      path: '/camera-intelligence',
      icon: Camera,
      labelEn: 'Camera Intelligence',
      labelKn: 'ಕ್ಯಾಮೆರಾ ಎಐ',
      badge: 'CCTV'
    },
    {
      path: '/case-explorer',
      icon: FileSearch,
      labelEn: 'Case Explorer',
      labelKn: 'ಕೇಸ್ ಫೈಲ್',
      badge: null
    },
    {
      path: '/trends',
      icon: TrendingUp,
      labelEn: 'Crime Trends',
      labelKn: 'ಅಪರಾಧ ಪ್ರವೃತ್ತಿ',
      badge: null
    },
    {
      path: '/governance',
      icon: ShieldCheck,
      labelEn: 'Governance & Audit',
      labelKn: 'ಆಡಿಟ್ ಮತ್ತು ಭದ್ರತೆ',
      badge: null
    },
    { path: '/bias-fairness', icon: Scale, labelEn: 'Bias & Fairness', labelKn: 'ನಿಷ್ಪಕ್ಷಪಾತ', badge: null },
    { path: '/fleet', icon: Radio, labelEn: 'Akka Patrol Fleet', labelKn: 'ಪೆಟ್ರೋಲ್ ಫ್ಲೀಟ್', badge: 'GPS' },
    { path: '/mo-search', icon: FileSearch, labelEn: 'MO Semantic Search', labelKn: 'ಎಂಒ ಶೋಧ', badge: 'AI' },
    { path: '/forecast', icon: TrendingUp, labelEn: 'Forecast Engine', labelKn: 'ಮುನ್ಸೂಚನೆ', badge: null },
    { path: '/report', icon: FileText, labelEn: 'Weekly Report', labelKn: 'ವರದಿ', badge: 'PDF' },
    { path: '/escalations', icon: GitBranch, labelEn: 'Cross-District Escalations', labelKn: 'ಎಸ್ಕಲೇಶನ್', badge: null }
  ];

  // Show only the routes this role is permitted to see (role-aware sidebar).
  const permitted = user ? (ROLE_ROUTE_PERMISSIONS[user.role] || []) : [];
  const navItems = allNavItems.filter((i) => permitted.includes(i.path));

  return (
    <aside
      className={`bg-navy-900 border-r border-navy-600 transition-transform lg:transition-all duration-300 flex flex-col
        fixed lg:static inset-y-0 top-16 lg:top-0 left-0 z-50 lg:z-30
        w-64 ${collapsed ? 'lg:w-20' : 'lg:w-64'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
    >
      {/* Navigation List */}
      <div className="flex-1 py-4 space-y-1.5 px-3 overflow-y-auto overscroll-contain">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => onNavigate?.()}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-navy-600 to-navy-700 text-amber-400 border-l-4 border-amber-500 shadow-md'
                    : 'text-slate-300 hover:bg-navy-800 hover:text-slate-100'
                }`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && (
                <div className="flex-1 flex items-center justify-between overflow-hidden">
                  <span className="truncate">{t(item.labelEn, item.labelKn)}</span>
                  {item.badge && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Collapse Toggle Button (desktop only — mobile uses the drawer) */}
      <div className="p-3 border-t border-navy-600/80 hidden lg:block">
        <button
          onClick={toggleCollapsed}
          className="w-full flex items-center justify-center space-x-2 py-2 rounded-lg bg-navy-850 hover:bg-navy-800 text-slate-400 hover:text-slate-200 border border-navy-700 transition-colors text-xs font-semibold"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>{t('Collapse Sidebar', 'ಸಂಕುಚಿತಗೊಳಿಸು')}</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};
