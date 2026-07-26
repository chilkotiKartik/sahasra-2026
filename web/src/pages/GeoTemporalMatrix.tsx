import React, { useEffect, useState } from 'react';
import { Grid3x3, RefreshCw, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ANALYST feature — Geo-Temporal Correlation Matrix (crime-type × hour-of-day).
// Purely statistical pattern-spotting view, distinct from the SP dispatch map.
export const GeoTemporalMatrix: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try { const r = await fetch('/api/catalyst/analyst/geo-temporal'); const j = await r.json(); if (j.success) setData(j); } catch {}
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const cell = (v: number, max: number) => {
    if (!v) return 'transparent';
    const r = v / max;
    if (r < 0.25) return 'rgba(56,189,248,0.25)';
    if (r < 0.5) return 'rgba(16,185,129,0.4)';
    if (r < 0.75) return 'rgba(245,158,11,0.55)';
    return 'rgba(239,68,68,0.75)';
  };
  const fmtHour = (h: number) => `${String(h).padStart(2, '0')}`;
  const period = (h: number) => (h < 5 ? 'pre-dawn' : h < 12 ? 'morning' : h < 17 ? 'afternoon' : h < 21 ? 'evening' : 'late-night');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-navy-700 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-wide text-slate-100 uppercase font-outfit flex items-center gap-2">
            <Grid3x3 className="w-7 h-7 text-amber-500" /> Geo-Temporal Correlation Matrix
          </h1>
          <p className="text-sm text-slate-400">Crime-type × hour-of-day incidence over 90 days of real data — for pattern-spotting, not dispatch</p>
        </div>
        <button onClick={load} className="px-3 py-1.5 bg-navy-800 border border-navy-600 rounded text-slate-200 text-xs font-bold flex items-center gap-1.5">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Recompute
        </button>
      </div>

      {data && (
        <>
          <div className="ops-card p-4 border border-navy-600 overflow-x-auto">
            <table className="text-[10px] font-mono border-separate" style={{ borderSpacing: 1 }}>
              <thead>
                <tr>
                  <th className="text-left text-slate-500 pr-2 sticky left-0 bg-navy-900">Crime \ Hour</th>
                  {data.hours.map((h: number) => <th key={h} className="text-slate-500 w-5">{fmtHour(h)}</th>)}
                </tr>
              </thead>
              <tbody>
                {data.crimeTypes.map((ct: string) => (
                  <tr key={ct}>
                    <td className="text-slate-300 pr-2 whitespace-nowrap sticky left-0 bg-navy-900">{ct}</td>
                    {data.grid[ct].map((v: number, h: number) => (
                      <td key={h} title={`${ct} · ${fmtHour(h)}:00 · ${v} incidents`}
                        className="w-5 h-6 text-center rounded-sm"
                        style={{ backgroundColor: cell(v, data.max), color: v / data.max > 0.6 ? '#fff' : '#475569' }}>
                        {v || ''}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Humanized takeaways — every peak stated as a plain sentence */}
          <div className="ops-card p-4 border border-navy-600 space-y-2">
            <h3 className="text-xs font-bold uppercase text-amber-400 flex items-center gap-2"><Info className="w-4 h-4" /> What the analyst should notice</h3>
            {data.peaks
              .filter((p: any) => p.count > 0)
              .sort((a: any, b: any) => b.count - a.count)
              .map((p: any) => (
                <p key={p.crimeType} className="text-xs text-slate-300 leading-relaxed">
                  <span className="text-slate-100 font-semibold">{p.crimeType}</span> concentrates in the {period(p.hour)} window, peaking around{' '}
                  <span className="text-amber-400 font-mono">{fmtHour(p.hour)}:00</span> ({p.count} incidents in that hour over 90 days) — roughly{' '}
                  {Math.round((p.count / (data.rowTotals[p.crimeType] || 1)) * 100)}% of all {p.crimeType.toLowerCase()} cases fall in this single hour band.
                </p>
              ))}
          </div>

          <div className="text-[11px] text-slate-500 font-mono border-t border-navy-800 pt-3">
            Interlink: peak windows here inform the <button onClick={() => navigate('/patrol-planner')} className="text-amber-400 underline">Patrol Planner</button> and <button onClick={() => navigate('/trends')} className="text-amber-400 underline">Crime Trends</button>.
          </div>
        </>
      )}
    </div>
  );
};
