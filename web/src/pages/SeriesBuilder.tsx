import React, { useEffect, useState } from 'react';
import { Link2, Plus, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ANALYST — Crime Series Builder (group real cases into a named, savable series)
export const SeriesBuilder: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cases, setCases] = useState<any[]>([]);
  const [series, setSeries] = useState<any[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSeries = async () => { const r = await fetch('/api/catalyst/analyst/series'); const j = await r.json(); if (j.success) setSeries(j.series); };
  useEffect(() => { (async () => { try { const r = await fetch('/api/catalyst/cases?limit=100'); const j = await r.json(); if (j.success) setCases(j.cases); await loadSeries(); } catch {} setLoading(false); })(); }, []);

  const toggle = (cn: string) => setPicked((p) => p.includes(cn) ? p.filter((x) => x !== cn) : [...p, cn]);
  const save = async () => {
    setError(null);
    if (!name.trim()) return setError('Give the series a name.');
    if (picked.length < 2) return setError('Select at least 2 cases for a series.');
    const r = await fetch('/api/catalyst/analyst/series', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, caseNumbers: picked, by: user?.badgeNumber || 'ANALYST-104' }) });
    const j = await r.json();
    if (j.success) { setName(''); setPicked([]); await loadSeries(); } else setError(j.message);
  };

  const dateOf = (cn: string) => (cases.find((c) => c.case_number === cn) || {}).date || '—';

  return (
    <div className="space-y-6">
      <div className="border-b border-navy-700 pb-4">
        <h1 className="text-2xl font-bold tracking-wide text-slate-100 uppercase font-outfit flex items-center gap-2"><Link2 className="w-7 h-7 text-amber-500" /> Crime Series Builder</h1>
        <p className="text-sm text-slate-400">Group real cases into a named, savable series — other screens can reference it.</p>
      </div>
      {loading ? <div className="text-slate-500 text-sm flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div> : (
        <>
          <div className="ops-card p-4 border border-navy-600 space-y-3">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Series name, e.g. Peenya Copper Ring" className="w-full px-3 py-2 bg-navy-900 border border-navy-700 rounded text-slate-100 text-sm" />
            <div className="flex flex-wrap gap-2">
              {cases.map((c) => <button key={c.id} onClick={() => toggle(c.case_number)} className={`px-2.5 py-1 rounded text-[11px] font-mono border ${picked.includes(c.case_number) ? 'bg-amber-500 text-navy-950 border-amber-400' : 'bg-navy-900 text-slate-300 border-navy-700'}`}>{c.case_number}</button>)}
            </div>
            {error && <p className="text-[11px] text-rose-400">{error}</p>}
            <button onClick={save} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-navy-950 text-xs font-bold uppercase rounded flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" /> Save Series ({picked.length})</button>
          </div>

          <div className="space-y-3">
            {series.map((s) => (
              <div key={s.id} className="ops-card p-4 border border-navy-600">
                <h3 className="font-bold text-slate-100 text-sm">{s.name} <span className="text-[10px] text-slate-500 font-mono">· {s.caseNumbers.length} cases · by {s.createdBy}</span></h3>
                {/* timeline strip */}
                <div className="flex items-center gap-2 mt-3 overflow-x-auto">
                  {s.caseNumbers.map((cn: string, i: number) => (
                    <React.Fragment key={cn}>
                      <div className="flex flex-col items-center shrink-0">
                        <span className="w-3 h-3 rounded-full bg-amber-500" />
                        <span className="text-[10px] font-mono text-amber-400 mt-1">{cn.split('/').pop()}</span>
                        <span className="text-[9px] text-slate-500">{dateOf(cn)}</span>
                      </div>
                      {i < s.caseNumbers.length - 1 && <div className="h-px flex-1 bg-navy-600 min-w-[24px]" />}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="text-[11px] text-slate-500 font-mono border-t border-navy-800 pt-3">Interlink: series draw from the <button onClick={() => navigate('/pattern-profiler')} className="text-amber-400 underline">Pattern Profiler</button>.</div>
        </>
      )}
    </div>
  );
};
