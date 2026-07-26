import * as Location from "expo-location";
import { Platform } from "react-native";

export interface Geo { lat: number; lng: number }

/** Bengaluru city center — safe default when GPS is denied/unavailable. */
export const DEFAULT_GEO: Geo = { lat: 12.9716, lng: 77.5946 };

/**
 * One-shot position with graceful permission handling (Phase 6). Returns null
 * if permission denied so callers can degrade rather than crash.
 */
export async function getCurrentPosition(): Promise<Geo | null> {
  try {
    if (Platform.OS === "web") {
      return await new Promise<Geo | null>((resolve) => {
        if (typeof navigator === "undefined" || !navigator.geolocation) return resolve(null);
        navigator.geolocation.getCurrentPosition(
          (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
          () => resolve(null),
          { timeout: 8000 },
        );
      });
    }
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return null;
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return { lat: pos.coords.latitude, lng: pos.coords.longitude };
  } catch {
    return null;
  }
}

/** Returns whether foreground location permission is granted. */
export async function hasLocationPermission(): Promise<boolean> {
  try {
    if (Platform.OS === "web") return true;
    const { status } = await Location.getForegroundPermissionsAsync();
    return status === "granted";
  } catch {
    return false;
  }
}

/**
 * Continuous position updates as the officer moves (Phase 6 watchPosition).
 * Returns an unsubscribe function. No-op-safe on web.
 */
export async function watchPosition(cb: (g: Geo) => void): Promise<() => void> {
  if (Platform.OS === "web") {
    if (typeof navigator === "undefined" || !navigator.geolocation) return () => {};
    const id = navigator.geolocation.watchPosition(
      (p) => cb({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => {},
      { enableHighAccuracy: true },
    );
    return () => navigator.geolocation.clearWatch(id);
  }
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") return () => {};
  const sub = await Location.watchPositionAsync(
    { accuracy: Location.Accuracy.High, distanceInterval: 10, timeInterval: 4000 },
    (p) => cb({ lat: p.coords.latitude, lng: p.coords.longitude }),
  );
  return () => sub.remove();
}

/** Haversine distance in meters — used for beat check-in tolerance. */
export function distanceMeters(a: Geo, b: Geo): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
