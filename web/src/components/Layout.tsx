import React, { useState, useEffect, Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { TopBar } from './TopBar';
import { SidebarNav } from './SidebarNav';
import { Bot, Sparkles, Loader2 } from 'lucide-react';
import { AskSahasraCopilot } from './AskSahasraCopilot';
import { DataProvenanceBadge } from './DataProvenanceBadge';
import { CommandPalette } from './CommandPalette';

export const Layout: React.FC = () => {
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const location = useLocation();

  // Close the mobile drawer whenever the route changes (tap-through navigation).
  useEffect(() => { setMobileNavOpen(false); }, [location.pathname]);

  return (
    // h-[100dvh] + overflow-hidden = only the inner <main> scrolls, never the whole page.
    // 100dvh tracks the *dynamic* viewport so mobile browser chrome doesn't clip the UI.
    <div className="h-[100dvh] flex flex-col bg-navy-950 text-slate-100 relative overflow-hidden">
      {/* Fixed Top Bar */}
      <TopBar onToggleNav={() => setMobileNavOpen((v) => !v)} navOpen={mobileNavOpen} />

      {/* Main Content Body */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        {/* Mobile drawer backdrop */}
        {mobileNavOpen && (
          <div
            className="fixed inset-0 top-16 bg-navy-950/70 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setMobileNavOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Left Sidebar (in-flow on desktop, off-canvas drawer on mobile) */}
        <SidebarNav mobileOpen={mobileNavOpen} onNavigate={() => setMobileNavOpen(false)} />

        {/* Dynamic Route Content Shell */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 md:p-6 bg-gradient-to-br from-navy-950 via-navy-900 to-navy-950 min-w-0">
          <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
            <Suspense fallback={
              <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 text-slate-400">
                <Loader2 className="w-7 h-7 animate-spin text-amber-500" />
                <span className="text-xs font-mono uppercase tracking-wider">Loading module…</span>
              </div>
            }>
              <Outlet />
            </Suspense>
            <DataProvenanceBadge />
          </div>
        </main>
      </div>

      {/* Persistent Floating Trigger Button for Ask SAHASRA Copilot */}
      <button
        onClick={() => setCopilotOpen(true)}
        className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-[3000] px-3 py-2.5 md:px-4 md:py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-navy-950 font-bold text-[11px] md:text-xs uppercase tracking-wider rounded-full shadow-2xl flex items-center gap-2 transition-transform hover:scale-105 border-2 border-amber-400"
      >
        <Bot className="w-5 h-5 text-navy-950" />
        <span className="hidden sm:inline">Ask SAHASRA Copilot</span>
        <span className="sm:hidden">Copilot</span>
        <Sparkles className="w-4 h-4 text-navy-950 animate-pulse" />
      </button>

      {/* Ask SAHASRA Copilot Persistent Side Panel */}
      <AskSahasraCopilot
        isOpen={copilotOpen}
        onClose={() => setCopilotOpen(false)}
      />

      {/* Global Command Palette (⌘K / Ctrl+K) */}
      <CommandPalette />
    </div>
  );
};
