import React, { useEffect, useState } from 'react';
import { DatabaseZap, RefreshCw, Loader2 } from 'lucide-react';

// ANALYST — Data Coverage Quality Dashboard (per-station completeness + staleness)
export const DataCoverage: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const load = async () => { setLoading(true); try { const r = await fetch('/api/catalyst/analyst/data-coverage'); const j = await r.json(); if (j.success) setData(j); } catch {} setLoading(false); };
  useEffect(() => { load(); }, []);
  const gradeColor = (g: string) => g === 'GOOD' ? 'text-emerald-400' : g === 'STALE' ? 'text-rose-400' : 'text-amber-400';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-navy-700 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-wide text-slate-100 uppercase font-outfit flex items-center gap-2"><DatabaseZap className="w-7 h-7 text-amber-500" /> Data Coverage Quality</h1>
          <p className="text-sm text-slate-400">Per-station record completeness and staleness — an analyst-only data-hygiene view.</p>
        </div>
        <button onClick={load} className="px-3 py-1.5 bg-navy-800 border border-navy-600 rounded text-slate-200 text-xs flex items-center gap-1.5"><RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /></button>
      </div>
      {loading ? <div className="text-slate-500 text-sm flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Auditing data…</div> : data && (
        <>
          <div className="ops-card border border-navy-600 rounded-xl overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-navy-700 text-slate-500 text-left"><th className="p-3">Station</th><th className="p-3">Records</th><th className="p-3">Completeness</th><th className="p-3">Stale %</th><th className="p-3">Newest</th><th className="p-3">Grade</th></tr></thead>
              <tbody>
                {data.rows.map((r: any) => (
                  <tr key={r.station} className="border-b border-navy-900">
                    <td className="p-3 text-slate-200">{r.station}</td>
                    <td className="p-3 font-mono text-slate-400">{r.total}</td>
                    <td className="p-3"><div className="flex items-center gap-2"><div className="w-16 h-2 rounded bg-navy-800"><div className="h-full rounded bg-emerald-500" style={{ width: `${r.completenessPct}%` }} /></div><span className="font-mono text-slate-300">{r.completenessPct}%</span></div></td>
                    <td className={`p-3 font-mono ${r.stalePct >= 60 ? 'text-rose-400' : 'text-slate-400'}`}>{r.stalePct}%</td>
                    <td className="p-3 font-mono text-slate-500">{r.daysSinceNewest}d ago</td>
                    <td className={`p-3 font-bold ${gradeColor(r.grade)}`}>{r.grade}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-slate-500 italic">{data.note}</p>
        </>
      )}
    </div>
  );
};
