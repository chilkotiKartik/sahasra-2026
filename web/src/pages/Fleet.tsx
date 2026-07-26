import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import { Radio, Navigation, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// SP Feature #9 — Akka Patrol Fleet (live simulated telemetry + nearest dispatch)
const STATUS_COLOR: Record<string, string> = {
  PATROLLING: '#10b981', AVAILABLE: '#38bdf8', ON_DISPATCH: '#f59e0b'
};

// preset incident locations to test "Dispatch Nearest Unit"
const TEST_INCIDENTS = [
  { label: 'Peenya break-in', lat: 13.036, lng: 77.545 },
  { label: 'Koramangala snatch', lat: 12.936, lng: 77.628 },
  { label: 'Mysuru Gokulam theft', lat: 12.312, lng: 76.642 }
];

export const Fleet: React.FC = () => {
  const navigate = useNavigate();
  const [officers, setOfficers] = useState<any[]>([]);
  const [dispatchResult, setDispatchResult] = useState<any | null>(null);
  const [dispatching, setDispatching] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(TEST_INCIDENTS[0]);
  const timer = useRef<any>();

  const poll = async () => {
    try { const r = await fetch('/api/catalyst/fleet'); const j = await r.json(); if (j.success) setOfficers(j.officers); } catch {}
  };
  useEffect(() => {
    poll();
    timer.current = setInterval(poll, 3000);
    return () => clearInterval(timer.current);
  }, []);

  const dispatchNearest = async () => {
    setDispatching(true);
    try {
      const r = await fetch('/api/catalyst/fleet/dispatch-nearest', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat: selectedIncident.lat, lng: selectedIncident.lng, label: selectedIncident.label })
      });
      setDispatchResult(await r.json());
      await poll();
    } catch {}
    setDispatching(false);
  };

  const icon = (color: string) =>
    L.divIcon({
      className: '',
      html: `<div style="width:16px;height:16px;border-radius:50%;background:${color};border:2px solid #0b1220;box-shadow:0 0 8px ${color}"></div>`,
      iconSize: [16, 16], iconAnchor: [8, 8]
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-navy-700 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-wide text-slate-100 uppercase font-outfit flex items-center gap-2">
            <Radio className="w-7 h-7 text-amber-500" /> Akka Patrol Fleet
          </h1>
          <p className="text-sm text-slate-400">
            <span className="text-amber-400 font-mono">Simulated Field Telemetry — Live Interval Feed</span> · positions update every 5s server-side · real haversine nearest-unit dispatch
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 ops-card border border-navy-600 rounded-xl overflow-hidden h-[460px]">
          <MapContainer center={[12.97, 77.4]} zoom={8} style={{ width: '100%', height: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {officers.map((o) => (
              <React.Fragment key={o.id}>
                <Polyline positions={o.waypoints} pathOptions={{ color: STATUS_COLOR[o.status], weight: 1, opacity: 0.4, dashArray: '4,4' }} />
                {o.history?.length > 1 && (
                  <Polyline positions={o.history.map((h: any) => [h.lat, h.lng])} pathOptions={{ color: STATUS_COLOR[o.status], weight: 2, opacity: 0.8 }} />
                )}
                <Marker position={[o.lat, o.lng]} icon={icon(STATUS_COLOR[o.status])}>
                  <Popup>
                    <div className="text-navy-950 text-xs space-y-0.5">
                      <b>{o.name}</b> ({o.badge})<br />
                      Status: {o.status}<br />
                      {o.currentDispatch && <>Dispatch: {o.currentDispatch}<br /></>}
                      {o.lat.toFixed(4)}, {o.lng.toFixed(4)}
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            ))}
            <CircleMarker center={[selectedIncident.lat, selectedIncident.lng]} radius={9} pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.6 }}>
              <Popup><span className="text-navy-950 text-xs">Incident: {selectedIncident.label}</span></Popup>
            </CircleMarker>
          </MapContainer>
        </div>

        <div className="space-y-4">
          <div className="ops-card p-4 border border-navy-600 space-y-3">
            <h3 className="text-xs font-bold uppercase text-slate-200 flex items-center gap-2"><Navigation className="w-4 h-4 text-amber-500" /> Dispatch Nearest Unit</h3>
            <select value={selectedIncident.label} onChange={(e) => setSelectedIncident(TEST_INCIDENTS.find((i) => i.label === e.target.value)!)} className="w-full px-3 py-2 bg-navy-900 border border-navy-700 rounded text-slate-100 text-xs">
              {TEST_INCIDENTS.map((i) => <option key={i.label}>{i.label}</option>)}
            </select>
            <button onClick={dispatchNearest} disabled={dispatching} className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-navy-950 font-bold text-xs uppercase rounded-lg flex items-center justify-center gap-2">
              {dispatching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />} Compute & Dispatch
            </button>
            {dispatchResult?.success && (
              <div className="text-xs space-y-1 bg-navy-950 border border-emerald-700/50 rounded p-2.5">
                <p className="text-emerald-400 font-bold">✓ Dispatched: {dispatchResult.dispatched.name}</p>
                <p className="font-mono text-slate-300">{dispatchResult.dispatched.distanceM} m away · ETA ~{dispatchResult.dispatched.etaMin} min</p>
                <p className="text-[10px] text-slate-500 font-mono pt-1 border-t border-navy-800">Ranked by real distance:</p>
                {dispatchResult.ranking.map((r: any, i: number) => (
                  <p key={r.id} className="text-[10px] font-mono text-slate-400">{i + 1}. {r.name.split('—')[1]?.trim()} — {r.distanceM} m</p>
                ))}
              </div>
            )}
          </div>

          <div className="ops-card p-4 border border-navy-600 space-y-2">
            <h3 className="text-xs font-bold uppercase text-slate-200">On-Duty Units ({officers.length})</h3>
            {officers.map((o) => (
              <div key={o.id} className="flex items-center justify-between text-xs p-2 bg-navy-950 rounded border border-navy-800">
                <div>
                  <p className="text-slate-200 font-bold">{o.badge}</p>
                  <p className="text-[10px] font-mono text-slate-500">{o.lat.toFixed(3)}, {o.lng.toFixed(3)} · {o.heading}</p>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: STATUS_COLOR[o.status] + '30', color: STATUS_COLOR[o.status] }}>{o.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="text-[11px] text-slate-500 font-mono border-t border-navy-800 pt-3">
        Interlink: dispatch targets come from <button onClick={() => navigate('/hotspot-map')} className="text-amber-400 underline">Hotspot Map</button> clusters and <button onClick={() => navigate('/command-center')} className="text-amber-400 underline">Command Center</button> alerts.
      </div>
    </div>
  );
};
