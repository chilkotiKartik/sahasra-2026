import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type Priority = "P1" | "P2" | "P3" | "P4";

export const PRIORITY_META: Record<Priority, { label: string; color: string; bg: string }> = {
  P1: { label: "CRITICAL (P1)", color: "#EF4444", bg: "#EF444420" },
  P2: { label: "HIGH (P2)", color: "#F59E0B", bg: "#F59E0B20" },
  P3: { label: "MEDIUM (P3)", color: "#3B82F6", bg: "#3B82F620" },
  P4: { label: "LOW (P4)", color: "#6B7280", bg: "#6B728020" },
};

export type ComplaintStatus = "Open" | "In Progress" | "Resolved" | "Closed";

export const STATUS_META: Record<ComplaintStatus, { label: string; color: string; bg: string }> = {
  Open: { label: "Pending", color: "#F59E0B", bg: "#F59E0B20" },
  "In Progress": { label: "In Progress", color: "#3B82F6", bg: "#3B82F620" },
  Resolved: { label: "Resolved", color: "#22C55E", bg: "#22C55E20" },
  Closed: { label: "Closed", color: "#6B7280", bg: "#6B728020" },
};

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface Complaint {
  id: string;
  title: string;
  department?: string;
  status?: ComplaintStatus;
  priority?: Priority;
  lat?: number;
  lng?: number;
  location?: string;
  description?: string;
}

export interface SOSAlert {
  id: string;
  userName?: string;
  time?: string;
  lat?: number;
  lng?: number;
  status?: string;
  category?: string;
  location?: string;
  description?: string;
  triggeredAt?: string;
  respondingWorker?: any;
}

export const SOS_META = {
  active: { label: "ACTIVE EMERGENCY", color: "#EF4444" },
  resolved: { label: "RESOLVED", color: "#22C55E" },
};

export interface Worker {
  id: string;
  name: string;
  role: string;
  lat: number;
  lng: number;
}

export interface PoliceStation {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  geo?: GeoPoint;
}

export interface RiskZone {
  id: string;
  name: string;
  riskLevel?: string;
  center?: GeoPoint;
}

export const TRANSLATIONS = {
  en: {
    appName: "SAHASRA KSP",
    citizen: "Citizen",
    police: "Police",
    fileComplaint: "File Report",
    sos: "SOS",
    namma112: "Namma 112",
    safeCity: "Safe City",
    complaints: "Complaints",
    profile: "Profile",
    cctns: "CCTNS",
    fir: "FIR",
    suspects: "Suspects",
    hotspots: "Hotspots",
    gangs: "Gangs",
    prediction: "Prediction",
    anpr: "ANPR",
    nlpQuery: "NLP Query",
    dashboard: "Dashboard",
    logout: "Logout",
    language: "Language",
    english: "English",
    kannada: "Kannada",
    hindi: "Hindi",
    welcome: "Namaskara",
    switchRole: "Switch Mode",
    activePatrols: "Active Patrols",
    casesSolved: "Cases Resolved",
    pendingInvestigation: "Under Investigation",
    avgResponseTime: "Avg Response Time",
    womenSafety: "Women Safety",
    incidentReports: "Incident Reports",
    reportIncident: "Report Incident",
    home: "Home",
    safeMap: "Safe Map",
    kspEmergency: "KSP Emergency",
    trustedContacts: "Trusted Emergency Contacts",
    roleSettings: "Role & Portal Settings",
    switchToPolice: "Switch to Police Intelligence Mode",
    accessPoliceHub: "Access CCTNS, Hotspots, Gang Links & ANPR",
  },
  kn: {
    appName: "ಸಹಸ್ರ ಕೇಎಸ್ಪಿ",
    citizen: "ಸಾರ್ವಜನಿಕ",
    police: "ಪೋಲೀಸ್",
    fileComplaint: "ವರದಿ ದಾಖಲಿಸಿ",
    sos: "ಎಸ್ಓಎಸ್",
    namma112: "ನಮ್ಮ 112",
    safeCity: "ಸುರಕ್ಷಿತ ನಗರ",
    complaints: "ಆಕ್ಷೇಪಗಳು",
    profile: "ಪ್ರೊಫೈಲ್",
    cctns: "ಸಿಸಿಟಿಎನ್‌ಎಸ್",
    fir: "ಎಫ್‌アイಆರ್",
    suspects: "ಸಂದಿಗ್ಧರು",
    hotspots: "ಹಾಟ್‌ಸ್ಪಾಟ್‌ಗಳು",
    gangs: "ಗ್ಯಾಂಗ್‌ಗಳು",
    prediction: "ಭವಿಷ್ಯವಾಣಿ",
    anpr: "ಎಎನ್‌ಪಿಆರ್",
    nlpQuery: "ಪ್ರಶ್ನೆ ಕೇಳಿ",
    dashboard: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
    logout: "ಲಾಗ್‌ಔಟ್",
    language: "ಭಾಷೆ",
    english: "English",
    kannada: "ಕನ್ನಡ",
    hindi: "हिंदी",
    welcome: "ನಮಸ್ಕಾರ",
    switchRole: "ಸ್ಥಿತಿ ಬದಲಾಯಿಸಿ",
    activePatrols: "ಸಕ್ರಿಯ ಗಸ್ತು ವಾಹನಗಳು",
    casesSolved: "ಪರಿಹರಿಸಲಾದ ಪ್ರಕರಣಗಳು",
    pendingInvestigation: "ತनीಖೆಯಲ್ಲಿದೆ",
    avgResponseTime: "ಸರಾಸರಿ ಪ್ರತಿಕ್ರಿಯೆ ಸಮಯ",
    womenSafety: "ಮಹಿಳಾ ಸುರಕ್ಷತೆ",
    incidentReports: "ಘಟನೆಯ ವರದಿಗಳು",
    reportIncident: "ಘಟನೆ ವರದಿ ಮಾಡಿ",
    home: "ಮುಖಪುಟ",
    safeMap: "ಸುರಕ್ಷಿತ ನಕ್ಷೆ",
    kspEmergency: "ಕೇಎಸ್ಪಿ ತುರ್ತು",
    trustedContacts: "ವಿಶ್ವಾಸಾರ್ಹ ತುರ್ತು ಸಂಪರ್ಕಗಳು",
    roleSettings: "ಪಾತ್ರ ಮತ್ತು ಪೋರ್ಟಲ್ ಸೆಟ್ಟಿಂಗ್‌ಗಳು",
    switchToPolice: "ಪೋಲೀಸ್ ಇಂಟೆಲಿಜೆನ್ಸ್ ಮೋಡ್‌ಗೆ ಬದಲಾಯಿಸಿ",
    accessPoliceHub: "CCTNS, ಹಾಟ್‌ಸ್ಪಾಟ್‌ಗಳು, ಗ್ಯಾಂಗ್ ಲಿಂಕ್‌ಗಳು ಮತ್ತು ANPR ಅನ್ನು ಪ್ರವೇಶಿಸಿ",
  },
  hi: {
    appName: "सहस्र केएसपी",
    citizen: "नागरिक",
    police: "पुलिस",
    fileComplaint: "शिकायत दर्ज करें",
    sos: "एसओएस",
    namma112: "नम्मा 112",
    safeCity: "सुरक्षित शहर",
    complaints: "शिकायतें",
    profile: "प्रोफ़ाइल",
    cctns: "सीसीटीएनएस",
    fir: "एफआईआर",
    suspects: "संदिग्ध",
    hotspots: "हॉटस्पॉट",
    gangs: "गिरोह",
    prediction: "पूर्वानुमान",
    anpr: "एएनपीआर",
    nlpQuery: "प्रश्न पूछें",
    dashboard: "डैशबोर्ड",
    logout: "लॉगआउट",
    language: "भाषा",
    english: "English",
    kannada: "ಕನ್ನಡ",
    hindi: "हिंदी",
    welcome: "नमस्ते",
    switchRole: "मोड बदलें",
    activePatrols: "सक्रिय गश्ती दल",
    casesSolved: "सुलझाए गए मामले",
    pendingInvestigation: "जांच के अधीन",
    avgResponseTime: "औसत प्रतिक्रिया समय",
    womenSafety: "महिला सुरक्षा",
    incidentReports: "घटना रिपोर्ट",
    reportIncident: "घटना रिपोर्ट करें",
    home: "होम",
    safeMap: "सुरक्षित मानचित्र",
    kspEmergency: "केएसपी आपातकालीन",
    trustedContacts: "विश्वसनीय आपातकालीन संपर्क",
    roleSettings: "भूमिका और पोर्टल सेटिंग्स",
    switchToPolice: "पुलिस इंटेलिजेंस मोड में स्विच करें",
    accessPoliceHub: "सीसीटीएनएस, हॉटस्पॉट, गैंग लिंक और एएनपीआर एक्सेस करें",
  }
};

export interface AppState {
  language: "en" | "kn" | "hi";
  theme: "dark" | "light";
  setLanguage: (lang: "en" | "kn" | "hi") => void;
  setTheme: (theme: "dark" | "light") => void;
  isOnline: boolean;
  setIsOnline: (online: boolean) => void;
  t: (key: keyof typeof TRANSLATIONS.en) => string;
}

const AppContext = createContext<AppState | undefined>(undefined);

const THEME_KEY = "sahasra_theme";
const LANG_KEY = "sahasra_lang";

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<"en" | "kn" | "hi">("en");
  const [theme, setThemeState] = useState<"dark" | "light">("dark");
  const [isOnline, setIsOnline] = useState(true);

  // Load persisted preferences once on mount (P9: persisted theme toggle).
  useEffect(() => {
    (async () => {
      try {
        const [savedTheme, savedLang] = await Promise.all([
          AsyncStorage.getItem(THEME_KEY),
          AsyncStorage.getItem(LANG_KEY),
        ]);
        if (savedTheme === "light" || savedTheme === "dark") setThemeState(savedTheme);
        if (savedLang === "en" || savedLang === "kn" || savedLang === "hi") setLanguageState(savedLang);
      } catch {
        /* defaults are fine */
      }
    })();
  }, []);

  const setTheme = (next: "dark" | "light") => {
    setThemeState(next);
    AsyncStorage.setItem(THEME_KEY, next).catch(() => {});
  };
  const setLanguage = (next: "en" | "kn" | "hi") => {
    setLanguageState(next);
    AsyncStorage.setItem(LANG_KEY, next).catch(() => {});
  };

  const t = (key: keyof typeof TRANSLATIONS.en): string => {
    const dict = TRANSLATIONS[language] || TRANSLATIONS["en"];
    return dict[key] || TRANSLATIONS["en"][key] || key;
  };

  return (
    <AppContext.Provider value={{ language, setLanguage, theme, setTheme, isOnline, setIsOnline, t }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}