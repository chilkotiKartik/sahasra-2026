import React, { useEffect, useState } from 'react';
import { Activity, RefreshCw, Loader2 } from 'lucide-react';

// ANALYST — Statistical Anomaly Explorer (station current rate vs its baseline)
export const AnomalyExplorer: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const load = async () => { setLoading(true); try { const r = await fetch('/api/catalyst/analyst/anomaly'); const j = await r.json(); if (j.success) setData(j); } catch {} setLoading(false); };
  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-navy-700 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-wide text-slate-100 uppercase font-outfit flex items-center gap-2"><Activity className="w-7 h-7 text-amber-500" /> Statistical Anomaly Explorer</h1>
          <p className="text-sm text-slate-400">Each station's current-week incident rate vs its own 11-week baseline (z-score) — the statistical detail behind Command Center's alerts.</p>
        </div>
        <button onClick={load} className="px-3 py-1.5 bg-navy-800 border border-navy-600 rounded text-slate-200 text-xs flex items-center gap-1.5"><RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Recompute</button>
      </div>
      {loading ? <div className="text-slate-500 text-sm flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Analysing…</div> : data && (
        <div className="space-y-3">
          {data.rows.map((r: any) => {
            const max = Math.max(...r.weeks, 1);
            const color = r.anomaly === 'SURGE' ? '#ef4444' : r.anomaly === 'DROP' ? '#38bdf8' : '#64748b';
            return (
              <div key={r.station} className={`ops-card p-4 border ${r.anomaly !== 'NORMAL' ? 'border-amber-500/40' : 'border-navy-600'}`}>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <span className="font-bold text-slate-100 text-sm">{r.station}</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {r.anomaly === 'SURGE' ? `This week is running notably hotter than usual — ${r.current} incidents vs a typical ${r.baselineMean} (z=${r.z}).`
                        : r.anomaly === 'DROP' ? `This week is unusually quiet — ${r.current} incidents vs a typical ${r.baselineMean} (z=${r.z}).`
                        : `Within normal range — ${r.current} vs baseline ${r.baselineMean} (z=${r.z}).`}
                    </p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded font-bold" style={{ backgroundColor: color + '20', color, border: `1px solid ${color}55` }}>{r.anomaly} · z={r.z}</span>
                </div>
                {/* sparkline histogram (oldest → newest week) */}
                <div className="flex items-end gap-0.5 h-10 mt-2">
                  {[...r.weeks].reverse().map((v: number, i: number) => (
                    <div key={i} title={`week -${11 - i}: ${v}`} className="flex-1 rounded-t" style={{ height: `${(v / max) * 100}%`, minHeight: 2, backgroundColor: i === 11 ? color : '#334155' }} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
