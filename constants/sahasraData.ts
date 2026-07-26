import { BENGALURU_BEATS, CCTNS_CRIME_CODES } from "./bengaluru";

export interface FIRItem {
  id: string;
  firNo: string;
  station: string;
  district: string;
  crimeCode: string;
  crimeLabel: string;
  section: string;
  category: "heinous" | "grave" | "petty";
  date: string;
  time: string;
  location: string;
  lat: number;
  lng: number;
  moNarrative: string;
  suspectName: string;
  suspectAlias: string;
  status: "Under Investigation" | "Charge Sheeted" | "Pending Arrest" | "Closed";
  icjsStatus: "Out on Bail" | "In Custody" | "Absconding" | "No Record";
  phoneticSimilarityMatch?: {
    matchedId: string;
    matchedName: string;
    similarityScore: number; // e.g. 0.89
  };
}

export interface SuspectItem {
  id: string;
  name: string;
  alias: string;
  age: number;
  gender: string;
  gangName: string;
  role: "Kingpin" | "Lieutenant" | "Operative" | "Financial Handler";
  icjsStatus: "Out on Bail" | "In Custody" | "Absconding";
  lastKnownLocation: string;
  district: string;
  firsCount: number;
  degreeCentrality: number; // 0 - 1.0
  photo: string;
  moVectorSummary: string;
  linkedVehicles: string[];
}

export interface GangItem {
  id: string;
  name: string;
  leader: string;
  membersCount: number;
  primaryZone: string;
  activeDistricts: string[];
  crimeTypes: string[];
  riskScore: number;
  louvainClusterId: number;
  suspects: SuspectItem[];
}

export interface HotspotCluster {
  id: string;
  name: string;
  zone: string;
  district: string;
  lat: number;
  lng: number;
  radiusMeters: number;
  dbscanDensity: "Critical" | "High" | "Medium";
  recentIncidentCount: number;
  predictedIncidentsNext7Days: number;
  dominantCrime: string;
  peakTimeSlot: string;
  riskFactor: string; // e.g., "Broken streetlights + high footfall near transit"
  contributingFIRs: string[];
}

export interface ANPRTrigger {
  id: string;
  cameraId: string;
  cameraName: string;
  lat: number;
  lng: number;
  timestamp: string;
  plateNo: string;
  vehicleModel: string;
  triggerType: "ANPR_HOTLIST_MATCH" | "CROWD_FORMATION" | "SUSPICIOUS_LOITERING";
  suspectLinked: string;
  bailStatus: string;
  alertLevel: "HIGH" | "CRITICAL" | "MEDIUM";
  actionTaken: string;
}

export interface AkkaPadePatrol {
  id: string;
  unitName: string;
  assignedZone: string;
  vehicleNo: string;
  officerInCharge: string;
  status: "Patrolling" | "Dispatched" | "Standby";
  currentLat: number;
  currentLng: number;
  routeReason: string;
}

export const MOCK_FIRS: FIRItem[] = [
  {
    id: "fir_001",
    firNo: "FIR-2026-BLR-0412",
    station: "Peenya PS",
    district: "Bengaluru Urban",
    crimeCode: "379A",
    crimeLabel: "Chain Snatching",
    section: "IPC 379A / BNS 304",
    category: "grave",
    date: "2026-07-20",
    time: "21:30",
    location: "Near Peenya Metro Station, 1st Stage",
    lat: 13.0287,
    lng: 77.5194,
    moNarrative: "Two riders on a black Pulsar 220 without number plate snatched gold chain from victim walking near dark stretch under flyover. Speed > 80 km/h getaway towards Tumakuru road.",
    suspectName: "Ramesh Kumar alias Cobra",
    suspectAlias: "Cobra Ramesh",
    status: "Pending Arrest",
    icjsStatus: "Out on Bail",
    phoneticSimilarityMatch: {
      matchedId: "suspect_001",
      matchedName: "Ramu K. (Cobra)",
      similarityScore: 0.92,
    },
  },
  {
    id: "fir_002",
    firNo: "FIR-2026-BLR-0389",
    station: "Koramangala PS",
    district: "Bengaluru Urban",
    crimeCode: "454",
    crimeLabel: "House Breaking",
    section: "IPC 454 / BNS 331",
    category: "grave",
    date: "2026-07-18",
    time: "02:15",
    location: "4th Block, 80ft Road Koramangala",
    lat: 12.9352,
    lng: 77.6146,
    moNarrative: "Suspects used hydraulic cutter to snap balcony iron grill between 2 AM and 4 AM. Stole cash and gold jewelry. Left behind distinctive chalk mark near main door.",
    suspectName: "Sunil Gowda",
    suspectAlias: "Grill Gowda",
    status: "Under Investigation",
    icjsStatus: "Out on Bail",
  },
  {
    id: "fir_003",
    firNo: "FIR-2026-DHAR-0104",
    station: "Subhash Nagar PS",
    district: "Dharwad",
    crimeCode: "454",
    crimeLabel: "House Breaking",
    section: "IPC 454",
    category: "grave",
    date: "2026-06-12",
    time: "03:00",
    location: "Near Court Circle, Dharwad",
    lat: 15.4589,
    lng: 75.0078,
    moNarrative: "Burglary involving red Maruti Swift getaway vehicle. Balcony iron grill cut using hydraulic cutter. Distinctive chalk mark on frame.",
    suspectName: "Unknown Gang (Swift Module)",
    suspectAlias: "Swift Burglars",
    status: "Under Investigation",
    icjsStatus: "No Record",
  },
  {
    id: "fir_004",
    firNo: "FIR-2026-HUB-0215",
    station: "Gokul Road PS",
    district: "Hubballi",
    crimeCode: "454",
    crimeLabel: "House Breaking",
    section: "IPC 454",
    category: "grave",
    date: "2026-07-15",
    time: "02:45",
    location: "Gokul Industrial Area, Hubballi",
    lat: 15.3647,
    lng: 75.1240,
    moNarrative: "Residential break-in with red Maruti Swift spotted. Balcony grill cut via hydraulic tool and chalk mark left on doorway.",
    suspectName: "Rakesh H.",
    suspectAlias: "Hydraulic Rakesh",
    status: "Pending Arrest",
    icjsStatus: "Out on Bail",
  },
  {
    id: "fir_005",
    firNo: "FIR-2026-BLR-0501",
    station: "Indiranagar PS",
    district: "Bengaluru Urban",
    crimeCode: "IT66D",
    crimeLabel: "Online Scam / Cyber Fraud",
    section: "IT Act 66D",
    category: "grave",
    date: "2026-07-21",
    time: "14:20",
    location: "100ft Road Indiranagar",
    lat: 12.9784,
    lng: 77.6408,
    moNarrative: "Digital arrest scam spoofing Bengaluru Custom Department. Victim coerced into transferring Rs 12.5 Lakhs to mule accounts.",
    suspectName: "Vikas Sharma",
    suspectAlias: "Vicky Cyber",
    status: "Charge Sheeted",
    icjsStatus: "In Custody",
  },
];

export const MOCK_SUSPECTS: SuspectItem[] = [
  {
    id: "suspect_001",
    name: "Ramesh Kumar",
    alias: "Cobra Ramesh",
    age: 32,
    gender: "Male",
    gangName: "Peenya Pulsar Syndicate",
    role: "Kingpin",
    icjsStatus: "Out on Bail",
    lastKnownLocation: "Peenya 2nd Stage, Bengaluru",
    district: "Bengaluru Urban",
    firsCount: 14,
    degreeCentrality: 0.94,
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300",
    moVectorSummary: "High-speed Pulsar chain snatching under unlit flyovers & transit corridors",
    linkedVehicles: ["KA-04-HB-9021 (Black Pulsar 220)", "KA-02-MK-4412"],
  },
  {
    id: "suspect_002",
    name: "Sunil Gowda",
    alias: "Grill Gowda",
    age: 38,
    gender: "Male",
    gangName: "Hydraulic Swift Ring",
    role: "Kingpin",
    icjsStatus: "Out on Bail",
    lastKnownLocation: "Koramangala 1st Block, Bengaluru",
    district: "Bengaluru Urban",
    firsCount: 11,
    degreeCentrality: 0.88,
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300",
    moVectorSummary: "Hydraulic grill cutting house burglary, red Maruti Swift getaway",
    linkedVehicles: ["KA-01-MH-9988 (Red Maruti Swift)", "KA-05-EX-1200"],
  },
  {
    id: "suspect_003",
    name: "Rakesh H.",
    alias: "Hydraulic Rakesh",
    age: 29,
    gender: "Male",
    gangName: "Hydraulic Swift Ring",
    role: "Lieutenant",
    icjsStatus: "Out on Bail",
    lastKnownLocation: "Gokul Road, Hubballi",
    district: "Hubballi-Dharwad",
    firsCount: 7,
    degreeCentrality: 0.72,
    photo: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300",
    moVectorSummary: "Cross-district house breaking in Dharwad and Hubballi",
    linkedVehicles: ["KA-01-MH-9988 (Red Maruti Swift)"],
  },
  {
    id: "suspect_004",
    name: "Manjunath N.",
    alias: "Speedo Manja",
    age: 26,
    gender: "Male",
    gangName: "Peenya Pulsar Syndicate",
    role: "Operative",
    icjsStatus: "Absconding",
    lastKnownLocation: "Yeshwanthpur, Bengaluru",
    district: "Bengaluru Urban",
    firsCount: 6,
    degreeCentrality: 0.65,
    photo: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300",
    moVectorSummary: "Pulsar bike rider for chain snatching operations",
    linkedVehicles: ["KA-04-HB-9021"],
  },
];

export const MOCK_GANGS: GangItem[] = [
  {
    id: "gang_001",
    name: "Peenya Pulsar Syndicate",
    leader: "Ramesh Kumar (Cobra Ramesh)",
    membersCount: 8,
    primaryZone: "West Zone (Peenya, Yeshwanthpur, Rajajinagar)",
    activeDistricts: ["Bengaluru Urban", "Tumakuru"],
    crimeTypes: ["Chain Snatching", "Robbery", "Vehicle Theft"],
    riskScore: 92,
    louvainClusterId: 1,
    suspects: [MOCK_SUSPECTS[0], MOCK_SUSPECTS[3]],
  },
  {
    id: "gang_002",
    name: "Hydraulic Swift Ring",
    leader: "Sunil Gowda (Grill Gowda)",
    membersCount: 6,
    primaryZone: "East Zone & Cross-District (Koramangala, Dharwad, Hubballi)",
    activeDistricts: ["Bengaluru Urban", "Dharwad", "Hubballi"],
    crimeTypes: ["House Breaking", "Burglary", "Dacoity"],
    riskScore: 88,
    louvainClusterId: 2,
    suspects: [MOCK_SUSPECTS[1], MOCK_SUSPECTS[2]],
  },
];

export const MOCK_HOTSPOTS: HotspotCluster[] = [
  {
    id: "hs_001",
    name: "Peenya Metro & Industrial Corridor",
    zone: "West Zone",
    district: "Bengaluru Urban",
    lat: 13.0287,
    lng: 77.5194,
    radiusMeters: 450,
    dbscanDensity: "Critical",
    recentIncidentCount: 18,
    predictedIncidentsNext7Days: 6,
    dominantCrime: "Chain Snatching (IPC 379A)",
    peakTimeSlot: "21:00 - 24:00 (Late Night)",
    riskFactor: "Unlit municipal streetlights + high commuter footfall near Metro exit",
    contributingFIRs: ["FIR-2026-BLR-0412", "FIR-2026-BLR-0388", "FIR-2026-BLR-0350"],
  },
  {
    id: "hs_002",
    name: "Koramangala 80ft Road & 4th Block",
    zone: "East Zone",
    district: "Bengaluru Urban",
    lat: 12.9352,
    lng: 77.6146,
    radiusMeters: 380,
    dbscanDensity: "High",
    recentIncidentCount: 12,
    predictedIncidentsNext7Days: 4,
    dominantCrime: "House Breaking (IPC 454)",
    peakTimeSlot: "00:00 - 04:00 (Midnight)",
    riskFactor: "Gated compound rear alleys with unmonitored balcony access",
    contributingFIRs: ["FIR-2026-BLR-0389", "FIR-2026-BLR-0361"],
  },
  {
    id: "hs_003",
    name: "Indiranagar 100ft Road Corridor",
    zone: "East Zone",
    district: "Bengaluru Urban",
    lat: 12.9784,
    lng: 77.6408,
    radiusMeters: 500,
    dbscanDensity: "High",
    recentIncidentCount: 15,
    predictedIncidentsNext7Days: 5,
    dominantCrime: "Cyber Fraud & Vehicle Theft",
    peakTimeSlot: "18:00 - 22:00 (Evening)",
    riskFactor: "Dense commercial pub hub with illegal valet parking clusters",
    contributingFIRs: ["FIR-2026-BLR-0501"],
  },
];

export const MOCK_ANPR_TRIGGERS: ANPRTrigger[] = [
  {
    id: "anpr_001",
    cameraId: "SC_001",
    cameraName: "MG Road Junction Camera #4",
    lat: 12.9752,
    lng: 77.6067,
    timestamp: "2026-07-22 03:12 AM",
    plateNo: "KA-01-MH-9988",
    vehicleModel: "Red Maruti Swift",
    triggerType: "ANPR_HOTLIST_MATCH",
    suspectLinked: "Sunil Gowda (Grill Gowda)",
    bailStatus: "Out on Bail (ICJS Flagged)",
    alertLevel: "CRITICAL",
    actionTaken: "Pushed tactical alert to Beat Officer CEN_03 (MG Road Beat)",
  },
  {
    id: "anpr_002",
    cameraId: "SC_006",
    cameraName: "Silk Board Junction AI Island",
    lat: 12.9172,
    lng: 77.6229,
    timestamp: "2026-07-22 02:45 AM",
    plateNo: "N/A",
    vehicleModel: "N/A",
    triggerType: "CROWD_FORMATION",
    suspectLinked: "Unidentified Crowd (14 Persons)",
    bailStatus: "N/A",
    alertLevel: "HIGH",
    actionTaken: "Akka Pade Unit #4 dispatch suggested",
  },
];

export const MOCK_AKKA_PADE: AkkaPadePatrol[] = [
  {
    id: "akka_001",
    unitName: "Akka Pade Unit #1 (Koramangala)",
    assignedZone: "East Zone",
    vehicleNo: "KA-01-MH-1234",
    officerInCharge: "PSI Savitha K.",
    status: "Dispatched",
    currentLat: 12.9352,
    currentLng: 77.6146,
    routeReason: "Re-routed to broken streetlight dark spot near Koramangala 4th Block",
  },
  {
    id: "akka_002",
    unitName: "Akka Pade Unit #2 (Peenya)",
    assignedZone: "West Zone",
    vehicleNo: "KA-01-MH-1235",
    officerInCharge: "PSI Meenakshi R.",
    status: "Patrolling",
    currentLat: 13.0287,
    currentLng: 77.5194,
    routeReason: "Routine patrol near Peenya Metro dark spot cluster",
  },
];

export const MOCK_NLP_SUGGESTIONS = [
  "Show chain snatchers in Peenya",
  "Burglary cases involving red Swift vehicle",
  "Hotspots with broken streetlights in Koramangala",
  "Suspects out on bail in Bengaluru Urban",
  "Find MO match for hydraulic cutter theft",
];
