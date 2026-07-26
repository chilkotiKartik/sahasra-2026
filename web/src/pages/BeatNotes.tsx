import React, { useEffect, useState } from 'react';
import { MapPin, Plus, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// IO — Neighborhood Beat Notes (location-tied, visible to same-jurisdiction IOs)
export const BeatNotes: React.FC = () => {
  const { user } = useAuth();
  const jurisdiction = user?.district || 'Bengaluru Urban';
  const [notes, setNotes] = useState<any[]>([]);
  const [location, setLocation] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => { setLoading(true); try { const r = await fetch(`/api/catalyst/io/beat-notes?jurisdiction=${encodeURIComponent(jurisdiction)}`); const j = await r.json(); if (j.success) setNotes(j.notes); } catch {} setLoading(false); };
  useEffect(() => { load(); }, []);

  const add = async () => {
    setErr(null); if (!note.trim() || !location.trim()) { setErr('Enter both a location and a note.'); return; }
    try { const r = await fetch('/api/catalyst/io/beat-notes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jurisdiction, location: location.trim(), note: note.trim(), author: user?.badgeNumber || 'IO-402' }) }); const j = await r.json(); if (!j.success) throw new Error(j.message); setNote(''); setLocation(''); await load(); } catch (e: any) { setErr(e.message); }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-navy-700 pb-4">
        <h1 className="text-2xl font-bold tracking-wide text-slate-100 uppercase font-outfit flex items-center gap-2"><MapPin className="w-7 h-7 text-amber-500" /> Neighborhood Beat Notes</h1>
        <p className="text-sm text-slate-400">Local-intelligence notes tied to a location — shared with other IOs in <b>{jurisdiction}</b> only.</p>
      </div>
      <div className="ops-card p-4 border border-navy-600 space-y-2">
        <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location (e.g. Peenya 4th Block cross-road)" className="w-full px-3 py-2 bg-navy-900 border border-navy-700 rounded text-slate-100 text-sm" />
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Local intelligence note…" className="w-full px-3 py-2 bg-navy-900 border border-navy-700 rounded text-slate-100 text-sm" />
        {err && <p className="text-[11px] text-rose-400">{err}</p>}
        <button onClick={add} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-navy-950 text-xs font-bold uppercase rounded flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" /> Add beat note</button>
      </div>
      {loading ? <Loader2 className="w-4 h-4 animate-spin text-slate-500" /> : (
        <div className="space-y-2">
          {notes.map((n) => (
            <div key={n.id} className="ops-card p-3 border border-navy-600">
              <p className="text-xs text-amber-400 font-mono font-bold flex items-center gap-1"><MapPin className="w-3 h-3" /> {n.location}</p>
              <p className="text-xs text-slate-200 mt-1">{n.note}</p>
              <p className="text-[10px] font-mono text-slate-500 mt-0.5">{n.author} · {new Date(n.timestamp).toLocaleString('en-GB', { hour12: false })}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
