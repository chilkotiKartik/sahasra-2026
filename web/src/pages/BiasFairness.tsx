import React, { useEffect, useState } from 'react';
import { Scale, AlertTriangle, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// SP Feature #8 — Live Bias & Fairness (real ward alert-rate vs census baseline)
export const BiasFairness: React.FC = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<any[]>([]);
  const [score, setScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/catalyst/governance/bias-fairness');
      const j = await r.json();
      const p = j.result ? j.result : j;
      setMetrics(p.metrics || []);
      if (typeof p.fairnessScorePct === 'number') setScore(p.fairnessScorePct);
    } catch {}
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-navy-700 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-wide text-slate-100 uppercase font-outfit flex items-center gap-2">
            <Scale className="w-7 h-7 text-amber-500" /> Live Bias & Fairness Audit
          </h1>
          <p className="text-sm text-slate-400">Real alert-rate per 10k population vs census baseline, per ward · flags disproportionate policing</p>
        </div>
        <div className="flex items-center gap-2">
          {score != null && (
            <span className={`px-3 py-1.5 rounded font-mono text-xs font-bold border ${score >= 90 ? 'bg-emerald-950 text-emerald-300 border-emerald-600' : 'bg-amber-950 text-amber-300 border-amber-600'}`}>
              Fairness Score: {score}%
            </span>
          )}
          <button onClick={load} className="px-3 py-1.5 bg-navy-800 border border-navy-600 rounded text-slate-200 text-xs font-bold flex items-center gap-1.5">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Recompute
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {metrics.map((b) => {
          const dev = b.deviationPct;
          return (
            <div key={b.wardName} className={`ops-card p-4 border ${b.isDisproportionate ? 'border-rose-600/60 bg-rose-950/20' : 'border-navy-600'}`}>
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-slate-100">{b.wardName}</h3>
                {b.isDisproportionate && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-600 text-white font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> DEVIATION ALERT
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">{b.district} · census pop {b.populationCensus?.toLocaleString()}</p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-navy-950 rounded p-2 border border-navy-800">
                  <p className="text-[9px] text-slate-500 uppercase">Alerts</p>
                  <p className="font-mono font-bold text-slate-100">{b.alertsCount}</p>
                </div>
                <div className="bg-navy-950 rounded p-2 border border-navy-800">
                  <p className="text-[9px] text-slate-500 uppercase">Rate/10k</p>
                  <p className="font-mono font-bold text-amber-400">{b.alertRatePer10k}</p>
                </div>
                <div className="bg-navy-950 rounded p-2 border border-navy-800">
                  <p className="text-[9px] text-slate-500 uppercase">Expected</p>
                  <p className="font-mono font-bold text-slate-300">{b.expectedRatePer10k}</p>
                </div>
              </div>
              <div className="mt-2 h-2 rounded-full bg-navy-800 overflow-hidden">
                <div className={`h-full ${Math.abs(dev) > 20 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, 50 + dev)}%` }} />
              </div>
              <p className="text-[10px] font-mono text-slate-500 mt-1">deviation {dev > 0 ? '+' : ''}{dev}% vs census baseline</p>
            </div>
          );
        })}
      </div>

      <div className="text-[11px] text-slate-500 font-mono border-t border-navy-800 pt-3">
        Interlink: the same fairness ledger feeds the{' '}
        <button onClick={() => navigate('/governance')} className="text-amber-400 underline">Governance & Audit</button> screen.
      </div>
    </div>
  );
};
