import React, { useState } from 'react';
import { Siren, Loader2, CheckCircle2, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// AKKA feature — Panic/SOS Quick Trigger. One tap → real CRITICAL alert on
// Command Center + pushed to every dashboard's live bell (real interlink).
export const PanicSOS: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [note, setNote] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [result, setResult] = useState<any | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const trigger = async () => {
    setState('sending');
    // best-effort real geolocation (non-blocking)
    let lat: number | undefined, lng: number | undefined;
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 2500 }));
      lat = pos.coords.latitude; lng = pos.coords.longitude;
      setCoords({ lat, lng });
    } catch { /* location optional */ }
    try {
      const r = await fetch('/api/catalyst/akka/panic', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ officerId: user?.badgeNumber || 'AKKA-55', lat, lng, note: note.trim() || undefined })
      });
      setResult(await r.json());
      setState('sent');
    } catch { setState('idle'); }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-navy-700 pb-4">
        <h1 className="text-2xl font-bold tracking-wide text-slate-100 uppercase font-outfit flex items-center gap-2">
          <Siren className="w-7 h-7 text-rose-500" /> Panic / SOS
        </h1>
        <p className="text-sm text-slate-400">One tap raises an immediate officer-safety alert — it appears on the District SP's Command Center and pushes to every on-duty dashboard instantly.</p>
      </div>

      <div className="max-w-md mx-auto ops-card p-8 border border-rose-600/40 flex flex-col items-center gap-5">
        {state !== 'sent' ? (
          <>
            <button
              onClick={trigger}
              disabled={state === 'sending'}
              className="w-44 h-44 rounded-full bg-gradient-to-br from-rose-600 to-rose-800 hover:from-rose-500 hover:to-rose-700 text-white font-extrabold text-xl uppercase tracking-wider shadow-2xl border-4 border-rose-400/50 flex flex-col items-center justify-center gap-2 transition-transform active:scale-95"
            >
              {state === 'sending' ? <Loader2 className="w-10 h-10 animate-spin" /> : <Siren className="w-12 h-12" />}
              <span>{state === 'sending' ? 'Sending…' : 'SOS'}</span>
            </button>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional: nature of emergency…"
              className="w-full px-3 py-2 bg-navy-900 border border-navy-700 rounded-lg text-slate-100 text-xs text-center focus:outline-none focus:border-rose-500" />
            <p className="text-[11px] text-slate-500 text-center">Your live location is attached automatically if permitted.</p>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 text-center">
            <CheckCircle2 className="w-16 h-16 text-emerald-400" />
            <p className="text-sm font-bold text-emerald-300">Backup is on the way — hold tight, {user?.name || 'Officer'}.</p>
            <p className="text-xs text-slate-400">Your SOS is now the top item on the District SP's Command Center and every duty dashboard's alert bell.</p>
            {coords && <p className="text-[10px] font-mono text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}</p>}
            {result?.alert && (
              <p className="text-[10px] font-mono text-slate-500">alert id {result.alert.id} · {result.alert.severity}</p>
            )}
            <button onClick={() => { setState('idle'); setResult(null); }} className="mt-2 text-xs text-slate-400 underline">Reset</button>
          </div>
        )}
      </div>

      <div className="text-[11px] text-slate-500 font-mono border-t border-navy-800 pt-3 text-center">
        Real interlink: verify it landed on <button onClick={() => navigate('/command-center')} className="text-amber-400 underline">Command Center</button> — same alerts table, same live WebSocket bus.
      </div>
    </div>
  );
};
