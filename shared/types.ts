// SAHASRA Police Intelligence Platform — Shared API & RBAC Contracts

export type UserRole =
  | "investigating_officer"
  | "crime_analyst"
  | "district_sp"
  | "akka_pade_officer";

export interface UserProfile {
  id: string;
  badgeNumber: string;
  name: string;
  role: UserRole;
  jurisdiction: string;
  district: string;
}

export interface AuthSession {
  token: string;
  user: UserProfile;
  expiresAt: number;
}

export interface AuditLogRecord {
  id: string;
  user_id: string;
  username: string;
  role: UserRole | "anonymous";
  action: "LOGIN_SUCCESS" | "LOGIN_FAILED" | "LOGOUT" | "ACCESS_DENIED";
  timestamp: string;
  ip_address: string;
  resource_attempted?: string;
  prev_hash: string;
  this_hash: string;
}

// Allowed routes matrix for each role
export const ROLE_ROUTE_PERMISSIONS: Record<UserRole, string[]> = {
  district_sp: [
    "/activity",
    "/command-center",
    "/hotspot-map",
    "/network-graph",
    "/camera-intelligence",
    "/case-explorer",
    "/trends",
    "/governance",
    "/bias-fairness",
    "/fleet",
    "/mo-search",
    "/forecast",
    "/report",
    "/escalations",
    "/patrol-planner",
  ],
  crime_analyst: [
    "/activity",
    "/command-center",
    "/hotspot-map",
    "/network-graph",
    "/camera-intelligence",
    "/trends",
    "/mo-search",
    "/forecast",
    "/patrol-planner",
    "/geo-temporal",
    "/pattern-profiler",
    "/case-comparator",
    "/suspect-ranking",
    "/anomaly-explorer",
    "/report-builder",
    "/series-builder",
    "/data-coverage",
    "/annotation-notebook",
    "/external-correlator",
    "/suspect-timeline",
    "/similar-cases",
  ],
  investigating_officer: [
    "/activity",
    "/command-center",
    "/camera-intelligence",
    "/case-explorer",
    "/mo-search",
    "/patrol-planner",
    "/case-diary",
    "/evidence-locker",
    "/repeat-check",
    "/deadlines",
    "/warrant-generator",
    "/clearance",
    "/evidence-capture",
    "/witness-manager",
    "/beat-notes",
    "/collab-request",
    "/suspect-timeline",
    "/similar-cases",
  ],
  akka_pade_officer: [
    "/activity",
    "/command-center",
    "/hotspot-map",
    "/camera-intelligence",
    "/fleet",
    "/patrol-planner",
    "/panic",
    "/beat-checklist",
    "/offline-queue",
    "/beat-feed",
    "/nearby-units",
    "/shift-handover",
    "/commendations",
    "/community-tip",
    "/equipment-checklist",
    "/field-report",
  ],
};

export const ROLE_DEFAULT_ROUTES: Record<UserRole, string> = {
  district_sp: "/command-center",
  crime_analyst: "/hotspot-map",
  investigating_officer: "/case-explorer",
  akka_pade_officer: "/hotspot-map",
};
