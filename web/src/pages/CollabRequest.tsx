import React, { useEffect, useState } from 'react';
import { Handshake, Send, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// IO — Collaboration Request (IO → IO, real cross-officer notification via WS)
export const CollabRequest: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [form, setForm] = useState<any>({ toOfficer: 'IO-511', caseRef: 'KSP/2026/FIR-1042', reason: '' });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const load = async () => { setLoading(true); try { const r = await fetch('/api/catalyst/io/collab'); const j = await r.json(); if (j.success) setRequests(j.requests); } catch {} setLoading(false); };
  useEffect(() => { load(); }, []);

  const send = async () => {
    setErr(null); setSent(false); if (!form.reason.trim()) { setErr('Describe why you need to collaborate.'); return; }
    try { const r = await fetch('/api/catalyst/io/collab', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fromOfficer: user?.badgeNumber || 'IO-402', ...form }) }); const j = await r.json(); if (!j.success) throw new Error(j.message); setForm({ ...form, reason: '' }); setSent(true); await load(); } catch (e: any) { setErr(e.message); }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-navy-700 pb-4">
        <h1 className="text-2xl font-bold tracking-wide text-slate-100 uppercase font-outfit flex items-center gap-2"><Handshake className="w-7 h-7 text-amber-500" /> Collaboration Request</h1>
        <p className="text-sm text-slate-400">Ping another IO when you suspect a shared MO or suspect — writes a real cross-officer notification (also pushed to the live alert bell).</p>
      </div>
      <div className="ops-card p-4 border border-navy-600 space-y-2 max-w-xl">
        <div className="grid grid-cols-2 gap-2">
          <input value={form.toOfficer} onChange={(e) => setForm({ ...form, toOfficer: e.target.value })} placeholder="To officer (badge)" className="px-3 py-2 bg-navy-900 border border-navy-700 rounded text-slate-100 text-xs" />
          <input value={form.caseRef} onChange={(e) => setForm({ ...form, caseRef: e.target.value })} placeholder="Case ref" className="px-3 py-2 bg-navy-900 border border-navy-700 rounded text-slate-100 text-xs font-mono" />
        </div>
        <textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} rows={2} placeholder="Reason (shared MO / suspect / vehicle)…" className="w-full px-3 py-2 bg-navy-900 border border-navy-700 rounded text-slate-100 text-sm" />
        {err && <p className="text-[11px] text-rose-400">{err}</p>}
        {sent && <p className="text-[11px] text-emerald-400">Request sent — it's now on the recipient's notifications and the live bell.</p>}
        <button onClick={send} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-navy-950 text-xs font-bold uppercase rounded flex items-center gap-1.5"><Send className="w-3.5 h-3.5" /> Send request</button>
      </div>
      {loading ? <Loader2 className="w-4 h-4 animate-spin text-slate-500" /> : (
        <div className="space-y-2">
          <p className="text-[10px] uppercase text-slate-500">Open collaboration requests ({requests.length})</p>
          {requests.map((c) => (
            <div key={c.id} className="ops-card p-3 border border-navy-600 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-200"><span className="font-mono text-amber-400">{c.fromOfficer}</span> → <span className="font-mono">{c.toOfficer}</span> · {c.caseRef}</p>
                <p className="text-[11px] text-slate-400">{c.reason}</p>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-700">{c.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
