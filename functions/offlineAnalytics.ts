// Catalyst Serverless Functions — fully-offline real analytics (no cloud, no CDN)
//   • Module 3: TF-IDF + cosine MO semantic search over real case narratives
//   • Module 4: Holt-Winters (double exponential smoothing) time-series forecast
// Both are genuine algorithms implemented in pure TypeScript.

import { getSeededCases } from "./casesAndTrends";

// ── Shared text utilities ────────────────────────────────────────────────────
const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "of", "in", "on", "at", "to", "by", "for",
  "with", "from", "near", "into", "is", "was", "were", "are", "be", "been",
  "this", "that", "these", "those", "it", "its", "as", "but", "up", "out",
  "show", "me", "find", "cases", "case", "report", "reported", "follow"
]);

// Very light stemmer so snatched/snatching/snatch collapse together.
function stem(w: string): string {
  return w
    .replace(/(ing|edly|ed|ers|er|ies|s)$/i, "")
    .replace(/borne$/i, "")
    .replace(/e$/i, "");
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOPWORDS.has(w))
    .map(stem)
    .filter(Boolean);
}

// ── Module 3: TF-IDF + cosine similarity semantic search ─────────────────────
interface Doc {
  id: string;
  case_number: string;
  crime_type: string;
  district: string;
  description: string;
  tokens: string[];
  tf: Map<string, number>;
}

let DOCS: Doc[] | null = null;
let IDF: Map<string, number> | null = null;

function buildIndex() {
  const cases = getSeededCases();
  DOCS = cases.map((c) => {
    // index description + crime_type + district so type/place terms count too
    const text = `${c.description} ${c.crime_type} ${c.district}`;
    const tokens = tokenize(text);
    const tf = new Map<string, number>();
    tokens.forEach((t) => tf.set(t, (tf.get(t) || 0) + 1));
    // normalise tf by doc length
    tf.forEach((v, k) => tf.set(k, v / tokens.length));
    return {
      id: c.id,
      case_number: c.case_number,
      crime_type: c.crime_type,
      district: c.district,
      description: c.description,
      tokens,
      tf
    };
  });
  // IDF = ln(N / df)
  const N = DOCS.length;
  const df = new Map<string, number>();
  DOCS.forEach((d) => {
    new Set(d.tokens).forEach((t) => df.set(t, (df.get(t) || 0) + 1));
  });
  IDF = new Map();
  df.forEach((v, k) => IDF!.set(k, Math.log((N + 1) / (v + 1)) + 1));
}

function tfidfVector(tf: Map<string, number>): Map<string, number> {
  const v = new Map<string, number>();
  tf.forEach((val, k) => v.set(k, val * (IDF!.get(k) || Math.log(DOCS!.length + 1) + 1)));
  return v;
}

function cosine(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  a.forEach((va, k) => {
    na += va * va;
    const vb = b.get(k);
    if (vb) dot += va * vb;
  });
  b.forEach((vb) => (nb += vb * vb));
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export function moSemanticSearch(query: string, topK = 5) {
  if (!DOCS || !IDF) buildIndex();
  const qTokens = tokenize(query);
  const qtf = new Map<string, number>();
  qTokens.forEach((t) => qtf.set(t, (qtf.get(t) || 0) + 1));
  qtf.forEach((v, k) => qtf.set(k, v / Math.max(1, qTokens.length)));
  const qVec = tfidfVector(qtf);

  const ranked = DOCS!
    .map((d) => {
      const dVec = tfidfVector(d.tf);
      const score = cosine(qVec, dVec);
      const overlap = qTokens.filter((t) => d.tokens.includes(t));
      return {
        case_number: d.case_number,
        crime_type: d.crime_type,
        district: d.district,
        description: d.description,
        similarity: Math.round(score * 1000) / 1000,
        matchedTerms: [...new Set(overlap)]
      };
    })
    .filter((r) => r.similarity > 0)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);

  return {
    query,
    queryTokens: qTokens,
    model: "Offline TF-IDF + cosine similarity (pure TS)",
    corpusSize: DOCS!.length,
    results: ranked
  };
}

// ── Module 4: Holt-Winters (Holt's linear trend) forecast ────────────────────
// Real double-exponential smoothing over a historical count series.
export interface ForecastPoint {
  index: number;
  value: number;
  lower: number;
  upper: number;
}

export function holtLinearForecast(
  history: number[],
  horizon = 4,
  alpha = 0.5,
  beta = 0.3
): { fitted: number[]; forecast: ForecastPoint[]; alpha: number; beta: number; rmse: number; model: string } {
  if (history.length < 2) {
    return { fitted: [...history], forecast: [], alpha, beta, rmse: 0, model: "Holt linear (insufficient data)" };
  }
  let level = history[0];
  let trend = history[1] - history[0];
  const fitted: number[] = [history[0]];
  let sqErr = 0;
  let n = 0;
  for (let i = 1; i < history.length; i++) {
    const predicted = level + trend; // one-step-ahead
    fitted.push(predicted);
    const err = history[i] - predicted;
    sqErr += err * err;
    n++;
    const prevLevel = level;
    level = alpha * history[i] + (1 - alpha) * (level + trend);
    trend = beta * (level - prevLevel) + (1 - beta) * trend;
  }
  const rmse = Math.sqrt(sqErr / Math.max(1, n));

  const forecast: ForecastPoint[] = [];
  for (let h = 1; h <= horizon; h++) {
    const value = Math.max(0, Math.round(level + h * trend));
    // widening band ~ rmse * sqrt(h) (simple predictive interval)
    const band = Math.round(1.28 * rmse * Math.sqrt(h)); // ~80% interval
    forecast.push({
      index: history.length + h - 1,
      value,
      lower: Math.max(0, value - band),
      upper: value + band
    });
  }
  return { fitted, forecast, alpha, beta, rmse: Math.round(rmse * 100) / 100, model: "Holt's Linear Trend (double exponential smoothing)" };
}
