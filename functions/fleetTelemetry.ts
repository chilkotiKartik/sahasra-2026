// Catalyst Serverless Function — Akka Patrol Fleet live telemetry (Module 9)
// A REAL server-side interval advances each on-duty officer along a scripted
// route of real Karnataka lat/lng waypoints, so any screen polling this data
// reads genuinely-updating rows (labelled "Simulated Field Telemetry").
// "Dispatch Nearest Unit" uses a real haversine distance computation.

export interface FleetOfficer {
  id: string;
  name: string;
  badge: string;
  station: string;
  status: "PATROLLING" | "ON_DISPATCH" | "AVAILABLE";
  lat: number;
  lng: number;
  heading: string;
  currentDispatch: string | null;
  lastUpdated: string;
  route: [number, number][]; // waypoints
  _seg: number;
  _t: number; // 0..1 interpolation along current segment
  history: { lat: number; lng: number; at: string }[];
}

// Scripted patrol routes along real Bengaluru / Mysuru corridors.
const OFFICERS: FleetOfficer[] = [
  {
    id: "akka-1", name: "Akka Pade Unit — Lakshmi", badge: "AKKA-55", station: "Peenya Industrial PS",
    status: "PATROLLING",
    route: [[13.0290, 77.5200], [13.0310, 77.5300], [13.0350, 77.5400], [13.0380, 77.5500], [13.0330, 77.5620]],
    lat: 13.0290, lng: 77.5200, heading: "NE", currentDispatch: null, lastUpdated: new Date().toISOString(),
    _seg: 0, _t: 0, history: []
  },
  {
    id: "akka-2", name: "Akka Pade Unit — Bhavani", badge: "AKKA-57", station: "Koramangala PS",
    status: "PATROLLING",
    route: [[12.9340, 77.6140], [12.9380, 77.6220], [12.9420, 77.6300], [12.9350, 77.6360], [12.9300, 77.6260]],
    lat: 12.9340, lng: 77.6140, heading: "E", currentDispatch: null, lastUpdated: new Date().toISOString(),
    _seg: 0, _t: 0, history: []
  },
  {
    id: "akka-3", name: "Akka Pade Unit — Chaya", badge: "AKKA-61", station: "Devaraja PS (Mysuru)",
    status: "AVAILABLE",
    route: [[12.3210, 76.6340], [12.3160, 76.6420], [12.3100, 76.6480], [12.3050, 76.6400], [12.3120, 76.6320]],
    lat: 12.3210, lng: 76.6340, heading: "SE", currentDispatch: null, lastUpdated: new Date().toISOString(),
    _seg: 0, _t: 0, history: []
  },
  {
    id: "akka-4", name: "Akka Pade Unit — Deepa", badge: "AKKA-63", station: "Hebbal PS",
    status: "AVAILABLE",
    route: [[13.0380, 77.5920], [13.0420, 77.6000], [13.0460, 77.6080], [13.0400, 77.6140], [13.0350, 77.6020]],
    lat: 13.0380, lng: 77.5920, heading: "N", currentDispatch: null, lastUpdated: new Date().toISOString(),
    _seg: 0, _t: 0, history: []
  }
];

function haversineM(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371000;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

let started = false;
export function startFleetTelemetry() {
  if (started) return;
  started = true;
  setInterval(() => {
    OFFICERS.forEach((o) => {
      if (o.status === "ON_DISPATCH") return; // paused while responding
      o._t += 0.18; // advance along the segment
      if (o._t >= 1) {
        o._t = 0;
        o._seg = (o._seg + 1) % (o.route.length - 1);
      }
      const [aLat, aLng] = o.route[o._seg];
      const [bLat, bLng] = o.route[o._seg + 1];
      o.lat = +(aLat + (bLat - aLat) * o._t).toFixed(6);
      o.lng = +(aLng + (bLng - aLng) * o._t).toFixed(6);
      o.heading = bLat > aLat ? (bLng > aLng ? "NE" : "NW") : bLng > aLng ? "SE" : "SW";
      o.lastUpdated = new Date().toISOString();
      o.history.push({ lat: o.lat, lng: o.lng, at: o.lastUpdated });
      if (o.history.length > 20) o.history.shift();
    });
  }, 5000);
}

export function getFleet() {
  return OFFICERS.map(({ route, _seg, _t, ...pub }) => ({ ...pub, waypoints: route }));
}

export function dispatchNearest(incidentLat: number, incidentLng: number, dispatchLabel: string) {
  const available = OFFICERS.filter((o) => o.status !== "ON_DISPATCH");
  const ranked = available
    .map((o) => ({ officer: o, distanceM: Math.round(haversineM(o.lat, o.lng, incidentLat, incidentLng)) }))
    .sort((a, b) => a.distanceM - b.distanceM);
  if (ranked.length === 0) return { success: false, message: "No available units" };
  const chosen = ranked[0];
  chosen.officer.status = "ON_DISPATCH";
  chosen.officer.currentDispatch = dispatchLabel;
  chosen.officer.lastUpdated = new Date().toISOString();
  return {
    success: true,
    dispatched: {
      id: chosen.officer.id,
      name: chosen.officer.name,
      badge: chosen.officer.badge,
      distanceM: chosen.distanceM,
      etaMin: Math.max(1, Math.round(chosen.distanceM / 400)) // ~24 km/h urban
    },
    ranking: ranked.map((r) => ({ id: r.officer.id, name: r.officer.name, distanceM: r.distanceM }))
  };
}

// Non-mutating nearest-available-unit lookup (used by the Patrol Planner).
export function nearestUnit(lat: number, lng: number) {
  const ranked = OFFICERS.filter((o) => o.status !== "ON_DISPATCH")
    .map((o) => ({ id: o.id, name: o.name, badge: o.badge, distanceM: Math.round(haversineM(o.lat, o.lng, lat, lng)) }))
    .sort((a, b) => a.distanceM - b.distanceM);
  return ranked[0] || null;
}

export function clearDispatch(officerId: string) {
  const o = OFFICERS.find((x) => x.id === officerId);
  if (o) {
    o.status = "PATROLLING";
    o.currentDispatch = null;
  }
  return { success: true };
}
