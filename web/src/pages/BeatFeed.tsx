import React, { useEffect, useState } from 'react';
import { Bell, RefreshCw, Loader2, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// AKKA — My Beat's Hotspot Feed (only this officer's beat alerts; glance view)
export const BeatFeed: React.FC = () => {
  const navigate = useNavigate();
  const beat = 'Peenya';
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const load = async () => { setLoading(true); try { const r = await fetch(`/api/catalyst/akka/beat-feed?beat=${beat}`); const j = await r.json(); if (j.success) setData(j); } catch {} setLoading(false); };
  useEffect(() => { load(); const t = setInterval(load, 8000); return () => clearInterval(t); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-navy-700 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-wide text-slate-100 uppercase font-outfit flex items-center gap-2"><Bell className="w-7 h-7 text-amber-500" /> My Beat's Hotspot Feed</h1>
          <p className="text-sm text-slate-400">Only <b>{beat}</b> beat's active alerts — a glance view for patrol, not the full district map.</p>
        </div>
        <button onClick={load} className="px-3 py-1.5 bg-navy-800 border border-navy-600 rounded text-slate-200 text-xs flex items-center gap-1.5"><RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /></button>
      </div>
      {loading ? <div className="text-slate-500 text-sm flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading feed…</div> : data && (
        <>
          <p className="text-[11px] text-slate-500">{data.alerts.length} alert(s) on your beat · filtered from {data.total} district-wide.</p>
          {data.alerts.length === 0 ? <p className="text-xs text-slate-500 italic">All quiet on the {beat} beat right now.</p> : data.alerts.map((a: any) => (
            <div key={a.id} className="ops-card p-4 border border-rose-600/30">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-100 text-sm">{a.crimeType}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${a.severity === 'CRITICAL' ? 'bg-rose-950 text-rose-300 border border-rose-600' : 'bg-amber-950 text-amber-300 border border-amber-600'}`}>{a.severity}</span>
              </div>
              <p className="text-xs text-slate-300 mt-1">{a.description}</p>
              <p className="text-[10px] text-slate-500 font-mono mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> {a.station} · {a.district} · {a.timestamp}</p>
            </div>
          ))}
          <div className="text-[11px] text-slate-500 font-mono border-t border-navy-800 pt-3">Interlink: same alerts table as the SP <button onClick={() => navigate('/command-center')} className="text-amber-400 underline">Command Center</button> — filtered to your beat.</div>
        </>
      )}
    </div>
  );
};
