import React, { useState, useRef } from 'react';
import { UserSearch, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// IO feature — Repeat Person/Address Auto-Flag. As the officer types a suspect
// name or vehicle plate during FIR intake, a real-time Jaro-Winkler check runs
// against existing police records and surfaces priors immediately.
export const RepeatFlag: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [plate, setPlate] = useState('');
  const [result, setResult] = useState<any | null>(null);
  const [checking, setChecking] = useState(false);
  const debounce = useRef<any>();

  const runCheck = (n: string, p: string) => {
    clearTimeout(debounce.current);
    if (!n.trim() && !p.trim()) { setResult(null); return; }
    debounce.current = setTimeout(async () => {
      setChecking(true);
      try {
        const r = await fetch('/api/catalyst/io/repeat-check', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: n, plate: p }) });
        setResult(await r.json());
      } catch {}
      setChecking(false);
    }, 350);
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-navy-700 pb-4">
        <h1 className="text-2xl font-bold tracking-wide text-slate-100 uppercase font-outfit flex items-center gap-2">
          <UserSearch className="w-7 h-7 text-amber-500" /> Repeat Person / Vehicle Auto-Flag
        </h1>
        <p className="text-sm text-slate-400">During FIR intake, priors are surfaced in real time — fuzzy (Jaro-Winkler) match against existing records, so a misspelt name still catches.</p>
      </div>

      <div className="ops-card p-5 border border-navy-600 space-y-3">
        <span className="text-[10px] uppercase font-bold text-slate-400">New FIR — party details</span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] uppercase text-slate-400 mb-1">Suspect / person name</label>
            <input value={name} onChange={(e) => { setName(e.target.value); runCheck(e.target.value, plate); }} placeholder="e.g. Ramesh Kumar" className="w-full px-3 py-2 bg-navy-900 border border-navy-700 rounded text-slate-100 text-sm" />
          </div>
          <div>
            <label className="block text-[10px] uppercase text-slate-400 mb-1">Vehicle plate</label>
            <input value={plate} onChange={(e) => { setPlate(e.target.value); runCheck(name, e.target.value); }} placeholder="e.g. KA-04-MH-1234" className="w-full px-3 py-2 bg-navy-900 border border-navy-700 rounded text-slate-100 text-sm font-mono" />
          </div>
        </div>
        <p className="text-[10px] text-slate-500 flex items-center gap-1">{checking ? <><Loader2 className="w-3 h-3 animate-spin" /> checking records…</> : 'Try "Cobra Ramesh" or "KA-04-MH-1234" — real seeded priors.'}</p>
      </div>

      {result && (
        result.hasPriors ? (
          <div className="ops-card p-4 border border-rose-600/50 bg-rose-950/20 space-y-2">
            <p className="text-sm font-bold text-rose-300 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Prior record found — this party has {result.matches.length} existing case(s)</p>
            {result.matches.map((m: any) => (
              <div key={m.firNumber} className="p-2.5 bg-navy-950 rounded border border-navy-800">
                <p className="text-xs text-slate-200 font-semibold">This looks like the same {m.matchedOn} as <span className="text-rose-300">{m.firNumber}</span> — "{m.title}"</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Suspect: {m.suspectName} · {m.vehiclePlate} · {m.crimeType}</p>
                <p className="text-[10px] font-mono text-amber-400 mt-0.5">match confidence {m.confidence}% on {m.matchedOn}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="ops-card p-4 border border-emerald-600/40 bg-emerald-950/10 flex items-center gap-2 text-emerald-300 text-sm">
            <CheckCircle2 className="w-4 h-4" /> No prior records match — appears to be a first-time party.
          </div>
        )
      )}

      <div className="text-[11px] text-slate-500 font-mono border-t border-navy-800 pt-3">
        Interlink: matched priors open in <button onClick={() => navigate('/case-explorer')} className="text-amber-400 underline">Case Explorer</button> and can be attached to the case <button onClick={() => navigate('/case-diary')} className="text-amber-400 underline">Diary</button>.
      </div>
    </div>
  );
};
