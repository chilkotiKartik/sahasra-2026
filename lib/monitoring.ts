import { Platform } from "react-native";
import { SENTRY_DSN } from "./config";

/**
 * Phase 8. Sentry is loaded LAZILY and only when EXPO_PUBLIC_SENTRY_DSN is set,
 * so (a) the app runs cleanly with no DSN and (b) @sentry/react-native never
 * has to bundle on web where it isn't supported. Free-tier: paste your DSN into
 * .env / eas.json and it activates on the next native build.
 */
let sentry: any = null;
let started = false;

export function initSentry() {
  if (started || !SENTRY_DSN || Platform.OS === "web") return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    sentry = require("@sentry/react-native");
    sentry.init({ dsn: SENTRY_DSN, enableNative: true, tracesSampleRate: 0.2, sendDefaultPii: false });
    started = true;
  } catch {
    /* never let monitoring crash the app */
  }
}

export function captureError(err: unknown, context?: Record<string, any>) {
  if (started && sentry) {
    sentry.captureException(err, context ? { extra: context } : undefined);
  } else {
    console.error("[captureError]", err, context ?? "");
  }
}

/** Deliberate test crash for Phase 8 proof. */
export function triggerTestError() {
  captureError(new Error("SAHASRA test error — Phase 8 Sentry verification"), { intentional: true });
}

export const isSentryEnabled = () => started;
