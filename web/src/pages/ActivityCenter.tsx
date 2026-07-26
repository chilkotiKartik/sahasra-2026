import React, { useEffect, useRef, useState } from 'react';
import { Activity, Wifi, WifiOff, Filter } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Evt { id: string; crimeType: string; severity: string; station: string; district: string; description: string; at: string; live?: boolean; }

// Activity / Notification Center — aggregates every real-time event from the /ws
// bus (alerts, panics, community tips, collaboration pings) into a filterable feed.
const SEV_COLOR: Record<string, string> = { CRITICAL: '#ef4444', HIGH: '#f59e0b', MEDIUM: '#38bdf8', INFO: '#64748b' };

export const ActivityCenter: React.FC = () => {
  const { token } = useAuth();
  const [events, setEvents] = useState<Evt[]>([]);
  const [connected, setConnected] = useState(false);
  const [filter, setFilter] = useState<string>('ALL');
  const wsRef = useRef<WebSocket | null>(null);

  // seed from existing alerts
  useEffect(() => {
    fetch('/api/catalyst/command-center').then((r) => r.json()).then((j) => {
      const a = j?.data?.alerts || [];
      setEvents(a.map((x: any) => ({ id: x.id, crimeType: x.crimeType, severity: x.severity, station: x.station, district: x.district, description: x.description, at: x.timestamp })));
    }).catch(() => {});
  }, []);

  // live WS
  useEffect(() => {
    let stop = false;
    const connect = () => {
      if (stop) return;
      const proto = location.protocol === 'https:' ? 'wss' : 'ws';
      const ws = new WebSocket(`${proto}://${location.host}/ws?token=${encodeURIComponent(token || 'demo')}`);
      wsRef.current = ws;
      ws.onopen = () => setConnected(true);
      ws.onclose = () => { setConnected(false); if (!stop) setTimeout(connect, 3000); };
      ws.onerror = () => ws.close();
      ws.onmessage = (e) => {
        try {
          const m = JSON.parse(e.data);
          if (m.type === 'crime_alert' && m.alert) {
            const a = m.alert;
            setEvents((prev) => [{ id: a.id || `e-${Date.now()}`, crimeType: a.crimeType, severity: a.severity, station: a.station, district: a.district, description: a.description, at: new Date().toLocaleTimeString('en-GB', { hour12: false }), live: true }, ...prev].slice(0, 100));
          }
        } catch {}
      };
    };
    connect();
    return () => { stop = true; wsRef.current?.close(); };
  }, [token]);

  const kinds = Array.from(new Set(events.map((e) => e.crimeType)));
  const shown = filter === 'ALL' ? events : events.filter((e) => e.crimeType === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-navy-700 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-wide text-slate-100 uppercase font-outfit flex items-center gap-2"><Activity className="w-7 h-7 text-amber-500" /> Activity Center</h1>
          <p className="text-sm text-slate-400">Every real-time event across the platform — watchlist matches, panic/SOS, community tips, collaboration requests.</p>
        </div>
        <span className={`px-3 py-1.5 rounded font-mono text-xs font-bold border flex items-center gap-1.5 ${connected ? 'bg-emerald-950 text-emerald-300 border-emerald-700' : 'bg-navy-900 text-slate-400 border-navy-700'}`}>
          {connected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />} {connected ? 'LIVE' : 'reconnecting'}
        </span>
      </div>

      <div className="flex items-center gap-2 flex-wrap text-xs">
        <Filter className="w-3.5 h-3.5 text-slate-500" />
        {['ALL', ...kinds].map((k) => (
          <button key={k} onClick={() => setFilter(k)} className={`px-2.5 py-1 rounded border ${filter === k ? 'bg-amber-500 text-navy-950 border-amber-400 font-bold' : 'bg-navy-900 text-slate-300 border-navy-700'}`}>{k}</button>
        ))}
      </div>

      <div className="space-y-2">
        {shown.length === 0 ? <p className="text-xs text-slate-500 italic">No activity yet — trigger a Panic/SOS or Community Tip to see it appear live.</p> :
          shown.map((e) => (
            <div key={e.id} className="ops-card p-3.5 border-l-4 border border-navy-700" style={{ borderLeftColor: SEV_COLOR[e.severity] || '#64748b' }}>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="font-bold text-sm text-slate-100 flex items-center gap-2">{e.crimeType}{e.live && <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700">LIVE</span>}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: (SEV_COLOR[e.severity] || '#64748b') + '22', color: SEV_COLOR[e.severity] || '#94a3b8' }}>{e.severity}</span>
              </div>
              <p className="text-xs text-slate-300 mt-1">{e.description}</p>
              <p className="text-[10px] font-mono text-slate-500 mt-1">{e.station} · {e.district} · {e.at}</p>
            </div>
          ))}
      </div>
    </div>
  );
};
