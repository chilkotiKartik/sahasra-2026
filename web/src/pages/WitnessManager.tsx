import React, { useEffect, useState } from 'react';
import { Users, Plus, Loader2, Radio, EyeOff } from 'lucide-react';

const CASES = [{ id: 'case-001', label: 'KSP/2026/FIR-1042' }, { id: 'case-002', label: 'KSP/2026/CYBER-501' }, { id: 'case-003', label: 'MYS/2026/FIR-112' }];

// IO — Witness/Informant Management + cross-role field-intel inbox (Akka tips)
export const WitnessManager: React.FC = () => {
  const [caseId, setCaseId] = useState('case-001');
  const [witnesses, setWitnesses] = useState<any[]>([]);
  const [intel, setIntel] = useState<any[]>([]);
  const [form, setForm] = useState<any>({ name: '', kind: 'Witness', confidentiality: 'Standard', statementStatus: 'Pending', contact: '' });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = async (cid: string) => { setLoading(true); try {
    const [w, fi] = await Promise.all([fetch(`/api/catalyst/io/witnesses?caseId=${cid}`).then(r => r.json()), fetch('/api/catalyst/io/field-intel').then(r => r.json())]);
    if (w.success) setWitnesses(w.witnesses); if (fi.success) setIntel(fi.intel);
  } catch {} setLoading(false); };
  useEffect(() => { load(caseId); }, [caseId]);

  const add = async () => {
    setErr(null); if (!form.name.trim()) { setErr('Enter a name.'); return; }
    try { const r = await fetch('/api/catalyst/io/witnesses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ caseId, ...form }) }); const j = await r.json(); if (!j.success) throw new Error(j.message); setForm({ name: '', kind: 'Witness', confidentiality: 'Standard', statementStatus: 'Pending', contact: '' }); await load(caseId); } catch (e: any) { setErr(e.message); }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-navy-700 pb-4">
        <h1 className="text-2xl font-bold tracking-wide text-slate-100 uppercase font-outfit flex items-center gap-2"><Users className="w-7 h-7 text-amber-500" /> Witness / Informant Management</h1>
        <p className="text-sm text-slate-400">Contact log per case with statement status and confidentiality tier — plus incoming field tips from patrol officers.</p>
      </div>
      <div className="flex items-center gap-3">
        <label className="text-xs text-slate-400 uppercase font-bold">Case:</label>
        <select value={caseId} onChange={(e) => setCaseId(e.target.value)} className="px-3 py-2 bg-navy-900 border border-navy-700 rounded text-slate-100 text-xs">{CASES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="ops-card p-4 border border-navy-600 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" className="px-3 py-2 bg-navy-900 border border-navy-700 rounded text-slate-100 text-xs" />
              <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })} className="px-3 py-2 bg-navy-900 border border-navy-700 rounded text-slate-100 text-xs">{['Witness', 'Informant', 'Complainant'].map(k => <option key={k}>{k}</option>)}</select>
              <select value={form.confidentiality} onChange={(e) => setForm({ ...form, confidentiality: e.target.value })} className="px-3 py-2 bg-navy-900 border border-navy-700 rounded text-slate-100 text-xs">{['Standard', 'Restricted', 'Protected Identity'].map(k => <option key={k}>{k}</option>)}</select>
              <input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} placeholder="Contact" className="px-3 py-2 bg-navy-900 border border-navy-700 rounded text-slate-100 text-xs" />
            </div>
            {err && <p className="text-[11px] text-rose-400">{err}</p>}
            <button onClick={add} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-navy-950 text-xs font-bold uppercase rounded flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" /> Add contact</button>
          </div>
          {loading ? <Loader2 className="w-4 h-4 animate-spin text-slate-500" /> : witnesses.map((w) => (
            <div key={w.id} className="ops-card p-3 border border-navy-600">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-100 font-semibold flex items-center gap-2">{w.confidentiality !== 'Standard' && <EyeOff className="w-3.5 h-3.5 text-rose-400" />}{w.confidentiality === 'Protected Identity' ? '[Identity Protected]' : w.name}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-navy-900 border border-navy-700 text-slate-300">{w.kind}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Statement: {w.statementStatus} · {w.confidentiality} · {w.confidentiality === 'Protected Identity' ? '••••••' : w.contact}</p>
            </div>
          ))}
        </div>

        {/* CROSS-ROLE READ: community tips from Akka field officers */}
        <div className="ops-card p-4 border border-sky-600/40">
          <h3 className="text-xs font-bold uppercase text-sky-300 flex items-center gap-2 mb-2"><Radio className="w-4 h-4" /> Field Intel Inbox (from patrol officers)</h3>
          {intel.length === 0 ? <p className="text-xs text-slate-500 italic">No field tips yet.</p> : intel.map((f) => (
            <div key={f.id} className="p-2.5 bg-navy-950 rounded border border-navy-800 mb-2">
              <p className="text-xs text-slate-200">{f.text}</p>
              <p className="text-[10px] font-mono text-slate-500 mt-0.5">{f.kind} · {f.source} · {f.location} · {new Date(f.timestamp).toLocaleString('en-GB', { hour12: false })}</p>
            </div>
          ))}
          <p className="text-[10px] text-slate-500 mt-1">These are written by Akka Pade officers' Community Tip / Field Report screens — a real cross-role write.</p>
        </div>
      </div>
    </div>
  );
};
