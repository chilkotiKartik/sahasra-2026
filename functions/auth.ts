import { createHash, randomUUID } from "crypto";
import { UserRole, UserProfile, AuthSession, AuditLogRecord, ROLE_ROUTE_PERMISSIONS } from "../shared/types";

// Catalyst In-Memory / Data Store mock user registry
const MOCK_OFFICERS: Record<string, { pass: string; user: UserProfile }> = {
  "SP-8821": {
    pass: "Ksp#2026",
    user: {
      id: "usr-sp-01",
      badgeNumber: "SP-8821",
      name: "SP Ramesh Kumar, IPS",
      role: "district_sp",
      jurisdiction: "Bengaluru Urban Command",
      district: "Bengaluru Urban"
    }
  },
  "ANALYST-104": {
    pass: "Ksp#2026",
    user: {
      id: "usr-an-02",
      badgeNumber: "ANALYST-104",
      name: "Inspector Kavitha Rao",
      role: "crime_analyst",
      jurisdiction: "State Intelligence Cell",
      district: "Bengaluru Urban"
    }
  },
  "IO-402": {
    pass: "Ksp#2026",
    user: {
      id: "usr-io-03",
      badgeNumber: "IO-402",
      name: "PSI Vijay Gowda",
      role: "investigating_officer",
      jurisdiction: "Koramangala PS Sub-Division",
      district: "Bengaluru Urban"
    }
  },
  "AKKA-55": {
    pass: "Ksp#2026",
    user: {
      id: "usr-ap-04",
      badgeNumber: "AKKA-55",
      name: "Head Constable Suma M.",
      role: "akka_pade_officer",
      jurisdiction: "Peenya Dark Spot Safety Squad",
      district: "Bengaluru Urban"
    }
  }
};

// Append-only Audit Table in Catalyst Data Store
export const AUDIT_STORE: AuditLogRecord[] = [];
let lastHash = "0000000000000000000000000000000000000000000000000000000000000000";

// Active Session Tokens Store
export const ACTIVE_SESSIONS: Map<string, AuthSession> = new Map();

/**
 * Log Event to Append-Only Audit Chain with SHA-256 Prev-Hash Link
 */
export function logAuditEvent(
  userId: string,
  username: string,
  role: UserRole | "anonymous",
  action: "LOGIN_SUCCESS" | "LOGIN_FAILED" | "LOGOUT" | "ACCESS_DENIED",
  ipAddress: string,
  resourceAttempted?: string
): AuditLogRecord {
  const timestamp = new Date().toISOString();
  const id = randomUUID();

  // Compute tamper-evident SHA-256 hash linked to previous block hash
  const payload = `${lastHash}|${id}|${userId}|${action}|${timestamp}|${resourceAttempted || ''}`;
  const thisHash = createHash("sha256").update(payload).digest("hex");

  const record: AuditLogRecord = {
    id,
    user_id: userId,
    username,
    role,
    action,
    timestamp,
    ip_address: ipAddress,
    resource_attempted: resourceAttempted,
    prev_hash: lastHash,
    this_hash: thisHash
  };

  lastHash = thisHash;
  AUDIT_STORE.unshift(record); // Prepend to view latest first
  return record;
}

/**
 * Catalyst Auth Login Function
 */
export async function catalystLogin(
  badgeNumber: string,
  password: string,
  ipAddress: string = "127.0.0.1"
): Promise<{ success: boolean; session?: AuthSession; message?: string }> {
  const account = MOCK_OFFICERS[badgeNumber.trim().toUpperCase()];

  if (!account || account.pass !== password) {
    logAuditEvent("unknown", badgeNumber, "anonymous", "LOGIN_FAILED", ipAddress);
    // Generic error to prevent username enumeration attacks
    return { success: false, message: "Invalid Badge ID or Password credentials." };
  }

  const token = `cat_sec_${randomUUID()}_${Date.now()}`;
  const session: AuthSession = {
    token,
    user: account.user,
    expiresAt: Date.now() + 8 * 60 * 60 * 1000 // 8 hours
  };

  ACTIVE_SESSIONS.set(token, session);

  logAuditEvent(account.user.id, account.user.badgeNumber, account.user.role, "LOGIN_SUCCESS", ipAddress, "auth_method=password");

  return { success: true, session };
}

// Look up a demo officer by badge (used by the WebAuthn ceremony).
export function getOfficerByBadge(badge: string): UserProfile | null {
  const account = MOCK_OFFICERS[badge.trim().toUpperCase()];
  return account ? account.user : null;
}

// Mint a session after a successful biometric (WebAuthn) authentication.
export function createBiometricSession(
  user: UserProfile,
  ipAddress: string = "127.0.0.1"
): AuthSession {
  const token = `cat_bio_${randomUUID()}_${Date.now()}`;
  const session: AuthSession = { token, user, expiresAt: Date.now() + 8 * 60 * 60 * 1000 };
  ACTIVE_SESSIONS.set(token, session);
  logAuditEvent(user.id, user.badgeNumber, user.role, "LOGIN_SUCCESS", ipAddress, "auth_method=biometric");
  return session;
}

/**
 * Catalyst Auth Logout Function
 */
export async function catalystLogout(token: string, ipAddress: string = "127.0.0.1"): Promise<void> {
  const session = ACTIVE_SESSIONS.get(token);
  if (session) {
    logAuditEvent(session.user.id, session.user.badgeNumber, session.user.role, "LOGOUT", ipAddress);
    ACTIVE_SESSIONS.delete(token);
  }
}

/**
 * Catalyst API Gateway Scope Guard (Server-Side Scope Validation)
 */
export function validateGatewayAccess(
  token: string | undefined,
  requestedRoute: string,
  ipAddress: string = "127.0.0.1"
): { authorized: boolean; user?: UserProfile; message?: string } {
  if (!token) {
    return { authorized: false, message: "Authentication Token Missing" };
  }

  const session = ACTIVE_SESSIONS.get(token);
  if (!session || Date.now() > session.expiresAt) {
    return { authorized: false, message: "Session Expired or Invalid" };
  }

  const allowedRoutes = ROLE_ROUTE_PERMISSIONS[session.user.role] || [];
  const hasAccess = allowedRoutes.includes(requestedRoute);

  if (!hasAccess) {
    logAuditEvent(
      session.user.id,
      session.user.badgeNumber,
      session.user.role,
      "ACCESS_DENIED",
      ipAddress,
      requestedRoute
    );
    return { authorized: false, user: session.user, message: `Role '${session.user.role}' is not authorized for resource '${requestedRoute}'` };
  }

  return { authorized: true, user: session.user };
}
