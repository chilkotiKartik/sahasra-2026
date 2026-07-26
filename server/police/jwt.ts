import jwt from "jsonwebtoken";
import crypto from "node:crypto";

/**
 * JWT layer for the 3-role police system (Phase 1).
 *
 * Access token: short-lived (15m), carries { sub, role, stationId }.
 * Refresh token: long-lived (30d), opaque-ish JWT tracked server-side so it can
 * be invalidated on logout (a plain stateless JWT can't be revoked).
 */

export type PoliceRole = "officer" | "station_head" | "super_admin";

const ACCESS_TTL = "15m";
const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// In a real deploy these come from env / secret manager. Falls back to a
// per-process random secret so tokens are at least unforgeable across restarts
// within a session.
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || crypto.randomBytes(32).toString("hex");
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || crypto.randomBytes(32).toString("hex");

export interface AccessClaims {
  sub: string; // user id
  role: PoliceRole;
  stationId: string | null;
  name: string;
  type: "access";
}

export interface RefreshClaims {
  sub: string;
  jti: string; // token id, tracked for revocation
  type: "refresh";
}

/** Active refresh token ids. Presence == valid. Logout deletes the jti. */
const activeRefreshJti = new Set<string>();

export function signAccess(payload: Omit<AccessClaims, "type">): string {
  return jwt.sign({ ...payload, type: "access" }, ACCESS_SECRET, { expiresIn: ACCESS_TTL });
}

export function signRefresh(userId: string): string {
  const jti = crypto.randomUUID();
  activeRefreshJti.add(jti);
  // expiresIn in seconds
  return jwt.sign({ sub: userId, jti, type: "refresh" }, REFRESH_SECRET, {
    expiresIn: Math.floor(REFRESH_TTL_MS / 1000),
  });
}

export function verifyAccess(token: string): AccessClaims | null {
  try {
    const decoded = jwt.verify(token, ACCESS_SECRET) as AccessClaims;
    return decoded.type === "access" ? decoded : null;
  } catch {
    return null;
  }
}

export function verifyRefresh(token: string): RefreshClaims | null {
  try {
    const decoded = jwt.verify(token, REFRESH_SECRET) as RefreshClaims;
    if (decoded.type !== "refresh") return null;
    if (!activeRefreshJti.has(decoded.jti)) return null; // revoked
    return decoded;
  } catch {
    return null;
  }
}

/** Invalidate a single refresh token (logout). */
export function revokeRefresh(token: string): void {
  try {
    const decoded = jwt.decode(token) as RefreshClaims | null;
    if (decoded?.jti) activeRefreshJti.delete(decoded.jti);
  } catch {
    /* ignore */
  }
}

/** Rotate: revoke the old jti and mint a fresh refresh token. */
export function rotateRefresh(oldToken: string, userId: string): string {
  revokeRefresh(oldToken);
  return signRefresh(userId);
}
