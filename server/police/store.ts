import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import type {
  User, Station, Incident, SosEvent, DutyStatus, BeatCheckpoint, Evidence,
  Message, ShiftAssignment, ReviewNote, DispatchApproval, AuditLog, CaseLink,
  PoliceRole, GeoPoint,
} from "./types";

const now = () => new Date().toISOString();
const id = (p: string) => `${p}_${crypto.randomBytes(5).toString("hex")}`;

/**
 * Storage seam (Phase 3). Every route depends on this interface, NOT on the
 * in-memory implementation — so a Postgres/Supabase-backed store can be dropped
 * in later without touching a single route handler.
 */
export interface PoliceStore {
  // users / auth
  findUserByBadge(badge: string): User | undefined;
  findUserById(id: string): User | undefined;
  listUsers(filter?: { stationId?: string; role?: PoliceRole }): User[];
  createUser(input: Omit<User, "id" | "createdAt" | "passwordHash"> & { password: string }): User;
  updateUser(id: string, patch: Partial<User>): User | undefined;

  // stations
  listStations(): Station[];
  findStation(id: string): Station | undefined;
  createStation(input: Omit<Station, "id" | "createdAt">): Station;
  updateStation(id: string, patch: Partial<Station>): Station | undefined;
  deleteStation(id: string): boolean;

  // incidents
  listIncidents(filter?: { stationId?: string; assignedOfficerId?: string }): Incident[];
  findIncident(id: string): Incident | undefined;
  createIncident(input: Omit<Incident, "id" | "createdAt" | "updatedAt" | "resolvedAt" | "photoUrl"> & { photoUrl?: string | null }): Incident;
  updateIncident(id: string, patch: Partial<Incident>): Incident | undefined;

  // sos
  listSos(filter?: { stationId?: string; status?: string }): SosEvent[];
  createSos(input: Omit<SosEvent, "id" | "createdAt" | "acknowledgedById" | "dispatchedOfficerId" | "resolvedAt" | "status">): SosEvent;
  updateSos(id: string, patch: Partial<SosEvent>): SosEvent | undefined;

  // duty
  getDuty(officerId: string): DutyStatus | undefined;
  setDuty(officerId: string, onDuty: boolean, geo: GeoPoint | null): DutyStatus;
  listDuty(stationId?: string): DutyStatus[];

  // beats
  listCheckpoints(officerId: string): BeatCheckpoint[];
  checkInCheckpoint(id: string): BeatCheckpoint | undefined;

  // evidence
  listEvidence(incidentId?: string): Evidence[];
  createEvidence(input: { incidentId: string; label: string; userId: string }): Evidence;
  updateEvidence(id: string, patch: Partial<Evidence>): Evidence | undefined;
  appendCustody(id: string, userId: string, action: string): Evidence | undefined;

  // messages
  listMessages(stationId: string): Message[];
  createMessage(input: Omit<Message, "id" | "createdAt">): Message;

  // shifts
  listShifts(stationId: string): ShiftAssignment[];
  createShift(input: Omit<ShiftAssignment, "id" | "createdAt">): ShiftAssignment;
  deleteShift(id: string): boolean;

  // review notes
  listReviewNotes(officerId: string): ReviewNote[];
  createReviewNote(input: Omit<ReviewNote, "id" | "createdAt">): ReviewNote;

  // dispatch approvals
  listApprovals(stationId: string): DispatchApproval[];
  createApproval(input: Omit<DispatchApproval, "id" | "createdAt" | "status" | "decidedById">): DispatchApproval;
  updateApproval(id: string, patch: Partial<DispatchApproval>): DispatchApproval | undefined;

  // audit (hash-chained)
  appendAudit(input: { actorId: string; actorRole: PoliceRole; action: string; target: string }): AuditLog;
  listAudit(): AuditLog[];
  verifyAuditChain(): { valid: boolean; brokenAt: number | null };

  // cross-jurisdiction linkage (super admin)
  computeCaseLinks(): CaseLink[];
}

export class MemoryPoliceStore implements PoliceStore {
  private users = new Map<string, User>();
  private stations = new Map<string, Station>();
  private incidents = new Map<string, Incident>();
  private sos = new Map<string, SosEvent>();
  private duty = new Map<string, DutyStatus>();
  private checkpoints = new Map<string, BeatCheckpoint>();
  private evidence = new Map<string, Evidence>();
  private messages = new Map<string, Message>();
  private shifts = new Map<string, ShiftAssignment>();
  private reviewNotes = new Map<string, ReviewNote>();
  private approvals = new Map<string, DispatchApproval>();
  private audit: AuditLog[] = [];

  constructor() {
    this.seed();
  }

  // ---- users ----
  findUserByBadge(badge: string) {
    return [...this.users.values()].find((u) => u.badge.toLowerCase() === badge.toLowerCase());
  }
  findUserById(uid: string) { return this.users.get(uid); }
  listUsers(filter?: { stationId?: string; role?: PoliceRole }) {
    return [...this.users.values()].filter(
      (u) => (!filter?.stationId || u.stationId === filter.stationId) && (!filter?.role || u.role === filter.role),
    );
  }
  createUser(input: Omit<User, "id" | "createdAt" | "passwordHash"> & { password: string }) {
    const uid = id("usr");
    const { password, ...rest } = input;
    const user: User = { ...rest, id: uid, passwordHash: bcrypt.hashSync(password, 10), createdAt: now() };
    this.users.set(uid, user);
    return user;
  }
  updateUser(uid: string, patch: Partial<User>) {
    const u = this.users.get(uid);
    if (!u) return undefined;
    const updated = { ...u, ...patch };
    this.users.set(uid, updated);
    return updated;
  }

  // ---- stations ----
  listStations() { return [...this.stations.values()]; }
  findStation(sid: string) { return this.stations.get(sid); }
  createStation(input: Omit<Station, "id" | "createdAt">) {
    const sid = id("stn");
    const s: Station = { ...input, id: sid, createdAt: now() };
    this.stations.set(sid, s);
    return s;
  }
  updateStation(sid: string, patch: Partial<Station>) {
    const s = this.stations.get(sid);
    if (!s) return undefined;
    const updated = { ...s, ...patch };
    this.stations.set(sid, updated);
    return updated;
  }
  deleteStation(sid: string) { return this.stations.delete(sid); }

  // ---- incidents ----
  listIncidents(filter?: { stationId?: string; assignedOfficerId?: string }) {
    return [...this.incidents.values()]
      .filter((i) => (!filter?.stationId || i.stationId === filter.stationId) &&
        (!filter?.assignedOfficerId || i.assignedOfficerId === filter.assignedOfficerId))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  findIncident(iid: string) { return this.incidents.get(iid); }
  createIncident(input: Omit<Incident, "id" | "createdAt" | "updatedAt" | "resolvedAt" | "photoUrl"> & { photoUrl?: string | null }) {
    const iid = id("inc");
    const t = now();
    const inc: Incident = { ...input, photoUrl: input.photoUrl ?? null, id: iid, createdAt: t, updatedAt: t, resolvedAt: null };
    this.incidents.set(iid, inc);
    return inc;
  }
  updateIncident(iid: string, patch: Partial<Incident>) {
    const inc = this.incidents.get(iid);
    if (!inc) return undefined;
    const updated = { ...inc, ...patch, updatedAt: now() };
    if (patch.status === "resolved" && !inc.resolvedAt) updated.resolvedAt = now();
    this.incidents.set(iid, updated);
    return updated;
  }

  // ---- sos ----
  listSos(filter?: { stationId?: string; status?: string }) {
    return [...this.sos.values()]
      .filter((s) => (!filter?.stationId || s.stationId === filter.stationId) &&
        (!filter?.status || s.status === filter.status))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  createSos(input: Omit<SosEvent, "id" | "createdAt" | "acknowledgedById" | "dispatchedOfficerId" | "resolvedAt" | "status">) {
    const sid = id("sos");
    const s: SosEvent = {
      ...input, id: sid, status: "active", createdAt: now(),
      acknowledgedById: null, dispatchedOfficerId: null, resolvedAt: null,
    };
    this.sos.set(sid, s);
    return s;
  }
  updateSos(sid: string, patch: Partial<SosEvent>) {
    const s = this.sos.get(sid);
    if (!s) return undefined;
    const updated = { ...s, ...patch };
    if (patch.status === "resolved" && !s.resolvedAt) updated.resolvedAt = now();
    this.sos.set(sid, updated);
    return updated;
  }

  // ---- duty ----
  getDuty(officerId: string) { return this.duty.get(officerId); }
  setDuty(officerId: string, onDuty: boolean, geo: GeoPoint | null) {
    const d: DutyStatus = { officerId, onDuty, geo, updatedAt: now() };
    this.duty.set(officerId, d);
    return d;
  }
  listDuty(stationId?: string) {
    const all = [...this.duty.values()];
    if (!stationId) return all;
    return all.filter((d) => this.users.get(d.officerId)?.stationId === stationId);
  }

  // ---- beats ----
  listCheckpoints(officerId: string) {
    return [...this.checkpoints.values()].filter((c) => c.officerId === officerId);
  }
  checkInCheckpoint(cid: string) {
    const c = this.checkpoints.get(cid);
    if (!c) return undefined;
    const updated = { ...c, checkedIn: true, checkedInAt: now() };
    this.checkpoints.set(cid, updated);
    return updated;
  }

  // ---- evidence ----
  listEvidence(incidentId?: string) {
    return [...this.evidence.values()].filter((e) => !incidentId || e.incidentId === incidentId);
  }
  createEvidence(input: { incidentId: string; label: string; userId: string }) {
    const eid = id("evd");
    const e: Evidence = {
      id: eid, incidentId: input.incidentId, label: input.label,
      qrCode: `SAHASRA-EVD-${eid.toUpperCase()}`, url: null,
      custodyLog: [{ userId: input.userId, action: "created", at: now() }], createdAt: now(),
    };
    this.evidence.set(eid, e);
    return e;
  }
  updateEvidence(eid: string, patch: Partial<Evidence>) {
    const e = this.evidence.get(eid);
    if (!e) return undefined;
    const updated = { ...e, ...patch };
    this.evidence.set(eid, updated);
    return updated;
  }
  appendCustody(eid: string, userId: string, action: string) {
    const e = this.evidence.get(eid);
    if (!e) return undefined;
    const updated = { ...e, custodyLog: [...e.custodyLog, { userId, action, at: now() }] };
    this.evidence.set(eid, updated);
    return updated;
  }

  // ---- messages ----
  listMessages(stationId: string) {
    return [...this.messages.values()].filter((m) => m.stationId === stationId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }
  createMessage(input: Omit<Message, "id" | "createdAt">) {
    const mid = id("msg");
    const m: Message = { ...input, id: mid, createdAt: now() };
    this.messages.set(mid, m);
    return m;
  }

  // ---- shifts ----
  listShifts(stationId: string) {
    return [...this.shifts.values()].filter((s) => s.stationId === stationId);
  }
  createShift(input: Omit<ShiftAssignment, "id" | "createdAt">) {
    const sid = id("sft");
    const s: ShiftAssignment = { ...input, id: sid, createdAt: now() };
    this.shifts.set(sid, s);
    return s;
  }
  deleteShift(sid: string) { return this.shifts.delete(sid); }

  // ---- review notes ----
  listReviewNotes(officerId: string) {
    return [...this.reviewNotes.values()].filter((n) => n.officerId === officerId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  createReviewNote(input: Omit<ReviewNote, "id" | "createdAt">) {
    const nid = id("note");
    const n: ReviewNote = { ...input, id: nid, createdAt: now() };
    this.reviewNotes.set(nid, n);
    return n;
  }

  // ---- dispatch approvals ----
  listApprovals(stationId: string) {
    return [...this.approvals.values()].filter((a) => a.stationId === stationId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  createApproval(input: Omit<DispatchApproval, "id" | "createdAt" | "status" | "decidedById">) {
    const aid = id("apr");
    const a: DispatchApproval = { ...input, id: aid, status: "pending", decidedById: null, createdAt: now() };
    this.approvals.set(aid, a);
    return a;
  }
  updateApproval(aid: string, patch: Partial<DispatchApproval>) {
    const a = this.approvals.get(aid);
    if (!a) return undefined;
    const updated = { ...a, ...patch };
    this.approvals.set(aid, updated);
    return updated;
  }

  // ---- audit (hash-chain, same SHA-256 approach as the web build) ----
  appendAudit(input: { actorId: string; actorRole: PoliceRole; action: string; target: string }) {
    const seq = this.audit.length;
    const prevHash = seq === 0 ? "GENESIS" : this.audit[seq - 1].hash;
    const at = now();
    const payload = `${seq}|${input.actorId}|${input.action}|${input.target}|${at}|${prevHash}`;
    const hash = crypto.createHash("sha256").update(payload).digest("hex");
    const entry: AuditLog = { id: id("aud"), seq, ...input, at, prevHash, hash };
    this.audit.push(entry);
    return entry;
  }
  listAudit() { return [...this.audit].sort((a, b) => b.seq - a.seq); }
  verifyAuditChain() {
    for (let i = 0; i < this.audit.length; i++) {
      const e = this.audit[i];
      const prevHash = i === 0 ? "GENESIS" : this.audit[i - 1].hash;
      const payload = `${e.seq}|${e.actorId}|${e.action}|${e.target}|${e.at}|${prevHash}`;
      const expected = crypto.createHash("sha256").update(payload).digest("hex");
      if (e.prevHash !== prevHash || e.hash !== expected) return { valid: false, brokenAt: e.seq };
    }
    return { valid: true, brokenAt: null };
  }

  // ---- cross-jurisdiction case linkage (super admin only) ----
  computeCaseLinks(): CaseLink[] {
    const incs = [...this.incidents.values()];
    const links: CaseLink[] = [];
    for (let i = 0; i < incs.length; i++) {
      for (let j = i + 1; j < incs.length; j++) {
        const a = incs[i], b = incs[j];
        if (a.stationId === b.stationId) continue; // only CROSS-station links matter here
        if (a.mo && a.mo === b.mo) {
          links.push({ incidentA: a.id, incidentB: b.id, reason: "shared_mo", detail: `Same MO: ${a.mo}`, score: 0.8 });
          continue;
        }
        const shared = a.entities.filter((e) => b.entities.includes(e));
        if (shared.length > 0) {
          links.push({ incidentA: a.id, incidentB: b.id, reason: "shared_entity", detail: `Shared entity: ${shared.join(", ")}`, score: 0.6 + 0.1 * shared.length });
        }
      }
    }
    return links.sort((x, y) => y.score - x.score);
  }

  // ---- seed ----
  private seed() {
    const t = now();
    // Stations (Bengaluru)
    const stationsSeed: Omit<Station, "createdAt">[] = [
      { id: "stn_koramangala", name: "Koramangala PS", code: "KRM", district: "Bengaluru South", geo: { lat: 12.9352, lng: 77.6245 }, headId: null },
      { id: "stn_whitefield", name: "Whitefield PS", code: "WHF", district: "Bengaluru East", geo: { lat: 12.9698, lng: 77.7499 }, headId: null },
      { id: "stn_jayanagar", name: "Jayanagar PS", code: "JYN", district: "Bengaluru South", geo: { lat: 12.9250, lng: 77.5938 }, headId: null },
    ];
    stationsSeed.forEach((s) => this.stations.set(s.id, { ...s, createdAt: t }));

    // Users: 1 super admin, 1 head per station, 2 officers per station.
    // Seed password for every account: "sahasra123"
    const mk = (u: Omit<User, "id" | "createdAt" | "passwordHash"> & { id: string; password: string }) => {
      const { password, ...rest } = u;
      this.users.set(u.id, { ...rest, passwordHash: bcrypt.hashSync(password, 10), createdAt: t });
    };
    mk({ id: "usr_super", badge: "SA-001", name: "IGP Anitha Rao", role: "super_admin", rank: "Inspector General", stationId: null, phone: "9000000001", active: true, password: "sahasra123" });

    mk({ id: "usr_head_krm", badge: "SH-KRM", name: "SP Vikram Nair", role: "station_head", rank: "Station Head", stationId: "stn_koramangala", phone: "9000000010", active: true, password: "sahasra123" });
    mk({ id: "usr_head_whf", badge: "SH-WHF", name: "SP Deepa Menon", role: "station_head", rank: "Station Head", stationId: "stn_whitefield", phone: "9000000011", active: true, password: "sahasra123" });
    mk({ id: "usr_head_jyn", badge: "SH-JYN", name: "SP Ramesh Gowda", role: "station_head", rank: "Station Head", stationId: "stn_jayanagar", phone: "9000000012", active: true, password: "sahasra123" });

    mk({ id: "usr_off_1", badge: "KSP-1001", name: "Inspector Reddy", role: "officer", rank: "Inspector", stationId: "stn_koramangala", phone: "9000000100", active: true, password: "sahasra123" });
    mk({ id: "usr_off_2", badge: "KSP-1002", name: "SI Kavya Shetty", role: "officer", rank: "Sub-Inspector", stationId: "stn_koramangala", phone: "9000000101", active: true, password: "sahasra123" });
    mk({ id: "usr_off_3", badge: "KSP-1003", name: "Inspector Iqbal", role: "officer", rank: "Inspector", stationId: "stn_whitefield", phone: "9000000102", active: true, password: "sahasra123" });
    mk({ id: "usr_off_4", badge: "KSP-1004", name: "SI Meera Das", role: "officer", rank: "Sub-Inspector", stationId: "stn_jayanagar", phone: "9000000103", active: true, password: "sahasra123" });

    // Assign heads to stations
    this.stations.set("stn_koramangala", { ...this.stations.get("stn_koramangala")!, headId: "usr_head_krm" });
    this.stations.set("stn_whitefield", { ...this.stations.get("stn_whitefield")!, headId: "usr_head_whf" });
    this.stations.set("stn_jayanagar", { ...this.stations.get("stn_jayanagar")!, headId: "usr_head_jyn" });

    // Duty defaults
    this.setDuty("usr_off_1", true, { lat: 12.9352, lng: 77.6245 });
    this.setDuty("usr_off_2", false, null);
    this.setDuty("usr_off_3", true, { lat: 12.9698, lng: 77.7499 });
    this.setDuty("usr_off_4", true, { lat: 12.9250, lng: 77.5938 });

    // Incidents (some cross-station shared MO / entity for linkage demo)
    this.createIncident({ title: "Chain snatching near 5th Block", category: "theft", description: "Two-wheeler chain snatch", geo: { lat: 12.9340, lng: 77.6260 }, address: "5th Block, Koramangala", stationId: "stn_koramangala", status: "assigned", priority: "P2", reportedById: "usr_off_1", assignedOfficerId: "usr_off_1", mo: "two_wheeler_snatch", entities: ["KA01AB1234"] });
    this.createIncident({ title: "Bike snatch at ITPL road", category: "theft", description: "Similar snatch MO", geo: { lat: 12.9690, lng: 77.7510 }, address: "ITPL Road, Whitefield", stationId: "stn_whitefield", status: "reported", priority: "P2", reportedById: "usr_off_3", assignedOfficerId: null, mo: "two_wheeler_snatch", entities: ["KA01AB1234"] });
    this.createIncident({ title: "House break-in", category: "burglary", description: "Rear window forced", geo: { lat: 12.9260, lng: 77.5950 }, address: "4th T Block, Jayanagar", stationId: "stn_jayanagar", status: "in_progress", priority: "P1", reportedById: "usr_off_4", assignedOfficerId: "usr_off_4", mo: "rear_window_entry", entities: ["9812345678"] });

    // Beat checkpoints for officer 1
    ["Signal junction", "Market gate", "Metro entrance"].forEach((label, idx) => {
      const cid = id("bcp");
      this.checkpoints.set(cid, { id: cid, officerId: "usr_off_1", label, geo: { lat: 12.9352 + idx * 0.002, lng: 77.6245 + idx * 0.002 }, checkedIn: idx === 0, checkedInAt: idx === 0 ? t : null });
    });

    // Genesis audit entry
    this.appendAudit({ actorId: "system", actorRole: "super_admin", action: "system.seed", target: "bootstrap" });
  }
}

/** Singleton store. Swap MemoryPoliceStore for a Db-backed impl later. */
export const policeStore: PoliceStore = new MemoryPoliceStore();
