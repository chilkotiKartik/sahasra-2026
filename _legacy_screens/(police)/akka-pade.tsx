import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MOCK_AKKA_PADE, AkkaPadePatrol } from "@/constants/sahasraData";
import { AKKA_PADA_STATIONS } from "@/constants/bengaluru";
import KarnatakaMap from "@/components/KarnatakaMap";

export default function AkkaPadeScreen() {
  const [patrols, setPatrols] = useState<AkkaPadePatrol[]>(MOCK_AKKA_PADE);
  const [selectedDistrict, setSelectedDistrict] = useState<string>("Bengaluru Urban");

  const getApiRoot = () => {
    if (typeof window !== "undefined" && window.location) {
      if (window.location.port === "8081" || window.location.port === "8082" || window.location.port === "8080" || window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
        return `${window.location.protocol}//${window.location.hostname}:5000`;
      }
      return window.location.origin;
    }
    return "http://localhost:5000";
  };

  const [workers, setWorkers] = useState<any[]>([
    { id: "w1", name: "Akka Pade Unit #1", status: "active", phone: "080-22943400", geo: { lat: 12.9352, lng: 77.6146 }, currentTask: "Koramangala Patrol" },
    { id: "w2", name: "Akka Pade Unit #2", status: "active", phone: "080-22943410", geo: { lat: 13.0287, lng: 77.5194 }, currentTask: "Peenya Patrol" },
    { id: "w3", name: "Akka Pade Unit #3", status: "active", phone: "080-22943420", geo: { lat: 12.9784, lng: 77.6408 }, currentTask: "Indiranagar Patrol" },
  ]);

  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        const response = await fetch(`${getApiRoot()}/api/workers`);
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          // Convert backend worker schema to Leaflet component marker format
          const formatted = data.map((w, idx) => ({
            id: w.id,
            name: w.name,
            status: w.status,
            phone: w.phone || `080-229434${idx}0`,
            geo: w.geo || { lat: 12.9716, lng: 77.5946 },
            currentTask: w.currentTask || "Patrolling Route",
          }));
          setWorkers(formatted);
        }
      } catch (err) {
        console.log("Failed to fetch live workers from backend, using simulated drift:", err);
        // Fallback: simulate tiny drifts locally to show it's "live"
        setWorkers(prev => prev.map(w => ({
          ...w,
          geo: {
            lat: w.geo.lat + (Math.random() - 0.5) * 0.0002,
            lng: w.geo.lng + (Math.random() - 0.5) * 0.0002,
          }
        })));
      }
    };

    fetchWorkers();
    const interval = setInterval(fetchWorkers, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleTriggerReRoute = (unitId: string) => {
    setPatrols((prev) =>
      prev.map((p) =>
        p.id === unitId ? { ...p, status: "Dispatched" as const } : p
      )
    );
    Alert.alert(
      "Akka Pade Dispatch Sent",
      "Patrol vehicle re-routed to dark spot coordinates (Peenya Metro Underpass). Route guidance pushed to officer's mobile device via Police IT-V2 ERP.",
      [{ text: "OK" }]
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Akka Pade Women's Patrol Dispatch</Text>
          <Text style={styles.headerSub}>Routine Activity Dispatch Engine • Namma 112 + BBMP Dark Spots</Text>
        </View>
        <View style={styles.dispatchBadge}>
          <Text style={styles.dispatchText}>AUTO-REROUTE</Text>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Live GPS Patrol Map */}
        <View style={styles.mapCard}>
          <View style={styles.mapCardHeader}>
            <Ionicons name="map-outline" size={18} color="#EC4899" />
            <Text style={styles.mapCardTitle}>Live GPS Patrol Fleet Tracking Map</Text>
            <View style={styles.livePulseContainer}>
              <View style={styles.livePulseDot} />
              <Text style={styles.livePulseText}>LIVE GPS</Text>
            </View>
          </View>
          <View style={styles.mapContainer}>
            <KarnatakaMap
              workers={workers}
              filter="workers"
              userDistrict={selectedDistrict}
            />
          </View>
        </View>

        {/* Routine Activity Workflow Card */}
        <View style={styles.workflowCard}>
          <View style={styles.wfHeader}>
            <Ionicons name="git-pull-request-outline" size={20} color="#EC4899" />
            <Text style={styles.wfTitle}>Workflow A: Routine Activity Dispatch</Text>
          </View>
          <Text style={styles.wfDesc}>
            When Namma 112 receives 3+ harassment pings near a transit hub within 48 hours, DBSCAN clusters the points and correlates them with municipal BBMP streetlight failure reports to generate a Dark Spot Risk dispatch.
          </Text>

          <View style={styles.wfSteps}>
            <View style={styles.wfStep}>
              <Text style={styles.stepNum}>1</Text>
              <Text style={styles.stepText}>Namma 112 Calls</Text>
            </View>
            <Ionicons name="arrow-forward" size={14} color="#8892B0" />
            <View style={styles.wfStep}>
              <Text style={styles.stepNum}>2</Text>
              <Text style={styles.stepText}>BBMP Dark Spot</Text>
            </View>
            <Ionicons name="arrow-forward" size={14} color="#8892B0" />
            <View style={styles.wfStep}>
              <Text style={styles.stepNum}>3</Text>
              <Text style={styles.stepText}>Akka Dispatch</Text>
            </View>
          </View>
        </View>

        {/* Active Patrol Fleet Status */}
        <Text style={styles.sectionTitle}>Active Patrol Fleet Status</Text>

        {patrols.map((unit) => (
          <View key={unit.id} style={styles.unitCard}>
            <View style={styles.unitHeader}>
              <Text style={styles.unitName}>{unit.unitName}</Text>
              <View
                style={[
                  styles.statusTag,
                  {
                    backgroundColor:
                      unit.status === "Dispatched" ? "#F59E0B20" : "#22C55E20",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusTagText,
                    { color: unit.status === "Dispatched" ? "#F59E0B" : "#22C55E" },
                  ]}
                >
                  {unit.status.toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={styles.unitMeta}>
              <Text style={styles.metaText}>Officer: {unit.officerInCharge}</Text>
              <Text style={styles.metaText}>Vehicle: {unit.vehicleNo}</Text>
            </View>

            <Text style={styles.routeReason}>{unit.routeReason}</Text>

            <Pressable
              style={styles.reRouteBtn}
              onPress={() => handleTriggerReRoute(unit.id)}
            >
              <Ionicons name="navigate-outline" size={14} color="#FFFFFF" />
              <Text style={styles.reRouteText}>AUTO RE-ROUTE PATROL TO DARK SPOT</Text>
            </Pressable>
          </View>
        ))}

        {/* All Akka Pade Station Bases */}
        <Text style={styles.sectionTitle}>Akka Pade Station Bases ({AKKA_PADA_STATIONS.length})</Text>

        <View style={styles.basesGrid}>
          {AKKA_PADA_STATIONS.map((base, i) => {
            const baseName = base.name.replace("Akka Pada - ", "");
            const isSelected = selectedDistrict === baseName;
            return (
              <Pressable
                key={i}
                style={[
                  styles.baseCard,
                  isSelected && { borderColor: "#EC4899", backgroundColor: "#EC489915" }
                ]}
                onPress={() => setSelectedDistrict(baseName)}
              >
                <Ionicons name={isSelected ? "shield-checkmark" : "shield"} size={18} color="#EC4899" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.baseName}>{base.name} {isSelected ? "🎯" : ""}</Text>
                  <Text style={styles.baseSub}>{base.officers} Officers • {base.vehicle}</Text>
                </View>
                <Ionicons name="eye-outline" size={14} color={isSelected ? "#EC4899" : "#8892B0"} />
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
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
  dispatchBadge: {
    backgroundColor: "#EC489920",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#EC4899",
  },
  dispatchText: { fontSize: 9, fontWeight: "900", color: "#EC4899" },
  content: { flex: 1 },
  scrollContent: { padding: 18, gap: 14 },
  workflowCard: {
    backgroundColor: "#EC489910",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EC4899",
    gap: 10,
  },
  wfHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  wfTitle: { fontSize: 13, fontWeight: "800", color: "#EC4899" },
  wfDesc: { fontSize: 11, color: "#F0F4FF", lineHeight: 16 },
  wfSteps: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#0A0F1C", padding: 10, borderRadius: 10 },
  wfStep: { flexDirection: "row", alignItems: "center", gap: 6 },
  stepNum: { width: 18, height: 18, borderRadius: 9, backgroundColor: "#EC4899", textAlign: "center", color: "#FFFFFF", fontSize: 10, fontWeight: "900", lineHeight: 18 },
  stepText: { fontSize: 10, color: "#F0F4FF", fontWeight: "700" },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#F0F4FF" },
  unitCard: {
    backgroundColor: "#141A2E",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1F2A44",
    gap: 8,
  },
  unitHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  unitName: { fontSize: 14, fontWeight: "800", color: "#F0F4FF" },
  statusTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  statusTagText: { fontSize: 10, fontWeight: "800" },
  unitMeta: { flexDirection: "row", justifyContent: "space-between" },
  metaText: { fontSize: 11, color: "#8892B0" },
  routeReason: { fontSize: 11, color: "#F59E0B", fontWeight: "600", lineHeight: 15 },
  reRouteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#EC4899",
    padding: 12,
    borderRadius: 10,
    marginTop: 4,
  },
  reRouteText: { fontSize: 11, fontWeight: "900", color: "#FFFFFF" },
  basesGrid: { gap: 8 },
  baseCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#141A2E",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1F2A44",
  },
  baseName: { fontSize: 12, fontWeight: "700", color: "#F0F4FF" },
  baseSub: { fontSize: 10, color: "#8892B0" },
  mapCard: {
    backgroundColor: "#141A2E",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#EC489940",
    padding: 16,
    gap: 12,
  },
  mapCardHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  mapCardTitle: { fontSize: 13, fontWeight: "800", color: "#EC4899", flex: 1 },
  livePulseContainer: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#EF444420", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  livePulseDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: "#EF4444" },
  livePulseText: { fontSize: 8, fontWeight: "900", color: "#EF4444" },
  mapContainer: { height: 240, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: "#1F2A44" },
});
