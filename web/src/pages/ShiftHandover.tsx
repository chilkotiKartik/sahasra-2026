import React, { useEffect, useState } from 'react';
import { ClipboardList, Plus, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// AKKA — Shift Handover Notes (passed between shifts on the same beat)
export const ShiftHandover: React.FC = () => {
  const { user } = useAuth();
  const beat = 'Peenya';
  const [notes, setNotes] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => { setLoading(true); try { const r = await fetch(`/api/catalyst/akka/handover?beat=${beat}`); const j = await r.json(); if (j.success) setNotes(j.notes); } catch {} setLoading(false); };
  useEffect(() => { load(); }, []);

  const add = async () => {
    setErr(null); if (text.trim().length < 5) { setErr('Write a handover note (min 5 chars).'); return; }
    setSaving(true);
    try { const r = await fetch('/api/catalyst/akka/handover', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ beat, fromOfficer: user?.badgeNumber || 'AKKA-55', toOfficer: 'next shift', note: text.trim() }) }); const j = await r.json(); if (!j.success) throw new Error(j.message); setText(''); await load(); } catch (e: any) { setErr(e.message); }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-navy-700 pb-4">
        <h1 className="text-2xl font-bold tracking-wide text-slate-100 uppercase font-outfit flex items-center gap-2"><ClipboardList className="w-7 h-7 text-amber-500" /> Shift Handover Notes</h1>
        <p className="text-sm text-slate-400">Structured notes passed to the next officer on the <b>{beat}</b> beat.</p>
      </div>
      <div className="ops-card p-4 border border-navy-600 space-y-2">
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder="What should the next shift know? (open cases, hazards, watch areas)…" className="w-full px-3 py-2 bg-navy-900 border border-navy-700 rounded text-slate-100 text-sm" />
        {err && <p className="text-[11px] text-rose-400">{err}</p>}
        <button onClick={add} disabled={saving} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-navy-950 text-xs font-bold uppercase rounded flex items-center gap-1.5">{saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Pass to next shift</button>
      </div>
      {loading ? <div className="text-slate-500 text-sm flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div> : (
        <div className="space-y-2">
          {notes.map((n) => (
            <div key={n.id} className="ops-card p-3 border border-navy-600">
              <p className="text-xs text-slate-200">{n.note}</p>
              <p className="text-[10px] font-mono text-slate-500 mt-1">{n.fromOfficer} → {n.toOfficer} · {new Date(n.timestamp).toLocaleString('en-GB', { hour12: false })}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
