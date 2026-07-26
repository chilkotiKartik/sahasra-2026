import React, { useEffect, useState } from 'react';
import { Columns3, Loader2 } from 'lucide-react';

// ANALYST — Deep-Dive Case Comparator (side-by-side, matching fields highlighted)
export const CaseComparator: React.FC = () => {
  const [cases, setCases] = useState<any[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { (async () => { try { const r = await fetch('/api/catalyst/cases?limit=100'); const j = await r.json(); if (j.success) setCases(j.cases); } catch {} setLoading(false); })(); }, []);

  const toggle = (id: string) => setPicked((p) => p.includes(id) ? p.filter((x) => x !== id) : p.length < 3 ? [...p, id] : p);
  const sel = picked.map((id) => cases.find((c) => c.id === id)).filter(Boolean);
  // a field "matches" if 2+ selected cases share the same value
  const matches = (field: string, val: any) => sel.filter((c) => c[field] === val).length > 1;

  const FIELDS: [string, string][] = [['crime_type', 'Crime Type'], ['district', 'District'], ['station', 'Station'], ['status', 'Status'], ['date', 'Date'], ['accused_count', 'Accused']];

  return (
    <div className="space-y-6">
      <div className="border-b border-navy-700 pb-4">
        <h1 className="text-2xl font-bold tracking-wide text-slate-100 uppercase font-outfit flex items-center gap-2"><Columns3 className="w-7 h-7 text-amber-500" /> Deep-Dive Case Comparator</h1>
        <p className="text-sm text-slate-400">Pick 2–3 real cases; shared field values are highlighted where they align.</p>
      </div>
      {loading ? <div className="text-slate-500 text-sm flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading cases…</div> : (
        <>
          <div className="flex flex-wrap gap-2">
            {cases.map((c) => (
              <button key={c.id} onClick={() => toggle(c.id)} className={`px-3 py-1.5 rounded text-xs font-mono border ${picked.includes(c.id) ? 'bg-amber-500 text-navy-950 border-amber-400' : 'bg-navy-900 text-slate-300 border-navy-700'}`}>{c.case_number}</button>
            ))}
          </div>
          {sel.length < 2 ? <p className="text-xs text-slate-500 italic">Select at least 2 cases to compare.</p> : (
            <div className="ops-card border border-navy-600 rounded-xl overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="border-b border-navy-700"><th className="p-3 text-left text-slate-500">Field</th>{sel.map((c) => <th key={c.id} className="p-3 text-left text-amber-400 font-mono">{c.case_number}</th>)}</tr></thead>
                <tbody>
                  {FIELDS.map(([f, label]) => (
                    <tr key={f} className="border-b border-navy-900">
                      <td className="p-3 text-slate-400 uppercase text-[10px]">{label}</td>
                      {sel.map((c) => (
                        <td key={c.id} className={`p-3 ${matches(f, c[f]) ? 'bg-emerald-950/40 text-emerald-300 font-bold' : 'text-slate-200'}`}>{String(c[f])}{matches(f, c[f]) && ' ✓'}</td>
                      ))}
                    </tr>
                  ))}
                  <tr><td className="p-3 text-slate-400 uppercase text-[10px] align-top">MO</td>{sel.map((c) => <td key={c.id} className="p-3 text-slate-300 align-top">{c.description}</td>)}</tr>
                </tbody>
              </table>
            </div>
          )}
          {sel.length >= 2 && <p className="text-[11px] text-emerald-300/80">Highlighted cells are shared across cases — a natural first hint that these may be linked.</p>}
        </>
      )}
    </div>
  );
};
