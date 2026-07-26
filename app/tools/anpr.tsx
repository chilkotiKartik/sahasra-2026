import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  Alert,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { MOCK_ANPR_TRIGGERS, ANPRTrigger } from "@/constants/sahasraData";
import { SAFE_CITY_CAMERAS } from "@/constants/bengaluru";
import LiveCctvViewer from "@/components/LiveCctvViewer";
import { useAuth } from "@/context/AuthContext";
import ExplainabilityDrawer from "@/components/ExplainabilityDrawer";

export default function ANPRScreen() {
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const { camName, cameraId, autoOpen } = params;

  const [triggers, setTriggers] = useState<ANPRTrigger[]>([]);
  useEffect(() => {
    api.get<{ triggers: ANPRTrigger[] }>("/api/v2/intel/anpr")
      .then((r) => setTriggers(r.triggers?.length ? r.triggers : MOCK_ANPR_TRIGGERS))
      .catch(() => setTriggers(MOCK_ANPR_TRIGGERS));
  }, []);
  const [showIslandModal, setShowIslandModal] = useState(false);
  const [selectedCamId, setSelectedCamId] = useState<string>("c1");
  const [activeAlert, setActiveAlert] = useState<boolean>(true);
  const [showXai, setShowXai] = useState(false);
  const [selectedHotspot, setSelectedHotspot] = useState("Silk Board Junction");

  useEffect(() => {
    if (autoOpen === "true") {
      if (camName) {
        setSelectedCamId(camName as string);
      } else if (cameraId) {
        const found = SAFE_CITY_CAMERAS.find(c => c.id === cameraId);
        if (found) setSelectedCamId(found.name);
      }
      setShowIslandModal(true);
    }
  }, [autoOpen, camName, cameraId]);

  const handleSimulateTrigger = () => {
    Alert.alert(
      "Simulate Safe City ANPR Trigger",
      "Camera SC_003 (Whitefield Main Road) captured License Plate KA-04-HB-9021 (Black Pulsar 220). Vehicle linked to Ramesh Kumar (Cobra Ramesh). Tactical alert sent to Beat Officer WAS_02.",
      [{ text: "OK" }]
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Bengaluru Safe City ANPR & Cameras</Text>
          <Text style={styles.headerSub}>7,500+ AI Surveillance Metadata Feed • ANPR Hotlist Match</Text>
        </View>
        <Pressable style={styles.simBtn} onPress={handleSimulateTrigger}>
          <Ionicons name="flash" size={14} color="#FFFFFF" />
          <Text style={styles.simText}>SIMULATE PING</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* AI Threat Alerts Banner */}
        {activeAlert && (
          <View style={styles.aiAlertBanner}>
            <View style={styles.aiAlertHeader}>
              <View style={styles.flashDot} />
              <Text style={styles.aiAlertTitle}>AI ANOMALY: PHYSICAL FIGHT / VIOLENCE DETECTED</Text>
              <Pressable onPress={() => setActiveAlert(false)}>
                <Ionicons name="close" size={16} color="#FF9494" />
              </Pressable>
            </View>
            <Text style={styles.aiAlertBody}>
              Camera SC_006 (Silk Board Junction) flagged suspected physical violence/harassment gathering (94% confidence match index). Real-time OSD coordinates matched.
            </Text>
            <View style={styles.aiAlertActionRow}>
              <Pressable
                style={styles.aiAlertBtn}
                onPress={() => {
                  setSelectedCamId("Silk Board");
                  setShowIslandModal(true);
                }}
              >
                <Ionicons name="videocam" size={12} color="#FFFFFF" />
                <Text style={styles.aiAlertBtnText}>INTERCEPT LIVE CAM FEED</Text>
              </Pressable>
              <Pressable
                style={[styles.aiAlertBtn, { backgroundColor: "#FF444420", borderColor: "#FF4444" }]}
                onPress={() => {
                  Alert.alert("Emergency Dispatch", "Broadcasting Namma 112 SOS message to nearest Akka patrol vehicle Unit #1.");
                }}
              >
                <Ionicons name="alert-circle" size={12} color="#FF4444" />
                <Text style={[styles.aiAlertBtnText, { color: "#FF4444" }]}>DISPATCH PCR PATROL</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* SafeConnect Safety Island Trigger Banner */}
        <View style={styles.islandBanner}>
          <View style={styles.islandHeader}>
            <Ionicons name="call" size={20} color="#06B6D4" />
            <Text style={styles.islandTitle}>SafeConnect 2-Way Safety Island Pole Trigger</Text>
          </View>
          <Text style={styles.islandDesc}>
            Citizens in distress can press the emergency pole button at 50+ locations in Bengaluru to open a direct 2-way audio/video link to Command Center.
          </Text>
          <Pressable style={styles.islandBtn} onPress={() => setShowIslandModal(true)}>
            <Ionicons name="videocam" size={14} color="#FFFFFF" />
            <Text style={styles.islandBtnText}>OPEN LIVE SAFETY ISLAND FEED (2-WAY LINK)</Text>
          </Pressable>
        </View>

        {/* Camera Metadata Overview Card */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewHeader}>
            <Ionicons name="videocam-outline" size={22} color="#06B6D4" />
            <Text style={styles.overviewTitle}>7,500+ Camera Metadata Stream</Text>
          </View>
          <Text style={styles.overviewDesc}>
            SAHASRA processes high-speed metadata (license plates, crowd density, time) without storing raw video streams, ensuring DPDP Act privacy compliance.
          </Text>

          <View style={styles.overviewStats}>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>7,500+</Text>
              <Text style={styles.statSub}>Active Cameras</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>50+</Text>
              <Text style={styles.statSub}>Safety Islands</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statVal, { color: "#EF4444" }]}>12</Text>
              <Text style={styles.statSub}>ANPR Hotlist Hits</Text>
            </View>
          </View>

          <Pressable 
            style={[styles.inspectXaiBtn, { marginTop: 12 }]} 
            onPress={() => {
              setSelectedHotspot("Silk Board Junction Camera Cluster");
              setShowXai(true);
            }}
          >
            <Ionicons name="analytics" size={14} color="#06B6D4" />
            <Text style={styles.inspectXaiText}>INSPECT XAI AUDIT DECOMPOSITION</Text>
          </Pressable>
        </View>

        {/* Live ANPR Trigger Feed */}
        <Text style={styles.sectionTitle}>Real-time Safe City ANPR Trigger Alerts</Text>

        {triggers
          .filter(trig => 
            !user?.station || 
            trig.cameraName.toLowerCase().includes((user?.station ?? "").replace(" PS", "").toLowerCase())
          )
          .map((trig) => (
          <View key={trig.id} style={styles.trigCard}>
            <View style={styles.trigHeader}>
              <View style={styles.trigBadge}>
                <Ionicons name="alert-circle" size={12} color="#EF4444" />
                <Text style={styles.trigBadgeText}>{trig.triggerType}</Text>
              </View>
              <Text style={styles.trigTime}>{trig.timestamp}</Text>
            </View>

            <View style={styles.trigMain}>
              <View style={styles.plateBox}>
                <Text style={styles.plateText}>{trig.plateNo}</Text>
                <Text style={styles.modelText}>{trig.vehicleModel}</Text>
              </View>

              <View style={styles.cameraDetails}>
                <Text style={styles.camName}>{trig.cameraName}</Text>
                <Text style={styles.camCoords}>GPS: {trig.lat}° N, {trig.lng}° E</Text>
                <Text style={styles.linkedSuspect}>
                  ICJS Link: {trig.suspectLinked} ({trig.bailStatus})
                </Text>
              </View>
            </View>

            <View style={styles.actionBox}>
              <Ionicons name="shield-checkmark" size={14} color="#22C55E" />
              <Text style={styles.actionText}>{trig.actionTaken}</Text>
            </View>
          </View>
        ))}

        {/* Safe City Camera Network Nodes */}
        <Text style={styles.sectionTitle}>
          Active ANPR Camera Locations ({
            SAFE_CITY_CAMERAS.filter(cam => 
              !user?.station || 
              cam.name.toLowerCase().includes((user?.station ?? "").replace(" PS", "").toLowerCase())
            ).length
          })
        </Text>

        <View style={styles.camGrid}>
          {SAFE_CITY_CAMERAS
            .filter(cam => 
              !user?.station || 
              cam.name.toLowerCase().includes((user?.station ?? "").replace(" PS", "").toLowerCase())
            )
            .map((cam) => (
            <Pressable
              key={cam.id}
              style={styles.camCard}
              onPress={() => {
                setSelectedCamId(cam.name);
                setShowIslandModal(true);
              }}
            >
              <Ionicons name="videocam" size={18} color="#06B6D4" />
              <View style={{ flex: 1 }}>
                <Text style={styles.camCardName}>{cam.name}</Text>
                <Text style={styles.camCardType}>{cam.type} Camera • Active • Tap to View Feed 🎥</Text>
              </View>
              <View style={styles.liveDot} />
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* 2-Way Audio/Video Safety Island Live Modal */}
      <Modal visible={showIslandModal} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.liveTag}>
                <View style={styles.redDot} />
                <Text style={styles.liveText}>SAFECONNECT LIVE 2-WAY FEED</Text>
              </View>
              <Pressable onPress={() => setShowIslandModal(false)}>
                <Ionicons name="close" size={24} color="#8892B0" />
              </Pressable>
            </View>

             <LiveCctvViewer initialCamId={selectedCamId} hasAnomaly={activeAlert} />

            <View style={styles.islandActions}>
              <Pressable
                style={styles.dispatchPcrBtn}
                onPress={() => {
                  setShowIslandModal(false);
                  Alert.alert("PCR Patrol Dispatched", "Nearest PCR Van dispatched to Silk Board Safety Island #04.");
                }}
              >
                <Text style={styles.dispatchPcrText}>DISPATCH NEAREST PCR VAN</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <ExplainabilityDrawer
        visible={showXai}
        onClose={() => setShowXai(false)}
        hotspotName={selectedHotspot}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0F1C" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 18,
    paddingTop: 12,
  },
  headerTitle: { fontSize: 17, fontWeight: "800", color: "#F0F4FF" },
  headerSub: { fontSize: 11, color: "#8892B0", marginTop: 2 },
  simBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EF4444",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  simText: { fontSize: 10, fontWeight: "900", color: "#FFFFFF" },
  content: { flex: 1 },
  scrollContent: { padding: 18, gap: 14 },
  islandBanner: {
    backgroundColor: "#06B6D415",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#06B6D4",
    gap: 8,
  },
  islandHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  islandTitle: { fontSize: 13, fontWeight: "800", color: "#06B6D4" },
  islandDesc: { fontSize: 11, color: "#F0F4FF", lineHeight: 15 },
  islandBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "#06B6D4", padding: 12, borderRadius: 10, marginTop: 4 },
  islandBtnText: { fontSize: 11, fontWeight: "900", color: "#FFFFFF" },
  overviewCard: {
    backgroundColor: "#141A2E",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1F2A44",
    gap: 10,
  },
  overviewHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  overviewTitle: { fontSize: 14, fontWeight: "800", color: "#06B6D4" },
  overviewDesc: { fontSize: 11, color: "#8892B0", lineHeight: 16 },
  overviewStats: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  statBox: { backgroundColor: "#0A0F1C", padding: 10, borderRadius: 10, width: "31%", alignItems: "center" },
  statVal: { fontSize: 16, fontWeight: "900", color: "#F0F4FF" },
  statSub: { fontSize: 9, color: "#8892B0" },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#F0F4FF" },
  trigCard: {
    backgroundColor: "#141A2E",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EF444460",
    gap: 10,
  },
  trigHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  trigBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#EF444420", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  trigBadgeText: { fontSize: 10, fontWeight: "900", color: "#EF4444" },
  trigTime: { fontSize: 10, color: "#8892B0" },
  trigMain: { flexDirection: "row", gap: 12, alignItems: "center" },
  plateBox: { backgroundColor: "#0A0F1C", padding: 10, borderRadius: 10, borderLeftWidth: 3, borderColor: "#EF4444", alignItems: "center" },
  plateText: { fontSize: 13, fontWeight: "900", color: "#F0F4FF" },
  modelText: { fontSize: 9, color: "#8892B0" },
  cameraDetails: { flex: 1, gap: 2 },
  camName: { fontSize: 13, fontWeight: "700", color: "#F0F4FF" },
  camCoords: { fontSize: 10, color: "#8892B0" },
  linkedSuspect: { fontSize: 10, color: "#F59E0B", fontWeight: "700", marginTop: 2 },
  actionBox: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#22C55E15", padding: 8, borderRadius: 8 },
  actionText: { fontSize: 10, color: "#22C55E", fontWeight: "700" },
  camGrid: { gap: 8 },
  camCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#141A2E",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1F2A44",
  },
  camCardName: { fontSize: 12, fontWeight: "700", color: "#F0F4FF" },
  camCardType: { fontSize: 10, color: "#8892B0" },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#22C55E" },
  modalBg: { flex: 1, backgroundColor: "#00000080", justifyContent: "flex-end" },
  modalCard: { backgroundColor: "#141A2E", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 14 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  liveTag: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#EF444420", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  redDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#EF4444" },
  liveText: { fontSize: 10, fontWeight: "900", color: "#EF4444" },
  videoSimBox: { height: 220, backgroundColor: "#0A0F1C", borderRadius: 16, borderWidth: 1, borderColor: "#06B6D4", overflow: "hidden" },
  videoText: { fontSize: 13, fontWeight: "800", color: "#F0F4FF" },
  videoSub: { fontSize: 10, color: "#8892B0" },
  islandActions: { gap: 8 },
  dispatchPcrBtn: { backgroundColor: "#EF4444", padding: 14, borderRadius: 12, alignItems: "center" },
  dispatchPcrText: { fontSize: 12, fontWeight: "900", color: "#FFFFFF" },
  aiAlertBanner: {
    backgroundColor: "#EF444415",
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#EF4444",
    padding: 16,
    gap: 10,
  },
  aiAlertHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  flashDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#EF4444" },
  aiAlertTitle: { fontSize: 11, fontWeight: "900", color: "#EF4444", flex: 1, letterSpacing: 0.5 },
  aiAlertBody: { fontSize: 11, color: "#FFC2C2", lineHeight: 16 },
  aiAlertActionRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  aiAlertBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#EF4444",
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#EF4444",
  },
  aiAlertBtnText: { fontSize: 10, fontWeight: "900", color: "#FFFFFF" },
  inspectXaiBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: "#06B6D4", backgroundColor: "#06B6D415" },
  inspectXaiText: { fontSize: 10, color: "#06B6D4", fontWeight: "900", letterSpacing: 0.5 },
});
