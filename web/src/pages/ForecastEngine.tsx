import React, { useEffect, useState } from 'react';
import { TrendingUp, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// SP Feature #11 — Time-Series Forecast Engine (Holt's Linear Trend)
export const ForecastEngine: React.FC = () => {
  const navigate = useNavigate();
  const [fc, setFc] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try { const r = await fetch('/api/catalyst/forecast'); const j = await r.json(); if (j.success) setFc(j); } catch {}
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const hist: number[] = fc?.history || [];
  const forecast: any[] = fc?.forecast || [];
  const all = [...hist, ...forecast.map((f) => f.upper)];
  const max = Math.max(...all, 1);
  const n = hist.length + forecast.length;
  const X = (i: number) => (i / Math.max(1, n - 1)) * 600;
  const Y = (v: number) => 180 - (v / max) * 165;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-navy-700 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-wide text-slate-100 uppercase font-outfit flex items-center gap-2">
            <TrendingUp className="w-7 h-7 text-amber-500" /> Time-Series Forecast Engine
          </h1>
          <p className="text-sm text-slate-400">Real Holt's Linear Trend (double exponential smoothing) over 12 weeks of real incident counts — separate from the raw Hotspot Map</p>
        </div>
        <button onClick={load} className="px-3 py-1.5 bg-navy-800 border border-navy-600 rounded text-slate-200 text-xs font-bold flex items-center gap-1.5">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Re-run
        </button>
      </div>

      {fc && (
        <>
          <div className="ops-card p-5 border border-navy-600">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase text-emerald-400">{fc.model}</span>
              <span className="text-[11px] font-mono text-slate-400">α={fc.alpha} · β={fc.beta} · RMSE {fc.rmse}</span>
            </div>
            <svg viewBox="0 0 600 190" className="w-full" style={{ height: 220 }}>
              {[0.25, 0.5, 0.75].map((g) => (
                <line key={g} x1="0" x2="600" y1={180 - g * 165} y2={180 - g * 165} stroke="#1e293b" strokeWidth="1" />
              ))}
              {(() => {
                const histPts = hist.map((v, i) => `${X(i)},${Y(v)}`).join(' ');
                const bridge = `${X(hist.length - 1)},${Y(hist[hist.length - 1])}`;
                const fcPts = forecast.map((f, i) => `${X(hist.length + i)},${Y(f.value)}`);
                const bandTop = forecast.map((f, i) => `${X(hist.length + i)},${Y(f.upper)}`);
                const bandBot = forecast.map((f, i) => `${X(hist.length + i)},${Y(f.lower)}`).reverse();
                return (
                  <>
                    <polygon points={[bridge, ...bandTop, ...bandBot].join(' ')} fill="#f59e0b" opacity="0.15" />
                    <polyline points={histPts} fill="none" stroke="#94a3b8" strokeWidth="2" />
                    <polyline points={[bridge, ...fcPts].join(' ')} fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="6 4" />
                    {hist.map((v, i) => <circle key={i} cx={X(i)} cy={Y(v)} r="2.5" fill="#94a3b8" />)}
                    {forecast.map((f, i) => <circle key={i} cx={X(hist.length + i)} cy={Y(f.value)} r="3" fill="#f59e0b" />)}
                  </>
                );
              })()}
            </svg>
            <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
              <span>← 12 real historical weeks (grey)</span>
              <span className="text-amber-400">4-week forecast (amber, 80% band) →</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {forecast.map((f, i) => (
              <div key={i} className="ops-card p-3 border border-navy-600 text-center">
                <p className="text-[10px] text-slate-500 uppercase">Week +{i + 1}</p>
                <p className="text-2xl font-mono font-bold text-amber-400">{f.value}</p>
                <p className="text-[10px] font-mono text-slate-500">[{f.lower} – {f.upper}]</p>
              </div>
            ))}
          </div>
          <div className="text-[11px] text-slate-500 font-mono border-t border-navy-800 pt-3">
            Interlink: feeds the forecast band shown on <button onClick={() => navigate('/trends')} className="text-amber-400 underline">Crime Trends</button> and prioritises <button onClick={() => navigate('/hotspot-map')} className="text-amber-400 underline">Hotspot Map</button> patrols.
          </div>
        </>
      )}
    </div>
  );
};
