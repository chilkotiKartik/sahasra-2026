import * as React from "react";
import { api } from "./api";
import { captureError } from "./monitoring";

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/**
 * Fetch a GET endpoint with loading/error state + manual reload (Phase 7).
 * Pass `{ pollMs }` for live updates via polling — works everywhere including
 * Catalyst serverless (no WebSocket needed).
 */
export function useApi<T>(path: string | null, deps: any[] = [], opts: { pollMs?: number } = {}): ApiState<T> {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
    if (!path) {
      setLoading(false);
      return;
    }
    let alive = true;
    // Only show the full-screen spinner on the first load, not on poll refreshes.
    setLoading((prev) => (data === null ? true : prev));
    setError(null);
    const run = () =>
      api
        .get<T>(path)
        .then((d) => alive && setData(d))
        .catch((e) => {
          if (alive) setError(e?.message || "Request failed");
          captureError(e, { path });
        })
        .finally(() => alive && setLoading(false));
    run();
    const interval = opts.pollMs ? setInterval(run, opts.pollMs) : null;
    return () => {
      alive = false;
      if (interval) clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, tick, opts.pollMs, ...deps]);

  const reload = React.useCallback(() => setTick((t) => t + 1), []);
  return { data, loading, error, reload };
}
