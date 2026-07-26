import React, { useEffect, useState } from 'react';
import { History, Loader2, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Suspect Timeline — chronological cases/links for one person, from the real graph.
export const SuspectTimeline: React.FC = () => {
  const navigate = useNavigate();
  const [suspects, setSuspects] = useState<any[]>([]);
  const [id, setId] = useState('');
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const g = await fetch('/api/catalyst/network-graph').then((r) => r.json());
        const persons = (g.graphData?.nodes || []).filter((n: any) => n.type === 'Accused');
        setSuspects(persons);
        if (persons[0]) setId(persons[0].id);
      } catch {}
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const j = await fetch(`/api/catalyst/suspect/timeline?suspectId=${encodeURIComponent(id)}`).then((r) => r.json());
      if (j.success) setData(j);
    })();
  }, [id]);

  return (
    <div className="space-y-6">
      <div className="border-b border-navy-700 pb-4">
        <h1 className="text-2xl font-bold tracking-wide text-slate-100 uppercase font-outfit flex items-center gap-2"><History className="w-7 h-7 text-amber-500" /> Suspect Timeline</h1>
        <p className="text-sm text-slate-400">Chronological view of a person's linked cases and evidence across the network.</p>
      </div>
      {loading ? <div className="text-slate-500 text-sm flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div> : (
        <>
          <div className="flex items-center gap-3">
            <label className="text-xs text-slate-400 uppercase font-bold">Suspect:</label>
            <select value={id} onChange={(e) => setId(e.target.value)} className="px-3 py-2 bg-navy-900 border border-navy-700 rounded text-slate-100 text-xs">
              {suspects.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
          {data?.suspect && (
            <div className="ops-card p-4 border border-amber-500/40 bg-gradient-to-r from-amber-950/30 to-navy-950">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-100">{data.suspect.label}</span>
                {data.suspect.status && <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-700">{data.suspect.status}</span>}
                <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1"><Crown className="w-3 h-3" /> degree {data.suspect.degree}</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{data.suspect.gang} · {data.suspect.details}</p>
            </div>
          )}
          <div className="ops-card p-5 border border-navy-600">
            <p className="text-[10px] uppercase text-slate-500 mb-3">Timeline ({data?.events?.length || 0} events)</p>
            {(!data?.events || data.events.length === 0) ? <p className="text-xs text-slate-500 italic">No linked events for this suspect.</p> : (
              <ol className="relative border-l border-navy-700 ml-2 space-y-4">
                {data.events.map((e: any, i: number) => (
                  <li key={i} className="ml-4">
                    <span className="absolute -left-[7px] w-3 h-3 rounded-full bg-amber-500" />
                    <p className="text-[10px] font-mono text-amber-400">{e.date || '(date n/a)'} · {e.kind}</p>
                    <p className="text-sm text-slate-100 font-semibold">{e.label}</p>
                    <p className="text-[11px] text-slate-400">{e.detail}</p>
                  </li>
                ))}
              </ol>
            )}
          </div>
          <div className="text-[11px] text-slate-500 font-mono border-t border-navy-800 pt-3">Interlink: open the full <button onClick={() => navigate('/network-graph')} className="text-amber-400 underline">Network Graph</button>.</div>
        </>
      )}
    </div>
  );
};
