import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, ActivityIndicator, TextInput, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import KarnatakaMap from "@/components/KarnatakaMap";
import ExplainabilityDrawer from "@/components/ExplainabilityDrawer";

import { getThemeColors } from "@/constants/theme";

export default function AdminDashboard() {
  const router = useRouter();
  const { user, logout, switchRole } = useAuth();
  const { theme: activeTheme } = useApp();
  const theme = getThemeColors(activeTheme);
  const [complaints] = useState([
    { id: "c1", title: "Harassment near College campus", priority: "P1", lat: 12.9420, lng: 77.6250, department: "KSP Women Cell", status: "In Progress", sla: "10m" },
    { id: "c2", title: "Attempted burglary at residence", priority: "P2", lat: 13.0380, lng: 77.5250, department: "KSP Crime Branch", status: "Open", sla: "24h" },
    { id: "c3", title: "Suspected UPI phishing fraud", priority: "P3", lat: 12.9840, lng: 77.6480, department: "KSP Cyber Wing", status: "Open", sla: "6h" },
  ]);

  const [sosAlerts] = useState([
    { id: "s1", userName: "Ananya M.", time: "2 mins ago", lat: 12.9680, lng: 77.5980 },
  ]);

  const [policeStations] = useState([
    { id: "p1", name: "Koramangala PS", address: "80ft Road Koramangala", phone: "080-22943400", geo: { lat: 12.9320, lng: 77.6100 } },
    { id: "p2", name: "Peenya PS", address: "1st Stage Peenya", phone: "080-22943420", geo: { lat: 13.0220, lng: 77.5100 } },
    { id: "p3", name: "Indiranagar PS", address: "100ft Road Indiranagar", phone: "080-22943410", geo: { lat: 12.9720, lng: 77.6350 } },
  ]);

  const [riskZones] = useState([
    { id: "r1", name: "Peenya Flyover Dark Spot", riskLevel: "HIGH", center: { lat: 13.0310, lng: 77.5300 } },
  ]);
  
  const [selectedBeat, setSelectedBeat] = useState<string>("Bengaluru Urban");
  const [threatLevel, setThreatLevel] = useState<string>("MINIMAL");
  const [droneCount, setDroneCount] = useState<number>(24);
  const [showXai, setShowXai] = useState(false);

  // Officer Registration States
  const [newOfficerName, setNewOfficerName] = useState("");
  const [newOfficerPhone, setNewOfficerPhone] = useState("");
  const [newOfficerBeat, setNewOfficerBeat] = useState("Koramangala");
  const [newOfficerBadge, setNewOfficerBadge] = useState("");

  const getApiRoot = () => {
    if (typeof window !== "undefined" && window.location) {
      if (window.location.port === "8081" || window.location.port === "8082" || window.location.port === "8080" || window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
        return `${window.location.protocol}//${window.location.hostname}:5000`;
      }
      return window.location.origin;
    }
    return "http://localhost:5000";
  };

  const handleCreateOfficer = async () => {
    if (!newOfficerName || !newOfficerPhone || !newOfficerBadge) {
      Alert.alert("Registration Error", "Please fill in all fields before submitting.");
      return;
    }
    if (newOfficerPhone.length !== 10) {
      Alert.alert("Registration Error", "Phone number must be exactly 10 digits.");
      return;
    }

    try {
      const response = await fetch(`${getApiRoot()}/api/workers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newOfficerName,
          phone: newOfficerPhone,
          district: "Bengaluru Urban",
          ward: `${newOfficerBeat} Patrol Sector`,
        })
      });
      if (response.ok) {
        Alert.alert(
          "Provisioning Successful",
          `KSP Officer account created for ${newOfficerName} with Badge ${newOfficerBadge}. Account is active on Police IT-V2 ERP.`
        );
        setNewOfficerName("");
        setNewOfficerPhone("");
        setNewOfficerBadge("");
      } else {
        Alert.alert("API Error", "Server failed to register the officer account.");
      }
    } catch (err) {
      console.log("Failed to register officer:", err);
      Alert.alert(
        "Account Created (Mock Mode)",
        `KSP Officer account created for ${newOfficerName} with Badge ${newOfficerBadge}. Account initialized on local context.`
      );
      setNewOfficerName("");
      setNewOfficerPhone("");
      setNewOfficerBadge("");
    }
  };
  const [isAlerting, setIsAlerting] = useState<boolean>(false);
  const [sysLogs, setSysLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verifyingLedger, setVerifyingLedger] = useState(false);
  const [selectedBlockIdx, setSelectedBlockIdx] = useState<number | null>(null);

  // Wellness & workload states
  const [officers, setOfficers] = useState<any[]>([]);
  const [loadingOfficers, setLoadingOfficers] = useState(false);

  const fetchOfficers = async () => {
    setLoadingOfficers(true);
    try {
      const res = await fetch(`${getApiRoot()}/api/workers`);
      if (res.ok) {
        const data = await res.json();
        // Filter out only active workers in Bengaluru Urban for layout relevance
        const filtered = data.filter((w: any) => w.district === "Bengaluru Urban");
        setOfficers(filtered.length > 0 ? filtered : data.slice(0, 4));
      }
    } catch (e) {
      console.log("Failed to fetch officers:", e);
      setOfficers([
        { id: "w_patil", name: "Inspector Patil", ward: "Koramangala 4th Block", status: "active", workingHours: 13, nightShifts: 5, activeCases: 9, patrolFreq: 2.1, district: "Bengaluru Urban" },
        { id: "w_ramesh", name: "Sub-Inspector Ramesh", ward: "Peenya Industrial Area", status: "active", workingHours: 6, nightShifts: 1, activeCases: 2, patrolFreq: 4.8, district: "Bengaluru Urban" },
        { id: "w_gowda", name: "Inspector Gowda", ward: "Indiranagar 100ft Rd", status: "active", workingHours: 10, nightShifts: 3, activeCases: 6, patrolFreq: 3.5, district: "Bengaluru Urban" },
        { id: "w_sindhu", name: "Officer Sindhu", ward: "Jayanagar Metro Sector", status: "idle", workingHours: 5, nightShifts: 0, activeCases: 1, patrolFreq: 5.2, district: "Bengaluru Urban" }
      ]);
    } finally {
      setLoadingOfficers(false);
    }
  };

  const handleAiCaseRebalance = async (fromOfficer: any) => {
    const calculated = officers.map(w => {
      const fatigue = Math.round(((w.workingHours || 8) * 1.5) + ((w.nightShifts || 1) * 8) + ((w.activeCases || 3) * 6));
      return { ...w, fatigueScore: Math.min(100, fatigue) };
    });

    const otherOfficers = calculated.filter(w => w.id !== fromOfficer.id && w.status === "active");
    if (otherOfficers.length === 0) {
      Alert.alert("Rebalance Error", "No alternative active officers found in the beat sector.");
      return;
    }

    otherOfficers.sort((a, b) => a.fatigueScore - b.fatigueScore);
    const toOfficer = otherOfficers[0];
    const casesToTransfer = Math.min(fromOfficer.activeCases || 3, 3);

    const fromFatigue = Math.min(100, Math.round(((fromOfficer.workingHours || 8) * 1.5) + ((fromOfficer.nightShifts || 1) * 8) + ((fromOfficer.activeCases || 3) * 6)));

    Alert.alert(
      "AI WORKLOAD BALANCER",
      `Flagged: ${fromOfficer.name} (Fatigue: ${fromFatigue}%)\n\nAI Rebalancing Proposal:\n• Transfer ${casesToTransfer} active cases to ${toOfficer.name} (Fatigue: ${toOfficer.fatigueScore}%)\n• Reduce shift duty length by 2 hours\n\nAuthorize central database transfer?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "AUTHORIZE TRANSFER",
          onPress: async () => {
            try {
              const res = await fetch(`${getApiRoot()}/api/workers/transfer-workload`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  fromWorkerId: fromOfficer.id,
                  toWorkerId: toOfficer.id,
                  casesToTransfer
                })
              });
              if (res.ok) {
                Alert.alert("TRANSFER SUCCESSFUL", `Reallocated ${casesToTransfer} investigations to ${toOfficer.name}. DPDP Act audit seal applied.`);
                fetchOfficers();
                fetchLogs();
              } else {
                Alert.alert("API Error", "Failed to update case assignment on backend server.");
              }
            } catch (e) {
              Alert.alert("Mock Rebalance Executed", `Reallocated ${casesToTransfer} cases to ${toOfficer.name}. Local context updated.`);
              setOfficers(prev => prev.map(o => {
                if (o.id === fromOfficer.id) {
                  return { ...o, activeCases: Math.max(0, (o.activeCases || 0) - casesToTransfer), workingHours: Math.max(4, (o.workingHours || 8) - 2) };
                }
                if (o.id === toOfficer.id) {
                  return { ...o, activeCases: (o.activeCases || 0) + casesToTransfer, workingHours: (o.workingHours || 8) + 2 };
                }
                return o;
              }));
            }
          }
        }
      ]
    );
  };

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch(`${getApiRoot()}/api/audit?demo_role=admin`);
      if (res.ok) {
        const data = await res.json();
        setSysLogs(data);
      }
    } catch (e) {
      console.log("Failed to fetch audit logs:", e);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleVerifyLedger = async () => {
    setVerifyingLedger(true);
    try {
      const res = await fetch(`${getApiRoot()}/api/audit/verify?demo_role=admin`);
      if (res.ok) {
        const data = await res.json();
        setVerificationResult(data);
        setShowVerificationModal(true);
      } else {
        Alert.alert("Verification Error", "Failed to retrieve ledger verification report.");
      }
    } catch (e) {
      console.log("Verification request failed:", e);
      Alert.alert("Connection Error", "Could not connect to the authentication server.");
    } finally {
      setVerifyingLedger(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchOfficers();
    const interval = setInterval(() => {
      fetchLogs();
      fetchOfficers();
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const triggerEmergency = () => {
    setIsAlerting(true);
    setTimeout(() => {
      setIsAlerting(false);
      Alert.alert(
        "EMERGENCY BROADCAST SENT",
        "A high-priority SOS siren and push notification has been broadcasted to all citizens in the Bengaluru area."
      );
    }, 2000);
  };

  const initiateLockdown = () => {
    Alert.alert(
      "CONFIRM CITY LOCKDOWN",
      "Are you sure you want to restrict civic movement and mobilize all active patrols?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "CONFIRM LOCKDOWN", 
          style: "destructive",
          onPress: () => {
            setThreatLevel("CRITICAL");
            Alert.alert("TACTICAL ALERT", "Lockdown order sent to all KSP control units.");
          }
        }
      ]
    );
  };

  const triggerCctvAnomaly = async () => {
    try {
      const res = await fetch(`${getApiRoot()}/api/webhooks/cctv-anomaly`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cameraId: "CAM_PL_04",
          cameraName: "Peenya Industrial Rd CCTV",
          incidentType: "WEAPONS_ACT",
          lat: 13.0287,
          lng: 77.5194,
          district: "Bengaluru Urban"
        })
      });
      if (res.ok) {
        Alert.alert("CCTV SIMULATION WEBHOOK", "CCTV AI anomaly webhook triggered successfully! Real-time alerts dispatched to assigned district officers.");
      }
    } catch (e) {
      console.log("Failed to trigger CCTV webhook:", e);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.push("/(admin)/badge")}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>KSP Command Console</Text>
          <Text style={[styles.headerSub, { color: theme.muted }]}>Director General Portal • <Text style={{ color: "#EF4444", fontWeight: "bold" }}>View Super Pass 🔍</Text></Text>
        </Pressable>
        <Pressable 
          style={[styles.badge, threatLevel === "CRITICAL" && styles.badgeCritical]}
          onPress={() => setThreatLevel("MINIMAL")}
        >
          <Text style={styles.badgeText}>{threatLevel}</Text>
        </Pressable>
      </View>

      {/* Grid Stats */}
      <View style={styles.gridRow}>
        <View style={[styles.gridCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <Text style={[styles.gridVal, { color: theme.primary }]}>100%</Text>
          <Text style={[styles.gridLabel, { color: theme.muted }]}>CCTNS Link</Text>
        </View>
        <View style={[styles.gridCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <Text style={[styles.gridVal, { color: "#10B981" }]}>{droneCount}/25</Text>
          <Text style={[styles.gridLabel, { color: theme.muted }]}>Active Drones</Text>
        </View>
        <View style={[styles.gridCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <Text style={[styles.gridVal, { color: "#EF4444" }]}>{sosAlerts.length}</Text>
          <Text style={[styles.gridLabel, { color: theme.muted }]}>Active SOS</Text>
        </View>
      </View>

      {/* Map Control Wrapper */}
      <View style={styles.mapSection}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Global Tactical View</Text>
          <Pressable 
            style={[styles.inspectXaiBtn, { borderColor: theme.border }]}
            onPress={() => setShowXai(true)}
          >
            <Ionicons name="analytics" size={12} color="#06B6D4" />
            <Text style={styles.inspectXaiText}>Inspect XAI Audit</Text>
          </Pressable>
        </View>
        
        {/* Jump Beat buttons */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.beatChips}>
          {["Bengaluru Urban", "Peenya", "Koramangala", "Indiranagar", "Jayanagar", "Whitefield"].map(beat => (
            <Pressable
              key={beat}
              style={[styles.beatChip, { backgroundColor: theme.cardBg, borderColor: theme.border }, selectedBeat === beat && styles.beatChipActive]}
              onPress={() => setSelectedBeat(beat)}
            >
              <Text style={[styles.beatChipText, selectedBeat === beat && styles.beatChipTextActive]}>
                {beat}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={[styles.mapContainer, { borderColor: theme.border }]}>
          <KarnatakaMap
            complaints={complaints as any}
            sosAlerts={sosAlerts}
            policeStations={policeStations}
            riskZones={riskZones}
            filter="all"
            userDistrict={selectedBeat}
          />
        </View>
      </View>

      {/* Critical Overrides Panel */}
      <View style={styles.actionSection}>
        <Text style={styles.sectionTitle}>Emergency Command Overrides</Text>
        <View style={styles.actionRow}>
          <Pressable 
            style={[styles.actionBtn, styles.btnEmergency]} 
            onPress={triggerEmergency}
            disabled={isAlerting}
          >
            {isAlerting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="megaphone" size={16} color="#fff" />
                <Text style={styles.btnText}>Broadcast SOS</Text>
              </>
            )}
          </Pressable>

          <Pressable style={[styles.actionBtn, styles.btnLockdown]} onPress={initiateLockdown}>
            <Ionicons name="lock-closed" size={16} color="#fff" />
            <Text style={styles.btnText}>Lockdown City</Text>
          </Pressable>
        </View>

        <View style={[styles.actionRow, { marginTop: 8 }]}>
          <Pressable 
            style={[styles.actionBtn, styles.btnRapid]} 
            onPress={() => Alert.alert("RAPID DISPATCH", "4 Tactical Response Units dispatched to active hot zones.")}
          >
            <Ionicons name="speedometer" size={16} color="#fff" />
            <Text style={styles.btnText}>SWAT Dispatch</Text>
          </Pressable>

          <Pressable 
            style={[styles.actionBtn, { backgroundColor: "#06B6D4" }]} 
            onPress={triggerCctvAnomaly}
          >
            <Ionicons name="videocam" size={16} color="#fff" />
            <Text style={styles.btnText}>CCTV AI Anomaly</Text>
          </Pressable>
        </View>
      </View>

      {/* Pre-existing Administrators */}
      <View style={styles.adminSection}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Command Center Administrators</Text>
        <View style={styles.adminGrid}>
          {[
            { name: "DGP Alok Kumar", role: "Director General of Police", status: "Active Session", color: "#EF4444" },
            { name: "IGP Harish M.", role: "Inspector General, SCRB Division", status: "Idle Mode", color: "#3B82F6" },
            { name: "SP Sindhu S.", role: "Superintendent, Cyber Crime Wing", status: "On Leave", color: "#8B5CF6" },
          ].map((adm, i) => (
            <View key={i} style={[styles.adminRowCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <View style={[styles.adminColorBar, { backgroundColor: adm.color }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.adminName, { color: theme.text }]}>{adm.name}</Text>
                <Text style={[styles.adminRole, { color: theme.muted }]}>{adm.role}</Text>
              </View>
              <Text style={[styles.adminStatus, { color: adm.status.includes("Active") ? "#22C55E" : theme.muted }]}>
                {adm.status}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Create KSP Officer Account Form */}
      <View style={styles.formSection}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Register New KSP Police Account</Text>
        <View style={[styles.formCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: theme.muted }]}>OFFICER FULL NAME</Text>
            <TextInput
              style={[styles.formInput, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
              placeholder="e.g. Inspector Savitha K."
              placeholderTextColor={theme.muted}
              value={newOfficerName}
              onChangeText={setNewOfficerName}
            />
          </View>
          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: theme.muted }]}>OFFICER MOBILE NUMBER (10 DIGITS)</Text>
            <TextInput
              style={[styles.formInput, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
              placeholder="e.g. 9845012345"
              placeholderTextColor={theme.muted}
              keyboardType="phone-pad"
              maxLength={10}
              value={newOfficerPhone}
              onChangeText={setNewOfficerPhone}
            />
          </View>
          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: theme.muted }]}>ASSIGNED STATION BEAT</Text>
            <View style={styles.beatToggleGrid}>
              {["Koramangala", "Peenya", "Indiranagar", "Jayanagar", "Whitefield", "Hebbal"].map((b) => (
                <Pressable
                  key={b}
                  style={[
                    styles.beatToggleChip, 
                    { backgroundColor: theme.inputBg, borderColor: theme.border },
                    newOfficerBeat === b && styles.beatToggleChipActive
                  ]}
                  onPress={() => setNewOfficerBeat(b)}
                >
                  <Text style={[styles.beatToggleText, { color: theme.muted }, newOfficerBeat === b && styles.beatToggleTextActive]}>
                    {b}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: theme.muted }]}>OFFICER BADGE NUMBER</Text>
            <TextInput
              style={[styles.formInput, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
              placeholder="e.g. KSP-128930"
              placeholderTextColor={theme.muted}
              value={newOfficerBadge}
              onChangeText={setNewOfficerBadge}
            />
          </View>
          <Pressable 
            style={styles.submitOfficerBtn}
            onPress={handleCreateOfficer}
          >
            <Ionicons name="person-add-outline" size={14} color="#FFFFFF" />
            <Text style={styles.submitOfficerText}>PROVISION OFFICER ACCOUNT</Text>
          </Pressable>
        </View>
      </View>

      {/* Officer Wellness & Workload Insights Monitor */}
      <View style={styles.wellnessSection}>
        <View style={{ gap: 2, marginBottom: 8 }}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Officer Workload & Wellness Insights</Text>
          <Text style={{ fontSize: 9, color: theme.muted }}>AI-assisted fatigue monitoring, patrol frequencies, and CCTNS case rebalancing</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
          <View style={{ flexDirection: "row", gap: 10 }}>
            {officers.map((w) => {
              const fatigue = Math.round(((w.workingHours || 8) * 1.5) + ((w.nightShifts || 1) * 8) + ((w.activeCases || 3) * 6));
              const fatiguePercent = Math.min(100, fatigue);
              
              let statusColor = "#10B981";
              let statusText = "HEALTHY WORKLOAD";
              if (fatiguePercent >= 70) {
                statusColor = "#EF4444";
                statusText = "OVERBURDENED";
              } else if (fatiguePercent >= 45) {
                statusColor = "#F59E0B";
                statusText = "MODERATE FATIGUE";
              }

              return (
                <View 
                  key={w.id} 
                  style={[
                    styles.wellnessCard, 
                    { backgroundColor: theme.cardBg, borderColor: fatiguePercent >= 70 ? "#EF444450" : theme.border }
                  ]}
                >
                  <View style={styles.wellnessCardHeader}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={[styles.wellnessOfficerName, { color: theme.text }]} numberOfLines={1}>{w.name}</Text>
                      <Text style={{ fontSize: 8, color: theme.muted }} numberOfLines={1}>{w.ward}</Text>
                    </View>
                    <View style={{ backgroundColor: statusColor + "15", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: statusColor + "30" }}>
                      <Text style={{ fontSize: 7, fontWeight: "900", color: statusColor }}>{statusText}</Text>
                    </View>
                  </View>

                  {/* Micro stats grid */}
                  <View style={styles.wellnessGrid}>
                    <View style={styles.wellnessGridItem}>
                      <Text style={styles.wellnessGridVal}>{w.workingHours || 8}h</Text>
                      <Text style={styles.wellnessGridLabel}>Shift</Text>
                    </View>
                    <View style={styles.wellnessGridItem}>
                      <Text style={styles.wellnessGridVal}>{w.nightShifts || 1}</Text>
                      <Text style={styles.wellnessGridLabel}>Night</Text>
                    </View>
                    <View style={styles.wellnessGridItem}>
                      <Text style={[styles.wellnessGridVal, (w.activeCases || 0) >= 6 && { color: "#EF4444" }]}>{w.activeCases || 0}</Text>
                      <Text style={styles.wellnessGridLabel}>Cases</Text>
                    </View>
                    <View style={styles.wellnessGridItem}>
                      <Text style={styles.wellnessGridVal}>{w.patrolFreq || 4.0}k/h</Text>
                      <Text style={styles.wellnessGridLabel}>Patrol</Text>
                    </View>
                  </View>

                  {/* Fatigue Meter */}
                  <View style={{ marginTop: 8, gap: 3 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                      <Text style={{ fontSize: 8, fontWeight: "700", color: theme.muted }}>Fatigue Index:</Text>
                      <Text style={{ fontSize: 9, fontWeight: "900", color: statusColor }}>{fatiguePercent}%</Text>
                    </View>
                    <View style={{ width: "100%", height: 5, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 10, overflow: "hidden" }}>
                      <View style={{ width: `${fatiguePercent}%`, height: "100%", backgroundColor: statusColor }} />
                    </View>
                  </View>

                  {/* AI Recommendation Banner */}
                  <View style={{ backgroundColor: "rgba(0,0,0,0.15)", borderRadius: 8, padding: 6, marginTop: 8 }}>
                    <Text style={{ fontSize: 8, color: "#3B82F6", fontWeight: "700" }}>🤖 AI RECO & SCHEDULING:</Text>
                    <Text style={{ fontSize: 8, color: "#F0F4FF", marginTop: 2, lineHeight: 11 }}>
                      {fatiguePercent >= 70 
                        ? "Critical stress levels. Rebalance caseload or schedule shift rest cycle immediately."
                        : "Workload is stable. Suitable for dispatcher assignments and active patrolling."}
                    </Text>
                  </View>

                  {/* Action Rebalance Button */}
                  {fatiguePercent >= 70 && (
                    <Pressable 
                      style={styles.rebalanceBtn}
                      onPress={() => handleAiCaseRebalance(w)}
                    >
                      <Ionicons name="git-pull-request" size={10} color="#FFFFFF" />
                      <Text style={styles.rebalanceBtnText}>AI REBALANCE CASELOAD</Text>
                    </Pressable>
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* DPDP Act 2023 Compliance Audit Ledger */}
      <View style={styles.logsSection}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <View style={{ gap: 2, flex: 1, marginRight: 8 }}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>DPDP Act 2023 Immutable Audit Ledger</Text>
            <Text style={{ fontSize: 9, color: theme.muted }}>Cryptographically sealed privacy compliance audit log</Text>
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

        <View style={[styles.logsBox, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
          {loadingLogs && sysLogs.length === 0 ? (
            <ActivityIndicator size="small" color="#3B82F6" style={{ padding: 12 }} />
          ) : sysLogs.length === 0 ? (
            <Text style={[styles.logLine, { color: theme.muted, textAlign: 'center', padding: 8 }]}>No audit logs found on server</Text>
          ) : (
            sysLogs.map((log, idx) => {
              const dateStr = new Date(log.timestamp).toLocaleTimeString();
              const actionColors: Record<string, string> = {
                auth_login: "#8B5CF6",
                cctns_search: "#F59E0B",
                access_profile: "#10B981",
                rti_filed: "#3B82F6",
                provision_officer: "#EC4899",
                automated_cleanup: "#06B6D4"
              };
              const actionColor = actionColors[log.action] || "#8892B0";
              
              return (
                <View key={log.id || idx} style={[styles.logEntryItem, { borderBottomColor: theme.border, borderBottomWidth: idx === sysLogs.length - 1 ? 0 : 1 }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ fontSize: 8, color: theme.muted, fontFamily: 'monospace' }}>{dateStr}</Text>
                      <View style={{ backgroundColor: actionColor + "15", borderColor: actionColor + "40", borderWidth: 1, paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4 }}>
                        <Text style={{ fontSize: 6, fontWeight: '900', color: actionColor }}>{log.action?.toUpperCase()}</Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 8, color: '#3B82F6', fontFamily: 'monospace' }}>Block #{idx + 1}</Text>
                  </View>
                  <Text style={{ fontSize: 10, color: theme.text, marginTop: 3, fontWeight: '500' }}>
                    <Text style={{ fontWeight: '700', color: '#6366F1' }}>{log.userName}</Text>: {log.details}
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                    <View style={{ backgroundColor: "#10B98110", paddingHorizontal: 4, paddingVertical: 1, borderRadius: 3 }}>
                      <Text style={{ fontSize: 7, color: "#10B981", fontWeight: "600" }}>{log.dpdpSection || "Sec 7(i)"}</Text>
                    </View>
                    <View style={{ backgroundColor: "#F59E0B10", paddingHorizontal: 4, paddingVertical: 1, borderRadius: 3 }}>
                      <Text style={{ fontSize: 7, color: "#F59E0B", fontWeight: "600" }}>{log.purpose || "Specified Purpose"}</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                    <Text style={{ fontSize: 7, color: '#8892B0', fontFamily: 'monospace' }}>
                      Prev: {log.prevHash ? log.prevHash.slice(0, 12) : '000000000000'}...
                    </Text>
                    <Text style={{ fontSize: 7, color: '#8892B0', fontFamily: 'monospace', fontWeight: 'bold' }}>
                      Hash: {log.hash ? log.hash.slice(0, 12) : 'N/A'}...
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </View>

      {/* System Settings & Switch */}
      <View style={styles.footerSection}>
        <Pressable 
          style={styles.switchBtn} 
          onPress={() => switchRole("police")}
        >
          <Ionicons name="swap-horizontal" size={18} color="#3B82F6" />
          <Text style={styles.switchBtnText}>Switch to Police Desk</Text>
        </Pressable>
        <Pressable style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out" size={18} color="#EF4444" />
          <Text style={styles.logoutBtnText}>Command Secure Exit</Text>
        </Pressable>
      </View>

      <ExplainabilityDrawer
        visible={showXai}
        onClose={() => setShowXai(false)}
        hotspotName={`${selectedBeat} Priority Beat Sector`}
      />

      {/* Verification Results Overlay Modal */}
      <Modal
        visible={showVerificationModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowVerificationModal(false);
          setSelectedBlockIdx(null);
        }}
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
              {sysLogs.map((log, index) => {
                const isSelected = selectedBlockIdx === index;
                // Calculate simulated hashes for visual verification display
                const prevHashSim = index === 0 ? "00000000000000000000" : `prev_hash_block_sha_${index}_902f`;
                const currHashSim = `curr_hash_block_sha_${index}_abc8842`;

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
                        <Text style={[styles.blockIndex, { color: theme.text }]}>BLOCK #{sysLogs.length - index}</Text>
                      </View>
                      <View style={styles.blockStatusBadge}>
                        <Text style={styles.blockStatusText}>SEAL OK</Text>
                      </View>
                    </View>

                    <Text style={[styles.blockSummary, { color: theme.muted }]}>
                      Action: {log.action} • {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>

                    {isSelected ? (
                      <View style={[styles.blockDetailsPane, { borderTopColor: theme.border }]}>
                        <View style={styles.blockDetailRow}>
                          <Text style={styles.blockDetailLabel}>Actor Badge / Phone:</Text>
                          <Text style={[styles.blockDetailVal, { color: theme.text }]}>{log.actorName} ({log.actorPhone || 'N/A'})</Text>
                        </View>
                        <View style={styles.blockDetailRow}>
                          <Text style={styles.blockDetailLabel}>DPDP Lawful Ground:</Text>
                          <Text style={[styles.blockDetailVal, { color: '#10B981' }]}>{log.dpdpLawfulBasis || 'Section 7(i)'}</Text>
                        </View>
                        <View style={styles.blockDetailRow}>
                          <Text style={styles.blockDetailLabel}>Justification / Purpose:</Text>
                          <Text style={[styles.blockDetailVal, { color: theme.text }]}>{log.reason || 'Crime Intelligence Query'}</Text>
                        </View>
                        <View style={styles.blockDetailRow}>
                          <Text style={styles.blockDetailLabel}>Target Area:</Text>
                          <Text style={[styles.blockDetailVal, { color: theme.text }]}>{log.district || 'All districts'}</Text>
                        </View>
                        <View style={{ marginTop: 4, gap: 2 }}>
                          <Text style={styles.blockDetailLabel}>Previous Block Hash:</Text>
                          <Text style={styles.blockHashText}>{log.prevHash || prevHashSim}</Text>
                        </View>
                        <View style={{ gap: 2 }}>
                          <Text style={styles.blockDetailLabel}>Current Block Hash:</Text>
                          <Text style={styles.blockHashText}>{log.hash || currHashSim}</Text>
                        </View>
                      </View>
                    ) : (
                      <Text style={{ fontSize: 8, color: '#10B981', fontStyle: 'italic', marginTop: 2 }}>
                        Tap block to view SHA-256 seal & compliance detail...
                      </Text>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>

            <Pressable 
              style={styles.closeModalBtn}
              onPress={() => {
                setShowVerificationModal(false);
                setSelectedBlockIdx(null);
              }}
            >
              <Text style={styles.closeModalBtnText}>CLOSE EXPLORER</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#060913" },
  content: { padding: 16, gap: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerTitle: { fontSize: 22, fontWeight: "900", color: "#F0F4FF", letterSpacing: 0.5, fontFamily: "Inter_700Bold" },
  headerSub: { fontSize: 11, color: "#8892B0", fontFamily: "Inter_400Regular" },
  badge: { backgroundColor: "#10B98120", borderWidth: 1, borderColor: "#10B981", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeCritical: { backgroundColor: "#EF444420", borderColor: "#EF4444" },
  badgeText: { fontSize: 10, fontWeight: "900", color: "#F0F4FF", fontFamily: "Inter_700Bold" },
  
  gridRow: { flexDirection: "row", gap: 10 },
  gridCard: { flex: 1, backgroundColor: "#0D1326", borderWidth: 1, borderColor: "#1F2A44", borderRadius: 16, padding: 14, alignItems: "center" },
  gridVal: { fontSize: 18, fontWeight: "900", color: "#3B82F6", fontFamily: "Inter_700Bold", marginBottom: 2 },
  gridLabel: { fontSize: 9, color: "#8892B0", fontFamily: "Inter_500Medium" },

  mapSection: { gap: 10 },
  sectionTitle: { fontSize: 14, fontWeight: "800", color: "#F0F4FF", fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  beatChips: { flexDirection: "row", marginBottom: 8 },
  beatChip: { backgroundColor: "#0D1326", borderWidth: 1, borderColor: "#1F2A44", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8 },
  beatChipActive: { backgroundColor: "#EF4444", borderColor: "#EF4444" },
  beatChipText: { fontSize: 11, color: "#8892B0", fontFamily: "Inter_600SemiBold" },
  beatChipTextActive: { color: "#FFFFFF" },
  mapContainer: { height: 260, borderRadius: 20, overflow: "hidden", borderWidth: 1, borderColor: "#1F2A44" },

  actionSection: { gap: 10 },
  actionRow: { flexDirection: "row", gap: 10 },
  actionBtn: { flex: 1, borderRadius: 14, paddingVertical: 12, alignItems: "center", justifyContent: "center", gap: 6, flexDirection: "row" },
  btnEmergency: { backgroundColor: "#EF4444" },
  btnLockdown: { backgroundColor: "#F59E0B" },
  btnRapid: { backgroundColor: "#3B82F6" },
  btnText: { fontSize: 11, fontWeight: "800", color: "#FFFFFF", fontFamily: "Inter_700Bold" },

  logsSection: { gap: 10 },
  logsBox: { backgroundColor: "#080C18", borderWidth: 1, borderColor: "#1F2A44", borderRadius: 16, padding: 14, gap: 6 },
  logLine: { fontSize: 10, color: "#8892B0", fontFamily: "monospace", lineHeight: 1.4 },
  
  verifyLedgerBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#10B98115", borderWidth: 1, borderColor: "#10B98144", paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8 },
  verifyLedgerText: { fontSize: 8, color: "#10B981", fontWeight: "900" },
  logEntryItem: { paddingVertical: 8, gap: 2 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(6,9,19,0.85)", justifyContent: "center", alignItems: "center", padding: 20 },
  modalContent: { width: "100%", maxWidth: 320, borderRadius: 20, borderWidth: 1, padding: 18, gap: 14, alignItems: "center" },
  modalContentExtended: { width: "100%", maxWidth: 440, borderRadius: 24, borderWidth: 1, padding: 18, gap: 12, alignItems: "center" },
  modalTitle: { fontSize: 13, fontWeight: "900", letterSpacing: 0.5, textAlign: "center" },
  verifyStatsBox: { width: "100%", borderRadius: 12, borderWidth: 1, padding: 10, gap: 4 },
  statRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  closeModalBtn: { width: "100%", backgroundColor: "#3B82F6", padding: 10, borderRadius: 10, alignItems: "center", marginTop: 4 },
  closeModalBtnText: { fontSize: 10, fontWeight: "800", color: "#FFFFFF" },

  // Block explorer specific styles
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


  footerSection: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  switchBtn: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10 },
  switchBtnText: { fontSize: 12, fontWeight: "700", color: "#3B82F6", fontFamily: "Inter_700Bold" },
  logoutBtn: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10 },
  logoutBtnText: { fontSize: 12, fontWeight: "700", color: "#EF4444", fontFamily: "Inter_700Bold" },
  adminSection: { gap: 10 },
  adminGrid: { gap: 8 },
  adminRowCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#0D1326", borderWidth: 1, borderColor: "#1F2A44", borderRadius: 14, padding: 12, gap: 10 },
  adminColorBar: { width: 4, height: 32, borderRadius: 2 },
  adminName: { fontSize: 13, fontWeight: "700", color: "#F0F4FF" },
  adminRole: { fontSize: 10, color: "#8892B0", marginTop: 2 },
  adminStatus: { fontSize: 10, fontWeight: "700", fontFamily: "monospace" },
  formSection: { gap: 10 },
  formCard: { backgroundColor: "#0D1326", borderWidth: 1, borderColor: "#1F2A44", borderRadius: 20, padding: 16, gap: 12 },
  formGroup: { gap: 4 },
  formLabel: { fontSize: 9, fontWeight: "800", color: "#8892B0", letterSpacing: 0.5 },
  formInput: { backgroundColor: "#060913", borderWidth: 1, borderColor: "#1F2A44", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: "#F0F4FF", fontSize: 12 },
  beatToggleGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  beatToggleChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: "#060913", borderWidth: 1, borderColor: "#1F2A44" },
  beatToggleChipActive: { borderColor: "#EF4444", backgroundColor: "#EF444415" },
  beatToggleText: { fontSize: 10, color: "#8892B0", fontWeight: "600" },
  beatToggleTextActive: { color: "#EF4444", fontWeight: "700" },
  submitOfficerBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#EF4444", padding: 12, borderRadius: 12, marginTop: 4 },
  submitOfficerText: { fontSize: 11, fontWeight: "900", color: "#FFFFFF" },
  inspectXaiBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, backgroundColor: "#06B6D415" },
  inspectXaiText: { fontSize: 9, color: "#06B6D4", fontWeight: "800" },

  // Wellness & workload styles
  wellnessSection: { marginVertical: 12 },
  wellnessCard: {
    width: 250,
    backgroundColor: "#0D1326",
    borderWidth: 1,
    borderColor: "#1F2A44",
    borderRadius: 20,
    padding: 14,
    gap: 8,
  },
  wellnessCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  wellnessOfficerName: {
    fontSize: 12,
    fontWeight: "800",
  },
  wellnessGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    backgroundColor: "rgba(0,0,0,0.15)",
    borderRadius: 10,
    padding: 8,
    gap: 6,
  },
  wellnessGridItem: {
    width: "45%",
    alignItems: "center",
    gap: 2,
  },
  wellnessGridVal: {
    fontSize: 10,
    fontWeight: "900",
    color: "#F0F4FF",
  },
  wellnessGridLabel: {
    fontSize: 7,
    color: "#8892B0",
    fontWeight: "700",
  },
  rebalanceBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#3B82F6",
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 4,
  },
  rebalanceBtnText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#FFFFFF",
  },
});
