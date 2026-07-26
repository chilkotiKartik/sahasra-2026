import React, { useState } from 'react';
import { FileSearch, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// SP Feature #10 — MO Semantic Search (offline TF-IDF + cosine)
export const MoSearch: React.FC = () => {
  const navigate = useNavigate();
  const [q, setQ] = useState('two men on a bike snatched a chain');
  const [res, setRes] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    setLoading(true);
    try {
      const r = await fetch(`/api/catalyst/mo-search?q=${encodeURIComponent(q)}`);
      setRes(await r.json());
    } catch {}
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-navy-700 pb-4">
        <h1 className="text-2xl font-bold tracking-wide text-slate-100 uppercase font-outfit flex items-center gap-2">
          <FileSearch className="w-7 h-7 text-amber-500" /> MO Semantic Search
        </h1>
        <p className="text-sm text-slate-400">Offline TF-IDF + cosine similarity over real case narratives — finds similar modus-operandi across districts even with different wording</p>
      </div>

      <form onSubmit={run} className="ops-card p-4 border border-sky-500/40 flex gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} className="flex-1 px-3 py-2.5 bg-navy-900 border border-navy-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-sky-500" placeholder="Describe an MO in plain words…" />
        <button className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs uppercase rounded-lg">{loading ? 'Searching…' : 'Find Similar'}</button>
      </form>

      {res && (
        <div className="space-y-2">
          <p className="text-[11px] font-mono text-slate-500">{res.model} · corpus {res.corpusSize} cases · query tokens [{(res.queryTokens || []).join(', ')}]</p>
          {(res.results || []).map((r: any, i: number) => (
            <div key={r.case_number} className="ops-card p-4 border border-navy-600 flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-500">#{i + 1}</span>
                  <span className="font-mono text-sm text-amber-400 font-bold">{r.case_number}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-navy-900 border border-navy-700 text-slate-300">{r.crime_type}</span>
                  <span className="text-[10px] text-slate-500">{r.district}</span>
                </div>
                <p className="text-xs text-slate-300 mt-1">{r.description}</p>
                <p className="text-[10px] text-sky-400 font-mono mt-1">matched: {(r.matchedTerms || []).join(', ') || '—'}</p>
              </div>
              <span className="text-sm font-mono font-bold text-emerald-400">{(r.similarity * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
      )}

      <div className="text-[11px] text-slate-500 font-mono border-t border-navy-800 pt-3 flex items-center gap-1">
        Interlink: matches open in the full <button onClick={() => navigate('/case-explorer')} className="text-amber-400 underline mx-1">Case Explorer</button> <ArrowRight className="w-3 h-3" />
      </div>
    </div>
  );
};
