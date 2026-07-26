import type { Express, Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { policeStore as store } from "./store";
import { intel } from "./intel";
import { signAccess, signRefresh, verifyAccess, verifyRefresh, revokeRefresh, rotateRefresh, type PoliceRole } from "./jwt";
import type { AccessClaims } from "./jwt";

type Broadcast = (data: any) => void;

interface AuthedRequest extends Request {
  police?: AccessClaims;
}

/**
 * Mounts the 3-role police API under /api/v2. `broadcast` pushes realtime
 * events over the existing /ws WebSocket (used for live SOS/incident pins).
 */
export function mountPoliceRoutes(app: Express, broadcast: Broadcast) {
  // ---- auth middleware ----
  function bearer(req: Request): string | null {
    const a = req.headers.authorization;
    return a?.startsWith("Bearer ") ? a.slice(7) : null;
  }

  function requireJwt(req: AuthedRequest, res: Response, next: NextFunction) {
    const token = bearer(req);
    const claims = token ? verifyAccess(token) : null;
    if (!claims) return res.status(401).json({ message: "Unauthorized" });
    // Server-side role/authorization is derived from the VERIFIED token, never
    // from a client-supplied role field.
    req.police = claims;
    next();
  }

  const requireRole = (...roles: PoliceRole[]) =>
    (req: AuthedRequest, res: Response, next: NextFunction) => {
      if (!req.police || !roles.includes(req.police.role)) {
        return res.status(403).json({ message: "Forbidden: insufficient role" });
      }
      next();
    };

  const audit = (req: AuthedRequest, action: string, target: string) => {
    if (req.police) store.appendAudit({ actorId: req.police.sub, actorRole: req.police.role, action, target });
  };

  const publicUser = (u: any) =>
    u && ({
      id: u.id, badge: u.badge, name: u.name, role: u.role, rank: u.rank,
      stationId: u.stationId, phone: u.phone, active: u.active,
      // station NAME + district (legacy intel screens filter by these) — "" for super admin.
      station: (u.stationId && store.findStation(u.stationId)?.name) || "",
      district: (u.stationId && store.findStation(u.stationId)?.district) || "",
    });

  // ============================================================ AUTH
  app.post("/api/v2/auth/login", (req: Request, res: Response) => {
    const { badge, password } = req.body || {};
    if (!badge || !password) return res.status(400).json({ message: "badge and password required" });
    const user = store.findUserByBadge(String(badge));
    if (!user || !user.active || !bcrypt.compareSync(String(password), user.passwordHash)) {
      return res.status(401).json({ message: "Invalid badge or password" });
    }
    const accessToken = signAccess({ sub: user.id, role: user.role, stationId: user.stationId, name: user.name });
    const refreshToken = signRefresh(user.id);
    store.appendAudit({ actorId: user.id, actorRole: user.role, action: "auth.login", target: user.badge });
    // The VERIFIED role comes back to the client so it routes to the right stack.
    res.json({ accessToken, refreshToken, user: publicUser(user) });
  });

  app.post("/api/v2/auth/refresh", (req: Request, res: Response) => {
    const { refreshToken } = req.body || {};
    const claims = refreshToken ? verifyRefresh(String(refreshToken)) : null;
    if (!claims) return res.status(401).json({ message: "Invalid refresh token" });
    const user = store.findUserById(claims.sub);
    if (!user || !user.active) return res.status(401).json({ message: "User inactive" });
    const accessToken = signAccess({ sub: user.id, role: user.role, stationId: user.stationId, name: user.name });
    const newRefresh = rotateRefresh(String(refreshToken), user.id); // rotation
    res.json({ accessToken, refreshToken: newRefresh, user: publicUser(user) });
  });

  app.post("/api/v2/auth/logout", (req: Request, res: Response) => {
    const { refreshToken } = req.body || {};
    if (refreshToken) revokeRefresh(String(refreshToken));
    res.json({ ok: true });
  });

  app.get("/api/v2/auth/me", requireJwt, (req: AuthedRequest, res: Response) => {
    const user = store.findUserById(req.police!.sub);
    if (!user) return res.status(404).json({ message: "Not found" });
    res.json({ user: publicUser(user) });
  });

  // ============================================================ STATIONS
  app.get("/api/v2/stations", requireJwt, (_req, res) => {
    res.json({ stations: store.listStations() });
  });
  app.post("/api/v2/stations", requireJwt, requireRole("super_admin"), (req: AuthedRequest, res) => {
    const { name, code, district, geo, headId } = req.body || {};
    if (!name || !code) return res.status(400).json({ message: "name and code required" });
    const s = store.createStation({ name, code, district: district || "", geo: geo || { lat: 0, lng: 0 }, headId: headId ?? null });
    audit(req, "station.create", s.id);
    res.json({ station: s });
  });
  app.patch("/api/v2/stations/:id", requireJwt, requireRole("super_admin"), (req: AuthedRequest, res) => {
    const s = store.updateStation(String(req.params.id), req.body || {});
    if (!s) return res.status(404).json({ message: "Not found" });
    audit(req, "station.update", s.id);
    res.json({ station: s });
  });
  app.delete("/api/v2/stations/:id", requireJwt, requireRole("super_admin"), (req: AuthedRequest, res) => {
    const ok = store.deleteStation(String(req.params.id));
    audit(req, "station.delete", String(req.params.id));
    res.json({ ok });
  });

  // ============================================================ USERS / ROLE MGMT
  app.get("/api/v2/users", requireJwt, requireRole("super_admin", "station_head"), (req: AuthedRequest, res) => {
    // Heads only see their own station's users.
    const stationId = req.police!.role === "station_head" ? req.police!.stationId || undefined : (req.query.stationId as string | undefined);
    res.json({ users: store.listUsers({ stationId }).map(publicUser) });
  });
  app.post("/api/v2/users", requireJwt, requireRole("super_admin"), (req: AuthedRequest, res) => {
    const { badge, name, role, rank, stationId, phone, password } = req.body || {};
    if (!badge || !name || !role || !password) return res.status(400).json({ message: "badge, name, role, password required" });
    if (store.findUserByBadge(badge)) return res.status(409).json({ message: "Badge already exists" });
    const u = store.createUser({ badge, name, role, rank: rank || role, stationId: stationId ?? null, phone: phone || "", active: true, password });
    audit(req, "user.create", u.badge);
    res.json({ user: publicUser(u) });
  });
  app.patch("/api/v2/users/:id", requireJwt, requireRole("super_admin"), (req: AuthedRequest, res) => {
    const u = store.updateUser(String(req.params.id), req.body || {});
    if (!u) return res.status(404).json({ message: "Not found" });
    audit(req, "user.update", u.badge);
    res.json({ user: publicUser(u) });
  });

  // ============================================================ INCIDENTS
  app.get("/api/v2/incidents", requireJwt, (req: AuthedRequest, res) => {
    const { role, stationId, sub } = req.police!;
    let filter: any = {};
    if (role === "officer") filter = { stationId: stationId || undefined };
    else if (role === "station_head") filter = { stationId: stationId || undefined };
    // super_admin: all
    if (req.query.mine === "1") filter.assignedOfficerId = sub;
    res.json({ incidents: store.listIncidents(filter) });
  });
  app.get("/api/v2/incidents/:id", requireJwt, (req, res) => {
    const inc = store.findIncident(String(req.params.id));
    if (!inc) return res.status(404).json({ message: "Not found" });
    res.json({ incident: inc });
  });
  app.post("/api/v2/incidents", requireJwt, (req: AuthedRequest, res) => {
    const { title, category, description, geo, address, priority, mo, entities, photoUrl } = req.body || {};
    if (!title) return res.status(400).json({ message: "title required" });
    const stationId = req.police!.stationId || store.listStations()[0]?.id;
    const inc = store.createIncident({
      title, category: category || "general", description: description || "",
      geo: geo || { lat: 0, lng: 0 }, address: address || "", stationId,
      status: "reported", priority: priority || "P3", reportedById: req.police!.sub,
      assignedOfficerId: null, mo: mo || "", entities: entities || [], photoUrl: photoUrl ?? null,
    });
    audit(req, "incident.create", inc.id);
    broadcast({ type: "incident:new", incident: inc }); // live pin
    res.json({ incident: inc });
  });
  app.patch("/api/v2/incidents/:id", requireJwt, (req: AuthedRequest, res) => {
    const inc = store.updateIncident(String(req.params.id), req.body || {});
    if (!inc) return res.status(404).json({ message: "Not found" });
    audit(req, "incident.update", inc.id);
    broadcast({ type: "incident:update", incident: inc });
    res.json({ incident: inc });
  });

  // ============================================================ SOS
  app.get("/api/v2/sos", requireJwt, (req: AuthedRequest, res) => {
    const { role, stationId } = req.police!;
    const filter = role === "super_admin" ? {} : { stationId: stationId || undefined };
    res.json({ sos: store.listSos(filter) });
  });
  app.post("/api/v2/sos", requireJwt, requireRole("officer"), (req: AuthedRequest, res) => {
    const { geo, note } = req.body || {};
    const sos = store.createSos({ officerId: req.police!.sub, stationId: req.police!.stationId || "", geo: geo || { lat: 0, lng: 0 }, note: note || "Officer needs assistance" });
    // Auto-create a dispatch approval for the station head queue (cross-role link).
    store.createApproval({ sosId: sos.id, stationId: sos.stationId, requestedOfficerId: req.police!.sub });
    audit(req, "sos.trigger", sos.id);
    broadcast({ type: "sos:new", sos }); // live push to nearby officers + head
    res.json({ sos });
  });
  app.patch("/api/v2/sos/:id", requireJwt, (req: AuthedRequest, res) => {
    const patch = req.body || {};
    if (patch.status === "acknowledged") patch.acknowledgedById = req.police!.sub;
    const sos = store.updateSos(String(req.params.id), patch);
    if (!sos) return res.status(404).json({ message: "Not found" });
    audit(req, "sos.update", sos.id);
    broadcast({ type: "sos:update", sos });
    res.json({ sos });
  });

  // ============================================================ DUTY (officer <-> head roster)
  app.get("/api/v2/duty", requireJwt, (req: AuthedRequest, res) => {
    const stationId = req.police!.role === "super_admin" ? undefined : req.police!.stationId || undefined;
    const duty = store.listDuty(stationId).map((d) => ({ ...d, officer: publicUser(store.findUserById(d.officerId)) }));
    res.json({ duty });
  });
  app.post("/api/v2/duty", requireJwt, requireRole("officer"), (req: AuthedRequest, res) => {
    const { onDuty, geo } = req.body || {};
    const d = store.setDuty(req.police!.sub, !!onDuty, geo ?? null);
    audit(req, "duty.toggle", `${onDuty ? "on" : "off"}`);
    broadcast({ type: "duty:update", duty: { ...d, officer: publicUser(store.findUserById(d.officerId)) } });
    res.json({ duty: d });
  });

  // ============================================================ BEATS
  app.get("/api/v2/beats", requireJwt, requireRole("officer"), (req: AuthedRequest, res) => {
    res.json({ checkpoints: store.listCheckpoints(req.police!.sub) });
  });
  app.post("/api/v2/beats/:id/checkin", requireJwt, requireRole("officer"), (req: AuthedRequest, res) => {
    const c = store.checkInCheckpoint(String(req.params.id));
    if (!c) return res.status(404).json({ message: "Not found" });
    audit(req, "beat.checkin", c.id);
    res.json({ checkpoint: c });
  });

  // ============================================================ EVIDENCE
  app.get("/api/v2/evidence", requireJwt, (req: AuthedRequest, res) => {
    const incidentId = req.query.incidentId as string | undefined;
    if (incidentId) return res.json({ evidence: store.listEvidence(incidentId) });
    // Station-wide locker oversight for heads: evidence whose case is in-station.
    if (req.police!.role === "station_head") {
      const caseIds = new Set(store.listIncidents({ stationId: req.police!.stationId || undefined }).map((i) => i.id));
      const rows = store.listEvidence().filter((e) => caseIds.has(e.incidentId));
      return res.json({ evidence: rows });
    }
    res.json({ evidence: store.listEvidence() });
  });
  app.post("/api/v2/evidence", requireJwt, (req: AuthedRequest, res) => {
    const { incidentId, label } = req.body || {};
    if (!incidentId || !label) return res.status(400).json({ message: "incidentId and label required" });
    const e = store.createEvidence({ incidentId, label, userId: req.police!.sub });
    audit(req, "evidence.create", e.id);
    res.json({ evidence: e });
  });
  app.post("/api/v2/evidence/:id/custody", requireJwt, (req: AuthedRequest, res) => {
    const e = store.appendCustody(String(req.params.id), req.police!.sub, req.body?.action || "handled");
    if (!e) return res.status(404).json({ message: "Not found" });
    audit(req, "evidence.custody", e.id);
    res.json({ evidence: e });
  });

  // ============================================================ SHIFTS
  app.get("/api/v2/shifts", requireJwt, (req: AuthedRequest, res) => {
    const stationId = req.police!.stationId || (req.query.stationId as string) || "";
    res.json({ shifts: store.listShifts(stationId) });
  });
  app.post("/api/v2/shifts", requireJwt, requireRole("station_head"), (req: AuthedRequest, res) => {
    const { officerId, date, shift } = req.body || {};
    if (!officerId || !date || !shift) return res.status(400).json({ message: "officerId, date, shift required" });
    const s = store.createShift({ officerId, stationId: req.police!.stationId || "", date, shift });
    audit(req, "shift.create", s.id);
    res.json({ shift: s });
  });
  app.delete("/api/v2/shifts/:id", requireJwt, requireRole("station_head"), (req: AuthedRequest, res) => {
    const ok = store.deleteShift(String(req.params.id));
    audit(req, "shift.delete", String(req.params.id));
    res.json({ ok });
  });

  // ============================================================ REVIEW NOTES (head/super only)
  app.get("/api/v2/review-notes/:officerId", requireJwt, requireRole("station_head", "super_admin"), (req, res) => {
    res.json({ notes: store.listReviewNotes(String(req.params.officerId)) });
  });
  app.post("/api/v2/review-notes", requireJwt, requireRole("station_head", "super_admin"), (req: AuthedRequest, res) => {
    const { officerId, body } = req.body || {};
    if (!officerId || !body) return res.status(400).json({ message: "officerId and body required" });
    const n = store.createReviewNote({ officerId, authorId: req.police!.sub, body });
    audit(req, "review.note", officerId);
    res.json({ note: n });
  });

  // ============================================================ DISPATCH APPROVALS (head)
  app.get("/api/v2/approvals", requireJwt, requireRole("station_head"), (req: AuthedRequest, res) => {
    res.json({ approvals: store.listApprovals(req.police!.stationId || "") });
  });
  app.patch("/api/v2/approvals/:id", requireJwt, requireRole("station_head"), (req: AuthedRequest, res) => {
    const { status } = req.body || {};
    const a = store.updateApproval(String(req.params.id), { status, decidedById: req.police!.sub });
    if (!a) return res.status(404).json({ message: "Not found" });
    if (status === "approved") {
      store.updateSos(a.sosId, { status: "dispatched", dispatchedOfficerId: a.requestedOfficerId });
      broadcast({ type: "sos:update", sos: store.listSos().find((s) => s.id === a.sosId) });
    }
    audit(req, "dispatch." + status, a.id);
    res.json({ approval: a });
  });

  // ============================================================ MESSAGES
  app.get("/api/v2/messages", requireJwt, (req: AuthedRequest, res) => {
    const stationId = req.police!.stationId || (req.query.stationId as string) || "";
    res.json({ messages: store.listMessages(stationId) });
  });
  app.post("/api/v2/messages", requireJwt, (req: AuthedRequest, res) => {
    const { body, toId } = req.body || {};
    if (!body) return res.status(400).json({ message: "body required" });
    const m = store.createMessage({ fromId: req.police!.sub, toId: toId ?? null, stationId: req.police!.stationId || "", body });
    broadcast({ type: "message:new", message: m });
    res.json({ message: m });
  });

  // ============================================================ FILE UPLOAD
  // Base64 data-URL -> written to /uploads (served statically) -> retrieval URL.
  // Real cloud storage (Supabase/Firebase) drops in here later; the contract
  // (return a durable URL) stays the same.
  app.post("/api/v2/uploads", requireJwt, (req: AuthedRequest, res) => {
    const { dataUrl } = req.body || {};
    const m = /^data:(image\/[\w.+-]+);base64,(.+)$/.exec(String(dataUrl || ""));
    if (!m) return res.status(400).json({ message: "dataUrl (base64 image) required" });
    try {
      const ext = m[1].split("/")[1].replace(/[^\w]/g, "") || "jpg";
      const buf = Buffer.from(m[2], "base64");
      if (buf.length > 8 * 1024 * 1024) return res.status(413).json({ message: "Image too large (max 8MB)" });
      const name = `upl_${Date.now()}_${crypto.randomBytes(4).toString("hex")}.${ext}`;
      const dir = path.resolve(process.cwd(), "uploads");
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, name), buf);
      audit(req, "upload.create", name);
      res.json({ url: `/uploads/${name}`, name });
    } catch (e: any) {
      res.status(500).json({ message: e?.message || "Upload failed" });
    }
  });

  // Attach a photo/URL to an evidence item (QR evidence flow).
  app.patch("/api/v2/evidence/:id", requireJwt, (req: AuthedRequest, res) => {
    const e = store.updateEvidence(String(req.params.id), { url: req.body?.url });
    if (!e) return res.status(404).json({ message: "Not found" });
    store.appendCustody(e.id, req.police!.sub, "photo_attached");
    audit(req, "evidence.photo", e.id);
    res.json({ evidence: e });
  });

  // ============================================================ INTEL (CCTNS/ANPR/etc.)
  // Backed by server/police/intel.ts — real corpus stats + server-owned case data.
  app.get("/api/v2/intel/summary", requireJwt, (_req, res) => res.json({ summary: intel.summary(), connectors: intel.connectors() }));
  app.get("/api/v2/intel/firs", requireJwt, (req, res) => res.json({ firs: intel.listFirs(req.query.q as string | undefined) }));
  app.post("/api/v2/intel/firs", requireJwt, (req: AuthedRequest, res) => {
    const fir = intel.registerFir(req.body || {});
    audit(req, "cctns.register_fir", fir.firNo);
    res.json({ fir });
  });
  app.get("/api/v2/intel/suspects", requireJwt, (_req, res) => res.json({ suspects: intel.listSuspects() }));
  app.get("/api/v2/intel/gangs", requireJwt, (_req, res) => res.json({ gangs: intel.listGangs() }));
  app.get("/api/v2/intel/hotspots", requireJwt, (_req, res) => res.json(intel.hotspots()));
  app.get("/api/v2/intel/districts", requireJwt, (_req, res) => res.json({ districts: intel.districts() }));
  app.get("/api/v2/intel/anpr", requireJwt, (_req, res) => res.json({ triggers: intel.listAnpr() }));
  app.get("/api/v2/intel/akka-pade", requireJwt, (_req, res) => res.json({ patrols: intel.listPatrols() }));
  app.get("/api/v2/intel/nlp-suggestions", requireJwt, (_req, res) => res.json({ suggestions: intel.nlpSuggestions() }));

  // ============================================================ AGGREGATES / DASHBOARDS
  // Station performance (head) — computed from real data
  app.get("/api/v2/analytics/station", requireJwt, requireRole("station_head", "super_admin"), (req: AuthedRequest, res) => {
    const stationId = (req.query.stationId as string) || req.police!.stationId || "";
    const incs = store.listIncidents({ stationId });
    const resolved = incs.filter((i) => i.status === "resolved" || i.status === "closed");
    const open = incs.filter((i) => i.status !== "resolved" && i.status !== "closed");
    const avgMs = resolved.length
      ? resolved.reduce((acc, i) => acc + (new Date(i.resolvedAt!).getTime() - new Date(i.createdAt).getTime()), 0) / resolved.length
      : 0;
    res.json({
      stationId, total: incs.length, resolved: resolved.length, open: open.length,
      avgResolutionHours: Math.round((avgMs / 3600000) * 10) / 10,
      officers: store.listUsers({ stationId, role: "officer" }).length,
      onDuty: store.listDuty(stationId).filter((d) => d.onDuty).length,
    });
  });

  // Cross-station command center (super admin) — real rollup
  app.get("/api/v2/analytics/command-center", requireJwt, requireRole("super_admin"), (_req, res) => {
    const stations = store.listStations();
    const allInc = store.listIncidents();
    const today = new Date().toISOString().slice(0, 10);
    const sosToday = store.listSos().filter((s) => s.createdAt.slice(0, 10) === today);
    res.json({
      stationCount: stations.length,
      officerCount: store.listUsers({ role: "officer" }).length,
      activeCases: allInc.filter((i) => i.status !== "resolved" && i.status !== "closed").length,
      sosToday: sosToday.length,
      activeSos: store.listSos({ status: "active" }).length,
      perStation: stations.map((s) => {
        const incs = store.listIncidents({ stationId: s.id });
        return {
          stationId: s.id, name: s.name, geo: s.geo,
          open: incs.filter((i) => i.status !== "resolved" && i.status !== "closed").length,
          total: incs.length,
        };
      }),
    });
  });

  // Cross-jurisdiction case linkage (super admin)
  app.get("/api/v2/analytics/case-links", requireJwt, requireRole("super_admin"), (_req, res) => {
    const links = store.computeCaseLinks().map((l) => ({
      ...l,
      a: store.findIncident(l.incidentA),
      b: store.findIncident(l.incidentB),
    }));
    res.json({ links });
  });

  // Department-wide report generator (super admin) — real data, CSV + JSON.
  app.get("/api/v2/reports/state", requireJwt, requireRole("super_admin"), (req: AuthedRequest, res) => {
    const from = (req.query.from as string) || "0000-01-01";
    const to = (req.query.to as string) || "9999-12-31";
    const inRange = (iso: string) => {
      const d = iso.slice(0, 10);
      return d >= from && d <= to;
    };
    const stations = store.listStations().map((s) => {
      const incs = store.listIncidents({ stationId: s.id }).filter((i) => inRange(i.createdAt));
      const resolved = incs.filter((i) => i.status === "resolved" || i.status === "closed").length;
      return { station: s.name, code: s.code, total: incs.length, open: incs.length - resolved, resolved };
    });
    const totals = stations.reduce(
      (a, s) => ({ total: a.total + s.total, open: a.open + s.open, resolved: a.resolved + s.resolved }),
      { total: 0, open: 0, resolved: 0 },
    );
    const header = "Station,Code,Total,Open,Resolved";
    const csv = [header, ...stations.map((s) => `${s.station},${s.code},${s.total},${s.open},${s.resolved}`), `TOTAL,,${totals.total},${totals.open},${totals.resolved}`].join("\n");
    audit(req, "report.generate", `${from}..${to}`);
    res.json({ generatedAt: new Date().toISOString(), range: { from, to }, stations, totals, csv });
  });

  // Audit log + integrity (super admin)
  app.get("/api/v2/audit", requireJwt, requireRole("super_admin"), (req, res) => {
    const q = (req.query.q as string || "").toLowerCase();
    let logs = store.listAudit();
    if (q) logs = logs.filter((l) => (l.action + l.target + l.actorId).toLowerCase().includes(q));
    res.json({ logs, integrity: store.verifyAuditChain() });
  });

  // System health (super admin) — real process metrics
  const startedAt = Date.now();
  app.get("/api/v2/system/health", requireJwt, requireRole("super_admin"), (_req, res) => {
    res.json({
      uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
      memoryMb: Math.round(process.memoryUsage().rss / 1048576),
      auditEntries: store.listAudit().length,
      sentryConfigured: !!process.env.EXPO_PUBLIC_SENTRY_DSN,
      timestamp: new Date().toISOString(),
    });
  });
}
