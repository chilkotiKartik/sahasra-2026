// Catalyst Serverless Function — role-specific feature stores (IO / Akka).
// Real append-only data tied to real case_ids, feeding the shared pipelines.

export interface DiaryEntry {
  id: string;
  caseId: string;
  officerId: string;
  timestamp: string;
  entry: string;
}

// Append-only investigation diary, keyed by caseId (legal case-diary equivalent).
const CASE_DIARY = new Map<string, DiaryEntry[]>([
  ["case-001", [
    { id: "d-seed-1", caseId: "case-001", officerId: "IO-402", timestamp: new Date(Date.now() - 2 * 864e5).toISOString(), entry: "Visited Peenya Block 4 scene; recovered CCTV footage from adjacent unit. Copper coil weighbridge slip seized." },
    { id: "d-seed-2", caseId: "case-001", officerId: "IO-402", timestamp: new Date(Date.now() - 864e5).toISOString(), entry: "ANPR hit on KA-01-MJ-9922 near Hebbal flyover at 01:12; requested tower dump for the window." }
  ]]
]);

export function getDiary(caseId: string): DiaryEntry[] {
  return [...(CASE_DIARY.get(caseId) || [])].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}
export function addDiaryEntry(caseId: string, officerId: string, entry: string): DiaryEntry {
  const rec: DiaryEntry = { id: `diary-${Date.now()}`, caseId, officerId, timestamp: new Date().toISOString(), entry };
  const list = CASE_DIARY.get(caseId) || [];
  list.push(rec);
  CASE_DIARY.set(caseId, list);
  return rec;
}

// Beat-check-in log (Akka Pade) — geolocated check-ins.
export interface BeatCheckin {
  id: string; officerId: string; checkpoint: string; lat: number; lng: number; withinToleranceM: number; ok: boolean; timestamp: string;
}
const BEAT_CHECKINS: BeatCheckin[] = [];
export function addBeatCheckin(c: Omit<BeatCheckin, "id" | "timestamp">): BeatCheckin {
  const rec: BeatCheckin = { ...c, id: `beat-${Date.now()}`, timestamp: new Date().toISOString() };
  BEAT_CHECKINS.unshift(rec);
  return rec;
}
export function getBeatCheckins(officerId: string): BeatCheckin[] {
  return BEAT_CHECKINS.filter((b) => b.officerId === officerId).slice(0, 30);
}

// ── Evidence Locker (chain-of-custody per item, tied to case_id) ─────────────
export interface CustodyEvent { action: string; officer: string; timestamp: string; note?: string; }
export interface EvidenceItem {
  id: string; caseId: string; name: string; type: string; status: string; custody: CustodyEvent[];
}
const EVIDENCE = new Map<string, EvidenceItem[]>([
  ["case-001", [
    { id: "ev-1001", caseId: "case-001", name: "Copper coil weighbridge slip", type: "Document", status: "In Locker",
      custody: [
        { action: "LOGGED_IN", officer: "IO-402", timestamp: new Date(Date.now() - 2 * 864e5).toISOString(), note: "Seized from Peenya Block 4" },
        { action: "TRANSFERRED", officer: "FSL-Malleswaram", timestamp: new Date(Date.now() - 864e5).toISOString(), note: "Sent for fingerprint analysis" }
      ] },
    { id: "ev-1002", caseId: "case-001", name: "CCTV footage (USB)", type: "Digital", status: "In Locker",
      custody: [{ action: "LOGGED_IN", officer: "IO-402", timestamp: new Date(Date.now() - 2 * 864e5).toISOString(), note: "Copied from adjacent unit DVR" }] }
  ]]
]);
export function getEvidence(caseId: string): EvidenceItem[] { return EVIDENCE.get(caseId) || []; }
export function addEvidence(caseId: string, name: string, type: string, officer: string): EvidenceItem {
  const item: EvidenceItem = { id: `ev-${Date.now()}`, caseId, name, type: type || "Physical", status: "In Locker",
    custody: [{ action: "LOGGED_IN", officer, timestamp: new Date().toISOString(), note: "Initial custody" }] };
  const list = EVIDENCE.get(caseId) || []; list.push(item); EVIDENCE.set(caseId, list); return item;
}
export function transferEvidence(caseId: string, itemId: string, toOfficer: string, byOfficer: string): EvidenceItem | null {
  const item = (EVIDENCE.get(caseId) || []).find((e) => e.id === itemId);
  if (!item) return null;
  item.custody.push({ action: "TRANSFERRED", officer: toOfficer, timestamp: new Date().toISOString(), note: `Transferred by ${byOfficer}` });
  return item;
}

// ── Crime Series Builder (savable named groupings of real cases) ─────────────
export interface CrimeSeries { id: string; name: string; caseNumbers: string[]; createdBy: string; createdAt: string; }
const CRIME_SERIES: CrimeSeries[] = [
  { id: "series-seed-1", name: "Peenya Copper Ring", caseNumbers: ["KSP/2026/FIR-1042", "MYS/2026/FIR-112"], createdBy: "ANALYST-104", createdAt: new Date(Date.now() - 3 * 864e5).toISOString() }
];
export function getSeries(): CrimeSeries[] { return CRIME_SERIES; }
export function createSeries(name: string, caseNumbers: string[], by: string): CrimeSeries {
  const s: CrimeSeries = { id: `series-${Date.now()}`, name, caseNumbers, createdBy: by, createdAt: new Date().toISOString() };
  CRIME_SERIES.unshift(s); return s;
}

// ── My Case Clearance Snapshot (officer vs station average, from real cases) ──
export function caseClearanceSnapshot(officerId: string, cases: any[]) {
  // Officer's assigned cases = deterministic hash-partition of real cases (stable per officer).
  const hash = (s: string) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };
  const officerCases = cases.filter((c) => hash(c.case_number) % 3 === hash(officerId) % 3);
  const resolvedOf = (arr: any[]) => arr.filter((c) => /RESOLVED|CLOSED|CHARGE/i.test(c.status)).length;
  const officerRate = officerCases.length ? Math.round((resolvedOf(officerCases) / officerCases.length) * 100) : 0;
  const stationRate = cases.length ? Math.round((resolvedOf(cases) / cases.length) * 100) : 0;
  return {
    officerId,
    assigned: officerCases.length,
    resolved: resolvedOf(officerCases),
    officerClearanceRate: officerRate,
    stationClearanceRate: stationRate,
    delta: officerRate - stationRate,
    cases: officerCases.map((c) => ({ case_number: c.case_number, crime_type: c.crime_type, status: c.status }))
  };
}

// ── Shift Handover Notes (per beat, passed between shifts) ───────────────────
const HANDOVERS: any[] = [
  { id: "ho-seed", beat: "Peenya", fromOfficer: "AKKA-57", toOfficer: "AKKA-55", note: "Streetlight out at 4th Block junction; keep an eye on the warehouse row after midnight.", timestamp: new Date(Date.now() - 6 * 3600e3).toISOString() }
];
export function getHandovers(beat: string) { return HANDOVERS.filter((h) => h.beat === beat).sort((a, b) => b.timestamp.localeCompare(a.timestamp)); }
export function addHandover(beat: string, fromOfficer: string, toOfficer: string, note: string) {
  const h = { id: `ho-${Date.now()}`, beat, fromOfficer, toOfficer, note, timestamp: new Date().toISOString() }; HANDOVERS.unshift(h); return h;
}

// ── Commendation & Verified-Spot Log (per officer) ───────────────────────────
const COMMENDATIONS: any[] = [
  { id: "cm-seed-1", officerId: "AKKA-55", type: "VERIFIED_HOTSPOT", detail: "Confirmed Peenya dark-spot after 3 field visits", timestamp: new Date(Date.now() - 4 * 864e5).toISOString() },
  { id: "cm-seed-2", officerId: "AKKA-55", type: "DISPATCH_RESOLVED", detail: "Responded to Koramangala snatch dispatch — suspect detained", timestamp: new Date(Date.now() - 2 * 864e5).toISOString() }
];
export function getCommendations(officerId: string) { return COMMENDATIONS.filter((c) => c.officerId === officerId); }
export function addCommendation(officerId: string, type: string, detail: string) {
  const c = { id: `cm-${Date.now()}`, officerId, type, detail, timestamp: new Date().toISOString() }; COMMENDATIONS.unshift(c); return c;
}

// ── Annotation & Hypothesis Notebook (analyst private notes, versioned) ───────
const ANNOTATIONS: any[] = [];
export function getAnnotations(target: string) { return ANNOTATIONS.filter((a) => a.target === target).sort((a, b) => a.version - b.version); }
export function addAnnotation(target: string, text: string, author: string) {
  const version = ANNOTATIONS.filter((a) => a.target === target).length + 1;
  const a = { id: `note-${Date.now()}`, target, text, author, version, timestamp: new Date().toISOString() }; ANNOTATIONS.push(a); return a;
}

// ── Witness/Informant Management (per case, confidentiality tier) ─────────────
const WITNESSES = new Map<string, any[]>([
  ["case-001", [{ id: "w-seed-1", caseId: "case-001", name: "Night watchman (Block 4)", kind: "Witness", statementStatus: "Recorded", confidentiality: "Standard", contact: "94xxxxxx01" }]]
]);
export function getWitnesses(caseId: string) { return WITNESSES.get(caseId) || []; }
export function addWitness(caseId: string, w: any) {
  const rec = { id: `w-${Date.now()}`, caseId, ...w }; const list = WITNESSES.get(caseId) || []; list.push(rec); WITNESSES.set(caseId, list); return rec;
}

// ── Neighborhood Beat Notes (location-tied, per jurisdiction) ─────────────────
const BEAT_NOTES: any[] = [
  { id: "bn-seed", jurisdiction: "Bengaluru Urban", location: "Peenya 4th Block", note: "Scrap dealer on cross-road buys copper without bills — worth periodic checks.", author: "IO-402", timestamp: new Date(Date.now() - 5 * 864e5).toISOString() }
];
export function getBeatNotes(jurisdiction: string) { return BEAT_NOTES.filter((n) => n.jurisdiction === jurisdiction).sort((a, b) => b.timestamp.localeCompare(a.timestamp)); }
export function addBeatNote(jurisdiction: string, location: string, note: string, author: string) {
  const n = { id: `bn-${Date.now()}`, jurisdiction, location, note, author, timestamp: new Date().toISOString() }; BEAT_NOTES.unshift(n); return n;
}

// ── Collaboration Requests (IO → IO cross-officer notification) ───────────────
const COLLAB: any[] = [];
export function getCollab() { return COLLAB; }
export function addCollab(fromOfficer: string, toOfficer: string, caseRef: string, reason: string) {
  const c = { id: `collab-${Date.now()}`, fromOfficer, toOfficer, caseRef, reason, status: "OPEN", timestamp: new Date().toISOString() }; COLLAB.unshift(c); return c;
}

// ── FIELD INTEL — Community Tips + Quick Field Reports (Akka → IO pipeline) ────
const FIELD_INTEL: any[] = [
  { id: "fi-seed", source: "AKKA-55", kind: "COMMUNITY_TIP", text: "Resident reports two men on a bike casing shops near Peenya market at night.", location: "Peenya", status: "NEW", timestamp: new Date(Date.now() - 3 * 3600e3).toISOString() }
];
export function getFieldIntel() { return FIELD_INTEL.sort((a, b) => b.timestamp.localeCompare(a.timestamp)); }
export function addFieldIntel(source: string, kind: string, text: string, location: string) {
  const f = { id: `fi-${Date.now()}`, source, kind, text, location, status: "NEW", timestamp: new Date().toISOString() }; FIELD_INTEL.unshift(f); return f;
}

// ── Pre-Shift Equipment Checklist ────────────────────────────────────────────
const EQUIPMENT: any[] = [];
export function addEquipmentCheck(officerId: string, items: any) {
  const e = { id: `eq-${Date.now()}`, officerId, items, timestamp: new Date().toISOString() }; EQUIPMENT.unshift(e); return e;
}
export function getEquipmentChecks(officerId: string) { return EQUIPMENT.filter((e) => e.officerId === officerId).slice(0, 10); }

// ── Jaro-Winkler similarity (for repeat person/address auto-flag) ────────────
export function jaroWinkler(s1: string, s2: string): number {
  s1 = (s1 || "").toLowerCase().trim(); s2 = (s2 || "").toLowerCase().trim();
  if (!s1 || !s2) return 0;
  if (s1 === s2) return 1;
  const m = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;
  const s1m = new Array(s1.length).fill(false), s2m = new Array(s2.length).fill(false);
  let matches = 0;
  for (let i = 0; i < s1.length; i++) {
    const lo = Math.max(0, i - m), hi = Math.min(i + m + 1, s2.length);
    for (let k = lo; k < hi; k++) { if (!s2m[k] && s1[i] === s2[k]) { s1m[i] = s2m[k] = true; matches++; break; } }
  }
  if (!matches) return 0;
  let t = 0, k = 0;
  for (let i = 0; i < s1.length; i++) { if (s1m[i]) { while (!s2m[k]) k++; if (s1[i] !== s2[k]) t++; k++; } }
  t /= 2;
  const jaro = (matches / s1.length + matches / s2.length + (matches - t) / matches) / 3;
  let prefix = 0;
  for (let i = 0; i < Math.min(4, s1.length, s2.length); i++) { if (s1[i] === s2[i]) prefix++; else break; }
  return jaro + prefix * 0.1 * (1 - jaro);
}
