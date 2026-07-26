import React, { useEffect, useState } from 'react';
import { FileText, Printer, RefreshCw, ShieldCheck } from 'lucide-react';

// SP Feature #12 — Weekly Performance Report Generator (real data → print-to-PDF)
export const ReportGenerator: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try { const r = await fetch('/api/catalyst/report/weekly'); const j = await r.json(); if (j.success) setData(j); } catch {}
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-navy-700 pb-4 no-print">
        <div>
          <h1 className="text-2xl font-bold tracking-wide text-slate-100 uppercase font-outfit flex items-center gap-2">
            <FileText className="w-7 h-7 text-amber-500" /> Weekly Performance Report
          </h1>
          <p className="text-sm text-slate-400">Real KPI + cluster + audit data compiled into a printable brief · export to PDF via browser print</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="px-3 py-1.5 bg-navy-800 border border-navy-600 rounded text-slate-200 text-xs font-bold flex items-center gap-1.5">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button onClick={() => window.print()} className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-navy-950 font-bold text-xs uppercase rounded-lg flex items-center gap-1.5">
            <Printer className="w-3.5 h-3.5" /> Export PDF
          </button>
        </div>
      </div>

      {data && (
        <div id="report-sheet" className="ops-card border border-navy-600 rounded-xl p-8 bg-navy-950 print:bg-white print:text-black space-y-6">
          <div className="flex items-center justify-between border-b border-navy-700 print:border-gray-300 pb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-100 print:text-black">SAHASRA — Weekly Intelligence Brief</h2>
              <p className="text-xs text-slate-400 print:text-gray-600 font-mono">{data.district} · generated {new Date(data.generatedAt).toLocaleString('en-GB', { hour12: false })}</p>
            </div>
            <span className="text-[10px] font-mono px-2 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 print:bg-white print:text-black print:border-black flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> integrity {data.integrity.verified ? 'VALID' : 'FAIL'} · {data.integrity.records} blocks
            </span>
          </div>

          <div>
            <h3 className="text-sm font-bold text-amber-500 uppercase mb-2">Key Metrics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                ['Active Hotspots', data.metrics.activeHotspotsCount],
                ['Pending Authorizations', data.metrics.pendingAuthorizationsCount],
                ['Cases Closed / week', data.metrics.casesClosedThisWeek],
                ['4-week avg', data.metrics.casesClosedFourWeekAvg]
              ].map(([k, v]) => (
                <div key={k as string} className="p-3 rounded border border-navy-700 print:border-gray-300">
                  <p className="text-[10px] text-slate-500 print:text-gray-600 uppercase">{k}</p>
                  <p className="text-2xl font-mono font-bold text-slate-100 print:text-black">{v as number}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-amber-500 uppercase mb-2">Top ST-DBSCAN Clusters (last 7 days)</h3>
            <table className="w-full text-xs">
              <thead><tr className="text-slate-500 print:text-gray-600 border-b border-navy-800 print:border-gray-300 text-left"><th className="py-1">Cluster</th><th>Primary Crime</th><th className="text-right">Incidents</th><th className="text-right">Intensity</th></tr></thead>
              <tbody>
                {data.topClusters.map((c: any) => (
                  <tr key={c.name} className="border-b border-navy-900 print:border-gray-200">
                    <td className="py-1.5 text-slate-200 print:text-black">{c.name}</td>
                    <td className="text-slate-400 print:text-gray-700">{c.primaryCrimeType}</td>
                    <td className="text-right font-mono text-amber-400 print:text-black">{c.incidentCount}</td>
                    <td className="text-right font-mono text-slate-300 print:text-black">{c.intensityScore}/100</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <h3 className="text-sm font-bold text-amber-500 uppercase mb-2">Recent Audit Trail (SHA-256 chained)</h3>
            <div className="space-y-1 font-mono text-[10px]">
              {data.recentAudit.map((a: any) => (
                <div key={a.id} className="flex justify-between text-slate-400 print:text-gray-700 border-b border-navy-900 print:border-gray-200 py-1">
                  <span>{a.timestamp} · {a.user_id} · {a.action}</span>
                  <span className="text-slate-600 print:text-gray-500 truncate max-w-[140px]">{a.this_hash}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 print:text-gray-500 font-mono mt-2">Ledger head: {data.integrity.lastChainHash?.slice(0, 32)}…</p>
          </div>
        </div>
      )}
    </div>
  );
};
