import React, { useEffect, useState } from 'react';
import { NotebookPen, Plus, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const TARGETS = [
  { id: 'case-001', label: 'Case KSP/2026/FIR-1042' },
  { id: 'case-003', label: 'Case MYS/2026/FIR-112' },
  { id: 'network:gang-a', label: 'Network view: Peenya crew' }
];

// ANALYST — Annotation & Hypothesis Notebook (private, timestamped, versioned)
export const AnnotationNotebook: React.FC = () => {
  const { user } = useAuth();
  const [target, setTarget] = useState('case-001');
  const [notes, setNotes] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async (t: string) => { setLoading(true); try { const r = await fetch(`/api/catalyst/analyst/annotations?target=${encodeURIComponent(t)}`); const j = await r.json(); if (j.success) setNotes(j.notes); } catch {} setLoading(false); };
  useEffect(() => { load(target); }, [target]);

  const add = async () => {
    if (!text.trim()) return; setSaving(true);
    try { await fetch('/api/catalyst/analyst/annotations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ target, text: text.trim(), author: user?.badgeNumber || 'ANALYST-104' }) }); setText(''); await load(target); } catch {}
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-navy-700 pb-4">
        <h1 className="text-2xl font-bold tracking-wide text-slate-100 uppercase font-outfit flex items-center gap-2"><NotebookPen className="w-7 h-7 text-amber-500" /> Annotation & Hypothesis Notebook</h1>
        <p className="text-sm text-slate-400">Your private, versioned working notes attached to any case or network view — separate from the official case record.</p>
      </div>
      <div className="flex items-center gap-3">
        <label className="text-xs text-slate-400 uppercase font-bold">Attach to:</label>
        <select value={target} onChange={(e) => setTarget(e.target.value)} className="px-3 py-2 bg-navy-900 border border-navy-700 rounded text-slate-100 text-xs">{TARGETS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}</select>
      </div>
      <div className="ops-card p-4 border border-navy-600 space-y-2">
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder="Working hypothesis / observation (versioned)…" className="w-full px-3 py-2 bg-navy-900 border border-navy-700 rounded text-slate-100 text-sm" />
        <button onClick={add} disabled={saving} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-navy-950 text-xs font-bold uppercase rounded flex items-center gap-1.5">{saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Add note (v{notes.length + 1})</button>
      </div>
      {loading ? <div className="text-slate-500 text-sm flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div> : (
        <div className="space-y-2">
          {notes.length === 0 && <p className="text-xs text-slate-500 italic">No notes yet for this target.</p>}
          {notes.map((n) => (
            <div key={n.id} className="ops-card p-3 border border-navy-600">
              <div className="flex justify-between"><span className="text-[10px] font-mono text-amber-400">v{n.version}</span><span className="text-[10px] font-mono text-slate-500">{n.author} · {new Date(n.timestamp).toLocaleString('en-GB', { hour12: false })}</span></div>
              <p className="text-xs text-slate-200 mt-1">{n.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
