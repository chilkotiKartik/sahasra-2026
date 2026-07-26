import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Clock,
  MapPin,
  FileCheck,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { ExplainabilityDrawer, CitationData } from '../components/ExplainabilityDrawer';
import { CountUpKPI } from '../components/CountUpKPI';

interface AlertItem {
  id: string;
  station: string;
  district: string;
  crimeType: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO';
  timestamp: string;
  description: string;
}

interface ReviewQueueItem {
  id: string;
  title: string;
  station: string;
  district: string;
  aiConfidence: number;
  flagReason: string;
  timestamp: string;
}

interface CommandCenterData {
  metrics: {
    activeHotspotsCount: number;
    pendingAuthorizationsCount: number;
    casesClosedThisWeek: number;
    casesClosedFourWeekAvg: number;
  };
  alerts: AlertItem[];
  reviewQueue: ReviewQueueItem[];
}

export const CommandCenter: React.FC = () => {
  const { t } = useLanguage();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<CommandCenterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  // Real ST-DBSCAN cluster count (reconciles the KPI with the live engine)
  const [realHotspotCount, setRealHotspotCount] = useState<number | null>(null);

  // Explainability Drawer State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeCitation, setActiveCitation] = useState<CitationData | null>(null);

  const fetchCommandCenterData = async () => {
    try {
      const res = await fetch('/api/catalyst/command-center');
      if (!res.ok) return;
      const json = await res.json();
      if (json && json.success && json.data) {
        setData(json.data);
      }
    } catch (err) {
      console.warn('Failed to fetch command center data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Pull the REAL cluster count from the ST-DBSCAN engine so the hotspot KPI
  // matches the Hotspot Map instead of a hardcoded value.
  const fetchRealHotspotCount = async () => {
    try {
      const res = await fetch('/api/catalyst/hotspots');
      const json = await res.json();
      if (json?.success && Array.isArray(json.clusters)) {
        setRealHotspotCount(json.clusters.length);
      }
    } catch {}
  };

  useEffect(() => {
    fetchCommandCenterData();
    fetchRealHotspotCount();
    const interval = setInterval(() => {
      fetchCommandCenterData();
      fetchRealHotspotCount();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleQueueAction = async (queueId: string, action: 'APPROVE' | 'DISMISS') => {
    setActionLoading(queueId);
    try {
      const res = await fetch('/api/catalyst/review-queue/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ queueId, action })
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.updatedQueue)) {
        // Optimistically update UI
        setData(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            metrics: {
              ...prev.metrics,
              pendingAuthorizationsCount: json.updatedQueue.length
            },
            reviewQueue: json.updatedQueue
          };
        });
      }
    } catch {}
    setActionLoading(null);
  };

  const getSeverityBadge = (severity: AlertItem['severity']) => {
    switch (severity) {
      case 'CRITICAL':
        return (
          <span className="px-2 py-0.5 rounded bg-rose-950/80 border border-rose-500/50 text-rose-300 font-mono font-bold text-[10px] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
            CRITICAL SEVERITY
          </span>
        );
      case 'HIGH':
        return (
          <span className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/50 text-amber-300 font-mono font-bold text-[10px]">
            HIGH SEVERITY
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-2 py-0.5 rounded bg-blue-950/80 border border-blue-500/50 text-blue-300 font-mono font-bold text-[10px]">
            MEDIUM SEVERITY
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono font-bold text-[10px]">
            INFORMATIONAL
          </span>
        );
    }
  };

  if (loading || !data) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        <p className="text-xs text-slate-400 font-mono uppercase">{t('Loading Catalyst Command Center...', 'ಕಮಾಂಡ್ ಸೆಂಟರ್ ಲೋಡ್ ಆಗುತ್ತಿದೆ...')}</p>
      </div>
    );
  }

  const { metrics, alerts, reviewQueue } = data;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-navy-700 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-wide text-slate-100 uppercase font-outfit flex items-center gap-2">
            <LayoutDashboard className="w-7 h-7 text-amber-500" />
            {t('State Police Command Center', 'ರಾಜ್ಯ ಪೊಲೀಸ್ ಕಮಾಂಡ್ ಸೆಂಟರ್')}
          </h1>
          <p className="text-sm text-slate-400">
            {t('Real-time anomaly stream & supervisor field patrol review queue', 'ರಿಯಲ್-ಟೈಮ್ ಅನಾಮಲಿ ಮತ್ತು ಆಡಿಟ್ ಪೋರ್ಟಲ್')}
          </p>
        </div>
        <button
          onClick={fetchCommandCenterData}
          className="px-3 py-1.5 bg-navy-800 hover:bg-navy-700 border border-navy-600 text-slate-200 text-xs font-bold rounded-lg flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{t('Refresh Feeds', 'ನವೀಕರಿಸಿ')}</span>
        </button>
      </div>

      {/* 3 KPI Cards Across Top — each drills into the real filtered view */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <CountUpKPI
          value={realHotspotCount ?? metrics.activeHotspotsCount}
          label={t('Active High-Intensity Hotspots', 'ತೀವ್ರತೆಯ ಹಾಟ್‌ಸ್ಪಾಟ್‌ಗಳು')}
          subText="Clustered High-Density ST-DBSCAN Zones"
          trendPct={+12.4}
          onClick={() => navigate('/hotspot-map')}
          drillLabel="Open ST-DBSCAN hotspot map →"
        />
        <CountUpKPI
          value={metrics.pendingAuthorizationsCount}
          label={t('Pending Patrol Authorizations', 'ತಡೆಹಿಡಿಯಲಾದ ಅನುಮೋದನೆಗಳು')}
          subText="AI Flags Awaiting Supervisor Review"
          trendPct={-5.2}
          isPositiveGood={true}
          onClick={() => {
            document.getElementById('review-queue')?.scrollIntoView({ behavior: 'smooth' });
          }}
          drillLabel="Jump to review queue →"
        />
        <CountUpKPI
          value={metrics.casesClosedThisWeek}
          label={t('Cases Closed This Week', 'ಈ ವಾರ ಮುಕ್ತಾಯಗೊಂಡ ಪ್ರಕರಣಗಳು')}
          subText={`Rolling 4-Week Average: ${metrics.casesClosedFourWeekAvg}`}
          trendPct={+8.1}
          isPositiveGood={true}
          onClick={() => navigate('/case-explorer')}
          drillLabel="Open resolved cases →"
        />
      </div>

      {/* 2 Column Layout: Live Alert Feed (Left) & Review Queue (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Column 1: Live Alert Feed */}
        <div className="ops-card p-6 border border-navy-600 space-y-4">
          <div className="flex items-center justify-between border-b border-navy-700 pb-3">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 font-outfit">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              {t('Live Crime Anomaly Stream', 'ಲೈವ್ ಕ್ರೈಮ್ ಅನಾಮಲಿ ಫೀಡ್')}
            </h3>
            <span className="text-xs text-slate-400 font-mono">{alerts.length} Synthetic Alerts</span>
          </div>

          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                tabIndex={0}
                onClick={() => {
                  setActiveCitation({
                    title: `${alert.crimeType} — ${alert.station}`,
                    category: `${alert.severity} Anomaly · ${alert.district}`,
                    fir_citations: [alert.id.toUpperCase()],
                    model_source: 'Live Anomaly Stream · getCommandCenterData()',
                    shap_features: [
                      { feature: alert.crimeType, weight: 0.6 },
                      { feature: `Station: ${alert.station}`, weight: 0.4 }
                    ]
                  });
                  setDrawerOpen(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    (e.currentTarget as HTMLElement).click();
                  }
                }}
                className="p-3.5 bg-navy-950 rounded-lg border border-navy-700 space-y-1.5 cursor-pointer hover:border-amber-500/60 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-colors"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-xs text-slate-200">{alert.crimeType}</span>
                    <span className="text-[11px] text-slate-400">· {alert.station}</span>
                  </div>
                  {getSeverityBadge(alert.severity)}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{alert.description}</p>
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-amber-500" />
                    {alert.district}
                  </span>
                  <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: Supervisor Review Queue */}
        <div id="review-queue" className="ops-card p-6 border border-navy-600 space-y-4">
          <div className="flex items-center justify-between border-b border-navy-700 pb-3">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 font-outfit">
              <FileCheck className="w-4 h-4 text-amber-500" />
              {t('AI Flag Supervisor Review Queue', 'ಎಐ ಪರಿಶೀಲನೆ ಬಾಕಿ ಕ್ಯೂ')}
            </h3>
            <span className="text-xs text-amber-400 font-mono font-bold">{reviewQueue.length} Pending</span>
          </div>

          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
            {reviewQueue.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-navy-700 rounded-lg">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-200">{t('All AI Flags Reviewed!', 'ಎಲ್ಲಾ ಪರಿಶೀಲನೆಗಳು ಪೂರ್ಣಗೊಂಡಿವೆ!')}</p>
                <p className="text-[11px] text-slate-400 mt-1">No pending supervisor authorizations in queue.</p>
              </div>
            ) : (
              reviewQueue.map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-navy-950 rounded-lg border border-navy-700 space-y-3"
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <h4 className="text-xs font-bold text-slate-100">{item.title}</h4>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-600/40">
                        {item.aiConfidence}% AI Confidence
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">📍 {item.station} ({item.district})</p>
                    <p className="text-xs text-amber-300/90 mt-1 bg-amber-950/30 p-2 rounded border border-amber-800/40">
                      ⚠ {item.flagReason}
                    </p>
                  </div>

                  {/* Approve / Dismiss Actions */}
                  <div className="flex items-center space-x-3 pt-1">
                    <button
                      onClick={() => handleQueueAction(item.id, 'APPROVE')}
                      disabled={actionLoading === item.id}
                      className="flex-1 py-2 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-600/50 text-emerald-300 text-xs font-bold uppercase rounded-lg flex items-center justify-center gap-1.5 transition-all"
                    >
                      {actionLoading === item.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve Patrol</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleQueueAction(item.id, 'DISMISS')}
                      disabled={actionLoading === item.id}
                      className="flex-1 py-2 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-600/50 text-rose-300 text-xs font-bold uppercase rounded-lg flex items-center justify-center gap-1.5 transition-all"
                    >
                      {actionLoading === item.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Dismiss Flag</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Global Explainability Drawer */}
      <ExplainabilityDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        data={activeCitation}
      />
    </div>
  );
};
