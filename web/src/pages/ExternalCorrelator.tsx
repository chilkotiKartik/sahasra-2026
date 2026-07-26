import React, { useEffect, useState } from 'react';
import { CalendarRange, AlertTriangle, Loader2 } from 'lucide-react';

// ANALYST — Trend-vs-External-Factor Correlator. Honest: no external calendar
// reference data is ingested, so the correlation UI is labelled as awaiting it.
export const ExternalCorrelator: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { (async () => { try { const r = await fetch('/api/catalyst/analyst/external-correlate'); const j = await r.json(); if (j.success) setData(j); } catch {} setLoading(false); })(); }, []);

  return (
    <div className="space-y-6">
      <div className="border-b border-navy-700 pb-4">
        <h1 className="text-2xl font-bold tracking-wide text-slate-100 uppercase font-outfit flex items-center gap-2"><CalendarRange className="w-7 h-7 text-amber-500" /> Trend vs External-Factor Correlator</h1>
        <p className="text-sm text-slate-400">Correlates incident spikes against calendar factors (festivals, paydays).</p>
      </div>
      {loading ? <div className="text-slate-500 text-sm flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div> : data && (
        <>
          <div className="ops-card p-4 border border-amber-600/50 bg-amber-950/20 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-300">Awaiting external calendar data source</p>
              <p className="text-xs text-slate-300 mt-1">{data.message}</p>
            </div>
          </div>
          <div className="ops-card p-4 border border-navy-600">
            <p className="text-xs font-bold uppercase text-slate-400 mb-2">Real incident surges detected (ready to correlate once external data is ingested)</p>
            {data.surges.length === 0 ? <p className="text-xs text-slate-500 italic">No station surges this week.</p> : data.surges.map((s: any) => (
              <p key={s.station} className="text-xs text-slate-300">{s.station}: {s.current} incidents this week (z={s.z}) — <span className="text-slate-500">candidate for external-factor overlay</span></p>
            ))}
          </div>
          <p className="text-[10px] text-slate-500 italic">To activate: ingest a Karnataka festival/holiday calendar as a reference table, then this screen joins it against the surge dates above.</p>
        </>
      )}
    </div>
  );
};
