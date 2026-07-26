import React, { useEffect, useState } from 'react';
import { Fingerprint, RefreshCw, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ANALYST — Behavioral Pattern Profiler (clusters cases into named MO signatures)
export const PatternProfiler: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const load = async () => { setLoading(true); try { const r = await fetch('/api/catalyst/analyst/signatures'); const j = await r.json(); if (j.success) setData(j); } catch {} setLoading(false); };
  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-navy-700 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-wide text-slate-100 uppercase font-outfit flex items-center gap-2"><Fingerprint className="w-7 h-7 text-amber-500" /> Behavioral Pattern Profiler</h1>
          <p className="text-sm text-slate-400">Groups cases by modus-operandi narrative similarity into named behavioral signatures — this <b>clusters</b>, the MO Search <b>looks up</b>.</p>
        </div>
        <button onClick={load} className="px-3 py-1.5 bg-navy-800 border border-navy-600 rounded text-slate-200 text-xs font-bold flex items-center gap-1.5"><RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Recompute</button>
      </div>
      {loading ? <div className="text-slate-500 text-sm flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Clustering…</div> : data && (
        <>
          <p className="text-[11px] font-mono text-slate-500">{data.model} · {data.signatureCount} signatures</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.signatures.map((s: any) => (
              <div key={s.id} className={`ops-card p-4 border ${s.caseCount > 1 ? 'border-amber-500/50' : 'border-navy-600'}`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-100 text-sm">{s.name}</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${s.caseCount > 1 ? 'bg-amber-950 text-amber-300 border border-amber-700' : 'bg-navy-900 text-slate-400 border border-navy-700'}`}>{s.caseCount} case{s.caseCount > 1 ? 's' : ''}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Signature terms: {s.signatureTerms.join(', ')} · districts: {s.districts.join(', ')}</p>
                <div className="mt-2 space-y-1">
                  {s.cases.map((c: any) => (
                    <p key={c.case_number} className="text-[11px] text-slate-300"><span className="font-mono text-amber-400">{c.case_number}</span> — {c.description.slice(0, 60)}…</p>
                  ))}
                </div>
                {s.caseCount > 1 && <p className="text-[11px] text-amber-200/80 mt-2">These {s.caseCount} cases share a common method of operation — likely the same crew or copycat pattern.</p>}
              </div>
            ))}
          </div>
          <p className="text-[10px] text-slate-500 italic">Note: with only {data.signatures.reduce((n: number, s: any) => n + s.caseCount, 0)} seeded cases most signatures are thin; on the full KSP corpus these clusters grow substantially.</p>
          <div className="text-[11px] text-slate-500 font-mono border-t border-navy-800 pt-3">Interlink: signatures feed the <button onClick={() => navigate('/series-builder')} className="text-amber-400 underline">Crime Series Builder</button> and <button onClick={() => navigate('/network-graph')} className="text-amber-400 underline">Network Graph</button>.</div>
        </>
      )}
    </div>
  );
};
