import React, { useEffect, useState } from 'react';
import { Target, RefreshCw, Loader2, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CASES = ['KSP/2026/FIR-1042', 'MYS/2026/FIR-112', 'KSP/2026/CYBER-501'];

// ANALYST — Predictive Suspect Ranking (graph proximity + MO similarity)
export const SuspectRanking: React.FC = () => {
  const navigate = useNavigate();
  const [caseNumber, setCaseNumber] = useState(CASES[0]);
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const load = async (c: string) => { setLoading(true); try { const r = await fetch(`/api/catalyst/analyst/suspect-ranking?caseNumber=${encodeURIComponent(c)}`); const j = await r.json(); if (j.success) setData(j); } catch {} setLoading(false); };
  useEffect(() => { load(caseNumber); }, [caseNumber]);

  return (
    <div className="space-y-6">
      <div className="border-b border-navy-700 pb-4">
        <h1 className="text-2xl font-bold tracking-wide text-slate-100 uppercase font-outfit flex items-center gap-2"><Target className="w-7 h-7 text-amber-500" /> Predictive Suspect Ranking</h1>
        <p className="text-sm text-slate-400">For an unsolved case, ranks candidate suspects by graph proximity + MO similarity, with a plain-language reason for each.</p>
      </div>
      <div className="flex items-center gap-3">
        <label className="text-xs text-slate-400 uppercase font-bold">Unsolved case:</label>
        <select value={caseNumber} onChange={(e) => setCaseNumber(e.target.value)} className="px-3 py-2 bg-navy-900 border border-navy-700 rounded text-slate-100 text-xs font-mono">{CASES.map((c) => <option key={c}>{c}</option>)}</select>
        <button onClick={() => load(caseNumber)} className="px-3 py-1.5 bg-navy-800 border border-navy-600 rounded text-slate-200 text-xs flex items-center gap-1"><RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /></button>
      </div>
      {loading ? <div className="text-slate-500 text-sm flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Ranking…</div> : data && (
        <div className="space-y-3">
          <p className="text-[11px] text-slate-400">Candidates for <span className="font-mono text-amber-400">{data.targetCase}</span> ({data.targetCrime}):</p>
          {data.candidates.map((c: any, i: number) => (
            <div key={c.id} className={`ops-card p-4 border ${i === 0 ? 'border-amber-500/50' : 'border-navy-600'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-mono text-xs">#{i + 1}</span>
                  {i === 0 && <Crown className="w-4 h-4 text-amber-400" />}
                  <span className="font-bold text-slate-100">{c.label}</span>
                  {c.status && <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-700">{c.status}</span>}
                </div>
                <span className="font-mono font-bold text-amber-400">{Math.round(c.score * 100)}%</span>
              </div>
              <p className="text-xs text-amber-200/90 bg-amber-950/20 border border-amber-800/40 rounded p-2 mt-2">{c.reason}</p>
              <p className="text-[10px] font-mono text-slate-500 mt-1">graph-proximity {c.proximity} · MO-similarity {c.moSim} · gang: {c.gang}</p>
            </div>
          ))}
          <div className="text-[11px] text-slate-500 font-mono border-t border-navy-800 pt-3">Interlink: inspect any candidate in the <button onClick={() => navigate('/network-graph')} className="text-amber-400 underline">Network Graph</button>.</div>
        </div>
      )}
    </div>
  );
};
