import React, { useEffect, useState } from 'react';
import { Award, Loader2, MapPinned } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// AKKA — Commendation & Verified-Spot Log (on the officer's profile)
export const Commendations: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { (async () => { try { const r = await fetch(`/api/catalyst/akka/commendations?officerId=${user?.badgeNumber || 'AKKA-55'}`); const j = await r.json(); if (j.success) setItems(j.commendations); } catch {} setLoading(false); })(); }, [user]);

  const ICON: Record<string, any> = { VERIFIED_HOTSPOT: MapPinned, DISPATCH_RESOLVED: Award };
  return (
    <div className="space-y-6">
      <div className="border-b border-navy-700 pb-4">
        <h1 className="text-2xl font-bold tracking-wide text-slate-100 uppercase font-outfit flex items-center gap-2"><Award className="w-7 h-7 text-amber-500" /> Commendations & Verified Spots</h1>
        <p className="text-sm text-slate-400">{user?.name || 'Officer'}'s confirmed hotspot verifications and resolved dispatches — recognition record.</p>
      </div>
      <div className="ops-card p-4 border border-amber-500/40 bg-gradient-to-r from-amber-950/30 to-navy-950 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center"><Award className="w-7 h-7 text-amber-400" /></div>
        <div>
          <p className="font-bold text-slate-100">{user?.name} <span className="text-xs font-mono text-slate-400">({user?.badgeNumber})</span></p>
          <p className="text-xs text-amber-300">{items.length} confirmed contributions on record</p>
        </div>
      </div>
      {loading ? <div className="text-slate-500 text-sm flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div> : (
        <div className="space-y-2">
          {items.map((c) => { const Icon = ICON[c.type] || Award; return (
            <div key={c.id} className="ops-card p-3 border border-navy-600 flex items-start gap-3">
              <Icon className="w-5 h-5 text-emerald-400 mt-0.5" />
              <div>
                <p className="text-xs text-slate-200 font-semibold">{c.type.replace('_', ' ')}</p>
                <p className="text-[11px] text-slate-400">{c.detail}</p>
                <p className="text-[10px] font-mono text-slate-500 mt-0.5">{new Date(c.timestamp).toLocaleDateString('en-GB')}</p>
              </div>
            </div>
          ); })}
        </div>
      )}
    </div>
  );
};
