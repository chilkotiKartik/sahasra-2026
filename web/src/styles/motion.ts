// SAHASRA Centralized Forensic Motion & Animation Tokens

export const MOTION_TOKENS = {
  durations: {
    fast: 0.15,
    base: 0.3,
    slow: 0.6,
    scanLine: 0.6,
    scramble: 150, // ms
    kpiCount: 800 // ms
  },
  easings: {
    standard: [0.4, 0.0, 0.2, 1.0],
    decelerate: [0.0, 0.0, 0.2, 1.0],
    accelerate: [0.4, 0.0, 1.0, 1.0],
    springOvershoot: { type: "spring", stiffness: 300, damping: 20 }
  }
};

/**
 * Check prefers-reduced-motion accessibility setting
 */
export function usePrefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
