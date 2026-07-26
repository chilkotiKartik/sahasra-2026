import type { PoliceRole } from "./jwt";

export type { PoliceRole };

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface User {
  id: string;
  badge: string; // login identifier, e.g. "KSP-1001"
  name: string;
  role: PoliceRole;
  rank: string;
  stationId: string | null; // super_admin has null (state-wide)
  phone: string;
  passwordHash: string;
  active: boolean;
  createdAt: string;
}

export interface Station {
  id: string;
  name: string;
  code: string;
  district: string;
  geo: GeoPoint;
  headId: string | null; // assigned station head
  createdAt: string;
}

export type IncidentStatus = "reported" | "assigned" | "in_progress" | "resolved" | "closed";
export type IncidentPriority = "P1" | "P2" | "P3" | "P4";

export interface Incident {
  id: string;
  title: string;
  category: string;
  description: string;
  geo: GeoPoint;
  address: string;
  stationId: string;
  status: IncidentStatus;
  priority: IncidentPriority;
  reportedById: string;
  assignedOfficerId: string | null;
  mo: string; // modus operandi tag, used for cross-jurisdiction linkage
  entities: string[]; // people/vehicles/phones referenced — for shared-entity matching
  photoUrl: string | null; // geotagged field photo (Officer quick report)
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
}

export type SosStatus = "active" | "acknowledged" | "dispatched" | "resolved";

export interface SosEvent {
  id: string;
  officerId: string; // officer who triggered
  stationId: string;
  geo: GeoPoint;
  status: SosStatus;
  note: string;
  createdAt: string;
  acknowledgedById: string | null;
  dispatchedOfficerId: string | null;
  resolvedAt: string | null;
}

export interface DutyStatus {
  officerId: string;
  onDuty: boolean;
  geo: GeoPoint | null;
  updatedAt: string;
}

export interface BeatCheckpoint {
  id: string;
  officerId: string;
  label: string;
  geo: GeoPoint;
  checkedIn: boolean;
  checkedInAt: string | null;
}

export interface Evidence {
  id: string;
  incidentId: string;
  label: string;
  qrCode: string;
  url: string | null; // uploaded photo retrieval URL
  custodyLog: { userId: string; action: string; at: string }[];
  createdAt: string;
}

export interface Message {
  id: string;
  fromId: string;
  toId: string | null; // null = station broadcast
  stationId: string;
  body: string;
  createdAt: string;
}

export interface ShiftAssignment {
  id: string;
  officerId: string;
  stationId: string;
  date: string; // ISO date (yyyy-mm-dd)
  shift: "day" | "evening" | "night";
  createdAt: string;
}

export interface ReviewNote {
  id: string;
  officerId: string;
  authorId: string;
  body: string;
  createdAt: string;
}

export interface DispatchApproval {
  id: string;
  sosId: string;
  stationId: string;
  requestedOfficerId: string;
  status: "pending" | "approved" | "rejected";
  decidedById: string | null;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  seq: number;
  actorId: string;
  actorRole: PoliceRole;
  action: string;
  target: string;
  at: string;
  prevHash: string;
  hash: string; // SHA-256(seq|actorId|action|target|at|prevHash)
}

export interface CaseLink {
  incidentA: string;
  incidentB: string;
  reason: "shared_mo" | "shared_entity";
  detail: string;
  score: number;
}
