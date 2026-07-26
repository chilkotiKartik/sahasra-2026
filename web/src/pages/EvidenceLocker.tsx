import React, { useEffect, useState } from 'react';
import { Package, Plus, ArrowRightLeft, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const CASES = [
  { id: 'case-001', label: 'KSP/2026/FIR-1042 — Peenya Burglary' },
  { id: 'case-002', label: 'KSP/2026/CYBER-501 — UPI Fraud' },
  { id: 'case-003', label: 'MYS/2026/FIR-112 — Chain Snatching' }
];

export const EvidenceLocker: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [caseId, setCaseId] = useState('case-001');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [type, setType] = useState('Physical');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async (cid: string) => {
    setLoading(true);
    try { const r = await fetch(`/api/catalyst/io/evidence?caseId=${cid}`); const j = await r.json(); if (j.success) setItems(j.items); } catch {}
    setLoading(false);
  };
  useEffect(() => { load(caseId); }, [caseId]);

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null);
    if (!name.trim()) { setError('Describe the evidence item before logging it in.'); return; }
    setBusy('add');
    try {
      const r = await fetch('/api/catalyst/io/evidence', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId, name, type, officer: user?.badgeNumber || 'IO-402' }) });
      const j = await r.json(); if (!j.success) throw new Error(j.message);
      setName(''); await load(caseId);
    } catch (e: any) { setError(e.message); }
    setBusy(null);
  };

  const transfer = async (itemId: string) => {
    const to = prompt('Transfer custody to (officer/lab):', 'FSL-Malleswaram');
    if (!to) return;
    setBusy(itemId);
    try {
      await fetch('/api/catalyst/io/evidence/transfer', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId, itemId, toOfficer: to, byOfficer: user?.badgeNumber || 'IO-402' }) });
      await load(caseId);
    } catch {}
    setBusy(null);
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-navy-700 pb-4">
        <h1 className="text-2xl font-bold tracking-wide text-slate-100 uppercase font-outfit flex items-center gap-2">
          <Package className="w-7 h-7 text-amber-500" /> Evidence Locker
        </h1>
        <p className="text-sm text-slate-400">Chain-of-custody log per evidence item, tied to a case. Every log-in and transfer is written to the SHA-256 audit ledger.</p>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-xs text-slate-400 uppercase font-bold">Case:</label>
        <select value={caseId} onChange={(e) => setCaseId(e.target.value)} className="px-3 py-2 bg-navy-900 border border-navy-700 rounded text-slate-100 text-xs">
          {CASES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
      </div>

      <form onSubmit={addItem} className="ops-card p-4 border border-navy-600 flex flex-col sm:flex-row gap-2 items-stretch sm:items-end">
        <div className="flex-1">
          <label className="block text-[10px] uppercase text-slate-400 mb-1">Evidence item</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Recovered mobile handset (IMEI…)" className="w-full px-3 py-2 bg-navy-900 border border-navy-700 rounded text-slate-100 text-xs" />
        </div>
        <select value={type} onChange={(e) => setType(e.target.value)} className="px-3 py-2 bg-navy-900 border border-navy-700 rounded text-slate-100 text-xs">
          {['Physical', 'Document', 'Digital', 'Biological', 'Weapon'].map((t) => <option key={t}>{t}</option>)}
        </select>
        <button type="submit" disabled={busy === 'add'} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-navy-950 text-xs font-bold uppercase rounded flex items-center gap-1.5 justify-center">
          {busy === 'add' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Log In
        </button>
      </form>
      {error && <p className="text-[11px] text-rose-400 -mt-3">{error}</p>}

      {loading ? (
        <div className="text-slate-500 text-sm flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading locker…</div>
      ) : (
        <div className="space-y-3">
          {items.length === 0 && <p className="text-xs text-slate-500 italic">No evidence logged for this case yet.</p>}
          {items.map((it) => (
            <div key={it.id} className="ops-card p-4 border border-navy-600">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-amber-400 font-bold">{it.id}</span>
                    <span className="text-sm text-slate-100 font-semibold">{it.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-navy-900 border border-navy-700 text-slate-300">{it.type}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">Current holder: <span className="text-slate-200 font-mono">{it.custody[it.custody.length - 1].officer}</span> · {it.status}</p>
                </div>
                <button onClick={() => transfer(it.id)} disabled={busy === it.id} className="px-3 py-1.5 bg-navy-800 border border-navy-600 text-slate-200 text-[11px] font-bold rounded flex items-center gap-1.5">
                  {busy === it.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowRightLeft className="w-3 h-3" />} Transfer custody
                </button>
              </div>
              <div className="mt-3 border-t border-navy-800 pt-2 space-y-1">
                <p className="text-[10px] uppercase text-slate-500 font-bold">Chain of custody</p>
                {it.custody.map((c: any, i: number) => (
                  <p key={i} className="text-[11px] font-mono text-slate-400">
                    <span className={c.action === 'TRANSFERRED' ? 'text-sky-400' : 'text-emerald-400'}>{c.action}</span> · {c.officer} · {new Date(c.timestamp).toLocaleString('en-GB', { hour12: false })}{c.note ? ` — ${c.note}` : ''}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="text-[11px] text-slate-500 font-mono border-t border-navy-800 pt-3">
        Interlink: custody events appear in the <button onClick={() => navigate('/governance')} className="text-amber-400 underline">Governance audit ledger</button>.
      </div>
    </div>
  );
};
