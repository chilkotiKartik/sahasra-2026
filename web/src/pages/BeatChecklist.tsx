import React, { useEffect, useState } from 'react';
import { CheckSquare, MapPin, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// AKKA — Live Beat Checklist. Check-in at each checkpoint requires real device
// geolocation within tolerance of the checkpoint's coordinates.
const CHECKPOINTS = [
  { id: 'cp1', name: 'Peenya 4th Block Junction', lat: 13.0310, lng: 77.5300 },
  { id: 'cp2', name: 'Peenya Metro Gate', lat: 13.0355, lng: 77.5400 },
  { id: 'cp3', name: 'Peenya Warehouse Row', lat: 13.0380, lng: 77.5500 }
];
const TOLERANCE_M = 250;
function haversine(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371000, dLat = (bLat - aLat) * Math.PI / 180, dLng = (bLng - aLng) * Math.PI / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(aLat * Math.PI / 180) * Math.cos(bLat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export const BeatChecklist: React.FC = () => {
  const { user } = useAuth();
  const [done, setDone] = useState<Record<string, any>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => { (async () => { try { const r = await fetch(`/api/catalyst/akka/beat-checkins?officerId=${user?.badgeNumber || 'AKKA-55'}`); const j = await r.json(); const map: any = {}; (j.checkins || []).forEach((c: any) => { if (c.ok) map[c.checkpoint] = c; }); setDone(map); } catch {} })(); }, [user]);

  const checkIn = async (cp: typeof CHECKPOINTS[0]) => {
    setBusy(cp.id); setMsg(null);
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true, timeout: 4000 }));
      const dist = Math.round(haversine(pos.coords.latitude, pos.coords.longitude, cp.lat, cp.lng));
      const ok = dist <= TOLERANCE_M;
      const r = await fetch('/api/catalyst/akka/beat-checkin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ officerId: user?.badgeNumber || 'AKKA-55', checkpoint: cp.name, lat: pos.coords.latitude, lng: pos.coords.longitude, withinToleranceM: dist, ok }) });
      const j = await r.json();
      if (ok) { setDone((d) => ({ ...d, [cp.name]: j.checkin })); setMsg(`Checked in at ${cp.name} — ${dist} m from checkpoint.`); }
      else setMsg(`You're ${dist} m from ${cp.name} (tolerance ${TOLERANCE_M} m) — move closer to check in.`);
    } catch (e: any) {
      setMsg(e?.code === 1 ? 'Location permission denied — enable GPS to check in.' : 'Could not read device location.');
    }
    setBusy(null);
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-navy-700 pb-4">
        <h1 className="text-2xl font-bold tracking-wide text-slate-100 uppercase font-outfit flex items-center gap-2"><CheckSquare className="w-7 h-7 text-amber-500" /> Live Beat Checklist</h1>
        <p className="text-sm text-slate-400">Check in at each checkpoint — your real device GPS must be within {TOLERANCE_M} m of the point.</p>
      </div>
      {msg && <div className="ops-card p-3 border border-navy-600 text-xs text-slate-300">{msg}</div>}
      <div className="space-y-3">
        {CHECKPOINTS.map((cp) => {
          const ok = !!done[cp.name];
          return (
            <div key={cp.id} className={`ops-card p-4 border flex items-center justify-between ${ok ? 'border-emerald-600/50 bg-emerald-950/10' : 'border-navy-600'}`}>
              <div className="flex items-center gap-3">
                {ok ? <CheckCircle2 className="w-6 h-6 text-emerald-400" /> : <MapPin className="w-6 h-6 text-slate-500" />}
                <div>
                  <p className="font-bold text-slate-100 text-sm">{cp.name}</p>
                  <p className="text-[10px] font-mono text-slate-500">{cp.lat.toFixed(4)}, {cp.lng.toFixed(4)}{ok ? ` · checked in ${done[cp.name].withinToleranceM}m` : ''}</p>
                </div>
              </div>
              {ok ? <span className="text-[10px] font-bold text-emerald-400">DONE</span> : (
                <button onClick={() => checkIn(cp)} disabled={busy === cp.id} className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-navy-950 text-xs font-bold uppercase rounded flex items-center gap-1.5">
                  {busy === cp.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5" />} Check in
                </button>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-slate-500">{Object.keys(done).length}/{CHECKPOINTS.length} checkpoints completed this shift.</p>
    </div>
  );
};
