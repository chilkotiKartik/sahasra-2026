import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator,
  Modal,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { getThemeColors } from "@/constants/theme";
import { MOCK_ANPR_TRIGGERS, MOCK_HOTSPOTS } from "@/constants/sahasraData";

export default function PoliceCommandCenter() {
  const router = useRouter();
  const { user, switchRole } = useAuth();
  const { theme: activeTheme } = useApp();
  const theme = getThemeColors(activeTheme);

  const [auditLogs, setAuditLogs] = React.useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = React.useState(false);
  const [activeWsAlert, setActiveWsAlert] = React.useState<any>(null);
  const [verifyingLedger, setVerifyingLedger] = React.useState(false);
  const [verificationResult, setVerificationResult] = React.useState<any | null>(null);
  const [showLedgerModal, setShowLedgerModal] = React.useState(false);
  const [selectedBlockIdx, setSelectedBlockIdx] = React.useState<number | null>(null);

  const getApiRoot = () => {
    if (typeof window !== "undefined" && window.location) {
      if (window.location.port === "8081" || window.location.port === "8082" || window.location.port === "8080" || window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
        return `${window.location.protocol}//${window.location.hostname}:5000`;
      }
      return window.location.origin;
    }
    return "http://localhost:5000";
  };

  const handleVerifyLedger = async () => {
    setVerifyingLedger(true);
    try {
      const res = await fetch(`${getApiRoot()}/api/audit/verify`);
      if (res.ok) {
        const data = await res.json();
        setVerificationResult(data);
        setShowLedgerModal(true);
      }
    } catch (e) {
      console.log("Failed to verify audit ledger:", e);
      Alert.alert("VERIFICATION ERROR", "Failed to contact state verification node.");
    } finally {
      setVerifyingLedger(false);
    }
  };

  React.useEffect(() => {
    // Establish real-time WebSocket link
    const getWsRoot = () => {
      if (typeof window !== "undefined" && window.location) {
        const wsProto = window.location.protocol === "https:" ? "wss:" : "ws:";
        if (window.location.port === "8081" || window.location.port === "8082" || window.location.port === "8080" || window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
          return `${wsProto}//${window.location.hostname}:5000`;
        }
        return `${wsProto}//${window.location.host}`;
      }
      return "ws://localhost:5000";
    };
    const wsUrl = `${getWsRoot()}/ws?token=mock_token`;
    let socket: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connect = () => {
      console.log("[WS Client] Connecting to command center:", wsUrl);
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log("[WS Client] Connected successfully");
      };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === "cctv_webhook_simulation") {
            setActiveWsAlert(payload);
          }
        } catch (err) {
          console.log("[WS Client] Error parsing packet:", err);
        }
      };

      socket.onclose = () => {
        console.log("[WS Client] Disconnected, attempting retry...");
        reconnectTimeout = setTimeout(connect, 4000);
      };

      socket.onerror = (err) => {
        console.log("[WS Client] Error:", err);
      };
    };

    connect();

    return () => {
      if (socket) socket.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  const fetchLogs = React.useCallback(async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch(`${getApiRoot()}/api/audit?demo_role=police`);
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data);
      }
    } catch (e) {
      console.log("Failed to fetch police audit logs:", e);
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  React.useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 8000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} contentContainerStyle={styles.content}>
      {/* Top Officer Header */}
      <View style={styles.header}>
        <Pressable style={styles.badgeBox} onPress={() => router.push("/(police)/badge")}>
          <Text style={styles.kspTag}>KARNATAKA STATE POLICE • SCRB</Text>
          <Text style={[styles.officerName, { color: theme.text }]}>Inspector Reddy ({user?.station || "Koramangala PS"})</Text>
          <Text style={[styles.badgeNo, { color: theme.muted }]}>
            Badge #{user?.badge || "KSP-881920"} • <Text style={{ color: "#3B82F6", fontWeight: "bold" }}>View ID Pass 🔍</Text>
          </Text>
        </Pressable>

        <View style={{ gap: 6 }}>
          <Pressable style={[styles.citizenSwitchBtn, { backgroundColor: "#EF444420", borderColor: "#EF4444" }]} onPress={() => switchRole("police_admin")}>
            <Ionicons name="terminal" size={12} color="#EF4444" />
            <Text style={[styles.citizenSwitchText, { color: "#EF4444" }]}>ADMIN</Text>
          </Pressable>
        </View>
      </View>

      {/* Dynamic WebSocket CCTV Alert Banner or static fallback */}
      {activeWsAlert ? (
        <View style={[styles.alertBanner, { backgroundColor: "#EF444415", borderColor: "#EF4444" }]}>
          <View style={styles.alertHeader}>
            <View style={[styles.pulseDot, { backgroundColor: "#EF4444" }]} />
            <Text style={[styles.alertTitle, { color: "#EF4444" }]}>CRITICAL CCTV AI THREAT DETECTED</Text>
            <Text style={styles.alertTime}>Just Now</Text>
          </View>
          <Text style={[styles.alertBody, { color: "#F0F4FF" }]}>
            Camera {activeWsAlert.cameraId} ({activeWsAlert.cameraName}) flagged active {activeWsAlert.incidentType.replace('_', ' ')} in progress. Coordinates: GPS {activeWsAlert.geo?.lat}° N, {activeWsAlert.geo?.lng}° E.
          </Text>
          <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
            <Pressable
              style={[styles.alertActionBtn, { flex: 1, backgroundColor: "#EF4444" }]}
              onPress={() => {
                const alertData = activeWsAlert;
                setActiveWsAlert(null);
                router.push({
                  pathname: "/(police)/anpr",
                  params: {
                    camName: alertData.cameraName,
                    cameraId: alertData.cameraId,
                    autoOpen: "true"
                  }
                });
              }}
            >
              <Text style={styles.alertActionText}>🔴 INTERCEPT LIVE CAMERA FEED</Text>
            </Pressable>
            <Pressable
              style={[styles.alertActionBtn, { borderColor: "#EF4444", borderWidth: 1, backgroundColor: "transparent", flex: 0.3 }]}
              onPress={() => setActiveWsAlert(null)}
            >
              <Text style={[styles.alertActionText, { color: "#EF4444", textAlign: "center" }]}>DISMISS</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        /* Static 3-sigma Fallback Alert Banner */
        <View style={styles.alertBanner}>
          <View style={styles.alertHeader}>
            <View style={styles.pulseDot} />
            <Text style={styles.alertTitle}>3-SIGMA CRIME ANOMALY DETECTED</Text>
            <Text style={styles.alertTime}>Just now</Text>
          </View>
          <Text style={[styles.alertBody, { color: activeTheme === "light" ? "#EF4444" : "#F0F4FF" }]}>
            Peenya Industrial Ward: +310% spike in late-night chain snatching (IPC 379A). DBSCAN model flagged 450m cluster near Metro exit under unlit flyover.
          </Text>
          <Pressable
            style={styles.alertActionBtn}
            onPress={() => router.push("/(police)/akka-pade")}
          >
            <Text style={styles.alertActionText}>DISPATCH AKKA PADE PATROL →</Text>
          </Pressable>
        </View>
      )}

      {/* Intelligence KPI Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <Ionicons name="document-text-outline" size={22} color="#3B82F6" />
          <Text style={[styles.statNumber, { color: theme.text }]}>1,100+</Text>
          <Text style={[styles.statLabel, { color: theme.muted }]}>CCTNS Stations Ingested</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <Ionicons name="git-network-outline" size={22} color="#8B5CF6" />
          <Text style={[styles.statNumber, { color: theme.text }]}>14</Text>
          <Text style={[styles.statLabel, { color: theme.muted }]}>Gang Network Rings</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <Ionicons name="flame-outline" size={22} color="#EF4444" />
          <Text style={[styles.statNumber, { color: theme.text }]}>3</Text>
          <Text style={[styles.statLabel, { color: theme.muted }]}>High DBSCAN Hotspots</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <Ionicons name="videocam-outline" size={22} color="#06B6D4" />
          <Text style={[styles.statNumber, { color: theme.text }]}>7,500+</Text>
          <Text style={[styles.statLabel, { color: theme.muted }]}>Safe City AI Cameras</Text>
        </View>
      </View>

      {/* ANPR Camera Live Trigger Widget */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Bengaluru Safe City ANPR Trigger Alert</Text>
        <Pressable onPress={() => router.push("/(police)/anpr")}>
          <Text style={styles.seeAllText}>View All Cameras →</Text>
        </Pressable>
      </View>

      {MOCK_ANPR_TRIGGERS.slice(0, 1).map((trig) => (
        <View key={trig.id} style={[styles.anprCard, { backgroundColor: theme.cardBg, borderColor: activeTheme === "light" ? theme.border : "#EF444460" }]}>
          <View style={styles.anprHeader}>
            <View style={styles.anprTag}>
              <Text style={styles.anprTagText}>{trig.triggerType}</Text>
            </View>
            <Text style={styles.anprTime}>{trig.timestamp}</Text>
          </View>

          <View style={styles.anprBody}>
            <Image
              source={require("@/assets/images/cctv_feed_capture.png")}
              style={{ width: 80, height: 60, borderRadius: 8, borderWidth: 1, borderColor: theme.border, marginRight: 10 }}
              resizeMode="cover"
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.anprPlate, { color: theme.text }]}>{trig.plateNo} ({trig.vehicleModel})</Text>
              <Text style={[styles.anprCamera, { color: theme.muted }]}>{trig.cameraName}</Text>
              <Text style={styles.anprSuspect}>Linked: {trig.suspectLinked} ({trig.bailStatus})</Text>
            </View>
          </View>

          <View style={[styles.anprFooter, { borderColor: theme.border }]}>
            <Ionicons name="notifications" size={14} color="#F59E0B" />
            <Text style={[styles.anprFooterText, { color: theme.muted }]}>Push Alert Sent to Duty Officer CEN_03</Text>
          </View>
        </View>
      ))}

      {/* Advanced SAHASRA Feature Shortcuts */}
      <Text style={[styles.sectionTitle, { marginTop: 14, marginBottom: 10, color: theme.text }]}>SAHASRA Intelligence Modules</Text>

      <View style={styles.moduleGrid}>
        <Pressable style={[styles.moduleCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]} onPress={() => router.push("/(police)/cctns")}>
          <View style={[styles.moduleIcon, { backgroundColor: "#3B82F620" }]}>
            <Ionicons name="folder-open" size={22} color="#3B82F6" />
          </View>
          <Text style={[styles.moduleTitle, { color: theme.text }]}>CCTNS FIR Ingestion</Text>
          <Text style={[styles.moduleDesc, { color: theme.muted }]}>Standard IIF forms, ICJS bail/jail status & Jaro-Winkler entity resolution</Text>
        </Pressable>

        <Pressable style={[styles.moduleCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]} onPress={() => router.push("/(police)/gangs")}>
          <View style={[styles.moduleIcon, { backgroundColor: "#8B5CF620" }]}>
            <Ionicons name="git-network" size={22} color="#8B5CF6" />
          </View>
          <Text style={[styles.moduleTitle, { color: theme.text }]}>Gang Link Graph</Text>
          <Text style={[styles.moduleDesc, { color: theme.muted }]}>Louvain Community Detection & Kingpin Degree Centrality rank</Text>
        </Pressable>

        <Pressable style={[styles.moduleCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]} onPress={() => router.push("/(police)/mo-search")}>
          <View style={[styles.moduleIcon, { backgroundColor: "#06B6D420" }]}>
            <Ionicons name="search" size={22} color="#06B6D4" />
          </View>
          <Text style={[styles.moduleTitle, { color: theme.text }]}>MO Semantic Search</Text>
          <Text style={[styles.moduleDesc, { color: theme.muted }]}>FAISS vector similarity matching cross-district serial crime patterns</Text>
        </Pressable>

        <Pressable style={[styles.moduleCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]} onPress={() => router.push("/(police)/hotspots")}>
          <View style={[styles.moduleIcon, { backgroundColor: "#EF444420" }]}>
            <Ionicons name="flame" size={22} color="#EF4444" />
          </View>
          <Text style={[styles.moduleTitle, { color: theme.text }]}>DBSCAN & Prophet</Text>
          <Text style={[styles.moduleDesc, { color: theme.muted }]}>7-Day spatial crime forecasting & time-slot risk matrix</Text>
        </Pressable>

        <Pressable style={[styles.moduleCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]} onPress={() => router.push("/(police)/anpr")}>
          <View style={[styles.moduleIcon, { backgroundColor: "#F59E0B20" }]}>
            <Ionicons name="videocam" size={22} color="#F59E0B" />
          </View>
          <Text style={[styles.moduleTitle, { color: theme.text }]}>Safe City ANPR</Text>
          <Text style={[styles.moduleDesc, { color: theme.muted }]}>7,500+ AI camera pings & instant suspect history lookup</Text>
        </Pressable>

        <Pressable style={[styles.moduleCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]} onPress={() => router.push("/(police)/nlp-query")}>
          <View style={[styles.moduleIcon, { backgroundColor: "#22C55E20" }]}>
            <Ionicons name="terminal" size={22} color="#22C55E" />
          </View>
          <Text style={[styles.moduleTitle, { color: theme.text }]}>Natural Language AI</Text>
          <Text style={[styles.moduleDesc, { color: theme.muted }]}>Gemma/Llama intent parser converting English/Kannada query to JSON</Text>
        </Pressable>

        <Pressable style={[styles.moduleCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]} onPress={() => router.push("/(police)/akka-pade")}>
          <View style={[styles.moduleIcon, { backgroundColor: "#EC489920" }]}>
            <Ionicons name="car" size={22} color="#EC4899" />
          </View>
          <Text style={[styles.moduleTitle, { color: theme.text }]}>Akka Patrol Fleet</Text>
          <Text style={[styles.moduleDesc, { color: theme.muted }]}>Live PCR patrol vehicle GPS tracking and dispatch control</Text>
        </Pressable>
      </View>

      {/* DPDP Act 2023 Compliance Audit Ledger */}
      <View style={styles.auditSection}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <View style={{ gap: 2, flex: 1, marginRight: 8 }}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>DPDP Act 2023 Immutable Audit Ledger</Text>
            <Text style={{ fontSize: 9, color: theme.muted }}>Precinct investigation access logs & audit seals</Text>
          </View>
          <Pressable 
            style={[styles.verifyLedgerBtn, verifyingLedger && { opacity: 0.7 }]} 
            onPress={handleVerifyLedger}
            disabled={verifyingLedger}
          >
            {verifyingLedger ? (
              <ActivityIndicator size="small" color="#10B981" />
            ) : (
              <>
                <Ionicons name="shield-checkmark" size={12} color="#10B981" />
                <Text style={styles.verifyLedgerText}>VERIFY INTEGRITY</Text>
              </>
            )}
          </Pressable>
        </View>
        
        <ScrollView 
          nestedScrollEnabled={true} 
          style={{ maxHeight: 290, marginTop: 4 }} 
          contentContainerStyle={{ paddingRight: 4 }}
        >
          {loadingLogs && auditLogs.length === 0 ? (
            <ActivityIndicator size="small" color="#3B82F6" style={{ padding: 12 }} />
          ) : auditLogs.length === 0 ? (
            <Text style={[styles.auditLogLine, { color: theme.muted, textAlign: 'center', padding: 8 }]}>No precinct audit logs found</Text>
          ) : (
            auditLogs.map((log, idx) => {
              const dateStr = new Date(log.timestamp).toLocaleTimeString();
              const actionColors: Record<string, string> = {
                auth_login: "#8B5CF6",
                cctns_search: "#F59E0B",
                access_profile: "#10B981",
                rti_filed: "#3B82F6",
                provision_officer: "#EC4899",
                automated_cleanup: "#06B6D4",
                sla_breach: "#EF4444",
                cctv_anomaly_webhook: "#EC4899"
              };
              const actionColor = actionColors[log.action] || "#8892B0";
              const actionTitles: Record<string, string> = {
                auth_login: "🔐 Officer Login",
                cctns_search: "🔍 CCTNS Records Search",
                access_profile: "👤 Dossier Access",
                rti_filed: "📂 RTI Inquiry Processed",
                provision_officer: "⚡ Command Account Provisioned",
                automated_cleanup: "🧹 DPDP Retention Purge",
                sla_breach: "⚠️ Response SLA Breach Audit",
                cctv_anomaly_webhook: "🚨 CCTV Threat Alert"
              };
              const actionTitle = actionTitles[log.action] || log.action?.toUpperCase();
              
              const isDark = activeTheme === "dark";
              const itemBg = isDark ? "#141A2E" : "#F8FAFC";
              const textPrimary = isDark ? "#F0F4FF" : "#1E293B";
              const textSecondary = isDark ? "#94A3B8" : "#64748B";

              return (
                <Pressable
                  key={log.id || idx}
                  onPress={() => {
                    setSelectedBlockIdx(idx);
                    setShowLedgerModal(true);
                  }}
                  style={{
                    backgroundColor: itemBg,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: theme.border,
                    borderLeftWidth: 3,
                    borderLeftColor: actionColor,
                    padding: 10,
                    marginBottom: 6,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 2,
                    elevation: 1,
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ fontSize: 9, color: theme.muted, fontFamily: 'monospace' }}>{dateStr}</Text>
                      <View style={{ backgroundColor: actionColor + "15", borderColor: actionColor + "40", borderWidth: 1, paddingHorizontal: 5, paddingVertical: 1.5, borderRadius: 4 }}>
                        <Text style={{ fontSize: 7, fontWeight: '900', color: actionColor }}>{actionTitle}</Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="cube-outline" size={10} color="#3B82F6" />
                      <Text style={{ fontSize: 9, color: '#3B82F6', fontFamily: 'monospace', fontWeight: 'bold' }}>Block #{idx + 1}</Text>
                    </View>
                  </View>
                  
                  <Text style={{ fontSize: 10, color: textPrimary, lineHeight: 13, fontWeight: '500' }}>
                    <Text style={{ fontWeight: '700', color: '#6366F1' }}>{log.userName}</Text> — {log.details}
                  </Text>
                  
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                    <View style={{ backgroundColor: "#10B98115", borderColor: "#10B98133", borderWidth: 1, paddingHorizontal: 5, paddingVertical: 1.5, borderRadius: 4 }}>
                      <Text style={{ fontSize: 7, color: "#10B981", fontWeight: "700" }}>🛡️ {log.dpdpSection || "Sec 7(i) Grounds"}</Text>
                    </View>
                    <View style={{ backgroundColor: "#F59E0B15", borderColor: "#F59E0B33", borderWidth: 1, paddingHorizontal: 5, paddingVertical: 1.5, borderRadius: 4 }}>
                      <Text style={{ fontSize: 7, color: "#F59E0B", fontWeight: "700" }}>⚙️ {log.purpose || "Crime Prevention"}</Text>
                    </View>
                    <View style={{ backgroundColor: "#10B98110", paddingHorizontal: 5, paddingVertical: 1.5, borderRadius: 4, marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                      <Ionicons name="checkmark-circle" size={8} color="#10B981" />
                      <Text style={{ fontSize: 7, color: "#10B981", fontWeight: "700" }}>SEALED</Text>
                    </View>
                  </View>
                  
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, borderTopWidth: 1, borderTopColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)", paddingTop: 4 }}>
                    <Text style={{ fontSize: 7.5, color: textSecondary, fontFamily: 'monospace' }}>
                      Prev: <Text style={{ color: isDark ? '#FFF' : '#000' }}>{log.prevHash ? log.prevHash.slice(0, 16) : '0000000000000000'}</Text>
                    </Text>
                    <Text style={{ fontSize: 7.5, color: textSecondary, fontFamily: 'monospace' }}>
                      Hash: <Text style={{ color: '#10B981', fontWeight: 'bold' }}>{log.hash ? log.hash.slice(0, 16) : 'N/A'}</Text>
                    </Text>
                  </View>
                </Pressable>
              );
            })
          )}
        </ScrollView>
      </View>
    </ScrollView>

    {/* Cryptographic Ledger Verification Modal */}
    <Modal
      visible={showLedgerModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowLedgerModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContentExtended, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <View style={{ alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <Ionicons 
              name={verificationResult?.isValid ? "shield-checkmark" : "alert-circle"} 
              size={34} 
              color={verificationResult?.isValid ? "#10B981" : "#EF4444"} 
            />
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {verificationResult?.isValid ? "CRYPTOGRAPHIC SEAL SECURE" : "INTEGRITY COMPROMISED"}
            </Text>
            <Text style={{ fontSize: 10, color: theme.muted, textAlign: 'center', lineHeight: 14 }}>
              {verificationResult?.isValid 
                ? "SAHASRA's access ledger validated. All SHA-256 blocks chained and untampered."
                : "Warning! The cryptographic hash chain is broken!"}
            </Text>
          </View>

          {/* Overall stats */}
          <View style={[styles.verifyStatsBox, { backgroundColor: theme.inputBg, borderColor: theme.border, padding: 8, gap: 3 }]}>
            <View style={styles.statRow}>
              <Text style={{ fontSize: 9, color: theme.muted }}>Verified Blocks:</Text>
              <Text style={{ fontSize: 9, fontWeight: 'bold', color: theme.text }}>{verificationResult?.count || 0} Blocks</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={{ fontSize: 9, color: theme.muted }}>Genesis Hash:</Text>
              <Text style={{ fontSize: 8, fontFamily: 'monospace', color: '#10B981' }}>
                {verificationResult?.genesisHash ? `${verificationResult.genesisHash.slice(0, 16)}...` : 'N/A'}
              </Text>
            </View>
            <View style={styles.statRow}>
              <Text style={{ fontSize: 9, color: theme.muted }}>Chain Seal:</Text>
              <Text style={{ fontSize: 8, fontFamily: 'monospace', color: '#3B82F6' }}>
                {verificationResult?.latestHash ? `${verificationResult.latestHash.slice(0, 16)}...` : 'N/A'}
              </Text>
            </View>
          </View>

          {/* Block Explorer Scroll List */}
          <Text style={{ fontSize: 10, fontWeight: '800', color: theme.text, alignSelf: 'flex-start', marginTop: 4 }}>
            Ledger Blocks Blockchain Explorer
          </Text>

          <ScrollView 
            style={{ width: "100%", maxHeight: 220 }} 
            contentContainerStyle={{ gap: 8 }}
            showsVerticalScrollIndicator={true}
          >
            {auditLogs.map((log, index) => {
              const isSelected = selectedBlockIdx === index;

              return (
                <Pressable
                  key={log.id || index}
                  style={[
                    styles.blockItem,
                    { 
                      backgroundColor: theme.inputBg,
                      borderColor: isSelected ? "#10B981" : theme.border,
                      shadowColor: isSelected ? "#10B981" : "transparent"
                    }
                  ]}
                  onPress={() => setSelectedBlockIdx(isSelected ? null : index)}
                >
                  <View style={styles.blockHeader}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Ionicons name="cube-outline" size={14} color="#10B981" />
                      <Text style={[styles.blockIndex, { color: theme.text }]}>BLOCK #{auditLogs.length - index}</Text>
                    </View>
                    <View style={styles.blockStatusBadge}>
                      <Text style={styles.blockStatusText}>SECURE</Text>
                    </View>
                  </View>

                  <Text style={[styles.blockSummary, { color: theme.text }]}>
                    {log.userName} (Officer): {log.details}
                  </Text>

                  {isSelected && (
                    <View style={[styles.blockDetailsPane, { borderTopColor: theme.border }]}>
                      <View style={styles.blockDetailRow}>
                        <Text style={styles.blockDetailLabel}>Timestamp:</Text>
                        <Text style={[styles.blockDetailVal, { color: theme.text }]}>
                          {new Date(log.timestamp).toLocaleString()}
                        </Text>
                      </View>
                      <View style={styles.blockDetailRow}>
                        <Text style={styles.blockDetailLabel}>Lawful Basis:</Text>
                        <Text style={[styles.blockDetailVal, { color: "#10B981" }]}>
                          {log.dpdpSection || "Sec 7(i) State function"}
                        </Text>
                      </View>
                      <View style={styles.blockDetailRow}>
                        <Text style={styles.blockDetailLabel}>Purpose:</Text>
                        <Text style={[styles.blockDetailVal, { color: "#F59E0B" }]}>
                          {log.purpose || "Crime Prevention"}
                        </Text>
                      </View>
                      <Text style={[styles.blockDetailLabel, { marginTop: 2 }]}>Previous Hash SHA-256:</Text>
                      <Text style={styles.blockHashText}>{log.prevHash || "000000000000000000000"}</Text>
                      <Text style={[styles.blockDetailLabel, { marginTop: 2 }]}>Current Hash SHA-256:</Text>
                      <Text style={[styles.blockHashText, { color: "#10B981" }]}>{log.hash || "N/A"}</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>

          <Pressable 
            style={styles.closeModalBtn} 
            onPress={() => {
              setShowLedgerModal(false);
              setSelectedBlockIdx(null);
            }}
          >
            <Text style={styles.closeModalBtnText}>CLOSE EXPLORER</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  </View>
);
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0F1C" },
  content: { padding: 18, paddingBottom: 40 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18,
  },
  badgeBox: { gap: 2 },
  kspTag: { fontSize: 9, fontWeight: "900", color: "#8B5CF6", letterSpacing: 1 },
  officerName: { fontSize: 18, fontWeight: "800", color: "#F0F4FF" },
  badgeNo: { fontSize: 11, color: "#8892B0" },
  citizenSwitchBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#3B82F620",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#3B82F6",
  },
  citizenSwitchText: { fontSize: 10, fontWeight: "800", color: "#3B82F6" },
  alertBanner: {
    backgroundColor: "#EF444415",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EF4444",
    marginBottom: 20,
    gap: 8,
  },
  alertHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#EF4444" },
  alertTitle: { fontSize: 12, fontWeight: "900", color: "#EF4444", letterSpacing: 0.5, flex: 1 },
  alertTime: { fontSize: 10, color: "#8892B0" },
  alertBody: { fontSize: 12, color: "#F0F4FF", lineHeight: 17 },
  alertActionBtn: {
    backgroundColor: "#EF4444",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  alertActionText: { fontSize: 11, fontWeight: "900", color: "#FFFFFF" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 },
  statCard: {
    width: "48%",
    backgroundColor: "#141A2E",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#1F2A44",
    gap: 4,
  },
  statNumber: { fontSize: 20, fontWeight: "900", color: "#F0F4FF", marginTop: 4 },
  statLabel: { fontSize: 11, color: "#8892B0" },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#F0F4FF" },
  seeAllText: { fontSize: 11, fontWeight: "700", color: "#8B5CF6" },
  anprCard: {
    backgroundColor: "#141A2E",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EF444460",
    marginBottom: 20,
    gap: 10,
  },
  anprHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  anprTag: { backgroundColor: "#EF444420", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  anprTagText: { fontSize: 10, fontWeight: "900", color: "#EF4444" },
  anprTime: { fontSize: 10, color: "#8892B0" },
  anprBody: { flexDirection: "row", alignItems: "center", gap: 12 },
  anprPlate: { fontSize: 14, fontWeight: "800", color: "#F0F4FF" },
  anprCamera: { fontSize: 11, color: "#8892B0" },
  anprSuspect: { fontSize: 11, color: "#F59E0B", fontWeight: "700", marginTop: 2 },
  anprFooter: { flexDirection: "row", alignItems: "center", gap: 6, paddingTop: 8, borderTopWidth: 1, borderColor: "#1F2A44" },
  anprFooterText: { fontSize: 10, color: "#8892B0" },
  moduleGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  moduleCard: {
    width: "48%",
    backgroundColor: "#141A2E",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#1F2A44",
    gap: 6,
  },
  moduleIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  moduleTitle: { fontSize: 13, fontWeight: "700", color: "#F0F4FF" },
  moduleDesc: { fontSize: 10, color: "#8892B0", lineHeight: 14 },
  auditSection: { gap: 8, marginTop: 18 },
  auditLogsBox: { padding: 12, borderRadius: 16, borderWidth: 1, gap: 6 },
  auditLogLine: { fontSize: 9, color: "#8892B0", fontFamily: "monospace", lineHeight: 13 },
  auditEntryItem: { paddingVertical: 8, gap: 2 },
  
  verifyLedgerBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#10B98115", borderWidth: 1, borderColor: "#10B98144", paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8 },
  verifyLedgerText: { fontSize: 8, color: "#10B981", fontWeight: "900" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(6,9,19,0.85)", justifyContent: "center", alignItems: "center", padding: 20 },
  modalContentExtended: { width: "100%", maxWidth: 440, borderRadius: 24, borderWidth: 1, padding: 18, gap: 12, alignItems: "center" },
  modalTitle: { fontSize: 13, fontWeight: "900", letterSpacing: 0.5, textAlign: "center" },
  verifyStatsBox: { width: "100%", borderRadius: 12, borderWidth: 1, padding: 10, gap: 4 },
  statRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  closeModalBtn: { width: "100%", backgroundColor: "#3B82F6", padding: 10, borderRadius: 10, alignItems: "center", marginTop: 4 },
  closeModalBtnText: { fontSize: 10, fontWeight: "800", color: "#FFFFFF" },

  blockItem: {
    width: "100%",
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    gap: 3,
  },
  blockHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  blockIndex: {
    fontSize: 10,
    fontWeight: "800",
  },
  blockStatusBadge: {
    backgroundColor: "#10B98120",
    borderWidth: 1,
    borderColor: "#10B98188",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  blockStatusText: {
    fontSize: 8,
    fontWeight: "900",
    color: "#10B981",
  },
  blockSummary: {
    fontSize: 9,
    lineHeight: 12,
  },
  blockDetailsPane: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    gap: 4,
  },
  blockDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  blockDetailLabel: {
    fontSize: 8,
    color: "#8892B0",
    fontWeight: "600",
  },
  blockDetailVal: {
    fontSize: 8,
    fontWeight: "700",
  },
  blockHashText: {
    fontSize: 7.5,
    fontFamily: "monospace",
    color: "#8892B0",
    backgroundColor: "rgba(0,0,0,0.15)",
    padding: 3,
    borderRadius: 4,
  },
});
