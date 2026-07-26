import React, { useEffect, useState, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import {
  MapPin,
  Filter,
  Sliders,
  Flame,
  Zap,
  Layers,
  Sparkles,
  Clock,
  Calendar,
  AlertTriangle,
  Loader2,
  RefreshCcw,
  Check,
  X
} from 'lucide-react';
import { MapContainer, TileLayer, Circle, Popup, Marker, Polygon, LayerGroup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface ClusterResult {
  id: string;
  name: string;
  district: string;
  station_id: string;
  centerLat: number;
  centerLng: number;
  radiusMeters: number;
  intensityScore: number;
  incidentCount: number;
  primaryCrimeType: string;
  breakdown: Record<string, number>;
  isEmergingTrend: boolean;
  baselineExceededPct: number;
  shapAttribution: { feature: string; weight: number }[];
  incidents?: {
    id: string;
    crime_type: string;
    timestamp: string;
    station_id: string;
    latitude: number;
    longitude: number;
    distanceM: number;
  }[];
}

const CRIME_TYPE_OPTIONS = [
  'All',
  'Burglary & Theft',
  'Vehicle Theft',
  'Cyber & UPI Fraud',
  'Harassment & Assault',
  'Robbery'
];

const TIME_BAND_OPTIONS = [
  { id: 'all', label: 'All Hours (24h)' },
  { id: 'night', label: 'Night (22:00 - 04:00)' },
  { id: 'morning', label: 'Morning (07:00 - 11:00)' },
  { id: 'evening', label: 'Evening (17:00 - 21:00)' }
];

const DATE_RANGE_OPTIONS = [
  { days: 7, label: 'Past 7 Days' },
  { days: 30, label: 'Past 30 Days' },
  { days: 90, label: 'Past 90 Days' }
];

export const HotspotMap: React.FC = () => {
  const { t } = useLanguage();
  const { token } = useAuth();

  const [clusters, setClusters] = useState<ClusterResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [reclustering, setReclustering] = useState(false);
  const [lastComputed, setLastComputed] = useState<string>('—');
  const [selectedCluster, setSelectedCluster] = useState<ClusterResult | null>(null);

  // Filters State
  const [selectedCrimeTypes, setSelectedCrimeTypes] = useState<string[]>(['All']);
  const [timeBand, setTimeBand] = useState<string>('all');
  const [dateRangeDays, setDateRangeDays] = useState<number>(30);

  // Overlay Layers State
  const [showStreetlighting, setShowStreetlighting] = useState(true);
  const [showWardBoundaries, setShowWardBoundaries] = useState(true);
  const [showTransitCorridors, setShowTransitCorridors] = useState(false);

  const fetchClusters = async () => {
    setLoading(true);
    try {
      const crimeParam = selectedCrimeTypes.includes('All') ? '' : selectedCrimeTypes.join(',');
      const url = `/api/catalyst/hotspots?crimeTypes=${encodeURIComponent(crimeParam)}&timeBand=${timeBand}&dateRangeDays=${dateRangeDays}`;
      const res = await fetch(url);
      if (!res.ok) return;
      const json = await res.json();
      if (json && json.success && Array.isArray(json.clusters)) {
        setClusters(json.clusters);
        setLastComputed(new Date().toLocaleTimeString('en-GB', { hour12: false }));
      }
    } catch (err) {
      console.warn('Failed to fetch clusters:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClusters();
  }, [selectedCrimeTypes, timeBand, dateRangeDays]);

  const handleCrimeTypeToggle = (type: string) => {
    if (type === 'All') {
      setSelectedCrimeTypes(['All']);
      return;
    }

    let updated = selectedCrimeTypes.filter(t => t !== 'All');
    if (updated.includes(type)) {
      updated = updated.filter(t => t !== type);
    } else {
      updated.push(type);
    }

    if (updated.length === 0) updated = ['All'];
    setSelectedCrimeTypes(updated);
  };

  const handleTriggerClustering = async () => {
    setReclustering(true);
    try {
      await fetch('/api/catalyst/trigger-clustering', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      await fetchClusters();
    } catch {}
    setReclustering(false);
  };

  const getClusterColor = (score: number) => {
    if (score >= 85) return '#EF4444'; // Critical Red
    if (score >= 65) return '#F59E0B'; // High Amber
    return '#EAB308'; // Medium Yellow
  };

  // Synthetic Overlay Polygons for Ward Boundaries
  const WARD_POLYGONS: [number, number][][] = [
    [[13.045, 77.515], [13.055, 77.545], [13.020, 77.550], [13.015, 77.520]],
    [[12.945, 77.600], [12.955, 77.635], [12.920, 77.640], [12.915, 77.605]],
    [[12.330, 76.620], [12.340, 76.650], [12.310, 76.655], [12.305, 76.625]]
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-navy-700 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-wide text-slate-100 uppercase font-outfit flex items-center gap-2">
            <MapPin className="w-7 h-7 text-amber-500" />
            {t('DBSCAN & Predictive Hotspot Map', 'ಹಾಟ್‌ಸ್ಪಾಟ್ ಮ್ಯಾಪ್ ಮತ್ತು ಅನಾಲಿಟಿಕ್ಸ್')}
          </h1>
          <p className="text-sm text-slate-400">
            {t('ST-DBSCAN spatial clustering, baseline surge alerts & layer overlays across Karnataka', 'ಕ್ರೈಮ್ ಕ್ಲಸ್ಟರ್ ವಿವರಣೆ')}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <button
            onClick={handleTriggerClustering}
            disabled={reclustering}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-navy-950 font-bold text-xs uppercase tracking-wider rounded-lg shadow-ops-glow flex items-center gap-2 transition-all"
          >
            {reclustering ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCcw className="w-4 h-4" />
            )}
            <span>{t('Run On-Demand ST-DBSCAN', 'ಮರು ಕ್ಲಸ್ಟರ್ ಮಾಡಿ')}</span>
          </button>
          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
            <span className="px-2 py-0.5 rounded bg-navy-900 border border-navy-700">
              <span className="text-amber-400 font-bold">{clusters.length}</span> active clusters
            </span>
            <span className="px-2 py-0.5 rounded bg-navy-900 border border-navy-700 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Last computed:{' '}
              <span className="text-emerald-400">{reclustering ? 'computing…' : lastComputed}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Dynamic Filter Controls Panel */}
      <div className="ops-card p-4 space-y-4 border border-navy-600">
        <div className="flex items-center justify-between border-b border-navy-700 pb-2">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase text-slate-200">
            <Filter className="w-4 h-4 text-amber-500" />
            <span>{t('Backend Query Filters', 'ಫಿಲ್ಟರ್ ಶೋಧ')}</span>
          </div>
          {loading && (
            <span className="text-xs text-amber-400 font-mono flex items-center gap-1.5 animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Re-querying Catalyst Engine...
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Filter 1: Crime Types Multi-Select */}
          <div className="space-y-1.5">
            <label className="block text-slate-400 font-semibold uppercase text-[11px]">
              {t('Crime Type Scope:', 'ಅಪರಾಧ ಪ್ರಕಾರ:')}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CRIME_TYPE_OPTIONS.map((type) => {
                const active = selectedCrimeTypes.includes(type);
                return (
                  <button
                    key={type}
                    onClick={() => handleCrimeTypeToggle(type)}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold border transition-all ${
                      active
                        ? 'bg-amber-500 text-navy-950 border-amber-400 font-bold'
                        : 'bg-navy-900 text-slate-300 border-navy-700 hover:border-navy-500'
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filter 2: Time-of-Day Band */}
          <div className="space-y-1.5">
            <label className="block text-slate-400 font-semibold uppercase text-[11px] flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              {t('Time-of-Day Band:', 'ಸಮಯಾವಧಿ:')}
            </label>
            <select
              value={timeBand}
              onChange={(e) => setTimeBand(e.target.value)}
              className="w-full px-3 py-1.5 bg-navy-900 border border-navy-700 rounded text-slate-100 font-mono focus:outline-none focus:border-amber-500"
            >
              {TIME_BAND_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Filter 3: Date Range */}
          <div className="space-y-1.5">
            <label className="block text-slate-400 font-semibold uppercase text-[11px] flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-amber-500" />
              {t('Historical Horizon:', 'ದಿನಗಳ ವ್ಯಾಪ್ತಿ:')}
            </label>
            <div className="flex space-x-2">
              {DATE_RANGE_OPTIONS.map((opt) => (
                <button
                  key={opt.days}
                  onClick={() => setDateRangeDays(opt.days)}
                  className={`flex-1 py-1.5 rounded text-[11px] font-bold border transition-all ${
                    dateRangeDays === opt.days
                      ? 'bg-navy-700 text-amber-400 border-amber-500'
                      : 'bg-navy-900 text-slate-400 border-navy-700 hover:text-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Toggleable Layer Overlays */}
        <div className="pt-2 border-t border-navy-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="text-slate-400 font-semibold uppercase text-[11px] flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-amber-500" />
            {t('GIS Overlays:', 'ಮ್ಯಾಪ್ ಲೇಯರ್‌ಗಳು:')}
          </span>

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center space-x-1.5 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={showStreetlighting}
                onChange={(e) => setShowStreetlighting(e.target.checked)}
                className="accent-amber-500 rounded"
              />
              <span>Streetlight Outage Dark Spots</span>
            </label>

            <label className="flex items-center space-x-1.5 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={showWardBoundaries}
                onChange={(e) => setShowWardBoundaries(e.target.checked)}
                className="accent-amber-500 rounded"
              />
              <span>Ward / PS Boundaries</span>
            </label>

            <label className="flex items-center space-x-1.5 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={showTransitCorridors}
                onChange={(e) => setShowTransitCorridors(e.target.checked)}
                className="accent-amber-500 rounded"
              />
              <span>Highway Transit Corridors</span>
            </label>
          </div>
        </div>
      </div>

      {/* Interactive Map Shell */}
      <div className="ops-card h-[540px] border border-navy-600 rounded-xl overflow-hidden relative shadow-ops-panel">
        <MapContainer
          center={[13.0, 76.5]}
          zoom={7}
          scrollWheelZoom={true}
          style={{ width: '100%', height: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Toggleable Ward Boundary Polygons */}
          {showWardBoundaries &&
            WARD_POLYGONS.map((poly, idx) => (
              <Polygon
                key={idx}
                positions={poly}
                pathOptions={{
                  color: '#3B64A6',
                  fillColor: '#1F3864',
                  fillOpacity: 0.15,
                  weight: 1.5,
                  dashArray: '4, 4'
                }}
              />
            ))}

          {/* Render Cluster Circles with Intensity Color & Pulsing Emerging Alert */}
          {clusters.map((cluster) => {
            const color = getClusterColor(cluster.intensityScore);
            return (
              <React.Fragment key={cluster.id}>
                {/* Emerging Trend Pulsing Outer Ring */}
                {cluster.isEmergingTrend && (
                  <Circle
                    center={[cluster.centerLat, cluster.centerLng]}
                    radius={cluster.radiusMeters * 1.5}
                    pathOptions={{
                      color: '#EF4444',
                      fillColor: '#EF4444',
                      fillOpacity: 0.25,
                      weight: 2
                    }}
                  />
                )}

                {/* Core DBSCAN Cluster Circle */}
                <Circle
                  center={[cluster.centerLat, cluster.centerLng]}
                  radius={cluster.radiusMeters}
                  eventHandlers={{ click: () => setSelectedCluster(cluster) }}
                  pathOptions={{
                    color: color,
                    fillColor: color,
                    fillOpacity: selectedCluster?.id === cluster.id ? 0.7 : 0.45,
                    weight: selectedCluster?.id === cluster.id ? 4 : 2
                  }}
                >
                  {/* Interactive Popup on Click */}
                  <Popup className="custom-leaflet-popup">
                    <div className="p-2 space-y-2 text-navy-950 font-sans min-w-[220px]">
                      <div className="border-b pb-1.5">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-sm text-navy-900">{cluster.name}</h4>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded text-white ${
                              cluster.intensityScore >= 85 ? 'bg-red-600' : 'bg-amber-600'
                            }`}
                          >
                            Score: {cluster.intensityScore}/100
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 font-semibold">{cluster.station_id} ({cluster.district})</p>
                      </div>

                      {cluster.isEmergingTrend && (
                        <div className="p-1.5 bg-red-100 border border-red-300 rounded text-[11px] text-red-800 font-bold flex items-center gap-1">
                          <Flame className="w-3.5 h-3.5 text-red-600" />
                          <span>EMERGING TREND (+{cluster.baselineExceededPct}% Baseline Surge)</span>
                        </div>
                      )}

                      <div className="text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="font-semibold text-slate-700">Total Incidents:</span>
                          <span className="font-bold text-navy-950 font-mono">{cluster.incidentCount} cases</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-semibold text-slate-700">Primary Category:</span>
                          <span className="font-bold text-amber-700">{cluster.primaryCrimeType}</span>
                        </div>
                      </div>

                      {/* Crime Breakdown List */}
                      <div className="pt-1.5 border-t text-[11px]">
                        <p className="font-bold text-slate-700 mb-1">Crime Breakdown:</p>
                        <div className="space-y-0.5 font-mono text-[10px]">
                          {Object.entries(cluster.breakdown).map(([type, cnt]) => (
                            <div key={type} className="flex justify-between text-slate-700">
                              <span>{type}:</span>
                              <span className="font-bold">{cnt}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedCluster(cluster)}
                        className="w-full mt-1 py-1 bg-navy-900 text-amber-400 rounded text-[11px] font-bold hover:bg-navy-800"
                      >
                        View {cluster.incidentCount} real incidents →
                      </button>
                    </div>
                  </Popup>
                </Circle>
              </React.Fragment>
            );
          })}
        </MapContainer>

        {/* Floating Map Legend & Summary Bar */}
        <div className="absolute bottom-4 left-4 z-[1000] ops-card p-3 border border-navy-600 bg-navy-950/90 text-xs space-y-1.5">
          <div className="flex items-center space-x-3 text-[11px] font-semibold">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-rose-500"></span> Critical (85+)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-amber-500"></span> High (65-84)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-yellow-500"></span> Medium (&lt;65)
            </span>
            <span className="flex items-center gap-1 text-rose-400 font-bold animate-pulse">
              <span className="w-3 h-3 rounded-full border-2 border-rose-500"></span> Emerging Surge Alert
            </span>
          </div>
        </div>
      </div>

      {/* ── ST-DBSCAN Cluster Breakdown Drawer (real incident list) ─────────── */}
      {selectedCluster && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-[420px] z-[3500] bg-navy-950 border-l border-navy-700 shadow-2xl flex flex-col">
          <div className="p-4 border-b border-navy-700 flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-100">{selectedCluster.name}</h3>
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                {selectedCluster.station_id} · {selectedCluster.district} · cluster {selectedCluster.id}
              </p>
              <div className="flex flex-wrap gap-2 mt-2 text-[10px] font-mono">
                <span className="px-2 py-0.5 rounded bg-navy-900 border border-navy-700 text-amber-400">
                  {selectedCluster.incidentCount} incidents
                </span>
                <span className="px-2 py-0.5 rounded bg-navy-900 border border-navy-700 text-slate-300">
                  intensity {selectedCluster.intensityScore}/100
                </span>
                <span className="px-2 py-0.5 rounded bg-navy-900 border border-navy-700 text-slate-300">
                  ε=600m
                </span>
                {selectedCluster.isEmergingTrend && (
                  <span className="px-2 py-0.5 rounded bg-rose-950 border border-rose-600 text-rose-300">
                    +{selectedCluster.baselineExceededPct}% surge
                  </span>
                )}
              </div>
            </div>
            <button onClick={() => setSelectedCluster(null)} className="p-1 text-slate-400 hover:text-slate-200">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-4 py-2 border-b border-navy-800 text-[10px] font-mono text-slate-500 uppercase tracking-wider grid grid-cols-[1fr_auto] gap-2">
            <span>Incident · type · time</span>
            <span>dist</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-navy-900">
            {(selectedCluster.incidents || []).map((inc) => (
              <div key={inc.id} className="px-4 py-2 hover:bg-navy-900/60 grid grid-cols-[1fr_auto] gap-2 items-center">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-amber-400 font-bold">{inc.id}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-navy-900 border border-navy-700 text-slate-300 truncate">
                      {inc.crime_type}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {new Date(inc.timestamp).toLocaleString('en-GB', { hour12: false })} · {inc.station_id}
                  </p>
                </div>
                <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap">{inc.distanceM} m</span>
              </div>
            ))}
            {(!selectedCluster.incidents || selectedCluster.incidents.length === 0) && (
              <p className="p-6 text-center text-xs text-slate-500">No incident rows attached to this cluster.</p>
            )}
          </div>

          <div className="p-3 border-t border-navy-800 text-[10px] font-mono text-slate-500">
            Real rows assigned to {selectedCluster.id} during the last ST-DBSCAN run · showing up to 150
          </div>
        </div>
      )}
    </div>
  );
};
