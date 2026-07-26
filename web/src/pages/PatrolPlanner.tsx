import React, { useEffect, useState } from 'react';
import { Crosshair, TrendingUp, TrendingDown, Navigation, Loader2, Grid3x3, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Predictive Patrol Planner — forecast × risk-window × nearest fleet → actions
export const PatrolPlanner: React.FC = () => {
  const navigate = useNavigate();
  const [plan, setPlan] = useState<any[]>([]);
  const [matrix, setMatrix] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [dispatch, setDispatch] = useState<Record<string, any>>({});
  const [acting, setActing] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [p, m] = await Promise.all([
        fetch('/api/catalyst/patrol-plan').then((r) => r.json()),
        fetch('/api/catalyst/risk-matrix').then((r) => r.json())
      ]);
      if (p.success) setPlan(p.plan);
      if (m.success) setMatrix(m);
    } catch {}
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const doDispatch = async (rec: any) => {
    setActing(rec.clusterId);
    try {
      const r = await fetch('/api/catalyst/fleet/dispatch-nearest', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat: rec.centerLat, lng: rec.centerLng, label: `Patrol: ${rec.name}` })
      });
      const j = await r.json();
      setDispatch((d) => ({ ...d, [rec.clusterId]: j }));
    } catch {}
    setActing(null);
  };

  const riskColor = (v: number, max: number) => {
    if (max === 0) return '#0b1220';
    const r = v / max;
    if (r === 0) return '#0b1220';
    if (r < 0.33) return 'rgba(16,185,129,0.35)';
    if (r < 0.66) return 'rgba(245,158,11,0.5)';
    return 'rgba(239,68,68,0.7)';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-navy-700 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-wide text-slate-100 uppercase font-outfit flex items-center gap-2">
            <Crosshair className="w-7 h-7 text-amber-500" /> Predictive Patrol Planner
          </h1>
          <p className="text-sm text-slate-400">Fuses ST-DBSCAN intensity × Holt-Winters forecast × time-slot risk × live fleet positions into deployable recommendations</p>
        </div>
        <button onClick={load} className="px-3 py-1.5 bg-navy-800 border border-navy-600 rounded text-slate-200 text-xs font-bold flex items-center gap-1.5">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Re-plan
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-slate-400 text-sm"><Loader2 className="w-5 h-5 animate-spin" /> Computing plan…</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recommendations */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-xs font-bold uppercase text-amber-400">Tonight's Deployment Recommendations</h3>
            {plan.map((rec, i) => (
              <div key={rec.clusterId} className={`ops-card p-4 border ${rec.riskLevel === 'CRITICAL' ? 'border-rose-600/50' : 'border-navy-600'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-slate-500">#{i + 1}</span>
                      <span className="font-bold text-slate-100">{rec.name}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${rec.riskLevel === 'CRITICAL' ? 'bg-rose-950 text-rose-300 border border-rose-600' : rec.riskLevel === 'HIGH' ? 'bg-amber-950 text-amber-300 border border-amber-600' : 'bg-navy-800 text-slate-300 border border-navy-600'}`}>{rec.riskLevel}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">{rec.station} · {rec.primaryCrimeType}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-mono font-bold flex items-center gap-1 ${rec.trendPct >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {rec.trendPct >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                      {rec.trendPct >= 0 ? '+' : ''}{rec.trendPct}%
                    </span>
                    <p className="text-[10px] text-slate-500 font-mono">peak {rec.peakWindow}h</p>
                  </div>
                </div>
                <p className="text-xs text-amber-200/90 bg-amber-950/25 border border-amber-800/40 rounded p-2 mt-2 leading-relaxed">{rec.rationale}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[11px] font-mono text-slate-400">
                    {rec.nearestUnit ? <>Nearest: <b className="text-slate-200">{rec.nearestUnit.badge}</b> · {(rec.nearestUnit.distanceM / 1000).toFixed(1)} km</> : 'No unit available'}
                  </span>
                  {rec.nearestUnit && (
                    <button onClick={() => doDispatch(rec)} disabled={acting === rec.clusterId} className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-navy-950 text-[11px] font-bold uppercase rounded flex items-center gap-1.5">
                      {acting === rec.clusterId ? <Loader2 className="w-3 h-3 animate-spin" /> : <Navigation className="w-3 h-3" />} Dispatch
                    </button>
                  )}
                </div>
                {dispatch[rec.clusterId]?.success && (
                  <p className="text-[11px] text-emerald-400 font-mono mt-1.5">✓ {dispatch[rec.clusterId].dispatched.name} dispatched — {dispatch[rec.clusterId].dispatched.distanceM} m · ETA ~{dispatch[rec.clusterId].dispatched.etaMin} min</p>
                )}
              </div>
            ))}
          </div>

          {/* Time-slot Risk Matrix */}
          <div className="ops-card p-4 border border-navy-600 h-fit">
            <h3 className="text-xs font-bold uppercase text-slate-200 flex items-center gap-2 mb-3">
              <Grid3x3 className="w-4 h-4 text-amber-500" /> Time-Slot Risk Matrix
            </h3>
            {matrix && (
              <>
                <div className="overflow-x-auto">
                  <table className="text-[9px] font-mono border-separate" style={{ borderSpacing: 2 }}>
                    <thead>
                      <tr>
                        <th></th>
                        {matrix.blocks.map((b: string) => <th key={b} className="text-slate-500 font-normal px-0.5">{b.split('-')[0]}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {matrix.days.map((day: string, di: number) => (
                        <tr key={day}>
                          <td className="text-slate-500 pr-1">{day}</td>
                          {matrix.grid[di].map((v: number, bi: number) => (
                            <td key={bi} title={`${day} ${matrix.blocks[bi]}h · ${v} incidents`}
                              className="w-6 h-6 text-center rounded"
                              style={{ backgroundColor: riskColor(v, matrix.max), color: v / matrix.max > 0.5 ? '#fff' : '#64748b' }}>
                              {v}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-[10px] text-slate-500 font-mono mt-2">
                  Peak: <span className="text-rose-400 font-bold">{matrix.peak.day} {matrix.peak.block}h</span> ({matrix.peak.count} incidents) · {matrix.total} total
                </p>
                <div className="flex items-center gap-2 mt-2 text-[9px] text-slate-500">
                  <span className="w-3 h-3 rounded" style={{ background: 'rgba(16,185,129,0.35)' }} /> low
                  <span className="w-3 h-3 rounded" style={{ background: 'rgba(245,158,11,0.5)' }} /> med
                  <span className="w-3 h-3 rounded" style={{ background: 'rgba(239,68,68,0.7)' }} /> high
                </div>
              </>
            )}
          </div>
        </div>
      )}
      <div className="text-[11px] text-slate-500 font-mono border-t border-navy-800 pt-3">
        Interlink: clusters from <button onClick={() => navigate('/hotspot-map')} className="text-amber-400 underline">Hotspot Map</button>, trend from <button onClick={() => navigate('/forecast')} className="text-amber-400 underline">Forecast Engine</button>, units from <button onClick={() => navigate('/fleet')} className="text-amber-400 underline">Akka Fleet</button>.
      </div>
    </div>
  );
};
