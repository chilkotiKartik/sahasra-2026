import React, { useEffect, useRef, useState } from 'react';
import { Bell, Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LiveAlert {
  id?: string;
  station: string;
  district: string;
  crimeType: string;
  severity: string;
  description: string;
  at: string;
}

// Live WebSocket alert bell — real-time push via /ws, shown on every dashboard.
export const NotificationBell: React.FC = () => {
  const { token } = useAuth();
  const [alerts, setAlerts] = useState<LiveAlert[]>([]);
  const [open, setOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const [unseen, setUnseen] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);

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
      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg.type === 'crime_alert' && msg.alert) {
            setAlerts((a) => [{ ...msg.alert, at: new Date().toLocaleTimeString('en-GB', { hour12: false }) }, ...a].slice(0, 20));
            setUnseen((u) => u + 1);
          }
        } catch {}
      };
    };
    connect();
    return () => { stop = true; wsRef.current?.close(); };
  }, [token]);

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen((o) => !o); setUnseen(0); }}
        className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-navy-800 hover:bg-navy-700 border border-navy-600 text-slate-200"
        title={connected ? 'Live alerts connected' : 'Reconnecting…'}
      >
        <Bell className="w-4 h-4" />
        {unseen > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
            {unseen}
          </span>
        )}
        <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ${connected ? 'bg-emerald-400' : 'bg-slate-500'}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-navy-950 border border-navy-700 rounded-xl shadow-2xl z-[4000]">
          <div className="p-3 border-b border-navy-800 flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-200 flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-amber-500" /> Live Alerts
            </span>
            <span className={`text-[10px] font-mono flex items-center gap-1 ${connected ? 'text-emerald-400' : 'text-slate-500'}`}>
              {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />} {connected ? 'WS live' : 'reconnecting'}
            </span>
          </div>
          {alerts.length === 0 ? (
            <p className="p-6 text-center text-xs text-slate-500">No live alerts yet. Watchlist / surge events push here in real time.</p>
          ) : (
            alerts.map((a, i) => (
              <div key={i} className="p-3 border-b border-navy-900 hover:bg-navy-900/60">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">{a.crimeType}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${a.severity === 'CRITICAL' ? 'bg-rose-950 text-rose-300 border border-rose-600' : 'bg-amber-950 text-amber-300 border border-amber-600'}`}>{a.severity}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">{a.description}</p>
                <p className="text-[10px] text-slate-500 font-mono mt-1">{a.station} · {a.district} · {a.at}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
