import { api } from "./api";

/**
 * Web fallback for the offline queue. expo-sqlite's web build pulls in a wasm
 * worker that can't be bundled for static web export, so on web we keep the
 * queue purely in memory. Native gets the real sqlite-backed queue (offline.ts).
 */

export interface QueuedReport {
  id: string;
  payload: any;
  createdAt: string;
}

const webQueue: QueuedReport[] = [];

export async function enqueueReport(payload: any): Promise<QueuedReport> {
  const item: QueuedReport = { id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, payload, createdAt: new Date().toISOString() };
  webQueue.push(item);
  return item;
}

export async function listQueued(): Promise<QueuedReport[]> {
  return [...webQueue];
}

export async function queuedCount(): Promise<number> {
  return webQueue.length;
}

export async function flushQueue(): Promise<number> {
  let synced = 0;
  for (const item of [...webQueue]) {
    try {
      await api.post("/api/v2/incidents", item.payload);
      const i = webQueue.findIndex((q) => q.id === item.id);
      if (i >= 0) webQueue.splice(i, 1);
      synced++;
    } catch {
      break;
    }
  }
  return synced;
}

export async function submitOrQueue(payload: any): Promise<{ queued: boolean }> {
  try {
    await api.post("/api/v2/incidents", payload);
    await flushQueue();
    return { queued: false };
  } catch {
    await enqueueReport(payload);
    return { queued: true };
  }
}
