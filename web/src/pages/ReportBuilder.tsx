import React, { useEffect, useState } from 'react';
import { FileBarChart, Printer, Loader2 } from 'lucide-react';

// ANALYST — Custom Report Builder (pick real sections → compose → export PDF)
const SECTIONS = [
  { key: 'metrics', label: 'District KPI metrics' },
  { key: 'clusters', label: 'Top ST-DBSCAN clusters' },
  { key: 'anomaly', label: 'Station anomaly table' },
  { key: 'audit', label: 'Recent audit trail' }
];

export const ReportBuilder: React.FC = () => {
  const [on, setOn] = useState<Record<string, boolean>>({ metrics: true, clusters: true, anomaly: false, audit: false });
  const [weekly, setWeekly] = useState<any | null>(null);
  const [anomaly, setAnomaly] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { (async () => {
    try {
      const [w, a] = await Promise.all([fetch('/api/catalyst/report/weekly').then(r => r.json()), fetch('/api/catalyst/analyst/anomaly').then(r => r.json())]);
      if (w.success) setWeekly(w); if (a.success) setAnomaly(a);
    } catch {} setLoading(false);
  })(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-navy-700 pb-4 no-print">
        <div>
          <h1 className="text-2xl font-bold tracking-wide text-slate-100 uppercase font-outfit flex items-center gap-2"><FileBarChart className="w-7 h-7 text-amber-500" /> Custom Report Builder</h1>
          <p className="text-sm text-slate-400">Select the real sections you want, then export a custom PDF (browser print).</p>
        </div>
        <button onClick={() => window.print()} className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-navy-950 font-bold text-xs uppercase rounded-lg flex items-center gap-1.5"><Printer className="w-3.5 h-3.5" /> Export PDF</button>
      </div>

      <div className="ops-card p-4 border border-navy-600 flex flex-wrap gap-4 no-print">
        {SECTIONS.map((s) => (
          <label key={s.key} className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
            <input type="checkbox" checked={!!on[s.key]} onChange={(e) => setOn({ ...on, [s.key]: e.target.checked })} className="accent-amber-500" /> {s.label}
          </label>
        ))}
      </div>

      {loading ? <div className="text-slate-500 text-sm flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading data…</div> : (
        <div id="report" className="ops-card p-8 border border-navy-600 rounded-xl bg-navy-950 print:bg-white print:text-black space-y-6">
          <h2 className="text-xl font-bold text-slate-100 print:text-black">SAHASRA — Analyst Custom Report</h2>
          {on.metrics && weekly && (
            <div><h3 className="text-sm font-bold text-amber-500 uppercase mb-2">Key Metrics</h3>
              <div className="grid grid-cols-4 gap-3 text-xs">{Object.entries(weekly.metrics).map(([k, v]) => <div key={k} className="p-2 border border-navy-700 print:border-gray-300 rounded"><p className="text-[10px] text-slate-500">{k}</p><p className="text-lg font-mono font-bold text-slate-100 print:text-black">{v as number}</p></div>)}</div>
            </div>)}
          {on.clusters && weekly && (
            <div><h3 className="text-sm font-bold text-amber-500 uppercase mb-2">Top Clusters</h3>
              {weekly.topClusters.map((c: any) => <p key={c.name} className="text-xs text-slate-300 print:text-black">{c.name} — {c.incidentCount} incidents ({c.primaryCrimeType})</p>)}</div>)}
          {on.anomaly && anomaly && (
            <div><h3 className="text-sm font-bold text-amber-500 uppercase mb-2">Station Anomalies</h3>
              {anomaly.rows.filter((r: any) => r.anomaly !== 'NORMAL').map((r: any) => <p key={r.station} className="text-xs text-slate-300 print:text-black">{r.station}: {r.anomaly} (z={r.z}, {r.current} vs {r.baselineMean})</p>)}</div>)}
          {on.audit && weekly && (
            <div><h3 className="text-sm font-bold text-amber-500 uppercase mb-2">Recent Audit</h3>
              {weekly.recentAudit.map((a: any) => <p key={a.id} className="text-[10px] font-mono text-slate-400 print:text-gray-700">{a.timestamp} · {a.user_id} · {a.action}</p>)}</div>)}
          <p className="text-[10px] text-slate-500 print:text-gray-500 font-mono">Generated {new Date().toLocaleString('en-GB', { hour12: false })} · SAHASRA Analyst Console</p>
        </div>
      )}
    </div>
  );
};
