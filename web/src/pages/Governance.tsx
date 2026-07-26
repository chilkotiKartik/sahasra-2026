import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import {
  ShieldAlert,
  CheckCircle2,
  Lock,
  Search,
  RefreshCw,
  Scale,
  FileCheck,
  AlertTriangle,
  Users,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface AuditRecord {
  id: string;
  timestamp: string;
  user_id: string;
  user_role: string;
  action: string;
  target_resource: string;
  ip_address: string;
  prev_hash: string;
  this_hash: string;
}

interface BiasMetric {
  wardName: string;
  district: string;
  populationCensus: number;
  alertsCount: number;
  alertRatePer10k: number;
  expectedRatePer10k: number;
  deviationPct: number;
  isDisproportionate: boolean;
}

const RBAC_RULES = [
  { role: 'District SP', code: 'district_sp', permissions: 'Full District Access, Audit Verification, Patrol Approval, Governance' },
  { role: 'Crime Analyst', code: 'crime_analyst', permissions: 'Read-only District Maps, Trends, Network Graphs, Command Center' },
  { role: 'Investigating Officer', code: 'investigating_officer', permissions: 'Assigned Jurisdiction Cases, Command Center' },
  { role: 'Akka Pade Officer', code: 'akka_pade_officer', permissions: 'Localized Proximity Alerts, Dark Spot Route Navigation' }
];

export const Governance: React.FC = () => {
  const { t } = useLanguage();

  const [logs, setLogs] = useState<AuditRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Integrity Check State
  const [verifying, setVerifying] = useState(false);
  const [integrityMessage, setIntegrityMessage] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);

  // Bias & Fairness Panel State
  const [biasMetrics, setBiasMetrics] = useState<BiasMetric[]>([]);
  const [fairnessScore, setFairnessScore] = useState(100);

  const fetchAudits = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/catalyst/governance/audits?page=${page}&limit=10&search=${encodeURIComponent(search)}`);
      if (!res.ok) return;
      const json = await res.json();
      if (json && json.success) {
        setLogs(json.logs);
        setTotal(json.total);
        setTotalPages(json.totalPages);
      }
    } catch (err) {
      console.warn('Failed to fetch audits:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBiasMetrics = async () => {
    try {
      const res = await fetch('/api/catalyst/governance/bias-fairness');
      if (!res.ok) return;
      const json = await res.json();
      // API spreads the result at top level (res.json({ success, ...result }))
      const p = json && json.result ? json.result : json;
      if (json && json.success && p && p.metrics) {
        setBiasMetrics(p.metrics);
        if (typeof p.fairnessScorePct === 'number') setFairnessScore(p.fairnessScorePct);
      }
    } catch {}
  };

  useEffect(() => {
    fetchAudits();
    fetchBiasMetrics();
  }, [page, search]);

  const handleRunIntegrityCheck = async () => {
    setVerifying(true);
    try {
      const res = await fetch('/api/catalyst/governance/verify-integrity', { method: 'POST' });
      if (!res.ok) return;
      const json = await res.json();
      // API spreads the result at top level (res.json({ success, ...result }))
      const p = json && json.result ? json.result : json;
      if (json && json.success && p && typeof p.message === 'string') {
        setIntegrityMessage(
          p.message + (p.totalRecordsChecked != null ? ` (${p.totalRecordsChecked} records checked)` : '')
        );
        setIsVerified(!!p.verified);
      }
    } catch {}
    setVerifying(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-navy-700 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-wide text-slate-100 uppercase font-outfit flex items-center gap-2">
            <ShieldAlert className="w-7 h-7 text-amber-500" />
            {t('Governance, Audit Ledger & Bias Panel', 'ಆಡಳಿತ ಮತ್ತು ತಪಾಸಣೆ ಆಡಿಟ್')}
          </h1>
          <p className="text-sm text-slate-400">
            {t('Tamper-evident SHA-256 hash-chain audit ledger, RBAC matrix & census fairness metrics', 'ಶಾಸನಬದ್ಧ ಭದ್ರತಾ ತಪಾಸಣೆ')}
          </p>
        </div>

        <button
          onClick={handleRunIntegrityCheck}
          disabled={verifying}
          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-navy-950 font-bold text-xs uppercase tracking-wider rounded-lg shadow-ops-glow flex items-center gap-2"
        >
          {verifying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>{t('Run Hash-Chain Integrity Check', 'ಹ್ಯಾಶ್-ಚೈನ್ ಪರಿಶೀಲಿಸಿ')}</span>
        </button>
      </div>

      {/* ── System Architecture — 5-Layer Engine (Part 4.1) ─────────────── */}
      <div className="ops-card p-5 border border-navy-600 space-y-3 shadow-ops-panel">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 border-b border-navy-700 pb-2">
          <Scale className="w-4 h-4 text-amber-500" />
          {t('SAHASRA System Architecture — 5-Layer Intelligence Engine', 'ವ್ಯವಸ್ಥೆ ವಿನ್ಯಾಸ')}
          <span className="ml-auto text-[10px] font-mono text-slate-500 normal-case">reflects implemented data flow</span>
        </h3>
        <div className="overflow-x-auto">
          <svg viewBox="0 0 900 300" className="w-full min-w-[720px]" role="img" aria-label="SAHASRA 5-layer architecture">
            <defs>
              <marker id="arw" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill="#64748b" />
              </marker>
            </defs>
            {[
              { x: 10, t: '1 · DATA PLANE', s: 'KSP corpus (201,733 records)\ncases · incidents · audit_ledger', c: '#f59e0b' },
              { x: 190, t: '2 · INGEST', s: 'ingestRealDataset()\ndataset-loader · 12 CSV files', c: '#38bdf8' },
              { x: 370, t: '3 · INTELLIGENCE', s: 'ST-DBSCAN · NetworkGraph\nTrends · ANPR · QuickML RAG', c: '#a78bfa' },
              { x: 550, t: '4 · GATEWAY / RBAC', s: 'validateGatewayAccess()\n4 roles · SHA-256 audit', c: '#34d399' },
              { x: 730, t: '5 · OPS UI', s: '7 role dashboards\nExplainability drawers', c: '#f87171' }
            ].map((L, i) => (
              <g key={L.t}>
                <rect x={L.x} y={110} width={150} height={80} rx={8} fill="#0b1220" stroke={L.c} strokeWidth={1.5} />
                <text x={L.x + 75} y={135} textAnchor="middle" fill={L.c} fontSize={12} fontWeight="bold" fontFamily="monospace">{L.t}</text>
                {L.s.split('\n').map((ln, j) => (
                  <text key={j} x={L.x + 75} y={155 + j * 14} textAnchor="middle" fill="#94a3b8" fontSize={9} fontFamily="monospace">{ln}</text>
                ))}
                {i < 4 && <line x1={L.x + 150} y1={150} x2={L.x + 180} y2={150} stroke="#64748b" strokeWidth={2} markerEnd="url(#arw)" />}
              </g>
            ))}
            {/* audit feedback loop */}
            <path d="M625,190 C625,250 285,250 285,190" fill="none" stroke="#34d399" strokeWidth={1.2} strokeDasharray="4 4" markerEnd="url(#arw)" />
            <text x={455} y={248} textAnchor="middle" fill="#34d399" fontSize={9} fontFamily="monospace">every action → append-only hash-chained audit log</text>
            <text x={450} y={40} textAnchor="middle" fill="#e2e8f0" fontSize={14} fontWeight="bold" fontFamily="monospace">KSP DATATHON · SAHASRA CRIME INTELLIGENCE PIPELINE</text>
            <text x={450} y={62} textAnchor="middle" fill="#64748b" fontSize={10} fontFamily="monospace">Zoho Catalyst serverless functions ← → React Ops Console</text>
          </svg>
        </div>
      </div>

      {/* Integrity Verification Result Banner */}
      {integrityMessage && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 text-xs font-mono ${
          isVerified ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300' : 'bg-rose-950/80 border-rose-500 text-rose-300'
        }`}>
          {isVerified ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />}
          <span>{integrityMessage}</span>
        </div>
      )}

      {/* Live Bias & Fairness Audit Panel */}
      <div className="ops-card p-5 border border-navy-600 space-y-4 shadow-ops-panel">
        <div className="flex items-center justify-between border-b border-navy-700 pb-3">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase text-slate-200">
            <Scale className="w-4 h-4 text-amber-500" />
            <span>{t('Live Bias & Census Fairness Audit Panel', 'ಪ್ರಾಮಾಣಿಕತೆ ಮತ್ತು ನಿಷ್ಪಕ್ಷಪಾತ ತಪಾಸಣೆ')}</span>
          </div>
          <span className="px-3 py-1 rounded bg-emerald-950 border border-emerald-600 text-emerald-300 font-mono text-xs font-bold">
            Fairness Score: {fairnessScore}% Compliant
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {biasMetrics.map((b) => (
            <div
              key={b.wardName}
              className={`p-3 rounded-lg border text-xs space-y-1 ${
                b.isDisproportionate ? 'bg-rose-950/40 border-rose-600/60' : 'bg-navy-950 border-navy-700'
              }`}
            >
              <div className="flex justify-between items-center font-bold">
                <span className="text-slate-100">{b.wardName}</span>
                {b.isDisproportionate && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-600 text-white">DEVIATION ALERT</span>}
              </div>
              <p className="text-[11px] text-slate-400">Census Pop: {b.populationCensus.toLocaleString()}</p>
              <div className="flex justify-between text-[11px] font-mono mt-1 pt-1 border-t border-navy-800">
                <span className="text-slate-400">Alert Rate:</span>
                <span className="font-bold text-amber-400">{b.alertRatePer10k}/10k</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Read-Only RBAC Matrix Display */}
      <div className="ops-card p-5 border border-navy-600 space-y-3">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 border-b border-navy-700 pb-2">
          <Lock className="w-4 h-4 text-amber-500" />
          {t('Role-Based Access Control (RBAC) Matrix', 'ಆರ್‍ಬಿಎಸಿ ಅಧಿಕಾರ ಕೋಷ್ಟಕ')}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {RBAC_RULES.map((r) => (
            <div key={r.code} className="p-3 bg-navy-950 rounded-lg border border-navy-800 space-y-1">
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold font-mono uppercase">
                {r.code}
              </span>
              <h4 className="font-bold text-slate-100">{r.role}</h4>
              <p className="text-[11px] text-slate-400">{r.permissions}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Read-Only Tamper-Evident Audit Ledger Table */}
      <div className="ops-card border border-navy-600 rounded-xl overflow-hidden shadow-ops-panel">
        <div className="p-4 bg-navy-950 border-b border-navy-700 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase text-slate-200">
            <FileCheck className="w-4 h-4 text-amber-500" />
            <span>{t('Append-Only SHA-256 Audit Trail', 'ಆಡಿಟ್ ವಿವರಣೆ')}</span>
          </div>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by User ID, Action..."
            className="px-3 py-1 bg-navy-900 border border-navy-700 rounded text-slate-100 text-xs"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead>
              <tr className="bg-navy-950 border-b border-navy-700 text-slate-400 uppercase text-[10px]">
                <th className="p-3">Timestamp</th>
                <th className="p-3">Officer ID</th>
                <th className="p-3">Role</th>
                <th className="p-3">Action</th>
                <th className="p-3">Target Endpoint</th>
                <th className="p-3">SHA-256 Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-800">
              {loading ? (
                <tr><td colSpan={6} className="p-6 text-center text-slate-500">Loading ledger...</td></tr>
              ) : (
                logs.map((l) => (
                  <tr key={l.id} className="hover:bg-navy-850">
                    <td className="p-3 text-slate-400">{l.timestamp}</td>
                    <td className="p-3 font-bold text-amber-400">{l.user_id}</td>
                    <td className="p-3 text-slate-300">{l.user_role}</td>
                    <td className="p-3 text-emerald-400">{l.action}</td>
                    <td className="p-3 text-slate-400">{l.target_resource}</td>
                    <td className="p-3 text-slate-500 text-[10px] truncate max-w-[120px]">{l.this_hash}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
