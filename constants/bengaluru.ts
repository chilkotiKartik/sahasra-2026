export const BENGALURU_DISTRICTS = [
  { code: "BLR_U", name: "Bengaluru Urban", psCount: 48, lat: 12.9716, lng: 77.5946 },
  { code: "BLR_R", name: "Bengaluru Rural", psCount: 18, lat: 13.1986, lng: 77.7063 },
  { code: "RAM", name: "Ramanagara", psCount: 14, lat: 12.7214, lng: 77.2814 },
  { code: "KOL", name: "Kolar", psCount: 16, lat: 13.1348, lng: 78.1295 },
  { code: "CHK", name: "Chikkaballapur", psCount: 12, lat: 13.4337, lng: 77.7281 },
  { code: "TUM", name: "Tumakuru", psCount: 22, lat: 13.3411, lng: 77.1015 },
  { code: "MYS", name: "Mysuru", psCount: 35, lat: 12.2958, lng: 76.6394 },
  { code: "MAN", name: "Mandya", psCount: 15, lat: 12.5245, lng: 76.8958 },
  { code: "HAS", name: "Hassan", psCount: 18, lat: 13.0038, lng: 76.1004 },
  { code: "CHM", name: "Chikkamagaluru", psCount: 12, lat: 13.3161, lng: 75.7720 },
  { code: "SHI", name: "Shivamogga", psCount: 20, lat: 13.9299, lng: 75.5681 },
  { code: "DAV", name: "Davangere", psCount: 18, lat: 14.4644, lng: 75.9218 },
  { code: "BEL", name: "Belagavi", psCount: 28, lat: 15.8497, lng: 74.4977 },
  { code: "BAG", name: "Bagalkot", psCount: 14, lat: 16.1850, lng: 75.6980 },
  { code: "BIJ", name: "Vijayapura", psCount: 16, lat: 16.8302, lng: 75.7100 },
  { code: "DHAR", name: "Dharwad", psCount: 18, lat: 15.4589, lng: 75.0078 },
  { code: "UTT", name: "Uttara Kannada", psCount: 14, lat: 14.8032, lng: 74.1224 },
  { code: "HAV", name: "Haveri", psCount: 12, lat: 14.8000, lng: 75.4000 },
  { code: "GAD", name: "Gadag", psCount: 10, lat: 15.4300, lng: 75.6300 },
  { code: "KOPP", name: "Koppal", psCount: 10, lat: 15.3500, lng: 76.1500 },
  { code: "RAI", name: "Raichur", psCount: 15, lat: 16.2076, lng: 77.3463 },
  { code: "KAL", name: "Kalaburagi", psCount: 18, lat: 17.3297, lng: 76.8343 },
  { code: "YAD", name: "Yadgir", psCount: 8, lat: 16.7500, lng: 77.1500 },
  { code: "BID", name: "Bidar", psCount: 14, lat: 17.9104, lng: 77.5199 },
];

export const BENGALURU_BEATS = [
  // Central
  { code: "CEN_01", name: "Cubbon Park", zone: "Central", lat: 12.9765, lng: 77.5938 },
  { code: "CEN_02", name: "Vidhana Soudha", zone: "Central", lat: 12.9799, lng: 77.5911 },
  { code: "CEN_03", name: "MG Road", zone: "Central", lat: 12.9752, lng: 77.6067 },
  { code: "CEN_04", name: "Brigade Road", zone: "Central", lat: 12.9705, lng: 77.6082 },
  { code: "CEN_05", name: "Commercial Street", zone: "Central", lat: 12.9864, lng: 77.6073 },
  { code: "CEN_06", name: "Shivajinagar", zone: "Central", lat: 12.9880, lng: 77.6061 },
  { code: "CEN_07", name: "Frazer Town", zone: "Central", lat: 13.0052, lng: 77.6137 },
  { code: "CEN_08", name: "Cox Town", zone: "Central", lat: 13.0120, lng: 77.6180 },

  // East
  { code: "EAS_01", name: "Indiranagar", zone: "East", lat: 12.9784, lng: 77.6408 },
  { code: "EAS_02", name: "Koramangala", zone: "East", lat: 12.9352, lng: 77.6146 },
  { code: "EAS_03", name: "HSR Layout", zone: "East", lat: 12.9081, lng: 77.6475 },
  { code: "EAS_04", name: "Bellandur", zone: "East", lat: 12.9309, lng: 77.6774 },
  { code: "EAS_05", name: "Marathahalli", zone: "East", lat: 12.9591, lng: 77.6974 },
  { code: "EAS_06", name: "Whitefield", zone: "East", lat: 12.9698, lng: 77.7500 },
  { code: "EAS_07", name: "KR Puram", zone: "East", lat: 13.0005, lng: 77.6869 },
  { code: "EAS_08", name: "Mahadevapura", zone: "East", lat: 12.9915, lng: 77.6926 },

  // South
  { code: "SOU_01", name: "Jayanagar", zone: "South", lat: 12.9291, lng: 77.5823 },
  { code: "SOU_02", name: "JP Nagar", zone: "South", lat: 12.9056, lng: 77.5862 },
  { code: "SOU_03", name: "Banashankari", zone: "South", lat: 12.9165, lng: 77.5545 },
  { code: "SOU_04", name: "BTM Layout", zone: "South", lat: 12.9165, lng: 77.6101 },
  { code: "SOU_05", name: "Padmanabhanagar", zone: "South", lat: 12.8980, lng: 77.5600 },
  { code: "SOU_06", name: "Uttarahalli", zone: "South", lat: 12.8550, lng: 77.5550 },
  { code: "SOU_07", name: "Kanakapura Road", zone: "South", lat: 12.8450, lng: 77.5350 },

  // West
  { code: "WES_01", name: "Rajajinagar", zone: "West", lat: 12.9905, lng: 77.5517 },
  { code: "WES_02", name: "Malleswaram", zone: "West", lat: 13.0034, lng: 77.5675 },
  { code: "WES_03", name: "Yeshwanthpur", zone: "West", lat: 13.0185, lng: 77.5526 },
  { code: "WES_04", name: "Peenya", zone: "West", lat: 13.0287, lng: 77.5194 },
  { code: "WES_05", name: "Vijayanagar", zone: "West", lat: 12.9687, lng: 77.5321 },
  { code: "WES_06", name: "Nagarbhavi", zone: "West", lat: 12.9550, lng: 77.4950 },

  // North
  { code: "NOR_01", name: "Hebbal", zone: "North", lat: 13.0358, lng: 77.5970 },
  { code: "NOR_02", name: "Yelahanka", zone: "North", lat: 13.1007, lng: 77.5963 },
  { code: "NOR_03", name: "Jalahalli", zone: "North", lat: 13.0667, lng: 77.5500 },
  { code: "NOR_04", name: "RT Nagar", zone: "North", lat: 13.0245, lng: 77.5867 },
  { code: "NOR_05", name: "Sahakarnagar", zone: "North", lat: 13.0575, lng: 77.6000 },

  // South-East
  { code: "SE_01", name: "Electronic City", zone: "South-East", lat: 12.8456, lng: 77.6603 },
  { code: "SE_02", name: "Bommanahalli", zone: "South-East", lat: 12.9000, lng: 77.6300 },
  { code: "SE_03", name: "Sarjapur Road", zone: "South-East", lat: 12.8600, lng: 77.6800 },
];

export const CCTNS_CRIME_CODES = {
  // Heinous
  MURDER: { code: "302", label: "Murder", severity: "heinous", section: "IPC 302" },
  ATTEMPT_MURDER: { code: "307", label: "Attempt to Murder", severity: "heinous", section: "IPC 307" },
  DACOITY: { code: "395", label: "Dacoity", severity: "heinous", section: "IPC 395" },
  ROBBERY: { code: "392", label: "Robbery", severity: "heinous", section: "IPC 392" },
  KIDNAPPING: { code: "363", label: "Kidnapping", severity: "heinous", section: "IPC 363" },
  RAPE: { code: "376", label: "Rape", severity: "heinous", section: "IPC 376" },
  GANG_RAPE: { code: "376D", label: "Gang Rape", severity: "heinous", section: "IPC 376D" },
  ACID_ATTACK: { code: "326A", label: "Acid Attack", severity: "heinous", section: "IPC 326A" },

  // Grave
  CHAIN_SNATCHING: { code: "379A", label: "Chain Snatching", severity: "grave", section: "IPC 379A" },
  THEFT_VEHICLE: { code: "379", label: "Vehicle Theft", severity: "grave", section: "IPC 379" },
  THEFT_DWELLING: { code: "380", label: "Dwelling Theft", severity: "grave", section: "IPC 380" },
  BURGLARY: { code: "454", label: "House Breaking", severity: "grave", section: "IPC 454" },
  CYBER_FRAUD: { code: "IT66C", label: "Cyber Fraud", severity: "grave", section: "IT Act 66C" },
  ONLINE_SCAM: { code: "IT66D", label: "Online Scam", severity: "grave", section: "IT Act 66D" },
  DRUGS_NDPS: { code: "NDPS", label: "NDPS Act", severity: "grave", section: "NDPS Act" },
  ASSAULT_GRIEVOUS: { code: "325", label: "Grievous Hurt", severity: "grave", section: "IPC 325" },
  EXTORTION: { code: "384", label: "Extortion", severity: "grave", section: "IPC 384" },

  // Petty
  THEFT_PETTY: { code: "379P", label: "Petty Theft", severity: "petty", section: "IPC 379" },
  MOLESTATION: { code: "354", label: "Molestation", severity: "petty", section: "IPC 354" },
  PUBLIC_NUISANCE: { code: "268", label: "Public Nuisance", severity: "petty", section: "IPC 268" },
  TRAFFIC_VIOLATION: { code: "MV", label: "Traffic Violation", severity: "petty", section: "MV Act" },
  LOST_PROPERTY: { code: "LP", label: "Lost Property", severity: "petty", section: "Police Act" },
  MISSING_PERSON: { code: "MP", label: "Missing Person", severity: "petty", section: "Police Act" },
  DOMESTIC_VIOLENCE: { code: "DV", label: "Domestic Violence", severity: "grave", section: "PWDV Act" },
};

export const CCTNS_CRIME_CATEGORIES = {
  heinous: { label: "Heinous", color: "#EF4444", weight: 5 },
  grave: { label: "Grave", color: "#F59E0B", weight: 3 },
  petty: { label: "Petty", color: "#3B82F6", weight: 1 },
};

export const KARNATAKA_POLICE_RANKS = [
  "DGP", "ADGP", "IGP", "DIG", "SP", "Addl.SP", "DySP", "PI", "PSI", "ASI", "HC", "PC"
];

export const KARNATAKA_BUREAUS = [
  { code: "SCRB", name: "State Crime Records Bureau", location: "Bengaluru" },
  { code: "FRO", name: "Finger Print Bureau", location: "Bengaluru" },
  { code: "FSL", name: "Forensic Science Laboratory", location: "Bengaluru" },
  { code: "CID", name: "Criminal Investigation Department", location: "Bengaluru" },
  { code: "LOKAYUKTA", name: "Lokayukta Police", location: "Bengaluru" },
];

export const AKKA_PADA_STATIONS = [
  { name: "Akka Pada - Koramangala", lat: 12.9352, lng: 77.6146, officers: 12, vehicle: "KA-01-MH-1234" },
  { name: "Akka Pada - Indiranagar", lat: 12.9784, lng: 77.6408, officers: 10, vehicle: "KA-01-MH-1235" },
  { name: "Akka Pada - Whitefield", lat: 12.9698, lng: 77.7500, officers: 8, vehicle: "KA-01-MH-1236" },
  { name: "Akka Pada - Jayanagar", lat: 12.9291, lng: 77.5823, officers: 10, vehicle: "KA-01-MH-1237" },
  { name: "Akka Pada - Malleswaram", lat: 13.0034, lng: 77.5675, officers: 8, vehicle: "KA-01-MH-1238" },
  { name: "Akka Pada - Hebbal", lat: 13.0358, lng: 77.5970, officers: 6, vehicle: "KA-01-MH-1239" },
  { name: "Akka Pada - Electronic City", lat: 12.8456, lng: 77.6603, officers: 8, vehicle: "KA-01-MH-1240" },
];

export const SAFE_CITY_CAMERAS = [
  { id: "SC_001", name: "MG Road Junction", lat: 12.9752, lng: 77.6067, type: "ANPR", status: "active" },
  { id: "SC_002", name: "Koramangala 80ft Road", lat: 12.9352, lng: 77.6146, type: "ANPR", status: "active" },
  { id: "SC_003", name: "Whitefield Main Road", lat: 12.9698, lng: 77.7500, type: "ANPR", status: "active" },
  { id: "SC_004", name: "Electronic City Phase 1", lat: 12.8456, lng: 77.6603, type: "ANPR", status: "active" },
  { id: "SC_005", name: "Hebbal Flyover", lat: 13.0358, lng: 77.5970, type: "ANPR", status: "active" },
  { id: "SC_006", name: "Silk Board Junction", lat: 12.9172, lng: 77.6229, type: "CROWD", status: "active" },
  { id: "SC_007", name: "Majestic Bus Stand", lat: 12.9760, lng: 77.5713, type: "CROWD", status: "active" },
  { id: "SC_008", name: "KR Market", lat: 12.9583, lng: 77.5758, type: "CROWD", status: "active" },
];

export const NAMMA_112_CATEGORIES = [
  { code: "POLICE", label: "Police Emergency", icon: "👮", color: "#3B82F6" },
  { code: "FIRE", label: "Fire Emergency", icon: "🔥", color: "#EF4444" },
  { code: "MEDICAL", label: "Medical Emergency", icon: "🚑", color: "#22C55E" },
  { code: "WOMEN", label: "Women Safety", icon: "👩", color: "#EC4899" },
  { code: "CHILD", label: "Child Protection", icon: "👶", color: "#F59E0B" },
  { code: "TRAFFIC", label: "Traffic Emergency", icon: "🚗", color: "#8B5CF6" },
  { code: "DISASTER", label: "Disaster Relief", icon: "🌪️", color: "#64748B" },
  { code: "CYBER", label: "Cyber Crime", icon: "💻", color: "#06B6D4" },
];

export const CIVIC_COMPLAINT_TYPES = [
  { code: "WOMEN_SAFETY", label: "Women Safety / Harassment", dept: "KSP Women Cell", icon: "👩", sla: "10m" },
  { code: "THEFT", label: "Theft / House Breaking", dept: "KSP Crime Branch", icon: "👮", sla: "24h" },
  { code: "CYBER_CRIME", label: "Cyber Crime / Online Fraud", dept: "KSP Cyber Crime Wing", icon: "💻", sla: "6h" },
  { code: "DRUG_ACTIVITY", label: "Drug / Narcotics Activity", dept: "KSP Narcotics Division", icon: "💊", sla: "12h" },
  { code: "ASSAULT", label: "Physical Assault / Violence", dept: "KSP Law & Order", icon: "🥊", sla: "15m" },
  { code: "TRAFFIC_VIOLATION", label: "Reckless Driving / Road Rage", dept: "Bengaluru Traffic Police", icon: "🚗", sla: "30m" },
  { code: "MISSING_PERSON", label: "Missing Person Report", dept: "KSP Missing Bureau", icon: "👤", sla: "4h" },
  { code: "NOISE_NUISANCE", label: "Noise / Public Nuisance", dept: "KSP Law & Order", icon: "🔊", sla: "1h" },
];

export const BENGALURU_WARDS = [
  { ward: 1, name: "Kempegowda", zone: "West" },
  { ward: 2, name: "Chickpete", zone: "West" },
  { ward: 3, name: "Srirama Mandir", zone: "West" },
  { ward: 4, name: "Chamarajpet", zone: "West" },
  { ward: 5, name: "Siddanna Layout", zone: "West" },
  { ward: 6, name: "Jayanagar East", zone: "South" },
  { ward: 7, name: "Basavanagudi", zone: "South" },
  { ward: 8, name: "Jayanagar", zone: "South" },
  { ward: 9, name: "Pattabhiram Nagar", zone: "South" },
  { ward: 10, name: "Sudhama Nagar", zone: "South" },
  { ward: 150, name: "Bellandur", zone: "East" },
  { ward: 151, name: "Kudlu", zone: "East" },
  { ward: 152, name: "HSR Layout", zone: "East" },
  { ward: 153, name: "Bommanahalli", zone: "East" },
  { ward: 198, name: "Yelahanka Satellite Town", zone: "North" },
];

export const TIME_SLOTS = [
  { id: "midnight", label: "00:00-03:00", start: 0, end: 3 },
  { id: "early_morning", label: "03:00-06:00", start: 3, end: 6 },
  { id: "morning", label: "06:00-09:00", start: 6, end: 9 },
  { id: "forenoon", label: "09:00-12:00", start: 9, end: 12 },
  { id: "afternoon", label: "12:00-15:00", start: 12, end: 15 },
  { id: "evening", label: "15:00-18:00", start: 15, end: 18 },
  { id: "night", label: "18:00-21:00", start: 18, end: 21 },
  { id: "late_night", label: "21:00-24:00", start: 21, end: 24 },
];

export const CANNADA_TEXTS = {
  appName: "ಸಹಸ್ರ ಕೇಎಸ್ಪಿ",
  citizen: "ಸಾರ್ವಜನಿಕ",
  police: "ಪೋಲೀಸ್",
  fileComplaint: "ಐवं ದಾಖಲ್ಗೊಳ್ಳಿ",
  sos: "ಎಸ್ಓಎಸ್",
  namma112: "ನಮ್ಮ 112",
  safeCity: "ಸುರಕ್ಷಿತ ನಗರ",
  complaints: "ಆಕ್ಷೇಪಗಳು",
  profile: "ಪ್ರೊಫೈಲ್",
  cctns: "ಸಿಸಿಟಿಎನ್‌ಎಸ್",
  fir: "ಎಫ್‌ಐಆರ್",
  suspects: "সন্দಿಗ್ಧರು",
  hotspots: "ಹಾಟ್‌ಸ್ಪಾಟ್‌ಗಳು",
  gangs: "ಗ್ಯಾಂಗ್‌ಗಳು",
  prediction: "ಭವಿಷ್ಯವಾಣಿ",
  anpr: "ಎಎನ್‌ಪಿಆರ್",
  nlpQuery: "ಪ್ರಶ್ನೆ ಕೇಳಿ",
  dashboard: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
  logout: "ಲಾಗ್‌ಆಉಟ್",
  language: "ಭಾಷೆ",
  english: "English",
  kannada: "ಕನ್ನಡ",
  hindi: "हिंदी",
};

export const SEVERITY_COLORS = {
  heinous: "#EF4444",
  grave: "#F59E0B",
  petty: "#3B82F6",
  critical: "#EF4444",
  high: "#F59E0B",
  medium: "#3B82F6",
  low: "#22C55E",
};