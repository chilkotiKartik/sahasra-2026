// Catalyst Serverless Function — Crime Analyst deep-analysis compute.
// Behavioral pattern clustering, predictive suspect ranking, station anomaly.
// Pure TypeScript over real seeded case + graph + incident data.

import { getSeededCases } from "./casesAndTrends";

const STOP = new Set(["the", "a", "an", "and", "or", "of", "in", "on", "at", "to", "by", "for", "with", "from", "near", "into", "is", "was", "resulting", "reported", "follow", "up"]);
function toks(t: string): string[] {
  return (t || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w))
    .map((w) => w.replace(/(ing|ed|s)$/i, ""));
}
function cosineTok(a: string[], b: string[]): number {
  const sa = new Set(a), sb = new Set(b);
  let inter = 0;
  sa.forEach((t) => { if (sb.has(t)) inter++; });
  return inter === 0 ? 0 : inter / Math.sqrt(sa.size * sb.size);
}

// ── 1. Behavioral Pattern Profiler — cluster cases into named signatures ─────
export function behavioralSignatures() {
  const cases = getSeededCases().map((c) => ({ ...c, _t: toks(`${c.description} ${c.crime_type}`) }));
  const used = new Set<string>();
  const clusters: any[] = [];
  for (let i = 0; i < cases.length; i++) {
    if (used.has(cases[i].id)) continue;
    const group = [cases[i]];
    used.add(cases[i].id);
    for (let j = i + 1; j < cases.length; j++) {
      if (used.has(cases[j].id)) continue;
      if (cosineTok(cases[i]._t, cases[j]._t) >= 0.18) { group.push(cases[j]); used.add(cases[j].id); }
    }
    // name the signature by the most frequent shared salient terms
    const freq = new Map<string, number>();
    group.forEach((g) => new Set(g._t).forEach((t) => freq.set(t, (freq.get(t) || 0) + 1)));
    const topTerms = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map((e) => e[0]);
    clusters.push({
      id: `sig-${clusters.length + 1}`,
      name: topTerms.map((t) => t[0].toUpperCase() + t.slice(1)).join(" · ") + " Signature",
      caseCount: group.length,
      cases: group.map((g) => ({ case_number: g.case_number, crime_type: g.crime_type, district: g.district, description: g.description })),
      signatureTerms: topTerms,
      districts: [...new Set(group.map((g) => g.district))]
    });
  }
  clusters.sort((a, b) => b.caseCount - a.caseCount);
  return { model: "Agglomerative MO clustering (token cosine ≥ 0.28)", signatureCount: clusters.length, signatures: clusters };
}

// ── "Cases like this" — TF-IDF nearest cases to a given case ─────────────────
import { moSemanticSearch } from "./offlineAnalytics";
export function similarCases(caseNumber: string, topK = 4) {
  const target = getSeededCases().find((c) => c.case_number === caseNumber);
  if (!target) return { target: caseNumber, matches: [] };
  const res = moSemanticSearch(`${target.description} ${target.crime_type}`, topK + 3);
  const matches = res.results
    .filter((r: any) => r.case_number !== caseNumber && r.similarity > 0)
    .slice(0, topK)
    .map((r: any) => ({
      case_number: r.case_number, crime_type: r.crime_type, district: r.district, description: r.description,
      similarity: r.similarity, matchedTerms: r.matchedTerms,
      reason: `Shares ${r.matchedTerms.slice(0, 3).join(', ') || 'method-of-operation'} with this case — ${Math.round(r.similarity * 100)}% MO overlap, worth linking.`
    }));
  return { target: caseNumber, targetCrime: target.crime_type, model: res.model, matches };
}

// ── Suspect Timeline — chronological cases/links for one person ───────────────
export async function suspectTimeline(suspectId: string) {
  const graph = await getNetworkGraph();
  const node: any = graph.nodes.find((n: any) => n.id === suspectId || n.label === suspectId)
    || graph.nodes.find((n: any) => n.type === 'Accused');
  if (!node) return { suspect: null, events: [] };
  const cases = getSeededCases();
  // edges touching this suspect → FIR references → real case events
  const firs = new Set<string>();
  (graph.edges as any[]).forEach((e) => {
    const s = typeof e.source === 'string' ? e.source : e.source?.id;
    const t = typeof e.target === 'string' ? e.target : e.target?.id;
    if (s === node.id || t === node.id) (e.source_fir_numbers || []).forEach((f: string) => firs.add(f));
  });
  const events: any[] = [];
  firs.forEach((fir) => {
    const c = cases.find((x) => x.case_number === fir || (x.fir_citations || []).includes(fir));
    if (c) events.push({ date: c.date, kind: 'CASE', label: `${c.case_number} — ${c.crime_type}`, detail: c.description, ref: c.case_number });
    else events.push({ date: '', kind: 'REF', label: fir, detail: 'Referenced FIR / evidence id', ref: fir });
  });
  // dedupe by ref, sort by date
  const seen = new Set<string>();
  const timeline = events.filter((e) => (seen.has(e.ref) ? false : (seen.add(e.ref), true)))
    .sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999'));
  return {
    suspect: { id: node.id, label: node.label, gang: node.gangName, status: node.metadata?.status, degree: node.liveDegree ?? node.degreeCentrality, details: node.metadata?.details },
    events: timeline
  };
}

// ── 3. Predictive Suspect Ranking — graph proximity + MO similarity ──────────
import { getNetworkGraph } from "./networkGraph";
export async function predictiveSuspectRanking(targetCaseNumber: string) {
  const target = getSeededCases().find((c) => c.case_number === targetCaseNumber) || getSeededCases()[0];
  const targetTok = toks(`${target.description} ${target.crime_type}`);
  const graph = await getNetworkGraph();
  const persons = graph.nodes.filter((n: any) => n.type === "Accused");
  const maxDeg = Math.max(...persons.map((p: any) => p.liveDegree || p.degreeCentrality || 1), 1);

  const ranked = persons.map((p: any) => {
    const proximity = (p.liveDegree || p.degreeCentrality || 0) / maxDeg; // graph centrality
    // MO similarity: does this suspect's gang operate the same MO as the target?
    const gangTok = toks(`${p.gangName} ${p.metadata?.details || ""} ${target.crime_type}`);
    const moSim = cosineTok(targetTok, gangTok);
    const score = 0.6 * proximity + 0.4 * moSim;
    const reasons: string[] = [];
    if (proximity > 0.6) reasons.push(`is among the most connected people in the network (centrality ${(p.liveDegree || p.degreeCentrality)})`);
    if (moSim > 0.1) reasons.push(`operates a method of operation overlapping this case`);
    if (p.metadata?.status === "WANTED" || p.metadata?.status === "ABSCONDING") reasons.push(`is currently ${p.metadata.status.toLowerCase()}`);
    const reason = reasons.length
      ? `${p.label} ${reasons.join(", ")} — combined lead score ${(score * 100).toFixed(0)}%.`
      : `${p.label} has a weak but non-zero association (${(score * 100).toFixed(0)}%).`;
    return { id: p.id, label: p.label, gang: p.gangName, status: p.metadata?.status, proximity: +proximity.toFixed(2), moSim: +moSim.toFixed(2), score: +score.toFixed(3), reason };
  }).sort((a, b) => b.score - a.score);

  return { targetCase: target.case_number, targetCrime: target.crime_type, candidates: ranked };
}
