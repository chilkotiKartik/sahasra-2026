import { apiUrl } from "./config";
import { authFetch } from "./auth";

/**
 * Thin typed client for the /api/v2 police API. Every call goes through
 * authFetch (Bearer + silent refresh on 401).
 */
async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await authFetch(apiUrl(path), {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `Request failed (${res.status})`);
  }
  // Some endpoints (logout) may return empty.
  const text = await res.text();
  return (text ? JSON.parse(text) : {}) as T;
}

export const api = {
  get: <T,>(path: string) => req<T>("GET", path),
  post: <T,>(path: string, body?: unknown) => req<T>("POST", path, body),
  patch: <T,>(path: string, body?: unknown) => req<T>("PATCH", path, body),
  del: <T,>(path: string) => req<T>("DELETE", path),
};
