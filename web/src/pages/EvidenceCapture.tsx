import React, { useState } from 'react';
import { Camera, MapPin, Clock, Loader2, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const CASES = [
  { id: 'case-001', label: 'KSP/2026/FIR-1042 — Peenya Burglary' },
  { id: 'case-002', label: 'KSP/2026/CYBER-501 — UPI Fraud' },
  { id: 'case-003', label: 'MYS/2026/FIR-112 — Chain Snatching' }
];

// IO — Mobile Evidence Capture with Geotag. Photo capture embeds real device
// GPS + timestamp into the case's evidence record (Evidence Locker).
export const EvidenceCapture: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [caseId, setCaseId] = useState('case-001');
  const [preview, setPreview] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ lat?: number; lng?: number; at: string; name: string } | null>(null);
  const [saved, setSaved] = useState<any | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setErr(null); setSaved(null);
    setPreview(URL.createObjectURL(f));
    const at = new Date().toISOString();
    let lat: number | undefined, lng: number | undefined;
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true, timeout: 4000 }));
      lat = pos.coords.latitude; lng = pos.coords.longitude;
    } catch { /* geotag optional but flagged */ }
    setMeta({ lat, lng, at, name: f.name });
  };

  const commit = async () => {
    if (!meta) { setErr('Capture or select a photo first.'); return; }
    setBusy(true);
    try {
      const geo = meta.lat != null ? `${meta.lat.toFixed(5)}, ${meta.lng!.toFixed(5)}` : 'no GPS';
      const name = `Field photo (${meta.name}) · geotag ${geo} · ${new Date(meta.at).toLocaleString('en-GB', { hour12: false })}`;
      const r = await fetch('/api/catalyst/io/evidence', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId, name, type: 'Digital', officer: user?.badgeNumber || 'IO-402' }) });
      const j = await r.json();
      if (!j.success) throw new Error(j.message);
      setSaved(j.item);
    } catch (e: any) { setErr(e.message); }
    setBusy(false);
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-navy-700 pb-4">
        <h1 className="text-2xl font-bold tracking-wide text-slate-100 uppercase font-outfit flex items-center gap-2"><Camera className="w-7 h-7 text-amber-500" /> Mobile Evidence Capture</h1>
        <p className="text-sm text-slate-400">Capture a scene photo — device GPS + timestamp are embedded and the item is logged to the case's Evidence Locker.</p>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-xs text-slate-400 uppercase font-bold">Case:</label>
        <select value={caseId} onChange={(e) => setCaseId(e.target.value)} className="px-3 py-2 bg-navy-900 border border-navy-700 rounded text-slate-100 text-xs">{CASES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select>
      </div>

      <div className="ops-card p-5 border border-navy-600 space-y-4">
        <label className="block">
          <span className="text-xs text-slate-300 font-bold uppercase">Capture / choose photo</span>
          <input type="file" accept="image/*" capture="environment" onChange={onFile} className="mt-2 block w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded file:border-0 file:bg-amber-500 file:text-navy-950 file:font-bold" />
        </label>
        {preview && <img src={preview} alt="capture" className="max-h-56 rounded-lg border border-navy-700" />}
        {meta && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
            <span className="flex items-center gap-1 text-slate-300"><MapPin className="w-3.5 h-3.5 text-amber-400" /> {meta.lat != null ? `${meta.lat.toFixed(5)}, ${meta.lng!.toFixed(5)}` : 'GPS unavailable / denied'}</span>
            <span className="flex items-center gap-1 text-slate-300"><Clock className="w-3.5 h-3.5 text-amber-400" /> {new Date(meta.at).toLocaleString('en-GB', { hour12: false })}</span>
          </div>
        )}
        {err && <p className="text-[11px] text-rose-400">{err}</p>}
        <button onClick={commit} disabled={busy || !meta} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-navy-950 text-xs font-bold uppercase rounded flex items-center gap-1.5">{busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />} Log to evidence</button>
        {saved && (
          <div className="flex items-center gap-2 text-emerald-300 text-xs"><CheckCircle2 className="w-4 h-4" /> Logged as {saved.id} — <button onClick={() => navigate('/evidence-locker')} className="underline">open Evidence Locker</button></div>
        )}
      </div>
      <p className="text-[10px] text-slate-500 italic">Note: the image bytes stay on-device in this demo; the geotag + timestamp + custody entry are written to the real evidence record. On Catalyst, wire the file to Stratus object storage.</p>
    </div>
  );
};
