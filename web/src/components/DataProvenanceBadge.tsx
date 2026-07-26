import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Database, Clock, ShieldCheck } from 'lucide-react';

// Maps each screen to the REAL backend data source powering it.
const PROVENANCE: Record<string, { source: string; engine: string }> = {
  '/command-center': {
    source: 'command_center_metrics · live_alerts',
    engine: 'getCommandCenterData() · Catalyst DataStore'
  },
  '/hotspot-map': {
    source: 'incidents (ST-incident store)',
    engine: 'runSpatiotemporalDBSCAN() · ε=600m'
  },
  '/network-graph': {
    source: 'case_linkages · suspects',
    engine: 'getNetworkGraph() · degree centrality'
  },
  '/camera-intelligence': {
    source: 'cases ledger · ANPR watchlist',
    engine: 'YOLOv8 ANPR · live case cross-ref'
  },
  '/case-explorer': {
    source: 'cases (KSP FIR ledger)',
    engine: 'queryCasesData() · paginated'
  },
  '/trends': {
    source: 'crime_trends timeseries',
    engine: 'getTrendsAndForecastData()'
  },
  '/governance': {
    source: 'audit_ledger (append-only)',
    engine: 'SHA-256 hash-chain verifier'
  }
};

export const DataProvenanceBadge: React.FC = () => {
  const { pathname } = useLocation();
  const [refreshed, setRefreshed] = useState<string>('—');
  const [datasetRows, setDatasetRows] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [h, s] = await Promise.all([
          fetch('/api/health').then((r) => r.json()).catch(() => null),
          fetch('/api/dataset/summary').then((r) => r.json()).catch(() => null)
        ]);
        if (cancelled) return;
        if (h?.timestamp) {
          setRefreshed(new Date(h.timestamp).toLocaleTimeString('en-GB', { hour12: false }));
        } else {
          setRefreshed(new Date().toLocaleTimeString('en-GB', { hour12: false }));
        }
        if (s?.totalCrimes) setDatasetRows(s.totalCrimes);
      } catch {
        if (!cancelled) setRefreshed(new Date().toLocaleTimeString('en-GB', { hour12: false }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const prov = PROVENANCE[pathname] || {
    source: 'SAHASRA data plane',
    engine: 'Catalyst serverless functions'
  };

  return (
    <footer className="mt-8 border-t border-navy-800 pt-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-[10px] font-mono text-slate-500">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-navy-900 border border-navy-700 text-slate-400">
          <Database className="w-3 h-3 text-amber-500/80" />
          DATA SOURCE: <span className="text-slate-300">{prov.source}</span>
        </span>
        <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-navy-900 border border-navy-700 text-slate-400">
          <ShieldCheck className="w-3 h-3 text-emerald-500/80" />
          ENGINE: <span className="text-slate-300">{prov.engine}</span>
        </span>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {datasetRows != null && (
          <span className="px-2 py-1 rounded bg-navy-900 border border-navy-700 text-slate-400">
            KSP corpus: <span className="text-slate-300">{datasetRows.toLocaleString()} records</span>
          </span>
        )}
        <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-navy-900 border border-navy-700 text-slate-400">
          <Clock className="w-3 h-3 text-slate-500" />
          LAST REFRESHED: <span className="text-emerald-400">{refreshed}</span>
        </span>
      </div>
    </footer>
  );
};
