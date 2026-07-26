import React, { useEffect, useState } from 'react';
import { Users2, RefreshCw, Loader2, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// AKKA — Nearby Unit Locator (real on-duty peer positions + distance)
export const NearbyUnits: React.FC = () => {
  const { user } = useAuth();
  const [peers, setPeers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: 13.031, lng: 77.53 });

  const load = async (lat: number, lng: number) => {
    setLoading(true);
    try { const r = await fetch(`/api/catalyst/akka/nearby?lat=${lat}&lng=${lng}&officerId=${user?.badgeNumber || 'AKKA-55'}`); const j = await r.json(); if (j.success) setPeers(j.peers); } catch {}
    setLoading(false);
  };
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (p) => { const c = { lat: p.coords.latitude, lng: p.coords.longitude }; setCoords(c); load(c.lat, c.lng); },
      () => load(coords.lat, coords.lng), { timeout: 3000 });
    const t = setInterval(() => load(coords.lat, coords.lng), 6000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-navy-700 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-wide text-slate-100 uppercase font-outfit flex items-center gap-2"><Users2 className="w-7 h-7 text-amber-500" /> Nearby Unit Locator</h1>
          <p className="text-sm text-slate-400">On-duty peer officers near you (live fleet telemetry) — for backup requests. Your position: {coords.lat.toFixed(3)}, {coords.lng.toFixed(3)}.</p>
        </div>
        <button onClick={() => load(coords.lat, coords.lng)} className="px-3 py-1.5 bg-navy-800 border border-navy-600 rounded text-slate-200 text-xs flex items-center gap-1.5"><RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /></button>
      </div>
      {loading && peers.length === 0 ? <div className="text-slate-500 text-sm flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Locating peers…</div> : (
        <div className="space-y-3">
          {peers.map((p, i) => (
            <div key={p.id} className={`ops-card p-4 border flex items-center justify-between ${i === 0 ? 'border-emerald-600/50' : 'border-navy-600'}`}>
              <div>
                <p className="font-bold text-slate-100 text-sm">{p.name} <span className="text-[10px] font-mono text-slate-500">({p.badge})</span></p>
                <p className="text-[11px] font-mono text-slate-400 flex items-center gap-1"><MapPin className="w-3 h-3" /> {p.lat.toFixed(3)}, {p.lng.toFixed(3)} · {p.status}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-mono font-bold text-amber-400">{p.distanceM != null ? (p.distanceM / 1000).toFixed(1) + ' km' : '—'}</p>
                {i === 0 && p.status !== 'ON_DISPATCH' && <p className="text-[10px] text-emerald-400 font-bold">CLOSEST BACKUP</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
