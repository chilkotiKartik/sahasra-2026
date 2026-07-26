import { logAuditEvent } from "./auth";

export interface AlertItem {
  id: string;
  station: string;
  district: string;
  crimeType: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "INFO";
  timestamp: string;
  description: string;
}

export interface ReviewQueueItem {
  id: string;
  title: string;
  station: string;
  district: string;
  aiConfidence: number;
  flagReason: string;
  timestamp: string;
  status: "PENDING" | "APPROVED" | "DISMISSED";
  actionBy?: string;
  actionAt?: string;
}

export interface CommandCenterMetrics {
  activeHotspotsCount: number;
  pendingAuthorizationsCount: number;
  casesClosedThisWeek: number;
  casesClosedFourWeekAvg: number;
}

// 30-40 Synthetic Live Alerts across Karnataka Districts
const SEEDED_ALERTS: AlertItem[] = [
  {
    id: "alt-101",
    station: "Koramangala PS",
    district: "Bengaluru Urban",
    crimeType: "ANPR Vehicle Match",
    severity: "CRITICAL",
    timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    description: "Stolen SUV KA-01-MJ-9922 detected passing 80ft Road Junction"
  },
  {
    id: "alt-102",
    station: "Peenya Industrial PS",
    district: "Bengaluru Urban",
    crimeType: "Dark Spot Panic SOS",
    severity: "CRITICAL",
    timestamp: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
    description: "Akka Pade SOS audio trigger activated near Flyover Pillar #44"
  },
  {
    id: "alt-103",
    station: "Devaraja PS",
    district: "Mysuru",
    crimeType: "Modus Operandi Match",
    severity: "HIGH",
    timestamp: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
    description: "89% similarity matched with 2025 serial burglary pattern in Gokulam"
  },
  {
    id: "alt-104",
    station: "Suburban Bus Stand PS",
    district: "Mysuru",
    crimeType: "CCTV Crowd Anomaly",
    severity: "MEDIUM",
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    description: "Unusual crowd surge detected near Ticket Counter Gate 3"
  },
  {
    id: "alt-105",
    station: "Mangaluru Town PS",
    district: "Dakshina Kannada",
    crimeType: "Cyber UPI Phishing Spike",
    severity: "HIGH",
    timestamp: new Date(Date.now() - 38 * 60 * 1000).toISOString(),
    description: "12 localized OTP fraud complaints originating from Hampankatta block"
  },
  {
    id: "alt-106",
    station: "Bunder Port PS",
    district: "Dakshina Kannada",
    crimeType: "Patrol Route Deviation",
    severity: "INFO",
    timestamp: new Date(Date.now() - 52 * 60 * 1000).toISOString(),
    description: "Beat Van 08 re-routed due to coastal waterlogging"
  },
  {
    id: "alt-107",
    station: "Hubballi Old Town PS",
    district: "Hubballi-Dharwad",
    crimeType: "Night Burglary Risk",
    severity: "HIGH",
    timestamp: new Date(Date.now() - 65 * 60 * 1000).toISOString(),
    description: "Predictive model flags commercial market block for 02:00 AM window"
  },
  {
    id: "alt-108",
    station: "Subhash Nagar PS",
    district: "Belagavi",
    crimeType: "Streetlight Outage Spike",
    severity: "MEDIUM",
    timestamp: new Date(Date.now() - 80 * 60 * 1000).toISOString(),
    description: "Civic telemetry reports 14 unlit transformers near Highway corridor"
  },
  {
    id: "alt-109",
    station: "Indiranagar PS",
    district: "Bengaluru Urban",
    crimeType: "Noise Nuisance Escalation",
    severity: "INFO",
    timestamp: new Date(Date.now() - 95 * 60 * 1000).toISOString(),
    description: "Multiple 112 calls logged for 100ft Road commercial venue"
  },
  {
    id: "alt-110",
    station: "Udupi Town PS",
    district: "Udupi",
    crimeType: "Temple Corridor Security",
    severity: "MEDIUM",
    timestamp: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    description: "AI camera flags unattended luggage near Car Street"
  },
  {
    id: "alt-111",
    station: "Shivamogga Rural PS",
    district: "Shivamogga",
    crimeType: "Illegal Sand Mining Movement",
    severity: "HIGH",
    timestamp: new Date(Date.now() - 130 * 60 * 1000).toISOString(),
    description: "ANPR camera 4 triggers alert for unlisted dumper truck"
  },
  {
    id: "alt-112",
    station: "Kalaburagi City PS",
    district: "Kalaburagi",
    crimeType: "Gang Convict Release Alert",
    severity: "HIGH",
    timestamp: new Date(Date.now() - 150 * 60 * 1000).toISOString(),
    description: "CCTNS notification: Convict #882 released on bail"
  }
];

// Seeded AI Review Queue awaiting supervisor decision
let SEEDED_REVIEW_QUEUE: ReviewQueueItem[] = [
  {
    id: "rq-501",
    title: "Akka Pade Patrol Route Approval — Peenya Pillar #44",
    station: "Peenya Industrial PS",
    district: "Bengaluru Urban",
    aiConfidence: 94.2,
    flagReason: "High night risk score + 3 streetlight outages detected",
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    status: "PENDING"
  },
  {
    id: "rq-502",
    title: "Cross-Jurisdiction Syndicate Linkage — Mysuru Burglary Ring",
    station: "Devaraja PS",
    district: "Mysuru",
    aiConfidence: 89.5,
    flagReason: "Matched suspect phone IMEI across Mysuru and Mandya incidents",
    timestamp: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
    status: "PENDING"
  },
  {
    id: "rq-503",
    title: "ANPR CCTV Hotspot Re-clustering Request",
    station: "Koramangala PS",
    district: "Bengaluru Urban",
    aiConfidence: 91.8,
    flagReason: "Vehicle theft frequency exceeded 2-sigma threshold",
    timestamp: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
    status: "PENDING"
  },
  {
    id: "rq-504",
    title: "Coastal Patrol Reinforcement — Bunder Docks",
    station: "Bunder Port PS",
    district: "Dakshina Kannada",
    aiConfidence: 86.0,
    flagReason: "High tide prediction coinciding with midnight vessel docking",
    timestamp: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    status: "PENDING"
  }
];

/**
 * Catalyst Function: getCommandCenterData
 */
export async function getCommandCenterData() {
  const pendingCount = SEEDED_REVIEW_QUEUE.filter(i => i.status === "PENDING").length;

  const metrics: CommandCenterMetrics = {
    activeHotspotsCount: 14,
    pendingAuthorizationsCount: pendingCount,
    casesClosedThisWeek: 42,
    casesClosedFourWeekAvg: 36
  };

  return {
    metrics,
    alerts: SEEDED_ALERTS,
    reviewQueue: SEEDED_REVIEW_QUEUE.filter(i => i.status === "PENDING")
  };
}

/**
 * Catalyst Function: processReviewQueueAction
 */
export async function processReviewQueueAction(
  queueId: string,
  action: "APPROVE" | "DISMISS",
  user: { id: string; badgeNumber: string; role: any }
): Promise<{ success: boolean; updatedQueue: ReviewQueueItem[] }> {
  const index = SEEDED_REVIEW_QUEUE.findIndex(item => item.id === queueId);
  if (index !== -1) {
    const item = SEEDED_REVIEW_QUEUE[index];
    item.status = action === "APPROVE" ? "APPROVED" : "DISMISSED";
    item.actionBy = user.badgeNumber;
    item.actionAt = new Date().toISOString();

    // Log action to tamper-evident SHA-256 Audit Trail
    logAuditEvent(
      user.id,
      user.badgeNumber,
      user.role,
      "LOGIN_SUCCESS", // Reuse action audit or log explicit approval
      "127.0.0.1",
      `REVIEW_QUEUE_${action}:${queueId} (${item.title})`
    );
  }

  const activeQueue = SEEDED_REVIEW_QUEUE.filter(i => i.status === "PENDING");
  return { success: true, updatedQueue: activeQueue };
}

export async function addLiveAlert(alertData: Partial<AlertItem>): Promise<AlertItem> {
  const newAlert: AlertItem = {
    id: `alt-live-${Date.now()}`,
    station: alertData.station || "Peenya PS",
    district: alertData.district || "Bengaluru Urban",
    crimeType: alertData.crimeType || "CCTV ANPR Watchlist Match",
    severity: (alertData.severity as any) || "CRITICAL",
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    description: alertData.description || "Stolen vehicle KA-01-MJ-9922 detected by CCTV Camera 04"
  };

  SEEDED_ALERTS.unshift(newAlert);
  return newAlert;
}
