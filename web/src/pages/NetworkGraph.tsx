import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import {
  GitFork,
  Network,
  Crown,
  Search,
  FileText,
  Users,
  RefreshCw,
  X,
  ExternalLink,
  Radar,
  Share2
} from 'lucide-react';
import ForceGraph2D from 'react-force-graph-2d';
import { drawNode, TYPE_COLOR } from '../components/graphDraw';

interface NetworkNode {
  id: string;
  type: string;
  label: string;
  photo?: string;
  gangId?: string;
  gangName?: string;
  degreeCentrality?: number;
  betweennessCentrality?: number;
  isCoordinator?: boolean;
  communityIndex?: number;
  liveDegree?: number;
  metadata?: any;
  x?: number;
  y?: number;
}
interface NetworkEdge {
  id: string;
  source: any;
  target: any;
  edge_type: string;
  relLabel?: string;
  confirmed?: boolean;
  weight: number;
  source_fir_numbers?: string[];
}
interface Community {
  id: string;
  memberIds: string[];
  memberCount: number;
  kingpinId: string;
  kingpinLabel: string;
  kingpinDegree: number;
  primaryType: string;
  color: string;
}
interface GraphData {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  coordinatorId: string;
  communities: Community[];
}

const EDGE_COLOR: Record<string, string> = {
  PARTY_TO: '#a855f7',
  WORKS_WITH: '#a855f7',
  Projection: '#38bdf8',
  SIMILAR_MO: '#38bdf8',
  SHARED_LOCATION: '#10b981',
  SHARED_VEHICLE: '#f59e0b',
  SHARED_ACCOUNT: '#3b82f6'
};

export const NetworkGraph: React.FC = () => {
  const { t } = useLanguage();
  const fgRef = useRef<any>();
  const sbRef = useRef<any>();
  const canvasWrapRef = useRef<HTMLDivElement | null>(null);
  const [dims, setDims] = useState<{ w: number; h: number }>({ w: 640, h: 470 });

  useEffect(() => {
    const el = canvasWrapRef.current;
    if (!el) return;
    const measure = () => setDims({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<NetworkEdge | null>(null);
  const [highlightEdges, setHighlightEdges] = useState<Set<string>>(new Set());
  const [highlightNodes, setHighlightNodes] = useState<Set<string>>(new Set());
  const [activeCommunity, setActiveCommunity] = useState<number | null>(null);

  // star-burst
  const [mode, setMode] = useState<'graph' | 'starburst'>('graph');
  const [starburst, setStarburst] = useState<any>(null);
  const [sbLoading, setSbLoading] = useState(false);

  const fetchGraphData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/catalyst/network-graph');
      const json = await res.json();
      if (json?.success && json.graphData) setGraphData(json.graphData);
    } catch (e) {
      console.warn('graph fetch failed', e);
    } finally {
      setLoading(false);
    }
  };

  const generateStarburst = async () => {
    setSbLoading(true);
    setMode('starburst');
    try {
      const caseId = `KSP-${new Date().toISOString().slice(0, 10)}-${Math.floor(Math.random() * 900 + 100)}`;
      const res = await fetch(`/api/catalyst/network-graph/starburst?caseId=${encodeURIComponent(caseId)}`);
      const json = await res.json();
      if (json?.success) setStarburst(json.starburst);
    } catch (e) {
      console.warn('starburst failed', e);
    } finally {
      setSbLoading(false);
    }
  };

  useEffect(() => {
    fetchGraphData();
  }, []);

  const communities = graphData?.communities || [];

  // Filter by active community
  const view = useMemo(() => {
    if (!graphData) return { nodes: [], edges: [] };
    if (activeCommunity == null) return { nodes: graphData.nodes, edges: graphData.edges };
    const comm = communities[activeCommunity];
    const ids = new Set(comm.memberIds);
    const nodes = graphData.nodes.filter((n) => ids.has(n.id));
    const edges = graphData.edges.filter((e) => {
      const s = typeof e.source === 'object' ? e.source.id : e.source;
      const tt = typeof e.target === 'object' ? e.target.id : e.target;
      return ids.has(s) && ids.has(tt);
    });
    return { nodes, edges };
  }, [graphData, activeCommunity, communities]);

  const handleNodeClick = (node: NetworkNode) => {
    setSelectedNode(node);
    setSelectedEdge(null);
    const neigh = new Set<string>([node.id]);
    const eids = new Set<string>();
    (graphData?.edges || []).forEach((e) => {
      const s = typeof e.source === 'object' ? e.source.id : e.source;
      const tt = typeof e.target === 'object' ? e.target.id : e.target;
      if (s === node.id) { neigh.add(tt); eids.add(e.id); }
      if (tt === node.id) { neigh.add(s); eids.add(e.id); }
    });
    setHighlightNodes(neigh);
    setHighlightEdges(eids);
  };

  const resetView = () => {
    setSelectedNode(null);
    setSelectedEdge(null);
    setHighlightNodes(new Set());
    setHighlightEdges(new Set());
    setActiveCommunity(null);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
        <p className="text-xs text-slate-400 font-mono uppercase">Mounting graph engine…</p>
      </div>
    );
  }
  if (!graphData) {
    return <div className="min-h-[40vh] flex items-center justify-center text-slate-400">No graph data</div>;
  }

  const coordinatorNode = graphData.nodes.find((n) => n.id === graphData.coordinatorId);

  const nodeCanvas = (node: any, ctx: CanvasRenderingContext2D, scale: number) => {
    const r = node.isCoordinator ? 9 : node.type === 'Accused' || node.type === 'Victim' ? 7 : 6;
    const comm = node.communityIndex != null && communities[node.communityIndex];
    const ring = node.isCoordinator ? '#F59E0B' : comm ? comm.color : (TYPE_COLOR[node.type] || '#334155');
    const dim = highlightNodes.size > 0 && !highlightNodes.has(node.id);
    drawNode(ctx, node, r, ring, dim);
    // name label below
    const fs = 3.4 / scale;
    ctx.font = `${fs > 4 ? 4 : fs}px Sans-Serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = dim ? '#475569' : '#cbd5e1';
    const short = node.label.length > 22 ? node.label.slice(0, 20) + '…' : node.label;
    ctx.fillText(short, node.x, node.y + r + 1.5);
  };

  const linkCanvas = (link: any, ctx: CanvasRenderingContext2D, scale: number) => {
    const s = link.source, tt = link.target;
    if (!s || tt == null || s.x == null || tt.x == null) return;
    const rel = link.relLabel || link.edge_type;
    const inferred = link.confirmed === false || rel === 'Projection' || rel === 'SIMILAR_MO';
    const hl = highlightEdges.size === 0 || highlightEdges.has(link.id);
    const color = EDGE_COLOR[rel] || '#475569';
    ctx.save();
    ctx.globalAlpha = hl ? 1 : 0.25;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(tt.x, tt.y);
    ctx.lineWidth = (hl ? 1.4 : 0.7) / scale;
    ctx.strokeStyle = color;
    ctx.setLineDash(inferred ? [4 / scale, 3 / scale] : []);
    ctx.stroke();
    ctx.setLineDash([]);
    // label at midpoint
    const mx = (s.x + tt.x) / 2;
    const my = (s.y + tt.y) / 2;
    let label = rel;
    if (rel === 'WORKS_WITH' && link.weight) label = `WORKS_WITH (${link.weight})`;
    if (rel === 'Projection' && link.weight) label = `Projection (${link.weight})`;
    const fs = 3 / scale;
    ctx.font = `${fs > 3.5 ? 3.5 : fs}px Sans-Serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const tw = ctx.measureText(label).width;
    ctx.fillStyle = 'rgba(7,12,24,0.85)';
    ctx.fillRect(mx - tw / 2 - 1, my - fs / 2 - 0.5, tw + 2, fs + 1);
    ctx.fillStyle = inferred ? '#7dd3fc' : '#d8b4fe';
    ctx.fillText(label, mx, my);
    ctx.restore();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-navy-700 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-wide text-slate-100 uppercase font-outfit flex items-center gap-2">
            <GitFork className="w-7 h-7 text-amber-500" />
            {t('Gang Link Graph — Louvain Community Detection', 'ಗ್ಯಾಂಗ್ ಲಿಂಕ್ ಗ್ರಾಫ್')}
          </h1>
          <p className="text-sm text-slate-400">
            Photo/glyph nodes · typed PARTY_TO / WORKS_WITH / Projection edges · live centrality kingpin ranking
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {(activeCommunity != null || selectedNode) && (
            <button onClick={resetView} className="px-3 py-1.5 bg-navy-800 hover:bg-navy-700 border border-navy-600 text-slate-200 text-xs font-bold rounded-lg flex items-center gap-1.5">
              <X className="w-3.5 h-3.5" /> Reset
            </button>
          )}
          <button
            onClick={() => setMode('graph')}
            className={`px-3 py-2 text-xs font-bold uppercase rounded-lg border flex items-center gap-1.5 ${mode === 'graph' ? 'bg-amber-500 text-navy-950 border-amber-400' : 'bg-navy-900 text-slate-200 border-navy-600 hover:border-amber-500'}`}
          >
            <Share2 className="w-4 h-4" /> Network
          </button>
          <button
            onClick={generateStarburst}
            className={`px-3 py-2 text-xs font-bold uppercase rounded-lg border flex items-center gap-1.5 ${mode === 'starburst' ? 'bg-amber-500 text-navy-950 border-amber-400' : 'bg-navy-900 text-slate-200 border-navy-600 hover:border-amber-500'}`}
          >
            <Radar className="w-4 h-4" /> Generate Link Analysis (Star-burst)
          </button>
        </div>
      </div>

      {/* Kingpin banner */}
      {coordinatorNode && mode === 'graph' && (
        <div className="ops-card p-4 border border-amber-500/50 bg-gradient-to-r from-amber-950/40 via-navy-900 to-navy-950 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-amber-500/20 rounded-xl border border-amber-500/40 text-amber-400 animate-pulse">
              <Crown className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded bg-amber-500 text-navy-950">♔ NETWORK COORDINATOR / KINGPIN</span>
                <span className="text-xs font-mono text-slate-400">Centrality: {coordinatorNode.betweennessCentrality?.toFixed(2)}</span>
              </div>
              <h3 className="text-base font-bold text-slate-100 mt-1">{coordinatorNode.label}</h3>
              <p className="text-xs text-slate-400">{coordinatorNode.gangName} · {coordinatorNode.metadata?.details}</p>
            </div>
          </div>
          <button onClick={() => handleNodeClick(coordinatorNode)} className="px-4 py-2 bg-navy-800 hover:bg-navy-700 border border-amber-500/40 text-amber-400 text-xs font-bold uppercase rounded-lg flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5" /> Inspect Dossier
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Canvas */}
        <div className="lg:col-span-2 ops-card p-2 border border-navy-600 min-h-[520px] rounded-xl overflow-hidden relative shadow-ops-panel">
          <div className="p-2 border-b border-navy-700 flex justify-between items-center text-xs font-mono text-slate-300">
            <span className="flex items-center gap-1 font-bold">
              <Network className="w-4 h-4 text-amber-500" />
              {mode === 'graph'
                ? `Force Canvas (${view.nodes.length} nodes · ${view.edges.length} edges)`
                : 'Incident Star-burst (radial DAG · dagMode=radialout)'}
            </span>
            <span className="text-slate-400 text-[11px]">
              {mode === 'graph' ? 'Solid = confirmed · Dashed = inferred/projection' : 'Center = crime scene · click evidence nodes'}
            </span>
          </div>

          <div ref={canvasWrapRef} className="h-[470px] w-full relative">
            {mode === 'graph' ? (
              <ForceGraph2D
                ref={fgRef}
                width={dims.w}
                height={dims.h}
                graphData={{ nodes: view.nodes as any, links: view.edges as any }}
                nodeRelSize={7}
                nodeCanvasObject={nodeCanvas}
                nodePointerAreaPaint={(node: any, color, ctx) => {
                  ctx.fillStyle = color;
                  ctx.beginPath();
                  ctx.arc(node.x, node.y, 9, 0, 2 * Math.PI);
                  ctx.fill();
                }}
                linkCanvasObjectMode={() => 'replace'}
                linkCanvasObject={linkCanvas}
                onNodeClick={(n: any) => handleNodeClick(n)}
                onLinkClick={(l: any) => { setSelectedEdge(l); setSelectedNode(null); }}
                onBackgroundClick={resetView}
                cooldownTicks={120}
                onEngineStop={() => fgRef.current?.zoomToFit(400, 50)}
              />
            ) : sbLoading ? (
              <div className="h-full flex items-center justify-center text-amber-400 text-xs font-mono">
                <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Generating radial link analysis…
              </div>
            ) : starburst ? (
              <ForceGraph2D
                ref={sbRef}
                width={dims.w}
                height={dims.h}
                graphData={{ nodes: starburst.nodes, links: starburst.links }}
                dagMode="radialout"
                dagLevelDistance={70}
                nodeRelSize={7}
                nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, scale: number) => {
                  const r = node.kind === 'center' ? 10 : node.kind === 'suspect' ? 8 : 5.5;
                  const ring = node.kind === 'center' ? '#f8fafc' : node.kind === 'suspect' ? '#EF4444' : '#A78BFA';
                  drawNode(ctx, node, r, ring, false);
                  const fs = Math.min(4, 3.4 / scale);
                  ctx.font = `${fs}px Sans-Serif`;
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'top';
                  ctx.fillStyle = '#cbd5e1';
                  const s = node.label.length > 26 ? node.label.slice(0, 24) + '…' : node.label;
                  ctx.fillText(s, node.x, node.y + r + 1.5);
                }}
                linkCanvasObjectMode={() => 'replace'}
                linkCanvasObject={(link: any, ctx: CanvasRenderingContext2D, scale: number) => {
                  const s = link.source, tt = link.target;
                  if (!s || s.x == null) return;
                  ctx.save();
                  ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(tt.x, tt.y);
                  ctx.lineWidth = 0.8 / scale;
                  ctx.strokeStyle = link.confirmed === false ? '#38bdf8' : '#64748b';
                  ctx.setLineDash(link.confirmed === false ? [3 / scale, 2 / scale] : []);
                  ctx.stroke();
                  ctx.restore();
                }}
                onNodeClick={(n: any) => setSelectedNode(n)}
                cooldownTicks={80}
                onEngineStop={() => sbRef.current?.zoomToFit(400, 60)}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">No star-burst generated yet.</div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Louvain communities */}
          <div className="ops-card p-4 border border-navy-600 space-y-3">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider border-b border-navy-700 pb-2 flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-500" />
              Detected Communities (Louvain) · {communities.length}
            </h3>
            <div className="space-y-2">
              {communities.map((c, i) => (
                <button
                  key={c.id}
                  onClick={() => { setActiveCommunity(activeCommunity === i ? null : i); setSelectedNode(null); setMode('graph'); }}
                  className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all ${activeCommunity === i ? 'border-amber-500 bg-amber-500/10' : 'border-navy-800 bg-navy-950 hover:border-navy-600'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 font-bold text-slate-100">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }}></span>
                      Gang #{i + 1}
                    </span>
                    <span className="font-mono text-slate-400">{c.memberCount} nodes</span>
                  </div>
                  <p className="mt-1 text-[11px] text-amber-400 font-mono flex items-center gap-1">
                    <Crown className="w-3 h-3" /> Kingpin: {c.kingpinLabel}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">degree centrality {c.kingpinDegree} · {c.primaryType}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Dossier / edge FIRs */}
          <div className="ops-card p-4 border border-navy-600 space-y-3">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider border-b border-navy-700 pb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-500" /> Entity Dossier & Evidence
            </h3>
            {selectedNode ? (
              <div className="space-y-2 text-xs">
                <h4 className="font-bold text-sm text-slate-100">{selectedNode.label}</h4>
                <div className="flex justify-between p-2 bg-navy-900 rounded border border-navy-800">
                  <span className="text-slate-400">Type</span><span className="font-bold" style={{ color: TYPE_COLOR[selectedNode.type] }}>{selectedNode.type}</span>
                </div>
                {selectedNode.gangName && (
                  <div className="flex justify-between p-2 bg-navy-900 rounded border border-navy-800">
                    <span className="text-slate-400">Affiliation</span><span className="font-bold text-slate-100">{selectedNode.gangName}</span>
                  </div>
                )}
                {selectedNode.liveDegree != null && (
                  <div className="flex justify-between p-2 bg-navy-900 rounded border border-navy-800">
                    <span className="text-slate-400">Live degree</span><span className="font-mono text-amber-400">{selectedNode.liveDegree}</span>
                  </div>
                )}
                {selectedNode.metadata?.status && (
                  <div className="flex justify-between p-2 bg-navy-900 rounded border border-navy-800">
                    <span className="text-slate-400">Status</span><span className="font-bold text-rose-400">{selectedNode.metadata.status}</span>
                  </div>
                )}
                {selectedNode.metadata?.details && (
                  <p className="p-2 bg-navy-900 rounded border border-navy-800 text-slate-300 leading-relaxed">{selectedNode.metadata.details}</p>
                )}
                {/* Human-readable insight (Part 5) */}
                <div className="p-2 bg-amber-950/30 rounded border border-amber-800/40 text-amber-200/90 text-[11px] leading-relaxed">
                  {selectedNode.isCoordinator
                    ? `This entity has the highest connectivity in its group (degree ${selectedNode.liveDegree ?? '—'}), making it the most likely coordinator to prioritise.`
                    : `This ${selectedNode.type.toLowerCase()} connects to ${selectedNode.liveDegree ?? 0} other entities in the network — click its edges to see the supporting FIRs.`}
                </div>
              </div>
            ) : selectedEdge ? (
              <div className="space-y-2 text-xs">
                <p className="font-semibold text-slate-200">{(selectedEdge.relLabel || selectedEdge.edge_type).replace(/_/g, ' ')}
                  <span className={`ml-2 px-1.5 py-0.5 rounded text-[9px] font-bold ${selectedEdge.confirmed === false ? 'bg-sky-950 text-sky-300 border border-sky-700' : 'bg-emerald-950 text-emerald-300 border border-emerald-700'}`}>
                    {selectedEdge.confirmed === false ? 'INFERRED' : 'CONFIRMED'}
                  </span>
                </p>
                {selectedEdge.relLabel === 'Projection' && (
                  <p className="text-[11px] text-sky-300/90 bg-sky-950/30 border border-sky-800/40 rounded p-2">
                    Algorithmic one-hop projection: these two persons share {selectedEdge.weight} common associate/evidence node(s) but have no directly-recorded link — a lead worth confirming.
                  </p>
                )}
                <p className="text-[11px] text-slate-400 font-bold">Supporting FIRs:</p>
                {(selectedEdge.source_fir_numbers || []).length ? selectedEdge.source_fir_numbers!.map((fir) => (
                  <div key={fir} className="p-1.5 bg-navy-900 rounded border border-navy-700 font-mono text-emerald-400 font-bold flex items-center justify-between">
                    <span>📜 {fir}</span><ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                )) : <p className="text-slate-500 italic text-[11px]">No confirmed FIR — inferred relationship.</p>}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic text-center py-8">Click any node or edge to inspect its real record.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
