import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import {
  FolderSearch,
  Search,
  Filter,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  FileText,
  ShieldCheck,
  Tag,
  X
} from 'lucide-react';
import { ExplainabilityDrawer, CitationData } from '../components/ExplainabilityDrawer';

interface CaseRecord {
  id: string;
  case_number: string;
  station: string;
  crime_type: string;
  status: 'INVESTIGATING' | 'UNRESOLVED' | 'CHARGE_SHEETED font-bold' | 'CLOSED';
  date: string;
  district: string;
  description: string;
  accused_count: number;
  fir_citations: string[];
  model_source?: string;
  shap_features?: { feature: string; weight: number }[];
}

interface InferredFilterChips {
  crime_type?: string;
  district?: string;
  status?: string;
  query_intent?: string;
  confidence: number;
}

const DISTRICT_OPTIONS = ['All', 'Bengaluru Urban', 'Mysuru', 'Hubballi-Dharwad'];
const CRIME_TYPE_OPTIONS = ['All', 'Burglary & Theft', 'Cyber & UPI Fraud', 'Vehicle Theft', 'Harassment & Assault'];
const STATUS_OPTIONS = ['All', 'INVESTIGATING', 'UNRESOLVED', 'CHARGE_SHEETED font-bold', 'CLOSED'];

export const CaseExplorer: React.FC = () => {
  const { t } = useLanguage();

  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Manual Filter Selects
  const [districtFilter, setDistrictFilter] = useState('All');
  const [crimeTypeFilter, setCrimeTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchInput, setSearchInput] = useState('');

  // Natural Language AI Chips
  const [aiQuery, setAiQuery] = useState('');
  const [inferredChips, setInferredChips] = useState<InferredFilterChips | null>(null);
  const [parsingAi, setParsingAi] = useState(false);
  // Real LLM parse output (Module 6)
  const [nlParsed, setNlParsed] = useState<any | null>(null);
  const [nlMeta, setNlMeta] = useState<{ parseSource: string; model: string; latencyMs: number } | null>(null);
  // Module 3: MO semantic search (offline TF-IDF)
  const [moQuery, setMoQuery] = useState('');
  const [moResults, setMoResults] = useState<any | null>(null);
  const [moLoading, setMoLoading] = useState(false);

  const handleMoSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moQuery.trim()) return;
    setMoLoading(true);
    try {
      const res = await fetch(`/api/catalyst/mo-search?q=${encodeURIComponent(moQuery)}`);
      const json = await res.json();
      if (json?.success) setMoResults(json);
    } catch {}
    setMoLoading(false);
  };

  // Explainability Drawer State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeCitation, setActiveCitation] = useState<CitationData | null>(null);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const url = `/api/catalyst/cases?page=${page}&limit=10&district=${encodeURIComponent(districtFilter)}&crime_type=${encodeURIComponent(crimeTypeFilter)}&status=${encodeURIComponent(statusFilter)}&search=${encodeURIComponent(searchInput)}`;
      const res = await fetch(url);
      if (!res.ok) return;
      const json = await res.json();
      if (json && json.success) {
        setCases(json.cases);
        setTotal(json.total);
        setTotalPages(json.totalPages);
      }
    } catch (err) {
      console.warn('Failed to fetch cases:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [page, districtFilter, crimeTypeFilter, statusFilter, searchInput]);

  const handleAiSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;

    setParsingAi(true);
    setNlParsed(null);
    setNlMeta(null);
    try {
      // Real LLM intent parsing (GROQ, server-side) → structured JSON + real query
      const res = await fetch('/api/catalyst/nl-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: aiQuery })
      });
      if (!res.ok) throw new Error('nl-query failed');
      const json = await res.json();
      if (json && json.success && json.parsed) {
        setNlParsed(json.parsed);
        setNlMeta({ parseSource: json.parseSource, model: json.model, latencyMs: json.latencyMs });
        setInferredChips({
          crime_type: json.parsed.crime_type || undefined,
          district: json.parsed.district || undefined,
          status: json.parsed.status || undefined,
          confidence: 0.95
        });
        // drive the real table via the parsed structured filters
        setDistrictFilter(json.parsed.district || 'All');
        setCrimeTypeFilter(json.parsed.crime_type || 'All');
        setStatusFilter(json.parsed.status || 'All');
        setSearchInput('');
        setPage(1);
      }
    } catch {
      // fall back to the legacy heuristic chip parser if the LLM route errors
      try {
        const res2 = await fetch('/api/catalyst/parse-intent', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: aiQuery })
        });
        const j2 = await res2.json();
        if (j2?.success && j2.chips) {
          setInferredChips(j2.chips);
          if (j2.chips.crime_type) setCrimeTypeFilter(j2.chips.crime_type);
          if (j2.chips.district) setDistrictFilter(j2.chips.district);
          if (j2.chips.status) setStatusFilter(j2.chips.status);
        }
      } catch {}
    }
    setParsingAi(false);
  };

  const handleRemoveChip = (key: 'crime_type' | 'district' | 'status') => {
    if (!inferredChips) return;
    const updated = { ...inferredChips };
    delete updated[key];
    setInferredChips(updated);

    if (key === 'crime_type') setCrimeTypeFilter('All');
    if (key === 'district') setDistrictFilter('All');
    if (key === 'status') setStatusFilter('All');
  };

  const handleRowClick = (caseItem: CaseRecord) => {
    setActiveCitation({
      title: `${caseItem.case_number} — ${caseItem.station}`,
      category: `Case Record (${caseItem.crime_type})`,
      fir_citations: caseItem.fir_citations,
      model_source: caseItem.model_source || 'Catalyst Data Store Query Engine',
      shap_features: caseItem.shap_features
    });
    setDrawerOpen(true);
  };

  const getStatusBadge = (status: CaseRecord['status']) => {
    switch (status) {
      case 'UNRESOLVED':
        return 'bg-rose-950/80 text-rose-300 border-rose-600/50';
      case 'INVESTIGATING':
        return 'bg-amber-950/80 text-amber-300 border-amber-600/50';
      case 'CLOSED':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-600/50';
      default:
        return 'bg-blue-950/80 text-blue-300 border-blue-600/50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-navy-700 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-wide text-slate-100 uppercase font-outfit flex items-center gap-2">
            <FolderSearch className="w-7 h-7 text-amber-500" />
            {t('Case Explorer & QuickML AI Search', 'ಕೇಸ್ ಫೈಲ್ ಮತ್ತು ಎಐ ಶೋಧಕ')}
          </h1>
          <p className="text-sm text-slate-400">
            {t('Natural-language intent parsing & server-side filterable case records', 'ಪೋಲಿಸ್ ಕೇಸ್ ಶೋಧ')}
          </p>
        </div>
      </div>

      {/* Natural Language AI Search Bar */}
      <form onSubmit={handleAiSearchSubmit} className="ops-card p-4 border border-amber-500/40 bg-navy-950/80 space-y-3 shadow-ops-glow">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
          <span className="text-xs font-bold uppercase text-slate-200">
            {t('Catalyst QuickML Natural Language Search', 'ಸಾಮರ್ಥ್ಯ ಶೋಧ ಬಾರ್')}
          </span>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              placeholder='Try: "unresolved chain-snatching in Mysuru" or "cyber phishing in Peenya"...'
              className="w-full pl-10 pr-4 py-2.5 bg-navy-900 border border-navy-700 rounded-lg text-slate-100 text-xs font-sans focus:outline-none focus:border-amber-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>
          <button
            type="submit"
            disabled={parsingAi}
            className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-navy-950 font-bold text-xs uppercase tracking-wider rounded-lg flex items-center gap-2 shadow-ops-glow"
          >
            <span>{parsingAi ? 'Parsing Intent...' : 'Search with AI'}</span>
          </button>
        </div>

        {/* Removable Inferred Filter Chips */}
        {inferredChips && (
          <div className="pt-2 border-t border-navy-800 flex items-center flex-wrap gap-2 text-xs">
            <span className="text-slate-400 font-semibold text-[11px] flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-amber-400" />
              Inferred Structured Filters:
            </span>

            {inferredChips.crime_type && (
              <span className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-mono flex items-center gap-1.5">
                <span>Crime: {inferredChips.crime_type}</span>
                <X className="w-3.5 h-3.5 cursor-pointer hover:text-white" onClick={() => handleRemoveChip('crime_type')} />
              </span>
            )}

            {inferredChips.district && (
              <span className="px-2.5 py-1 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[11px] font-mono flex items-center gap-1.5">
                <span>District: {inferredChips.district}</span>
                <X className="w-3.5 h-3.5 cursor-pointer hover:text-white" onClick={() => handleRemoveChip('district')} />
              </span>
            )}

            {inferredChips.status && (
              <span className="px-2.5 py-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[11px] font-mono flex items-center gap-1.5">
                <span>Status: {inferredChips.status}</span>
                <X className="w-3.5 h-3.5 cursor-pointer hover:text-white" onClick={() => handleRemoveChip('status')} />
              </span>
            )}
          </div>
        )}

        {/* Module 6: raw parsed JSON from the real LLM (AI-terminal transparency) */}
        {nlParsed && (
          <div className="pt-2 border-t border-navy-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Parsed Intent (structured JSON)
              </span>
              {nlMeta && (
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${nlMeta.parseSource === 'groq' ? 'bg-emerald-950 text-emerald-300 border-emerald-700' : 'bg-amber-950 text-amber-300 border-amber-700'}`}>
                  {nlMeta.model} · {nlMeta.latencyMs}ms
                </span>
              )}
            </div>
            <pre className="text-[11px] font-mono text-sky-300 bg-navy-950 border border-navy-800 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">
{JSON.stringify(nlParsed, null, 2)}
            </pre>
          </div>
        )}
      </form>

      {/* Module 3: MO Semantic Search (offline TF-IDF + cosine) */}
      <form onSubmit={handleMoSearch} className="ops-card p-4 border border-sky-500/40 bg-navy-950/80 space-y-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-bold uppercase text-slate-200">MO Semantic Search</span>
          <span className="text-[10px] font-mono text-slate-500">TF-IDF + cosine · offline · finds similar modus-operandi across districts</span>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={moQuery}
            onChange={(e) => setMoQuery(e.target.value)}
            placeholder='Describe an MO, e.g. "two men on a bike snatched a chain"'
            className="flex-1 px-3 py-2.5 bg-navy-900 border border-navy-700 rounded-lg text-slate-100 text-xs focus:outline-none focus:border-sky-500"
          />
          <button type="submit" disabled={moLoading} className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs uppercase rounded-lg">
            {moLoading ? 'Searching…' : 'Find Similar'}
          </button>
        </div>
        {moResults && (
          <div className="space-y-1.5 pt-1">
            <p className="text-[10px] font-mono text-slate-500">
              {moResults.model} · query tokens: [{(moResults.queryTokens || []).join(', ')}]
            </p>
            {(moResults.results || []).map((r: any, i: number) => (
              <div key={r.case_number} className="p-2.5 bg-navy-900 rounded-lg border border-navy-800 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-500">#{i + 1}</span>
                    <span className="font-mono text-xs text-amber-400 font-bold">{r.case_number}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-navy-950 border border-navy-700 text-slate-300">{r.crime_type}</span>
                    <span className="text-[10px] text-slate-500">{r.district}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">{r.description}</p>
                  {r.matchedTerms?.length > 0 && (
                    <p className="text-[10px] text-sky-400 font-mono mt-0.5">matched: {r.matchedTerms.join(', ')}</p>
                  )}
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400 whitespace-nowrap">{(r.similarity * 100).toFixed(1)}%</span>
              </div>
            ))}
            {(moResults.results || []).length === 0 && (
              <p className="text-[11px] text-slate-500 italic">No semantically similar cases found.</p>
            )}
          </div>
        )}
      </form>

      {/* Manual Filter Controls */}
      <div className="ops-card p-4 border border-navy-600 flex flex-wrap gap-4 text-xs">
        <div className="space-y-1">
          <label className="block text-slate-400 font-bold uppercase text-[10px]">District:</label>
          <select
            value={districtFilter}
            onChange={(e) => { setDistrictFilter(e.target.value); setPage(1); }}
            className="px-3 py-1.5 bg-navy-900 border border-navy-700 rounded text-slate-200 font-mono"
          >
            {DISTRICT_OPTIONS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-slate-400 font-bold uppercase text-[10px]">Crime Category:</label>
          <select
            value={crimeTypeFilter}
            onChange={(e) => { setCrimeTypeFilter(e.target.value); setPage(1); }}
            className="px-3 py-1.5 bg-navy-900 border border-navy-700 rounded text-slate-200 font-mono"
          >
            {CRIME_TYPE_OPTIONS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-slate-400 font-bold uppercase text-[10px]">Case Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-1.5 bg-navy-900 border border-navy-700 rounded text-slate-200 font-mono"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Case Table */}
      <div className="ops-card border border-navy-600 rounded-xl overflow-hidden shadow-ops-panel">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-navy-950 border-b border-navy-700 text-slate-300 uppercase text-[11px] font-bold">
                <th className="p-3">Case FIR Number</th>
                <th className="p-3">Police Station</th>
                <th className="p-3">Crime Type</th>
                <th className="p-3">District</th>
                <th className="p-3">Date</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Audit Citation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 font-mono">
                    Querying Catalyst Serverless Store...
                  </td>
                </tr>
              ) : cases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No cases match the query criteria.
                  </td>
                </tr>
              ) : (
                cases.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => handleRowClick(c)}
                    className="hover:bg-navy-850 cursor-pointer transition-colors"
                  >
                    <td className="p-3 font-mono font-bold text-amber-400">{c.case_number}</td>
                    <td className="p-3 text-slate-200 font-semibold">{c.station}</td>
                    <td className="p-3 text-slate-300">{c.crime_type}</td>
                    <td className="p-3 text-slate-400">{c.district}</td>
                    <td className="p-3 text-slate-400 font-mono">{c.date}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${getStatusBadge(c.status)}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button className="px-2 py-1 bg-navy-800 hover:bg-navy-700 text-amber-400 border border-amber-500/30 rounded text-[11px] font-bold flex items-center gap-1 ml-auto">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Inspect Citation</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 bg-navy-950 border-t border-navy-700 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-mono">
            Showing Page {page} of {totalPages} ({total} Total Records)
          </span>
          <div className="flex space-x-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1 bg-navy-900 border border-navy-700 rounded text-slate-300 disabled:opacity-40 flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1 bg-navy-900 border border-navy-700 rounded text-slate-300 disabled:opacity-40 flex items-center gap-1"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
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
