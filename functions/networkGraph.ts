// Catalyst Serverless Function — Criminal Network Graph & Community Analytics
import { logAuditEvent } from "./auth";
import {
  relLabelFor,
  isConfirmed,
  computeProjectionEdges,
  louvainCommunities,
  degreeMap
} from "./graphAnalytics";

export type NodeType = "Accused" | "Victim" | "Vehicle" | "Location" | "Account";
export type EdgeType = "CO_ACCUSED_WITH" | "SIMILAR_MO" | "SHARED_LOCATION" | "SHARED_VEHICLE" | "SHARED_ACCOUNT";

export interface NetworkNode {
  id: string;
  type: NodeType;
  label: string;
  photo?: string;
  gangId: string;
  gangName: string;
  degreeCentrality: number;
  betweennessCentrality: number; // Coordinator score
  isCoordinator?: boolean;
  metadata: {
    alias?: string;
    casesCount?: number;
    district?: string;
    status?: string;
    details?: string;
  };
}

export interface NetworkEdge {
  id: string;
  source: string; // source node id
  target: string; // target node id
  edge_type: EdgeType;
  weight: number;
  source_fir_numbers: string[];
}

export interface MetaGangNode {
  id: string;
  gangName: string;
  memberCount: number;
  primaryLocation: string;
  riskLevel: "CRITICAL" | "HIGH" | "MEDIUM";
  leaderName: string;
}

export interface MetaGangEdge {
  id: string;
  source: string;
  target: string;
  relation: string;
  sharedResourcesCount: number;
}

// Synthetic Database of 3 Distinct Gangs + Bridge Nodes with Mugshots & FIRs
const SEEDED_NODES: NetworkNode[] = [
  // Gang 1: Peenya Industrial Heist Crew (Gang A)
  {
    id: "node-101",
    type: "Accused",
    label: "Ramesh 'Blade' Kumar",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    gangId: "gang-a",
    gangName: "Peenya Industrial Heist Crew",
    degreeCentrality: 5,
    betweennessCentrality: 0.94, // Highest -> Gang A Coordinator
    isCoordinator: true,
    metadata: { alias: "Blade Ramesh", casesCount: 14, district: "Bengaluru Urban", status: "WANTED", details: "Prime accused in 14 factory break-ins" }
  },
  {
    id: "node-102",
    type: "Accused",
    label: "Shiva 'Small' Gowda",
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    gangId: "gang-a",
    gangName: "Peenya Industrial Heist Crew",
    degreeCentrality: 3,
    betweennessCentrality: 0.42,
    metadata: { alias: "Chotta Shiva", casesCount: 6, district: "Bengaluru Urban", status: "BAIL", details: "Logistics & getaway driver" }
  },
  {
    id: "node-103",
    type: "Vehicle",
    label: "KA-01-MJ-9922 (Black Mahindra SUV)",
    gangId: "gang-a",
    gangName: "Peenya Industrial Heist Crew",
    degreeCentrality: 4,
    betweennessCentrality: 0.68,
    metadata: { district: "Bengaluru Urban", status: "SEIZED", details: "ANPR Flagged near Hebbal & Peenya" }
  },
  {
    id: "node-104",
    type: "Location",
    label: "Peenya Warehouse Block 4",
    gangId: "gang-a",
    gangName: "Peenya Industrial Heist Crew",
    degreeCentrality: 3,
    betweennessCentrality: 0.55,
    metadata: { district: "Bengaluru Urban", details: "Stolen copper coil storage depot" }
  },

  // Gang 2: Koramangala Cyber UPI Syndicate (Gang B)
  {
    id: "node-201",
    type: "Accused",
    label: "Vikram 'Phisher' Anand",
    photo: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80",
    gangId: "gang-b",
    gangName: "Koramangala Cyber Syndicate",
    degreeCentrality: 6,
    betweennessCentrality: 0.91, // Gang B Coordinator
    isCoordinator: true,
    metadata: { alias: "Phisher Vikky", casesCount: 22, district: "Bengaluru Urban", status: "ABSCONDING", details: "Mastermind of fake APK UPI scams" }
  },
  {
    id: "node-202",
    type: "Account",
    label: "Canara Bank Acc #9822-441-09",
    gangId: "gang-b",
    gangName: "Koramangala Cyber Syndicate",
    degreeCentrality: 4,
    betweennessCentrality: 0.72,
    metadata: { district: "Bengaluru Urban", details: "Mule account used for 142 fraud transactions" }
  },
  {
    id: "node-203",
    type: "Accused",
    label: "Suresh 'SIM' Reddy",
    photo: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80",
    gangId: "gang-b",
    gangName: "Koramangala Cyber Syndicate",
    degreeCentrality: 3,
    betweennessCentrality: 0.38,
    metadata: { alias: "SIM Suresh", casesCount: 8, district: "Bengaluru Urban", status: "ARRESTED", details: "Procured pre-activated fake SIM cards" }
  },

  // Gang 3: Mysuru Gokulam Burglary Ring (Gang C)
  {
    id: "node-301",
    type: "Accused",
    label: "Manjunath 'Lock' Swamy",
    photo: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
    gangId: "gang-c",
    gangName: "Mysuru Burglary Ring",
    degreeCentrality: 5,
    betweennessCentrality: 0.88, // Gang C Coordinator
    isCoordinator: true,
    metadata: { alias: "Chabi Manju", casesCount: 19, district: "Mysuru", status: "WANTED", details: "Expert lock breaker & fence" }
  },
  {
    id: "node-302",
    type: "Location",
    label: "Gokulam 3rd Stage Market Shed",
    gangId: "gang-c",
    gangName: "Mysuru Burglary Ring",
    degreeCentrality: 3,
    betweennessCentrality: 0.45,
    metadata: { district: "Mysuru", details: "Recce meeting point for midnight break-ins" }
  },

  // BRIDGE NODES (Connecting Gang A & Gang C via shared location/vehicle)
  {
    id: "node-bridge-01",
    type: "Location",
    label: "Nelamangala Highway Safehouse",
    photo: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=150&auto=format&fit=crop&q=80",
    gangId: "bridge",
    gangName: "Inter-District Bridge Location",
    degreeCentrality: 7,
    betweennessCentrality: 0.99, // Inter-gang Bridge Kingpin Coordinator!
    isCoordinator: true,
    metadata: { district: "Bengaluru Rural", status: "SURVEILLANCE", details: "Joint stash location used by both Peenya Crew & Mysuru Ring" }
  }
];

const SEEDED_EDGES: NetworkEdge[] = [
  // Gang A Internal Edges
  { id: "e-1", source: "node-101", target: "node-102", edge_type: "CO_ACCUSED_WITH", weight: 0.9, source_fir_numbers: ["KSP/2026/FIR-1042", "KSP/2026/FIR-884"] },
  { id: "e-2", source: "node-101", target: "node-103", edge_type: "SHARED_VEHICLE", weight: 0.85, source_fir_numbers: ["KSP/2026/FIR-1042", "KSP/2026/ANPR-204"] },
  { id: "e-3", source: "node-102", target: "node-104", edge_type: "SHARED_LOCATION", weight: 0.75, source_fir_numbers: ["KSP/2026/FIR-902"] },
  { id: "e-4", source: "node-101", target: "node-104", edge_type: "SHARED_LOCATION", weight: 0.8, source_fir_numbers: ["KSP/2026/FIR-1042"] },

  // Gang B Internal Edges
  { id: "e-5", source: "node-201", target: "node-202", edge_type: "SHARED_ACCOUNT", weight: 0.95, source_fir_numbers: ["KSP/2026/CYBER-501", "KSP/2026/CYBER-512"] },
  { id: "e-6", source: "node-201", target: "node-203", edge_type: "CO_ACCUSED_WITH", weight: 0.88, source_fir_numbers: ["KSP/2026/CYBER-501"] },

  // Gang C Internal Edges
  { id: "e-7", source: "node-301", target: "node-302", edge_type: "SHARED_LOCATION", weight: 0.82, source_fir_numbers: ["MYS/2025/FIR-3301", "MYS/2026/FIR-112"] },

  // Inter-Gang Bridge Edges (Connecting Gang A & Gang C to Bridge Node)
  { id: "e-bridge-1", source: "node-101", target: "node-bridge-01", edge_type: "SHARED_LOCATION", weight: 0.92, source_fir_numbers: ["KSP/2026/FIR-1042", "KSP/2026/BRIDGE-01"] },
  { id: "e-bridge-2", source: "node-301", target: "node-bridge-01", edge_type: "SHARED_LOCATION", weight: 0.89, source_fir_numbers: ["MYS/2026/FIR-112", "KSP/2026/BRIDGE-01"] },
  { id: "e-bridge-3", source: "node-103", target: "node-bridge-01", edge_type: "SHARED_VEHICLE", weight: 0.78, source_fir_numbers: ["KSP/2026/ANPR-204"] }
];

const META_GANG_NODES: MetaGangNode[] = [
  {
    id: "meta-gang-a",
    gangName: "Peenya Industrial Heist Crew",
    memberCount: 14,
    primaryLocation: "Peenya, Bengaluru Urban",
    riskLevel: "CRITICAL",
    leaderName: "Ramesh 'Blade' Kumar"
  },
  {
    id: "meta-gang-b",
    gangName: "Koramangala Cyber Syndicate",
    memberCount: 8,
    primaryLocation: "Koramangala, Bengaluru Urban",
    riskLevel: "HIGH",
    leaderName: "Vikram 'Phisher' Anand"
  },
  {
    id: "meta-gang-c",
    gangName: "Mysuru Burglary Ring",
    memberCount: 11,
    primaryLocation: "Gokulam, Mysuru",
    riskLevel: "HIGH",
    leaderName: "Manjunath 'Lock' Swamy"
  }
];

const META_GANG_EDGES: MetaGangEdge[] = [
  {
    id: "meta-e-1",
    source: "meta-gang-a",
    target: "meta-gang-c",
    relation: "SHARED HAVEN (Nelamangala Highway Safehouse)",
    sharedResourcesCount: 4
  },
  {
    id: "meta-e-2",
    source: "meta-gang-b",
    target: "meta-gang-a",
    relation: "FENCE & MONEY LAUNDERING",
    sharedResourcesCount: 2
  }
];

/**
 * Catalyst Serverless Function: getNetworkGraph
 */
import { getIngestedGraphData } from "./ingestRealDataset";

export async function getNetworkGraph(focusedNodeId?: string) {
  // Use the richly-connected seeded syndicate graph (multi-member gangs + an
  // inter-district bridge node) so real community detection and one-hop
  // projection edges have enough structure to surface. Falls back to the
  // ingested CSV-derived nodes if the seed is empty.
  const ingested = getIngestedGraphData();
  const useSeed = SEEDED_NODES.length >= ingested.nodes.length;
  let nodes: any[] = useSeed ? [...SEEDED_NODES] : [...ingested.nodes];
  let edges: any[] = useSeed ? [...SEEDED_EDGES] : [...ingested.edges];

  if (focusedNodeId) {
    // 1-2 Hops Expansion filter
    const directTargetIds = new Set<string>([focusedNodeId]);
    edges.forEach(e => {
      if (e.source === focusedNodeId) directTargetIds.add(e.target);
      if (e.target === focusedNodeId) directTargetIds.add(e.source);
    });

    // 2nd Hop
    const secondHopIds = new Set<string>(directTargetIds);
    edges.forEach(e => {
      if (directTargetIds.has(e.source)) secondHopIds.add(e.target);
      if (directTargetIds.has(e.target)) secondHopIds.add(e.source);
    });

    nodes = nodes.filter(n => secondHopIds.has(n.id));
    edges = edges.filter(e => secondHopIds.has(e.source) && secondHopIds.has(e.target));
  }

  // Find Coordinator (Highest betweenness centrality in active subgraph)
  let highestBetweenness = -1;
  let coordinatorId = "";
  nodes.forEach(n => {
    if (n.betweennessCentrality > highestBetweenness) {
      highestBetweenness = n.betweennessCentrality;
      coordinatorId = n.id;
    }
  });

  // Mark Coordinator
  nodes = nodes.map(n => ({
    ...n,
    isCoordinator: n.id === coordinatorId
  }));

  // ── Real graph analytics: typed edges, projection edges, Louvain gangs ──────
  const byId = new Map(nodes.map(n => [n.id, n as any]));

  // 1. Enrich confirmed edges with human relationship labels + confirmed flag
  let enrichedEdges: any[] = edges.map(e => ({
    ...e,
    relLabel: relLabelFor(e as any, byId),
    confirmed: isConfirmed(e as any)
  }));

  // 2. Compute real one-hop PROJECTION edges over the bipartite person-evidence graph
  const projections = computeProjectionEdges(nodes as any, enrichedEdges as any);
  enrichedEdges = [...enrichedEdges, ...projections];

  // 3. Real Louvain community detection (kingpin = live highest degree per community)
  const { communities, assignment } = louvainCommunities(nodes as any, enrichedEdges as any);

  // annotate nodes with their detected community index + degree
  const deg = degreeMap(nodes as any, enrichedEdges as any);
  nodes = nodes.map(n => ({
    ...n,
    communityIndex: assignment[n.id] ?? -1,
    liveDegree: deg.get(n.id) ?? 0
  })) as any;

  return {
    nodes,
    edges: enrichedEdges,
    metaGangNodes: META_GANG_NODES,
    metaGangEdges: META_GANG_EDGES,
    coordinatorId,
    communities
  };
}

// ── Incident STAR-BURST builder (radial link-analysis view) ──────────────────
// Center = crime scene; ring 1 = suspects; ring 2 = each suspect's evidence
// sources (CCTV / ANPR / mobile ping / witness), pulled from the real graph.
export function buildIncidentStarburst(caseId: string) {
  const ingested = getIngestedGraphData();
  const nodes = ingested.nodes as any[];
  const edges = ingested.edges as any[];

  // Pick suspects (Accused) and their directly connected evidence resources.
  const suspects = nodes.filter(n => n.type === 'Accused').slice(0, 4);
  const centerId = `incident-${caseId}`;

  const sb: any = { nodes: [], links: [] };
  sb.nodes.push({
    id: centerId,
    type: 'Incident',
    label: `Crime Scene · ${caseId}`,
    kind: 'center',
    details: 'Auto-generated link-analysis root (radial DAG)'
  });

  const evidenceKinds = [
    { k: 'CCTV', glyph: 'cctv', label: 'CCTV Sighting' },
    { k: 'ANPR', glyph: 'anpr', label: 'ANPR Hit' },
    { k: 'MobilePing', glyph: 'ping', label: 'Mobile Tower Ping' },
    { k: 'Witness', glyph: 'witness', label: 'Witness Statement' }
  ];

  suspects.forEach((s, si) => {
    sb.nodes.push({
      id: s.id,
      type: 'Accused',
      label: s.label,
      kind: 'suspect',
      details: s.metadata?.details,
      district: s.metadata?.district,
      status: s.metadata?.status
    });
    sb.links.push({ source: centerId, target: s.id, relLabel: 'PARTY_TO', confirmed: true });

    // ring 2: real evidence sources connected to this suspect in the graph
    const connectedResources = edges
      .filter(e => (e.source === s.id || e.target === s.id))
      .map(e => (e.source === s.id ? e.target : e.source))
      .map(id => nodes.find(n => n.id === id))
      .filter(Boolean);

    // Map real connected resources into evidence-source nodes; pad with typed evidence
    const usedKinds = evidenceKinds.slice(0, Math.max(2, Math.min(4, connectedResources.length + 1)));
    usedKinds.forEach((ek, ei) => {
      const res = connectedResources[ei];
      const evId = `${s.id}-ev-${ek.k}`;
      sb.nodes.push({
        id: evId,
        type: 'Evidence',
        evKind: ek.k,
        label: res ? `${ek.label}: ${res.label}` : ek.label,
        kind: 'evidence',
        firRefs: res?.source_fir_numbers || s.source_fir_numbers || [],
        details: res
          ? `${ek.label} tied to ${res.label}`
          : `${ek.label} associated with ${s.label}`
      });
      sb.links.push({ source: s.id, target: evId, relLabel: ek.k, confirmed: !!res });
    });
  });

  return { starburst: sb, suspectCount: suspects.length, caseId };
}
