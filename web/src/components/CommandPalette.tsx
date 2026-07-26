import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLE_ROUTE_PERMISSIONS } from '@shared/types';
import { Search, FileText, GitFork, MapPin, Radio, LayoutDashboard, Sparkles, CornerDownLeft } from 'lucide-react';

// Global ⌘K / Ctrl+K command palette: jump to any screen, case, gang, cluster,
// or officer, or hand a free-text query to the AI. Pure client, offline.
interface Item { type: string; label: string; sub?: string; icon: any; go: () => void; }

const SCREENS: { path: string; label: string; kw: string }[] = [
  { path: '/command-center', label: 'Command Center', kw: 'dashboard alerts queue' },
  { path: '/hotspot-map', label: 'Hotspot Map', kw: 'dbscan cluster map' },
  { path: '/network-graph', label: 'Network Graph', kw: 'gang louvain' },
  { path: '/camera-intelligence', label: 'Camera Intelligence', kw: 'cctv detection coco' },
  { path: '/case-explorer', label: 'Case Explorer', kw: 'cases fir search' },
  { path: '/trends', label: 'Crime Trends', kw: 'forecast chart' },
  { path: '/governance', label: 'Governance & Audit', kw: 'hash chain bias' },
  { path: '/patrol-planner', label: 'Patrol Planner', kw: 'deploy risk' },
  { path: '/mo-search', label: 'MO Semantic Search', kw: 'similar modus' },
  { path: '/forecast', label: 'Forecast Engine', kw: 'holt winters' },
  { path: '/fleet', label: 'Akka Patrol Fleet', kw: 'gps dispatch' },
  { path: '/bias-fairness', label: 'Bias & Fairness', kw: 'census ward' },
  { path: '/report', label: 'Weekly Report', kw: 'pdf' },
  { path: '/escalations', label: 'Cross-District Escalations', kw: 'approve' },
  { path: '/geo-temporal', label: 'Geo-Temporal Matrix', kw: 'hour heatmap' },
  { path: '/pattern-profiler', label: 'Pattern Profiler', kw: 'signature cluster' },
  { path: '/case-comparator', label: 'Case Comparator', kw: 'compare' },
  { path: '/suspect-ranking', label: 'Suspect Ranking', kw: 'predict' },
  { path: '/anomaly-explorer', label: 'Anomaly Explorer', kw: 'zscore surge' },
  { path: '/report-builder', label: 'Report Builder', kw: 'custom pdf' },
  { path: '/series-builder', label: 'Crime Series Builder', kw: 'timeline' },
  { path: '/data-coverage', label: 'Data Coverage', kw: 'quality stale' },
  { path: '/annotation-notebook', label: 'Hypothesis Notebook', kw: 'notes' },
  { path: '/external-correlator', label: 'External Correlator', kw: 'festival' },
  { path: '/case-diary', label: 'Case Diary', kw: 'io diary' },
  { path: '/evidence-locker', label: 'Evidence Locker', kw: 'custody' },
  { path: '/repeat-check', label: 'Repeat Auto-Flag', kw: 'prior jaro' },
  { path: '/deadlines', label: 'Deadline Tracker', kw: 'chargesheet' },
  { path: '/warrant-generator', label: 'Warrant Generator', kw: 'notice' },
  { path: '/clearance', label: 'Clearance Snapshot', kw: 'stats' },
  { path: '/evidence-capture', label: 'Evidence Capture', kw: 'photo geotag' },
  { path: '/witness-manager', label: 'Witness / Informant', kw: 'contact' },
  { path: '/beat-notes', label: 'Beat Notes', kw: 'neighborhood' },
  { path: '/collab-request', label: 'Collaboration Request', kw: 'ping' },
  { path: '/panic', label: 'Panic / SOS', kw: 'emergency' },
  { path: '/beat-checklist', label: 'Beat Checklist', kw: 'checkpoint' },
  { path: '/offline-queue', label: 'Offline Queue', kw: 'sync' },
  { path: '/beat-feed', label: "My Beat's Feed", kw: 'alerts' },
  { path: '/nearby-units', label: 'Nearby Units', kw: 'backup' },
  { path: '/shift-handover', label: 'Shift Handover', kw: 'notes' },
  { path: '/commendations', label: 'Commendations', kw: 'award' },
  { path: '/community-tip', label: 'Community Tip', kw: 'citizen' },
  { path: '/equipment-checklist', label: 'Equipment Check', kw: 'kit' },
  { path: '/field-report', label: 'Field Report', kw: 'voice' },
  { path: '/activity', label: 'Activity Center', kw: 'notifications events' },
  { path: '/similar-cases', label: 'Cases Like This', kw: 'similar recommend mo' },
  { path: '/suspect-timeline', label: 'Suspect Timeline', kw: 'history chronology' }
];

export const CommandPalette: React.FC = () => {
  const nav = useNavigate();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const [data, setData] = useState<{ cases: any[]; gangs: any[]; clusters: any[]; officers: any[] }>({ cases: [], gangs: [], clusters: [], officers: [] });
  const inputRef = useRef<HTMLInputElement | null>(null);

  const allowed = user ? (ROLE_ROUTE_PERMISSIONS[user.role] || []) : [];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setOpen((o) => !o); }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    setQ(''); setSel(0);
    setTimeout(() => inputRef.current?.focus(), 30);
    // lazy-load searchable entities once opened
    (async () => {
      try {
        const [c, g, h, f] = await Promise.all([
          fetch('/api/catalyst/cases?limit=100').then((r) => r.json()).catch(() => ({})),
          fetch('/api/catalyst/network-graph').then((r) => r.json()).catch(() => ({})),
          fetch('/api/catalyst/hotspots').then((r) => r.json()).catch(() => ({})),
          fetch('/api/catalyst/fleet').then((r) => r.json()).catch(() => ({}))
        ]);
        setData({
          cases: c.cases || [],
          gangs: (g.graphData?.nodes || []).filter((n: any) => n.type === 'Accused'),
          clusters: h.clusters || [],
          officers: f.officers || []
        });
      } catch {}
    })();
  }, [open]);

  const items = useMemo<Item[]>(() => {
    const term = q.trim().toLowerCase();
    const out: Item[] = [];
    SCREENS.filter((s) => allowed.includes(s.path)).forEach((s) => {
      if (!term || s.label.toLowerCase().includes(term) || s.kw.includes(term))
        out.push({ type: 'Screen', label: s.label, icon: LayoutDashboard, go: () => nav(s.path) });
    });
    if (term) {
      data.cases.filter((c) => `${c.case_number} ${c.crime_type} ${c.district} ${c.description}`.toLowerCase().includes(term)).slice(0, 5)
        .forEach((c) => out.push({ type: 'Case', label: c.case_number, sub: `${c.crime_type} · ${c.district}`, icon: FileText, go: () => nav('/case-explorer') }));
      data.gangs.filter((n) => `${n.label} ${n.gangName}`.toLowerCase().includes(term)).slice(0, 4)
        .forEach((n) => out.push({ type: 'Person', label: n.label, sub: n.gangName, icon: GitFork, go: () => nav('/network-graph') }));
      data.clusters.filter((c) => `${c.name} ${c.district}`.toLowerCase().includes(term)).slice(0, 4)
        .forEach((c) => out.push({ type: 'Hotspot', label: c.name, sub: `${c.incidentCount} incidents`, icon: MapPin, go: () => nav('/hotspot-map') }));
      data.officers.filter((o) => `${o.name} ${o.badge}`.toLowerCase().includes(term)).slice(0, 4)
        .forEach((o) => out.push({ type: 'Officer', label: o.name, sub: `${o.badge} · ${o.status}`, icon: Radio, go: () => nav('/fleet') }));
      out.push({ type: 'AI', label: `Ask SAHASRA: "${q.trim()}"`, icon: Sparkles, go: () => { nav(allowed.includes('/case-explorer') ? '/case-explorer' : '/command-center'); window.dispatchEvent(new CustomEvent('sahasra-ai-query', { detail: q.trim() })); } });
    }
    return out;
  }, [q, data, allowed]);

  useEffect(() => { if (sel >= items.length) setSel(0); }, [items.length, sel]);

  if (!open) return null;

  const choose = (i: number) => { const it = items[i]; if (it) { it.go(); setOpen(false); } };

  return (
    <div className="fixed inset-0 z-[6000] bg-black/60 flex items-start justify-center pt-[12vh]" onClick={() => setOpen(false)}>
      <div className="w-full max-w-xl bg-navy-950 border border-navy-600 rounded-xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 px-4 border-b border-navy-700">
          <Search className="w-4 h-4 text-slate-500" />
          <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(s + 1, items.length - 1)); }
              if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
              if (e.key === 'Enter') { e.preventDefault(); choose(sel); }
            }}
            placeholder="Search screens, cases, gangs, hotspots, officers… or ask the AI"
            className="flex-1 py-3.5 bg-transparent text-slate-100 text-sm focus:outline-none" />
          <kbd className="text-[10px] font-mono text-slate-500 border border-navy-700 rounded px-1.5 py-0.5">ESC</kbd>
        </div>
        <div className="max-h-[50vh] overflow-y-auto py-1">
          {items.length === 0 ? <p className="px-4 py-6 text-center text-xs text-slate-500">No matches.</p> :
            items.map((it, i) => { const Icon = it.icon; return (
              <button key={i} onMouseEnter={() => setSel(i)} onClick={() => choose(i)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm ${i === sel ? 'bg-amber-500/15 text-slate-100' : 'text-slate-300 hover:bg-navy-900'}`}>
                <Icon className={`w-4 h-4 ${it.type === 'AI' ? 'text-amber-400' : 'text-slate-500'}`} />
                <div className="flex-1 min-w-0">
                  <span className="truncate">{it.label}</span>
                  {it.sub && <span className="block text-[10px] text-slate-500 font-mono truncate">{it.sub}</span>}
                </div>
                <span className="text-[9px] uppercase text-slate-600 font-mono">{it.type}</span>
                {i === sel && <CornerDownLeft className="w-3.5 h-3.5 text-slate-500" />}
              </button>
            ); })}
        </div>
        <div className="px-4 py-2 border-t border-navy-800 text-[10px] font-mono text-slate-500 flex justify-between">
          <span>↑↓ navigate · ↵ open</span><span>⌘K / Ctrl+K</span>
        </div>
      </div>
    </div>
  );
};
