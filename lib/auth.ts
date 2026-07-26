import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { apiUrl } from "./config";

/**
 * Token store (Phase 1).
 *
 * - Native: expo-secure-store (Keychain / Keystore). NEVER AsyncStorage for tokens.
 * - Web: expo-secure-store is unsupported, so we fall back to localStorage.
 *
 * An in-memory cache mirrors the persisted tokens so hot-path callers
 * (authHeader) don't have to await the keychain on every request.
 */

const ACCESS_KEY = "sahasra_access_token";
const REFRESH_KEY = "sahasra_refresh_token";

let accessToken: string | null = null;
let refreshToken: string | null = null;
let loaded = false;

const isWeb = Platform.OS === "web";

async function secureGet(key: string): Promise<string | null> {
  try {
    if (isWeb) return typeof localStorage !== "undefined" ? localStorage.getItem(key) : null;
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function secureSet(key: string, value: string): Promise<void> {
  try {
    if (isWeb) {
      if (typeof localStorage !== "undefined") localStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  } catch {
    /* best-effort */
  }
}

async function secureDelete(key: string): Promise<void> {
  try {
    if (isWeb) {
      if (typeof localStorage !== "undefined") localStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  } catch {
    /* best-effort */
  }
}

/** Load persisted tokens into the in-memory cache. Call once at app startup. */
export async function loadTokens(): Promise<{ accessToken: string | null; refreshToken: string | null }> {
  accessToken = await secureGet(ACCESS_KEY);
  refreshToken = await secureGet(REFRESH_KEY);
  loaded = true;
  return { accessToken, refreshToken };
}

export async function setTokens(access: string, refresh: string): Promise<void> {
  accessToken = access;
  refreshToken = refresh;
  loaded = true;
  await Promise.all([secureSet(ACCESS_KEY, access), secureSet(REFRESH_KEY, refresh)]);
}

/** Replace only the access token (used after a silent refresh). */
export async function setAccessToken(access: string): Promise<void> {
  accessToken = access;
  await secureSet(ACCESS_KEY, access);
}

export async function clearTokens(): Promise<void> {
  accessToken = null;
  refreshToken = null;
  await Promise.all([secureDelete(ACCESS_KEY), secureDelete(REFRESH_KEY)]);
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function getRefreshToken(): string | null {
  return refreshToken;
}

export function hasTokensLoaded(): boolean {
  return loaded;
}

/** Authorization header for the current access token, or {} if unauthenticated. */
export function authHeader(): Record<string, string> {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}

// --- Silent refresh (single-flight) ---------------------------------------

let refreshInFlight: Promise<string | null> | null = null;

/**
 * Exchange the refresh token for a new access token. De-duplicates concurrent
 * callers so a burst of 401s triggers exactly one /api/auth/refresh call.
 * Returns the new access token, or null if refresh failed (caller should logout).
 */
export async function refreshAccessToken(): Promise<string | null> {
  if (!refreshToken) return null;
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      const res = await fetch(apiUrl("/api/auth/refresh"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) {
        // Refresh token itself is invalid/expired -> force logout.
        await clearTokens();
        return null;
      }
      const data = await res.json();
      const newAccess: string | undefined = data.accessToken ?? data.access_token;
      const newRefresh: string | undefined = data.refreshToken ?? data.refresh_token;
      if (!newAccess) {
        await clearTokens();
        return null;
      }
      if (newRefresh) await setTokens(newAccess, newRefresh);
      else await setAccessToken(newAccess);
      return newAccess;
    } catch {
      return null; // network error: keep tokens, let caller retry later
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

/**
 * fetch() wrapper that attaches the access token and transparently refreshes on
 * a 401, retrying the original request once. This is the interceptor every
 * authenticated call should route through.
 */
export async function authFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const withAuth = (headers?: HeadersInit): HeadersInit => ({
    ...(headers || {}),
    ...authHeader(),
  });

  let res = await fetch(input, { ...init, headers: withAuth(init.headers) });

  if (res.status === 401 && refreshToken) {
    const newAccess = await refreshAccessToken();
    if (newAccess) {
      res = await fetch(input, {
        ...init,
        headers: { ...(init.headers || {}), Authorization: `Bearer ${newAccess}` },
      });
    }
  }

  return res;
}
