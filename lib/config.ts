import Constants from "expo-constants";
import { Platform } from "react-native";

/**
 * SINGLE SOURCE OF TRUTH for the backend base URL.
 *
 * Resolution order (first hit wins):
 *   1. EXPO_PUBLIC_API_URL          — inlined at build time by Expo (dev + EAS).
 *   2. expoConfig.extra.apiUrl      — set via app.config.js / eas.json env blocks.
 *   3. Web browser origin           — when running the web build, talk to same host.
 *   4. Dev fallback (localhost:5000)— ONLY in __DEV__, never in a production build.
 *
 * Why this file exists: previously 8 screens each hard-coded
 * `http://localhost:5000`, which is undefined-safe on web but resolves to the
 * DEVICE's own loopback on a native build — i.e. "works locally, blank after
 * deploy". All API access now funnels through here.
 */

function fromEnv(): string | undefined {
  // Expo inlines EXPO_PUBLIC_* string literals at build time.
  const raw = process.env.EXPO_PUBLIC_API_URL;
  if (raw && raw.trim().length > 0) return raw.trim();

  const extra =
    (Constants.expoConfig as any)?.extra?.apiUrl ??
    (Constants.expoConfig as any)?.extra?.EXPO_PUBLIC_API_URL ??
    (Constants.manifest as any)?.extra?.apiUrl;
  if (extra && String(extra).trim().length > 0) return String(extra).trim();

  return undefined;
}

function isWeb(): boolean {
  return (
    Platform.OS === "web" &&
    typeof window !== "undefined" &&
    typeof window.location !== "undefined" &&
    typeof window.location.origin === "string" &&
    window.location.origin !== "" &&
    window.location.origin !== "null"
  );
}

/** Normalizes to an origin WITHOUT a trailing slash, e.g. https://api.example.com */
function normalizeOrigin(url: string): string {
  return url.replace(/\/+$/, "");
}

function resolveApiOrigin(): string {
  const env = fromEnv();
  if (env) return normalizeOrigin(env);

  if (isWeb()) {
    // On the web dev server (Metro on 8081/8082) the API lives on :5000.
    const { protocol, hostname, port, origin } = window.location;
    if (["8081", "8082", "8080", "19006"].includes(port) || hostname === "localhost" || hostname === "127.0.0.1") {
      return normalizeOrigin(`${protocol}//${hostname}:5000`);
    }
    return normalizeOrigin(origin);
  }

  if (__DEV__) {
    // Native dev: prefer the Metro host so a phone on the same LAN can reach the
    // dev machine instead of its own loopback.
    const hostUri =
      (Constants.expoConfig as any)?.hostUri ??
      (Constants as any)?.expoGoConfig?.debuggerHost ??
      (Constants.manifest as any)?.debuggerHost;
    if (hostUri && typeof hostUri === "string") {
      const host = hostUri.split(":")[0];
      if (host && host !== "localhost") return `http://${host}:5000`;
    }
    return "http://localhost:5000";
  }

  // Production build with no env configured — fail loudly rather than silently
  // pointing at a dead loopback.
  console.error(
    "[config] EXPO_PUBLIC_API_URL is not set in this production build. " +
      "Set it in eas.json env / app.config.js. Falling back to localhost (will not work on-device).",
  );
  return "http://localhost:5000";
}

/** Backend origin, no trailing slash. e.g. "https://sahasra.example.com" */
export const API_ORIGIN: string = resolveApiOrigin();

/** WebSocket origin derived from API_ORIGIN. e.g. "wss://sahasra.example.com" */
export const WS_ORIGIN: string = API_ORIGIN.replace(/^http/, "ws");

/** Build a full API URL: apiUrl("/api/health") -> "<origin>/api/health" */
export function apiUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${API_ORIGIN}${p}`;
}

/** Build a full WS URL: wsUrl("/ws") -> "<ws-origin>/ws" */
export function wsUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${WS_ORIGIN}${p}`;
}

/** Optional Sentry DSN (Phase 8). Empty string = Sentry disabled. */
export const SENTRY_DSN: string =
  process.env.EXPO_PUBLIC_SENTRY_DSN ??
  (Constants.expoConfig as any)?.extra?.sentryDsn ??
  "";
