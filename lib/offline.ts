import * as SQLite from "expo-sqlite";
import { api } from "./api";

/**
 * Offline field-report queue (Officer feature #8) — NATIVE. Reports captured
 * with no connectivity are persisted in expo-sqlite and auto-synced when a
 * later request succeeds. Web uses offline.web.ts (in-memory; no sqlite/wasm).
 */

export interface QueuedReport {
  id: string;
  payload: any; // incident create body
  createdAt: string;
}

let db: any = null;

async function getDb(): Promise<any> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync("sahasra_offline.db");
  await db.execAsync(
    "CREATE TABLE IF NOT EXISTS queued_reports (id TEXT PRIMARY KEY NOT NULL, payload TEXT NOT NULL, createdAt TEXT NOT NULL);",
  );
  return db;
}

export async function enqueueReport(payload: any): Promise<QueuedReport> {
  const item: QueuedReport = { id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, payload, createdAt: new Date().toISOString() };
  const d = await getDb();
  await d.runAsync("INSERT INTO queued_reports (id, payload, createdAt) VALUES (?, ?, ?);", item.id, JSON.stringify(payload), item.createdAt);
  return item;
}

export async function listQueued(): Promise<QueuedReport[]> {
  const d = await getDb();
  const rows: any[] = await d.getAllAsync("SELECT * FROM queued_reports ORDER BY createdAt ASC;");
  return rows.map((r) => ({ id: r.id, payload: JSON.parse(r.payload), createdAt: r.createdAt }));
}

async function removeQueued(id: string): Promise<void> {
  const d = await getDb();
  await d.runAsync("DELETE FROM queued_reports WHERE id = ?;", id);
}

export async function queuedCount(): Promise<number> {
  return (await listQueued()).length;
}

/**
 * Try to POST each queued report. Stops on the first network failure (still
 * offline) so ordering is preserved. Returns how many synced.
 */
export async function flushQueue(): Promise<number> {
  const items = await listQueued();
  let synced = 0;
  for (const item of items) {
    try {
      await api.post("/api/v2/incidents", item.payload);
      await removeQueued(item.id);
      synced++;
    } catch {
      break; // still offline — leave the rest queued
    }
  }
  return synced;
}

/**
 * Submit a report: POST directly if online; if the request fails (offline),
 * queue it locally and report queued=true.
 */
export async function submitOrQueue(payload: any): Promise<{ queued: boolean }> {
  try {
    await api.post("/api/v2/incidents", payload);
    // Opportunistically flush anything backed up.
    await flushQueue();
    return { queued: false };
  } catch {
    await enqueueReport(payload);
    return { queued: true };
  }
}
