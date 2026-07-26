/**
 * Deep linking (Phase 2). Two jobs:
 *  1. Remember a route requested while logged out, so after login we continue
 *     to it instead of dumping the user on their home tab.
 *  2. Map a push-notification payload to an exact in-app route, so tapping an
 *     SOS/dispatch notification opens that specific screen.
 *
 * URL scheme `sahasra://` is declared in app.json; expo-router resolves file
 * routes from the path automatically.
 */

let pendingLink: string | null = null;

/** Route groups a user may deep-link into, by role. */
const ROLE_GROUP: Record<string, string> = {
  officer: "(officer)",
  station_head: "(station-head)",
  super_admin: "(super-admin)",
};

export function setPendingLink(path: string | null) {
  // Never remember auth routes as a post-login destination.
  if (path && !path.includes("(auth)")) pendingLink = path;
}

export function takePendingLink(): string | null {
  const p = pendingLink;
  pendingLink = null;
  return p;
}

export function peekPendingLink(): string | null {
  return pendingLink;
}

const ALL_GROUPS = ["(officer)", "(station-head)", "(super-admin)"];

/**
 * May this role navigate to this path? True if it's inside the role's own
 * stack OR a SHARED authenticated route (e.g. /incident/123) that isn't part of
 * another role's group or the auth group. Guards cross-role deep links.
 */
export function pathAllowedForRole(path: string, role: string): boolean {
  const group = ROLE_GROUP[role];
  if (group && path.includes(group)) return true;
  const inSomeRoleGroup = ALL_GROUPS.some((g) => path.includes(g));
  return !inSomeRoleGroup && !path.includes("(auth)");
}

/** True if `group` (segments[0]) is one of the three role stacks. */
export function isRoleGroup(group: string | undefined): boolean {
  return !!group && ALL_GROUPS.includes(group);
}

/**
 * Resolve a notification payload to a route. The server sets `data.path` (or a
 * full `data.url`) when sending the push, so the mapping lives in one place.
 * Falls back to a role-aware default per notification type.
 */
export function routeFromNotification(data: any, role: string): string | null {
  if (!data) return null;
  if (typeof data.path === "string") return data.path;
  if (typeof data.url === "string") return data.url.replace(/^sahasra:\/\//, "/");

  switch (data.type) {
    case "sos":
      // Head authorizes dispatch; officers view it on the field map.
      return role === "station_head" ? "/(station-head)/dispatch" : "/(officer)/map";
    case "dispatch":
      return role === "officer" ? "/(officer)/sos" : "/(station-head)/dispatch";
    case "incident":
      return data.id ? `/incident/${data.id}` : null;
    default:
      return null;
  }
}
