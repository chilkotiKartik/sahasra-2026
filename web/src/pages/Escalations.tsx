import React, { useEffect, useState } from 'react';
import { GitBranch, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// SP Feature #13 — Cross-District Escalation Approval (approve/deny IO requests)
export const Escalations: React.FC = () => {
  const navigate = useNavigate();
  const [reqs, setReqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/sp/cross-district-requests?targetDistrict=Bengaluru%20Urban');
      const j = await r.json();
      setReqs(Array.isArray(j) ? j : j.requests || []);
    } catch {}
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const respond = async (id: string, decision: 'Approved' | 'Denied') => {
    setActing(id);
    try {
      await fetch('/api/sp/cross-district-response', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: id, status: decision })
      });
      await load();
    } catch {}
    setActing(null);
  };

  const pending = reqs.filter((r) => r.status === 'Pending');
  const decided = reqs.filter((r) => r.status !== 'Pending');

  return (
    <div className="space-y-6">
      <div className="border-b border-navy-700 pb-4">
        <h1 className="text-2xl font-bold tracking-wide text-slate-100 uppercase font-outfit flex items-center gap-2">
          <GitBranch className="w-7 h-7 text-amber-500" /> Cross-District Escalation Approval
        </h1>
        <p className="text-sm text-slate-400">Approve or deny real cross-district intelligence-access requests raised by Investigating Officers — every decision is written to the SHA-256 audit ledger</p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-slate-400 text-sm"><Loader2 className="w-5 h-5 animate-spin" /> Loading requests…</div>
      ) : (
        <>
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase text-amber-400">Pending ({pending.length})</h3>
            {pending.length === 0 && <p className="text-xs text-slate-500 italic">No pending cross-district requests.</p>}
            {pending.map((r) => (
              <div key={r.id} className="ops-card p-4 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-amber-400 font-bold">{r.firNumber}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-navy-900 border border-navy-700 text-slate-300">from {r.requestingOfficerId}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {r.requestingDistrict} → <span className="text-slate-200 font-bold">{r.targetDistrict}</span> · case {r.caseId} · {new Date(r.timestamp).toLocaleString('en-GB', { hour12: false })}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button disabled={acting === r.id} onClick={() => respond(r.id, 'Approved')} className="px-3 py-2 bg-emerald-950/60 border border-emerald-600/50 text-emerald-300 text-xs font-bold uppercase rounded-lg flex items-center gap-1.5">
                    {acting === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} Approve
                  </button>
                  <button disabled={acting === r.id} onClick={() => respond(r.id, 'Denied')} className="px-3 py-2 bg-rose-950/60 border border-rose-600/50 text-rose-300 text-xs font-bold uppercase rounded-lg flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5" /> Deny
                  </button>
                </div>
              </div>
            ))}
          </div>

          {decided.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase text-slate-400">Decided ({decided.length})</h3>
              {decided.map((r) => (
                <div key={r.id} className="ops-card p-3 border border-navy-700 flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-300">{r.firNumber} · {r.requestingDistrict}</span>
                  <span className={`font-bold ${r.status === 'Approved' ? 'text-emerald-400' : 'text-rose-400'}`}>{r.status}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <div className="text-[11px] text-slate-500 font-mono border-t border-navy-800 pt-3">
        Interlink: decisions appear in the <button onClick={() => navigate('/governance')} className="text-amber-400 underline">Governance audit ledger</button>; source cases open in <button onClick={() => navigate('/case-explorer')} className="text-amber-400 underline">Case Explorer</button>.
      </div>
    </div>
  );
};
