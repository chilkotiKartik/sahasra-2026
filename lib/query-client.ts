import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { API_ORIGIN, WS_ORIGIN } from "./config";
import { authFetch } from "./auth";

/** @deprecated use wsUrl() from lib/config. Kept for callers that expect a trailing /ws. */
export function getWsUrl(): string {
  return `${WS_ORIGIN}/ws`;
}

/** @deprecated use API_ORIGIN / apiUrl() from lib/config. Returns origin WITH trailing slash. */
export function getApiUrl(): string {
  return `${API_ORIGIN}/`;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  route: string,
  data?: unknown,
): Promise<Response> {
  const url = new URL(route, `${API_ORIGIN}/`);

  // authFetch attaches the Bearer token and silently refreshes on 401.
  const res = await authFetch(url.toString(), {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";

export const getQueryFn =
  <T>({ on401 }: { on401: UnauthorizedBehavior }): QueryFunction<T> =>
  async ({ queryKey }) => {
    const url = new URL(queryKey.join("/") as string, `${API_ORIGIN}/`);

    const res = await authFetch(url.toString());

    if (on401 === "returnNull" && res.status === 401) {
      return null as T;
    }

    await throwIfResNotOk(res);
    return (await res.json()) as T;
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
