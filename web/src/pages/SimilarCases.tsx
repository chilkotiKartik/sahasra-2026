import React, { useEffect, useState } from 'react';
import { CopyCheck, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// "Cases like this" recommender — TF-IDF nearest cases to a chosen case.
export const SimilarCases: React.FC = () => {
  const navigate = useNavigate();
  const [cases, setCases] = useState<any[]>([]);
  const [cn, setCn] = useState('');
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { const j = await fetch('/api/catalyst/cases?limit=100').then((r) => r.json()); if (j.success) { setCases(j.cases); setCn(j.cases[0]?.case_number || ''); } } catch {}
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!cn) return;
    (async () => { const j = await fetch(`/api/catalyst/cases/similar?caseNumber=${encodeURIComponent(cn)}`).then((r) => r.json()); if (j.success) setData(j); })();
  }, [cn]);

  const target = cases.find((c) => c.case_number === cn);

  return (
    <div className="space-y-6">
      <div className="border-b border-navy-700 pb-4">
        <h1 className="text-2xl font-bold tracking-wide text-slate-100 uppercase font-outfit flex items-center gap-2"><CopyCheck className="w-7 h-7 text-amber-500" /> Cases Like This</h1>
        <p className="text-sm text-slate-400">Given a case, surface the most similar cases by modus operandi (TF-IDF) — candidates worth linking.</p>
      </div>
      {loading ? <div className="text-slate-500 text-sm flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div> : (
        <>
          <div className="flex items-center gap-3">
            <label className="text-xs text-slate-400 uppercase font-bold">Reference case:</label>
            <select value={cn} onChange={(e) => setCn(e.target.value)} className="px-3 py-2 bg-navy-900 border border-navy-700 rounded text-slate-100 text-xs font-mono">
              {cases.map((c) => <option key={c.id} value={c.case_number}>{c.case_number} — {c.crime_type}</option>)}
            </select>
          </div>
          {target && <div className="ops-card p-3 border border-navy-600 text-xs text-slate-300"><b className="text-amber-400 font-mono">{target.case_number}</b> — {target.description}</div>}
          <div className="space-y-3">
            <p className="text-[10px] uppercase text-slate-500">{data?.model} · {data?.matches?.length || 0} similar</p>
            {(!data?.matches || data.matches.length === 0) ? <p className="text-xs text-slate-500 italic">No similar cases found.</p> :
              data.matches.map((m: any, i: number) => (
                <div key={m.case_number} className="ops-card p-4 border border-navy-600 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-slate-500">#{i + 1}</span>
                      <span className="font-mono text-sm text-amber-400 font-bold">{m.case_number}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-navy-900 border border-navy-700 text-slate-300">{m.crime_type}</span>
                      <span className="text-[10px] text-slate-500">{m.district}</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">{m.description}</p>
                    <p className="text-[11px] text-amber-200/80 mt-1">{m.reason}</p>
                  </div>
                  <span className="text-sm font-mono font-bold text-emerald-400">{Math.round(m.similarity * 100)}%</span>
                </div>
              ))}
          </div>
          <div className="text-[11px] text-slate-500 font-mono border-t border-navy-800 pt-3">Interlink: open matches in <button onClick={() => navigate('/case-explorer')} className="text-amber-400 underline">Case Explorer</button>.</div>
        </>
      )}
    </div>
  );
};
