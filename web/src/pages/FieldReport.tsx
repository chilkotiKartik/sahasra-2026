import React, { useState } from 'react';
import { Zap, Loader2, CheckCircle2, Mic } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// AKKA — Quick Voice/Photo Field Report (rapid capture → shared leads pipeline)
export const FieldReport: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [listening, setListening] = useState(false);
  const [sent, setSent] = useState<any | null>(null);
  const [busy, setBusy] = useState(false);

  const voice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setText((t) => t + ' [voice input not supported on this device] '); return; }
    const rec = new SR(); rec.lang = 'en-IN'; rec.onresult = (e: any) => setText((t) => (t + ' ' + e.results[0][0].transcript).trim()); rec.onend = () => setListening(false); rec.onerror = () => setListening(false);
    setListening(true); rec.start();
  };

  const submit = async () => {
    if (text.trim().length < 3) return;
    setBusy(true);
    try { const r = await fetch('/api/catalyst/akka/community-tip', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ officerId: user?.badgeNumber || 'AKKA-55', text: text.trim(), location: 'Field', kind: 'FIELD_REPORT' }) }); const j = await r.json(); if (j.success) { setSent(j.intel); setText(''); } } catch {}
    setBusy(false);
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-navy-700 pb-4">
        <h1 className="text-2xl font-bold tracking-wide text-slate-100 uppercase font-outfit flex items-center gap-2"><Zap className="w-7 h-7 text-amber-500" /> Quick Field Report</h1>
        <p className="text-sm text-slate-400">One-handed rapid incident capture (voice or text) — feeds the same real leads pipeline IOs work from.</p>
      </div>
      <div className="ops-card p-5 border border-navy-600 space-y-3 max-w-xl">
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder="Dictate or type what you're seeing…" className="w-full px-3 py-2 bg-navy-900 border border-navy-700 rounded text-slate-100 text-sm" />
        <div className="flex gap-2">
          <button onClick={voice} className={`px-3 py-2 rounded text-xs font-bold flex items-center gap-1.5 ${listening ? 'bg-rose-600 text-white animate-pulse' : 'bg-navy-800 border border-navy-600 text-slate-200'}`}><Mic className="w-3.5 h-3.5" /> {listening ? 'Listening…' : 'Voice'}</button>
          <button onClick={submit} disabled={busy} className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-navy-950 text-xs font-bold uppercase rounded flex items-center justify-center gap-1.5">{busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />} File report</button>
        </div>
        {sent && <div className="flex items-center gap-2 text-emerald-300 text-xs"><CheckCircle2 className="w-4 h-4" /> Report {sent.id} filed — <button onClick={() => navigate('/beat-feed')} className="underline">visible to control room</button>.</div>}
      </div>
    </div>
  );
};
