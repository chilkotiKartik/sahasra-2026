import React, { useState } from 'react';
import { MessageSquarePlus, Loader2, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// AKKA — Community Tip Quick-Capture. Writes to the shared FIELD INTEL pipeline
// that IOs read (cross-role) and pushes to the live alert bus.
export const CommunityTip: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [location, setLocation] = useState('Peenya');
  const [sent, setSent] = useState<any | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setErr(null); if (text.trim().length < 5) { setErr('Enter the tip (min 5 chars).'); return; }
    setBusy(true);
    try { const r = await fetch('/api/catalyst/akka/community-tip', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ officerId: user?.badgeNumber || 'AKKA-55', text: text.trim(), location, kind: 'COMMUNITY_TIP' }) }); const j = await r.json(); if (!j.success) throw new Error(j.message); setSent(j.intel); setText(''); } catch (e: any) { setErr(e.message); }
    setBusy(false);
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-navy-700 pb-4">
        <h1 className="text-2xl font-bold tracking-wide text-slate-100 uppercase font-outfit flex items-center gap-2"><MessageSquarePlus className="w-7 h-7 text-amber-500" /> Community Tip Quick-Capture</h1>
        <p className="text-sm text-slate-400">Capture a citizen tip in the field — it feeds the shared leads pipeline that Investigating Officers see, and pings the live alert bus.</p>
      </div>
      <div className="ops-card p-5 border border-navy-600 space-y-3 max-w-xl">
        <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location / beat" className="w-full px-3 py-2 bg-navy-900 border border-navy-700 rounded text-slate-100 text-sm" />
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder="What did the citizen report?" className="w-full px-3 py-2 bg-navy-900 border border-navy-700 rounded text-slate-100 text-sm" />
        {err && <p className="text-[11px] text-rose-400">{err}</p>}
        <button onClick={submit} disabled={busy} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-navy-950 text-xs font-bold uppercase rounded flex items-center gap-1.5">{busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageSquarePlus className="w-3.5 h-3.5" />} Submit tip</button>
        {sent && (
          <div className="flex items-center gap-2 text-emerald-300 text-xs"><CheckCircle2 className="w-4 h-4" /> Tip {sent.id} filed to the leads pipeline — <button onClick={() => navigate('/witness-manager')} className="underline">IOs see it here</button>.</div>
        )}
      </div>
      <div className="text-[11px] text-slate-500 font-mono border-t border-navy-800 pt-3">Cross-role write: this tip appears on the IO <b>Witness/Informant</b> screen's field-intel inbox and on every dashboard's alert bell.</div>
    </div>
  );
};
