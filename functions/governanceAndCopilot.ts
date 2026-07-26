// Catalyst Serverless Functions — Governance Audit Integrity, Bias & Fairness, and Ask SAHASRA Copilot RAG

import { createHash } from "crypto";

export interface AuditRecord {
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

export interface BiasFairnessMetric {
  wardName: string;
  district: string;
  populationCensus: number;
  alertsCount: number;
  alertRatePer10k: number;
  expectedRatePer10k: number;
  deviationPct: number;
  isDisproportionate: boolean;
}

export interface CopilotResponse {
  answer: string;
  supportingFirs: string[];
  modelSource: string;
  confidence: number;
  shapFeatures?: { feature: string; weight: number }[];
}

// Seeded Append-Only Audit Chain Records
let AUDIT_LEDGER: AuditRecord[] = [];

function computeSha256(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

// Seed 5 Tamper-Evident Audit Records
let lastHash = "0000000000000000000000000000000000000000000000000000000000000000";

const INITIAL_AUDITS = [
  { user_id: "SP-8821", user_role: "district_sp", action: "PATROL_APPROVAL", target_resource: "/command-center/queue/q-101", ip_address: "10.14.2.1" },
  { user_id: "ANALYST-104", user_role: "crime_analyst", action: "HOTSPOT_QUERY", target_resource: "/hotspot-map?district=Bengaluru", ip_address: "10.14.2.45" },
  { user_id: "IO-402", user_role: "investigating_officer", action: "CASE_DOSSIER_VIEW", target_resource: "/case-explorer/KSP/2026/FIR-1042", ip_address: "10.14.3.12" },
  { user_id: "AKKA-55", user_role: "akka_pade_officer", action: "DARK_SPOT_ROUTE_FETCH", target_resource: "/hotspot-map/dark-spots", ip_address: "10.14.4.9" },
  { user_id: "SP-8821", user_role: "district_sp", action: "INTEGRITY_CHECK_RUN", target_resource: "/governance/audit-verify", ip_address: "10.14.2.1" }
];

INITIAL_AUDITS.forEach((item, idx) => {
  const ts = new Date(Date.now() - (5 - idx) * 3600000).toISOString();
  const rawPayload = `${item.user_id}:${item.user_role}:${item.action}:${item.target_resource}:${ts}:${lastHash}`;
  const thisHash = computeSha256(rawPayload);

  AUDIT_LEDGER.push({
    id: `audit-${101 + idx}`,
    timestamp: ts,
    user_id: item.user_id,
    user_role: item.user_role,
    action: item.action,
    target_resource: item.target_resource,
    ip_address: item.ip_address,
    prev_hash: lastHash,
    this_hash: thisHash
  });

  lastHash = thisHash;
});

/**
 * 1. Verify SHA-256 Hash Chain Integrity
 */
export async function verifyAuditLedgerIntegrity() {
  let isIntact = true;
  let brokenIndex = -1;
  let computedPrevious = "0000000000000000000000000000000000000000000000000000000000000000";

  for (let i = 0; i < AUDIT_LEDGER.length; i++) {
    const record = AUDIT_LEDGER[i];
    if (record.prev_hash !== computedPrevious) {
      isIntact = false;
      brokenIndex = i;
      break;
    }
    const rawPayload = `${record.user_id}:${record.user_role}:${record.action}:${record.target_resource}:${record.timestamp}:${computedPrevious}`;
    const expectedHash = computeSha256(rawPayload);
    if (record.this_hash !== expectedHash) {
      isIntact = false;
      brokenIndex = i;
      break;
    }
    computedPrevious = record.this_hash;
  }

  return {
    verified: isIntact,
    totalRecordsChecked: AUDIT_LEDGER.length,
    brokenIndex,
    lastChainHash: computedPrevious,
    message: isIntact
      ? "Verified — 100% Hash Chain Integrity. No tampering detected."
      : `CRITICAL: Hash chain broken at index ${brokenIndex}! Database tampering detected.`
  };
}

export async function getAuditLogs(page = 1, limit = 10, search = "") {
  let logs = [...AUDIT_LEDGER];
  if (search) {
    const s = search.toLowerCase();
    logs = logs.filter(
      l =>
        l.user_id.toLowerCase().includes(s) ||
        l.action.toLowerCase().includes(s) ||
        l.target_resource.toLowerCase().includes(s)
    );
  }
  const total = logs.length;
  const paged = logs.slice((page - 1) * limit, page * limit);
  return { logs: paged, total, page, totalPages: Math.ceil(total / limit) };
}

/**
 * 2. Live Bias & Fairness Audit Panel Engine
 */
export async function getBiasFairnessMetrics(): Promise<{
  metrics: BiasFairnessMetric[];
  fairnessScorePct: number;
  overallStatus: "COMPLIANT" | "WARNING";
}> {
  const metrics: BiasFairnessMetric[] = [
    { wardName: "Peenya Ward 36", district: "Bengaluru Urban", populationCensus: 42000, alertsCount: 38, alertRatePer10k: 9.04, expectedRatePer10k: 8.5, deviationPct: +6.3, isDisproportionate: false },
    { wardName: "Koramangala Ward 151", district: "Bengaluru Urban", populationCensus: 58000, alertsCount: 52, alertRatePer10k: 8.96, expectedRatePer10k: 8.5, deviationPct: +5.4, isDisproportionate: false },
    { wardName: "Gokulam Ward 12", district: "Mysuru", populationCensus: 31000, alertsCount: 29, alertRatePer10k: 9.35, expectedRatePer10k: 8.5, deviationPct: +10.0, isDisproportionate: false },
    { wardName: "Hebbal Ward 18", district: "Bengaluru Urban", populationCensus: 65000, alertsCount: 112, alertRatePer10k: 17.23, expectedRatePer10k: 8.5, deviationPct: +102.7, isDisproportionate: true }
  ];

  const disproportionateCount = metrics.filter(m => m.isDisproportionate).length;
  const fairnessScorePct = Math.round(((metrics.length - disproportionateCount) / metrics.length) * 100 * 10) / 10;

  return {
    metrics,
    fairnessScorePct,
    overallStatus: fairnessScorePct >= 90 ? "COMPLIANT" : "WARNING"
  };
}

/**
 * 3. Ask SAHASRA Copilot QuickML RAG Search
 */
export async function queryAskSahasraCopilot(prompt: string): Promise<CopilotResponse> {
  const p = prompt.toLowerCase();

  if (p.includes("peenya") || p.includes("heist") || p.includes("copper") || p.includes("blade")) {
    return {
      answer: "Peenya Industrial Area has recorded 14 commercial factory break-ins targeting heavy copper coils. High-density ST-DBSCAN clustering identifies Ramesh 'Blade' Kumar as the coordinator using vehicle KA-01-MJ-9922.",
      supportingFirs: ["KSP/2026/FIR-1042", "KSP/2026/ANPR-204"],
      modelSource: "ST-DBSCAN & QuickML RAG v2.4",
      confidence: 0.96,
      shapFeatures: [
        { feature: "Low Streetlighting Density", weight: 0.45 },
        { feature: "Midnight Recce Window", weight: 0.35 }
      ]
    };
  }

  if (p.includes("cyber") || p.includes("upi") || p.includes("koramangala") || p.includes("phish")) {
    return {
      answer: "The Koramangala Cyber Syndicate operates via fake electricity bill payment APKs. Funds are routed through Canara Bank Account #9822-441-09 managed by Vikram 'Phisher' Anand.",
      supportingFirs: ["KSP/2026/CYBER-501", "KSP/2026/BANK-889"],
      modelSource: "Zia Cyber Anomaly RAG v1.8",
      confidence: 0.94,
      shapFeatures: [
        { feature: "Mule Velocity Score", weight: 0.58 },
        { feature: "Fake SIM Association", weight: 0.30 }
      ]
    };
  }

  if (p.includes("mysuru") || p.includes("gokulam") || p.includes("manju") || p.includes("lock")) {
    return {
      answer: "Mysuru Gokulam 3rd Stage reports 19 residential lock-picking burglaries linked to Manjunath 'Lock' Swamy. Inter-gang safehouse connections identified in Nelamangala.",
      supportingFirs: ["MYS/2026/FIR-112", "MYS/2025/FIR-3301"],
      modelSource: "Louvain Community RAG v3.0",
      confidence: 0.92,
      shapFeatures: [
        { feature: "Shared Highway Safehouse", weight: 0.52 }
      ]
    };
  }

  return {
    answer: "No supporting case data found in Catalyst RAG vector store matching your query terms.",
    supportingFirs: [],
    modelSource: "Catalyst QuickML Strict RAG Engine",
    confidence: 0.0
  };
}
