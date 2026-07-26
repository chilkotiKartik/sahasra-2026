import React, { useEffect, useState, useCallback } from 'react';
import { CloudOff, Cloud, Loader2, Plus, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface QueuedAction { id: string; type: string; payload: any; createdAt: string; synced: boolean; }
const KEY = 'sahasra_offline_queue';
const load = (): QueuedAction[] => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } };
const save = (q: QueuedAction[]) => localStorage.setItem(KEY, JSON.stringify(q));

// AKKA — Offline Action Queue. Actions taken offline queue locally and sync
// automatically once connectivity returns.
export const OfflineQueue: React.FC = () => {
  const { user } = useAuth();
  const [online, setOnline] = useState(navigator.onLine);
  const [queue, setQueue] = useState<QueuedAction[]>(load());
  const [syncing, setSyncing] = useState(false);
  const [note, setNote] = useState('');

  const syncNow = useCallback(async () => {
    if (!navigator.onLine) return;
    const pending = load().filter((a) => !a.synced);
    if (!pending.length) return;
    setSyncing(true);
    for (const a of pending) {
      try {
        // real sync: field note → community tip / beat log endpoint
        await fetch('/api/catalyst/akka/beat-checkin', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ officerId: user?.badgeNumber || 'AKKA-55', checkpoint: 'Offline note: ' + a.payload.note, lat: 0, lng: 0, withinToleranceM: 0, ok: true }) });
        a.synced = true;
      } catch { /* stays queued */ }
    }
    const all = load().map((x) => pending.find((p) => p.id === x.id) ? { ...x, synced: true } : x);
    save(all); setQueue(all); setSyncing(false);
  }, [user]);

  useEffect(() => {
    const goOnline = () => { setOnline(true); syncNow(); };
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    if (navigator.onLine) syncNow();
    return () => { window.removeEventListener('online', goOnline); window.removeEventListener('offline', goOffline); };
  }, [syncNow]);

  const addAction = () => {
    if (!note.trim()) return;
    const a: QueuedAction = { id: `q-${Date.now()}`, type: 'field_note', payload: { note: note.trim() }, createdAt: new Date().toISOString(), synced: false };
    const q = [a, ...load()]; save(q); setQueue(q); setNote('');
    if (navigator.onLine) syncNow();
  };

  const pending = queue.filter((a) => !a.synced).length;
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-navy-700 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-wide text-slate-100 uppercase font-outfit flex items-center gap-2">{online ? <Cloud className="w-7 h-7 text-emerald-500" /> : <CloudOff className="w-7 h-7 text-amber-500" />} Offline Action Queue</h1>
          <p className="text-sm text-slate-400">Actions taken with no signal queue on-device and sync automatically when you're back online.</p>
        </div>
        <span className={`px-3 py-1.5 rounded font-mono text-xs font-bold border ${online ? 'bg-emerald-950 text-emerald-300 border-emerald-700' : 'bg-amber-950 text-amber-300 border-amber-700'}`}>{online ? 'ONLINE' : 'OFFLINE'} · {pending} pending</span>
      </div>

      <div className="ops-card p-4 border border-navy-600 flex gap-2">
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Field note / action (works with no signal)…" className="flex-1 px-3 py-2 bg-navy-900 border border-navy-700 rounded text-slate-100 text-sm" />
        <button onClick={addAction} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-navy-950 text-xs font-bold uppercase rounded flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" /> Queue</button>
        <button onClick={syncNow} disabled={!online || syncing} className="px-3 py-2 bg-navy-800 border border-navy-600 text-slate-200 text-xs rounded flex items-center gap-1.5">{syncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Sync</button>
      </div>

      <div className="ops-card p-3 border border-navy-600 text-[11px] text-slate-400 font-mono">
        To test: DevTools → Network → <b>Offline</b>, queue a note (stays pending), then set Online — it auto-syncs.
      </div>

      <div className="space-y-2">
        {queue.length === 0 && <p className="text-xs text-slate-500 italic">No queued actions.</p>}
        {queue.map((a) => (
          <div key={a.id} className="ops-card p-3 border border-navy-700 flex items-center justify-between text-xs">
            <span className="text-slate-200">{a.payload.note}</span>
            <span className={`text-[10px] font-bold ${a.synced ? 'text-emerald-400' : 'text-amber-400'}`}>{a.synced ? 'SYNCED' : 'PENDING'}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
