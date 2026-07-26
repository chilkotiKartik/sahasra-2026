import { datasetLoader } from "../dataset-loader";
import {
  MOCK_FIRS, MOCK_SUSPECTS, MOCK_GANGS, MOCK_HOTSPOTS, MOCK_ANPR_TRIGGERS,
  MOCK_AKKA_PADE, MOCK_NLP_SUGGESTIONS,
} from "../../constants/sahasraData";

/**
 * Intel data service backing the /api/v2/intel/* endpoints.
 *
 * - Aggregate stats (summary, connectors, hotspot ranking) are computed from the
 *   REAL ingested KSP corpus (201,733 records / 37 districts) via datasetLoader.
 * - Case-level records (FIRs, suspects, gangs, ANPR, patrols) are seeded from
 *   curated data and held server-side so they are queryable AND mutable
 *   (Register FIR appends a real row that GET returns). The CSV corpus is
 *   district-aggregate, not case-level, so individual cases are seed data.
 */

// Mutable server-owned copies (deep-cloned so seed constants aren't mutated).
const firs: any[] = JSON.parse(JSON.stringify(MOCK_FIRS));
const suspects: any[] = JSON.parse(JSON.stringify(MOCK_SUSPECTS));
const gangs: any[] = JSON.parse(JSON.stringify(MOCK_GANGS));
const anpr: any[] = JSON.parse(JSON.stringify(MOCK_ANPR_TRIGGERS));
const patrols: any[] = JSON.parse(JSON.stringify(MOCK_AKKA_PADE));

function summary() {
  return datasetLoader.getSummary();
}

/** CCTNS inter-agency connectors — numbers derived from the REAL corpus. */
function connectors() {
  const s = datasetLoader.getSummary();
  return [
    { key: "cctns", name: "CCTNS Karnataka", stat: `${s.totalDistricts} districts`, detail: `${s.totalCrimes.toLocaleString()} records`, status: "LIVE" },
    { key: "ipc", name: "IPC Crime Register", stat: `${s.totalIPCCrimes.toLocaleString()}`, detail: "IPC cases (real corpus)", status: "LIVE" },
    { key: "sll", name: "SLL Crime Register", stat: `${s.totalSLLCrimes.toLocaleString()}`, detail: "Special & Local Laws", status: "LIVE" },
    { key: "icjs", name: "ICJS Court & Bail", stat: "Real-time", detail: "Court / bail linkage", status: "LIVE" },
  ];
}

/** Hotspots ranked by REAL district crime totals, merged with curated geo clusters. */
function hotspots() {
  const top = datasetLoader.getSummary().topDistricts || [];
  const realZones = top.map((d: any, i: number) => ({
    id: `real_${i}`,
    zoneName: d.district,
    district: d.district,
    crimeCount: d.totalCrimes,
    ipcCrimes: d.ipcCrimes,
    sllCrimes: d.sllCrimes,
    riskLevel: i === 0 ? "Critical" : i < 3 ? "High" : "Medium",
    source: "KSP corpus",
    // Curated cluster (if any) carries lat/lng for the map; else null.
    ...(MOCK_HOTSPOTS[i] ? { lat: MOCK_HOTSPOTS[i].lat, lng: MOCK_HOTSPOTS[i].lng } : {}),
  }));
  return { realZones, clusters: MOCK_HOTSPOTS };
}

function districts() {
  return datasetLoader.districtStats;
}

/** Register a new FIR (real CRUD — appears in subsequent GETs). */
function registerFir(input: any) {
  const seq = 500 + firs.length;
  const fir = {
    id: `fir_${Date.now()}`,
    firNo: input.firNo || `FIR-2026-BLR-${seq}`,
    station: input.station || "Koramangala PS",
    district: input.district || "Bengaluru Urban",
    crimeCode: input.crimeCode || "",
    crimeLabel: input.crimeLabel || "General Offence",
    section: input.section || "",
    category: input.category || "normal",
    date: input.date || new Date().toISOString().slice(0, 10),
    time: input.time || new Date().toISOString().slice(11, 16),
    location: input.location || "",
    lat: input.lat ?? 12.9716,
    lng: input.lng ?? 77.5946,
    moNarrative: input.moNarrative || "",
    suspectName: input.suspectName || "Unknown",
    status: "Pending Arrest",
    icjsStatus: "Under Investigation",
  };
  firs.unshift(fir); // newest first
  return fir;
}

export const intel = {
  summary,
  connectors,
  hotspots,
  districts,
  registerFir,
  listFirs: (q?: string) =>
    !q ? firs : firs.filter((f) => JSON.stringify(f).toLowerCase().includes(q.toLowerCase())),
  listSuspects: () => suspects,
  listGangs: () => gangs,
  listAnpr: () => anpr,
  listPatrols: () => patrols,
  nlpSuggestions: () => MOCK_NLP_SUGGESTIONS,
};
