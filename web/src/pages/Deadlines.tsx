import React, { useEffect, useState } from 'react';
import { CalendarClock, RefreshCw, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const URGENCY: Record<string, { cls: string; label: string }> = {
  OVERDUE: { cls: 'bg-rose-950 text-rose-300 border-rose-600', label: 'OVERDUE' },
  CRITICAL: { cls: 'bg-rose-950/70 text-rose-300 border-rose-700', label: '≤15 days' },
  SOON: { cls: 'bg-amber-950 text-amber-300 border-amber-700', label: '≤30 days' },
  ON_TRACK: { cls: 'bg-emerald-950 text-emerald-300 border-emerald-700', label: 'On track' }
};

// IO feature — Court Date & Chargesheet Deadline Tracker (CrPC 90-day rule).
export const Deadlines: React.FC = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try { const r = await fetch('/api/catalyst/io/deadlines'); const j = await r.json(); if (j.success) setRows(j.deadlines); } catch {}
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-navy-700 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-wide text-slate-100 uppercase font-outfit flex items-center gap-2">
            <CalendarClock className="w-7 h-7 text-amber-500" /> Chargesheet Deadline Tracker
          </h1>
          <p className="text-sm text-slate-400">Chargesheet filing deadlines (CrPC 90-day rule) computed from real FIR dates, colour-coded by urgency.</p>
        </div>
        <button onClick={load} className="px-3 py-1.5 bg-navy-800 border border-navy-600 rounded text-slate-200 text-xs font-bold flex items-center gap-1.5">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-slate-500 text-sm flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
      ) : (
        <div className="space-y-3">
          {rows.map((d) => {
            const u = URGENCY[d.urgency] || URGENCY.ON_TRACK;
            return (
              <div key={d.case_number} className="ops-card p-4 border border-navy-600 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-amber-400 font-bold">{d.case_number}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-navy-900 border border-navy-700 text-slate-300">{d.crime_type}</span>
                    <span className="text-[10px] text-slate-500">{d.district} · {d.status}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 font-mono">FIR {d.firDate} → chargesheet due <span className="text-slate-200">{d.chargesheetDue}</span></p>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded border ${u.cls}`}>{u.label}</span>
                  <p className={`text-sm font-mono font-bold mt-1 ${d.daysLeft < 0 ? 'text-rose-400' : d.daysLeft <= 30 ? 'text-amber-400' : 'text-slate-300'}`}>
                    {d.daysLeft < 0 ? `${Math.abs(d.daysLeft)}d overdue` : `${d.daysLeft}d left`}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="text-[11px] text-slate-500 font-mono border-t border-navy-800 pt-3">
        Interlink: each case opens in <button onClick={() => navigate('/case-explorer')} className="text-amber-400 underline">Case Explorer</button>; log progress in the <button onClick={() => navigate('/case-diary')} className="text-amber-400 underline">Case Diary</button>.
      </div>
    </div>
  );
};
