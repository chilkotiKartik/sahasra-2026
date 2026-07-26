import React, { useEffect, useState } from 'react';
import { BookText, Plus, Loader2, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// IO feature — Digital Case Diary (append-only, timestamped, per case).
const CASES = [
  { id: 'case-001', label: 'KSP/2026/FIR-1042 — Peenya Burglary' },
  { id: 'case-002', label: 'KSP/2026/CYBER-501 — UPI Fraud' },
  { id: 'case-003', label: 'MYS/2026/FIR-112 — Chain Snatching' }
];

export const CaseDiary: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [caseId, setCaseId] = useState('case-001');
  const [entries, setEntries] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async (cid: string) => {
    setLoading(true);
    try { const r = await fetch(`/api/catalyst/io/case-diary?caseId=${cid}`); const j = await r.json(); if (j.success) setEntries(j.entries); } catch {}
    setLoading(false);
  };
  useEffect(() => { load(caseId); }, [caseId]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (text.trim().length < 5) { setError('Diary entry must be at least 5 characters — describe the action taken.'); return; }
    setSaving(true);
    try {
      const r = await fetch('/api/catalyst/io/case-diary', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId, officerId: user?.badgeNumber || 'IO-402', entry: text.trim() })
      });
      const j = await r.json();
      if (!j.success) throw new Error(j.message || 'Could not save entry');
      setText('');
      await load(caseId);
    } catch (e: any) { setError(e.message); }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-navy-700 pb-4">
        <h1 className="text-2xl font-bold tracking-wide text-slate-100 uppercase font-outfit flex items-center gap-2">
          <BookText className="w-7 h-7 text-amber-500" /> Digital Case Diary
        </h1>
        <p className="text-sm text-slate-400">Append-only, timestamped investigation diary per case — the legal case-diary record. Entries cannot be edited or deleted.</p>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-xs text-slate-400 uppercase font-bold">Case:</label>
        <select value={caseId} onChange={(e) => setCaseId(e.target.value)} className="px-3 py-2 bg-navy-900 border border-navy-700 rounded text-slate-100 text-xs">
          {CASES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
        <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1"><Lock className="w-3 h-3" /> append-only</span>
      </div>

      <form onSubmit={add} className="ops-card p-4 border border-navy-600 space-y-2">
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3}
          placeholder="Record today's investigative action (scene visit, seizure, statement recorded, forensic request)…"
          className="w-full px-3 py-2 bg-navy-900 border border-navy-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-amber-500" />
        {error && <p className="text-[11px] text-rose-400">{error}</p>}
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-slate-500 font-mono">signed as {user?.badgeNumber || 'IO-402'} · {new Date().toLocaleDateString('en-GB')}</span>
          <button type="submit" disabled={saving} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-navy-950 text-xs font-bold uppercase rounded-lg flex items-center gap-1.5">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Append Entry
          </button>
        </div>
      </form>

      <div className="ops-card border border-navy-600 rounded-xl overflow-hidden">
        <div className="p-3 border-b border-navy-800 text-xs font-bold uppercase text-slate-300">Diary Timeline ({entries.length})</div>
        {loading ? (
          <div className="p-6 text-center text-slate-500 text-sm flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
        ) : entries.length === 0 ? (
          <p className="p-6 text-center text-slate-500 text-xs">No diary entries yet for this case. Add the first investigative action above.</p>
        ) : (
          <ol className="relative">
            {entries.map((en, i) => (
              <li key={en.id} className="p-4 border-b border-navy-900 flex gap-3">
                <div className="flex flex-col items-center">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  {i < entries.length - 1 && <span className="flex-1 w-px bg-navy-700 mt-1" />}
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-200 leading-relaxed">{en.entry}</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-1">{en.officerId} · {new Date(en.timestamp).toLocaleString('en-GB', { hour12: false })}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="text-[11px] text-slate-500 font-mono border-t border-navy-800 pt-3">
        Interlink: entries are audit-logged and the case opens in <button onClick={() => navigate('/case-explorer')} className="text-amber-400 underline">Case Explorer</button>.
      </div>
    </div>
  );
};
