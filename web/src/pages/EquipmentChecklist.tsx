import React, { useEffect, useState } from 'react';
import { ShieldCheck, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ITEMS = ['Body camera', 'Radio / wireless set', 'Vehicle fuel & tyres', 'First-aid kit', 'Torch & baton', 'ID & duty roster'];

// AKKA — Pre-Shift Equipment/Vehicle Checklist (logged per shift start)
export const EquipmentChecklist: React.FC = () => {
  const { user } = useAuth();
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [history, setHistory] = useState<any[]>([]);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = async () => { try { const r = await fetch(`/api/catalyst/akka/equipment?officerId=${user?.badgeNumber || 'AKKA-55'}`); const j = await r.json(); if (j.success) setHistory(j.checks); } catch {} };
  useEffect(() => { load(); }, []);

  const submit = async () => {
    setBusy(true);
    try { await fetch('/api/catalyst/akka/equipment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ officerId: user?.badgeNumber || 'AKKA-55', items: checked }) }); setSaved(true); await load(); } catch {}
    setBusy(false);
  };
  const allOk = ITEMS.every((i) => checked[i]);

  return (
    <div className="space-y-6">
      <div className="border-b border-navy-700 pb-4">
        <h1 className="text-2xl font-bold tracking-wide text-slate-100 uppercase font-outfit flex items-center gap-2"><ShieldCheck className="w-7 h-7 text-amber-500" /> Pre-Shift Equipment Checklist</h1>
        <p className="text-sm text-slate-400">Confirm your kit before going on patrol — each submission is logged for the shift.</p>
      </div>
      <div className="ops-card p-5 border border-navy-600 space-y-2 max-w-xl">
        {ITEMS.map((i) => (
          <label key={i} className="flex items-center gap-3 p-2 rounded hover:bg-navy-900 cursor-pointer text-sm text-slate-200">
            <input type="checkbox" checked={!!checked[i]} onChange={(e) => { setChecked({ ...checked, [i]: e.target.checked }); setSaved(false); }} className="accent-amber-500 w-4 h-4" /> {i}
          </label>
        ))}
        <button onClick={submit} disabled={busy || !allOk} className="mt-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-navy-950 text-xs font-bold uppercase rounded flex items-center gap-1.5">{busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} {allOk ? 'Submit shift check' : 'Tick all items to submit'}</button>
        {saved && <p className="text-xs text-emerald-300 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Shift equipment check logged.</p>}
      </div>
      <div className="ops-card p-4 border border-navy-600">
        <p className="text-[10px] uppercase text-slate-500 mb-2">Recent checks ({history.length})</p>
        {history.length === 0 ? <p className="text-xs text-slate-500 italic">No prior checks logged.</p> : history.map((h) => (
          <p key={h.id} className="text-[11px] font-mono text-slate-400">{new Date(h.timestamp).toLocaleString('en-GB', { hour12: false })} — {Object.values(h.items).filter(Boolean).length}/{ITEMS.length} items ✓</p>
        ))}
      </div>
    </div>
  );
};
