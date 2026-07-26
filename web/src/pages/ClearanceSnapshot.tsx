import React, { useEffect, useState } from 'react';
import { Gauge, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// IO — My Case Clearance Snapshot (officer resolution rate vs station average)
export const ClearanceSnapshot: React.FC = () => {
  const { user } = useAuth();
  const [d, setD] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { (async () => { try { const r = await fetch(`/api/catalyst/io/clearance?officerId=${user?.badgeNumber || 'IO-402'}`); const j = await r.json(); if (j.success) setD(j); } catch {} setLoading(false); })(); }, [user]);

  if (loading) return <div className="text-slate-500 text-sm flex items-center gap-2 p-6"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>;
  if (!d) return null;
  const better = d.delta >= 0;
  const humanized = d.assigned === 0
    ? 'You have no cases assigned in the current sample.'
    : better
      ? `You're clearing cases ${d.delta} points above your station average — solid work, ${user?.name || 'Officer'}.`
      : `Your clearance rate is ${Math.abs(d.delta)} points below the station average — a few of your ${d.assigned} open cases may need a push.`;

  return (
    <div className="space-y-6">
      <div className="border-b border-navy-700 pb-4">
        <h1 className="text-2xl font-bold tracking-wide text-slate-100 uppercase font-outfit flex items-center gap-2"><Gauge className="w-7 h-7 text-amber-500" /> My Case Clearance Snapshot</h1>
        <p className="text-sm text-slate-400">Your personal resolution rate vs the station average — private performance, distinct from district KPIs.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[['Assigned', d.assigned], ['Resolved', d.resolved], ['My clearance', d.officerClearanceRate + '%'], ['Station avg', d.stationClearanceRate + '%']].map(([k, v]) => (
          <div key={k as string} className="ops-card p-4 border border-navy-600 text-center">
            <p className="text-[10px] uppercase text-slate-500">{k}</p>
            <p className="text-2xl font-mono font-bold text-slate-100">{v as any}</p>
          </div>
        ))}
      </div>

      <div className={`ops-card p-4 border ${better ? 'border-emerald-600/40' : 'border-amber-600/40'}`}>
        <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase" style={{ color: better ? '#34d399' : '#fbbf24' }}>You vs station</div>
        <div className="space-y-2">
          <div><p className="text-[10px] text-slate-400">You</p><div className="h-3 rounded bg-navy-800"><div className="h-full rounded bg-amber-500" style={{ width: `${d.officerClearanceRate}%` }} /></div></div>
          <div><p className="text-[10px] text-slate-400">Station</p><div className="h-3 rounded bg-navy-800"><div className="h-full rounded bg-slate-500" style={{ width: `${d.stationClearanceRate}%` }} /></div></div>
        </div>
        <p className="text-xs text-slate-300 mt-3">{humanized}</p>
      </div>

      <div className="ops-card p-4 border border-navy-600">
        <p className="text-[10px] uppercase text-slate-500 mb-2">Your cases</p>
        {d.cases.map((c: any) => <p key={c.case_number} className="text-xs text-slate-300 font-mono">{c.case_number} — {c.crime_type} · <span className={/RESOLVED|CLOSED|CHARGE/i.test(c.status) ? 'text-emerald-400' : 'text-amber-400'}>{c.status}</span></p>)}
      </div>
      <p className="text-[10px] text-slate-500 italic">Note: computed over the {d.assigned}-case seeded sample assigned to you; on the full corpus this reflects your true caseload.</p>
    </div>
  );
};
