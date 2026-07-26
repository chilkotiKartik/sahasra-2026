// Catalyst Serverless Function — Real Graph Analytics
// Louvain community detection, bipartite one-hop projection, incident star-burst.
// Pure computation over the real network graph edges (no external deps).

export interface AnalyticsNode {
  id: string;
  type: string;          // Accused | Victim | Vehicle | Location | Account
  label: string;
  gangName?: string;
  metadata?: any;
}
export interface AnalyticsEdge {
  id: string;
  source: string;
  target: string;
  edge_type: string;
  weight: number;
  source_fir_numbers?: string[];
  relLabel?: string;     // PARTY_TO | WORKS_WITH | SIMILAR_MO | SHARED_* | Projection
  confirmed?: boolean;   // true = officer-established, false = algorithm-inferred
}

const eid = (e: { source: any; target: any }) => ({
  s: typeof e.source === 'string' ? e.source : e.source?.id,
  t: typeof e.target === 'string' ? e.target : e.target?.id
});

const isPerson = (t?: string) => t === 'Accused' || t === 'Victim' || t === 'Witness';

// ── Relationship labelling (matches the PARTY_TO / WORKS_WITH reference) ──────
export function relLabelFor(edge: AnalyticsEdge, byId: Map<string, AnalyticsNode>): string {
  const { s, t } = eid(edge);
  const sp = isPerson(byId.get(s)?.type);
  const tp = isPerson(byId.get(t)?.type);
  if (edge.edge_type === 'CO_ACCUSED_WITH') return 'WORKS_WITH';   // person ↔ person
  if (edge.edge_type === 'SIMILAR_MO') return 'SIMILAR_MO';
  if ((sp && !tp) || (!sp && tp)) return 'PARTY_TO';               // person → resource/evidence
  return edge.edge_type;                                           // SHARED_LOCATION / VEHICLE / ACCOUNT
}

// Confirmed = officer-established (solid). Inferred = algorithmic (dashed).
export function isConfirmed(edge: AnalyticsEdge): boolean {
  return edge.edge_type !== 'SIMILAR_MO'; // seeded/co-accused/shared are officer-recorded
}

// ── Live degree centrality over the current (filtered) edge set ──────────────
export function degreeMap(nodes: AnalyticsNode[], edges: AnalyticsEdge[]): Map<string, number> {
  const deg = new Map<string, number>();
  nodes.forEach((n) => deg.set(n.id, 0));
  edges.forEach((e) => {
    const { s, t } = eid(e);
    if (deg.has(s)) deg.set(s, (deg.get(s) || 0) + 1);
    if (deg.has(t)) deg.set(t, (deg.get(t) || 0) + 1);
  });
  return deg;
}

// ── Bipartite one-hop PROJECTION ─────────────────────────────────────────────
// Two person nodes sharing ≥1 common (non-person) node, but with NO direct edge,
// get a dashed "Projection" edge whose weight = count of shared connections.
export function computeProjectionEdges(
  nodes: AnalyticsNode[],
  edges: AnalyticsEdge[]
): AnalyticsEdge[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const neighbors = new Map<string, Set<string>>();
  nodes.forEach((n) => neighbors.set(n.id, new Set()));
  const direct = new Set<string>();
  edges.forEach((e) => {
    const { s, t } = eid(e);
    neighbors.get(s)?.add(t);
    neighbors.get(t)?.add(s);
    direct.add(`${s}|${t}`);
    direct.add(`${t}|${s}`);
  });

  const persons = nodes.filter((n) => isPerson(n.type));
  const out: AnalyticsEdge[] = [];
  for (let i = 0; i < persons.length; i++) {
    for (let j = i + 1; j < persons.length; j++) {
      const a = persons[i].id;
      const b = persons[j].id;
      if (direct.has(`${a}|${b}`)) continue; // already directly linked
      const na = neighbors.get(a)!;
      const nb = neighbors.get(b)!;
      let shared = 0;
      na.forEach((x) => {
        if (nb.has(x) && !isPerson(byId.get(x)?.type)) shared++;
      });
      if (shared >= 1) {
        out.push({
          id: `proj-${a}-${b}`,
          source: a,
          target: b,
          edge_type: 'PROJECTION',
          relLabel: 'Projection',
          weight: shared,
          confirmed: false,
          source_fir_numbers: []
        });
      }
    }
  }
  return out;
}

// ── Real LOUVAIN community detection (modularity local-moving phase) ──────────
export interface Community {
  id: string;
  memberIds: string[];
  memberCount: number;
  kingpinId: string;
  kingpinLabel: string;
  kingpinDegree: number;
  primaryType: string;
  color: string;
}

const PALETTE = ['#F59E0B', '#3B82F6', '#10B981', '#EF4444', '#A78BFA', '#EC4899', '#14B8A6'];

export function louvainCommunities(
  nodes: AnalyticsNode[],
  edges: AnalyticsEdge[]
): { communities: Community[]; assignment: Record<string, number> } {
  const idx = new Map<string, number>();
  nodes.forEach((n, i) => idx.set(n.id, i));
  const N = nodes.length;

  // Weighted adjacency (undirected)
  const adj: Map<number, number>[] = Array.from({ length: N }, () => new Map());
  const k: number[] = new Array(N).fill(0); // weighted degree
  let m2 = 0; // 2m (sum of all edge weights * 2)
  edges.forEach((e) => {
    const { s, t } = eid(e);
    const si = idx.get(s);
    const ti = idx.get(t);
    if (si == null || ti == null || si === ti) return;
    const w = e.weight && e.weight > 0 ? e.weight : 1;
    adj[si].set(ti, (adj[si].get(ti) || 0) + w);
    adj[ti].set(si, (adj[ti].get(si) || 0) + w);
    k[si] += w;
    k[ti] += w;
    m2 += 2 * w;
  });
  const m = m2 / 2 || 1;

  // Each node starts in its own community
  const comm: number[] = nodes.map((_, i) => i);
  const sigmaTot: number[] = [...k]; // total degree of each community

  const communityOf = (i: number) => comm[i];

  let improved = true;
  let iterations = 0;
  while (improved && iterations < 50) {
    improved = false;
    iterations++;
    for (let i = 0; i < N; i++) {
      const ci = comm[i];
      // remove i from its community
      sigmaTot[ci] -= k[i];
      // sum of weights from i into each neighbouring community
      const wToComm = new Map<number, number>();
      adj[i].forEach((w, j) => {
        const cj = comm[j];
        wToComm.set(cj, (wToComm.get(cj) || 0) + w);
      });
      // pick best community by modularity gain ΔQ = w_in - sigmaTot*k_i/2m
      let bestC = ci;
      let bestGain = 0;
      wToComm.forEach((wIn, c) => {
        const gain = wIn - (sigmaTot[c] * k[i]) / (2 * m);
        if (gain > bestGain) {
          bestGain = gain;
          bestC = c;
        }
      });
      // also consider staying (gain 0 baseline covered by bestGain>0 test)
      comm[i] = bestC;
      sigmaTot[bestC] += k[i];
      if (bestC !== ci) improved = true;
    }
  }

  // Relabel communities compactly
  const remap = new Map<number, number>();
  const groups = new Map<number, string[]>();
  nodes.forEach((n, i) => {
    const c = communityOf(i);
    if (!remap.has(c)) remap.set(c, remap.size);
    const rc = remap.get(c)!;
    if (!groups.has(rc)) groups.set(rc, []);
    groups.get(rc)!.push(n.id);
  });

  const deg = degreeMap(nodes, edges);
  const communities: Community[] = [];
  groups.forEach((memberIds, rc) => {
    // kingpin = highest live degree centrality within the community
    let kingpinId = memberIds[0];
    let kingpinDeg = -1;
    const typeCount = new Map<string, number>();
    memberIds.forEach((id) => {
      const d = deg.get(id) || 0;
      if (d > kingpinDeg) {
        kingpinDeg = d;
        kingpinId = id;
      }
      const ty = nodes.find((n) => n.id === id)?.type || 'Unknown';
      typeCount.set(ty, (typeCount.get(ty) || 0) + 1);
    });
    const kingpinNode = nodes.find((n) => n.id === kingpinId);
    const primaryType = [...typeCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 'Mixed';
    communities.push({
      id: `comm-${rc}`,
      memberIds,
      memberCount: memberIds.length,
      kingpinId,
      kingpinLabel: kingpinNode?.label || kingpinId,
      kingpinDegree: kingpinDeg,
      primaryType,
      color: PALETTE[rc % PALETTE.length]
    });
  });

  communities.sort((a, b) => b.memberCount - a.memberCount);
  const assignment: Record<string, number> = {};
  communities.forEach((c, i) => c.memberIds.forEach((id) => (assignment[id] = i)));
  return { communities, assignment };
}
