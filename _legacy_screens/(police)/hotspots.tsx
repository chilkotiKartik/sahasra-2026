import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import KarnatakaMap from "@/components/KarnatakaMap";
import { MOCK_HOTSPOTS, HotspotCluster } from "@/constants/sahasraData";
import { TIME_SLOTS } from "@/constants/bengaluru";

export default function HotspotsScreen() {
  const router = useRouter();
  const [selectedSlot, setSelectedSlot] = useState<string>("late_night");

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>DBSCAN & 7-Day Prophet Forecast</Text>
          <Text style={styles.headerSub}>Spatiotemporal Spatial Density & Time-Series Forecasting</Text>
        </View>
        <View style={styles.aiBadge}>
          <Text style={styles.aiText}>PROPHET AI</Text>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Time Slot Risk Matrix Selector */}
        <Text style={styles.sectionTitle}>24-Hour Time Slot Risk Matrix</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.slotScroll}>
          {TIME_SLOTS.map((slot) => (
            <Pressable
              key={slot.id}
              style={[styles.slotCard, selectedSlot === slot.id && styles.slotCardActive]}
              onPress={() => setSelectedSlot(slot.id)}
            >
              <Text style={styles.slotLabel}>{slot.label}</Text>
              <View
                style={[
                  styles.riskIndicator,
                  {
                    backgroundColor:
                      slot.id === "late_night" || slot.id === "midnight"
                        ? "#EF4444"
                        : slot.id === "night"
                        ? "#F59E0B"
                        : "#22C55E",
                  },
                ]}
              />
            </Pressable>
          ))}
        </ScrollView>

        {/* Map Snapshot */}
        <View style={styles.mapContainer}>
          <KarnatakaMap
            riskZones={MOCK_HOTSPOTS.map((h) => ({
              id: h.id,
              name: h.name,
              riskLevel: h.dbscanDensity,
              center: { lat: h.lat, lng: h.lng },
            })) as any}
            filter="hotspots"
            userDistrict="Bengaluru Urban"
          />
        </View>

        {/* Hotspots Cluster List */}
        <Text style={styles.sectionTitle}>DBSCAN Hotspot Clusters ({MOCK_HOTSPOTS.length})</Text>

        {MOCK_HOTSPOTS.map((hs) => (
          <Pressable
            key={hs.id}
            style={styles.hsCard}
            onPress={() =>
              router.push({
                pathname: "/hotspot-detail",
                params: {
                  id: hs.id,
                  name: hs.name,
                  zone: hs.zone,
                  district: hs.district,
                  density: hs.dbscanDensity,
                  recentCount: hs.recentIncidentCount.toString(),
                  predictedCount: hs.predictedIncidentsNext7Days.toString(),
                  dominantCrime: hs.dominantCrime,
                  peakSlot: hs.peakTimeSlot,
                  riskFactor: hs.riskFactor,
                },
              })
            }
          >
            <View style={styles.hsHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.hsName}>{hs.name}</Text>
                <Text style={styles.hsZone}>{hs.zone} • {hs.district}</Text>
              </View>

              <View
                style={[
                  styles.densityBadge,
                  {
                    backgroundColor:
                      hs.dbscanDensity === "Critical" ? "#EF444420" : "#F59E0B20",
                    borderColor:
                      hs.dbscanDensity === "Critical" ? "#EF4444" : "#F59E0B",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.densityText,
                    { color: hs.dbscanDensity === "Critical" ? "#EF4444" : "#F59E0B" },
                  ]}
                >
                  DBSCAN: {hs.dbscanDensity}
                </Text>
              </View>
            </View>

            <View style={styles.forecastRow}>
              <View style={styles.forecastBox}>
                <Text style={styles.forecastLabel}>30-Day Historical</Text>
                <Text style={styles.forecastVal}>{hs.recentIncidentCount} Cases</Text>
              </View>
              <Ionicons name="arrow-forward" size={16} color="#8B5CF6" />
              <View style={styles.forecastBox}>
                <Text style={styles.forecastLabel}>Prophet 7-Day Forecast</Text>
                <Text style={[styles.forecastVal, { color: "#EF4444" }]}>
                  +{hs.predictedIncidentsNext7Days} Predicted
                </Text>
              </View>
            </View>

            <Text style={styles.crimeLabel}>Dominant Pattern: {hs.dominantCrime}</Text>
            <Text style={styles.factorText}>Risk Factor: {hs.riskFactor}</Text>

            {/* DPDP Compliance Explainability Node */}
            <View style={styles.explainBox}>
              <Ionicons name="information-circle-outline" size={14} color="#06B6D4" />
              <Text style={styles.explainText}>
                Explainability Node (DPDP Act): Generated from FIRs ({hs.contributingFIRs.join(", ")})
              </Text>
            </View>
          </Pressable>
        ))}
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
  aiBadge: {
    backgroundColor: "#EF444420",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#EF4444",
  },
  aiText: { fontSize: 9, fontWeight: "900", color: "#EF4444" },
  content: { flex: 1 },
  scrollContent: { padding: 18, gap: 14 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#F0F4FF" },
  slotScroll: { maxHeight: 60 },
  slotCard: {
    backgroundColor: "#141A2E",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1F2A44",
    marginRight: 8,
    alignItems: "center",
    gap: 4,
  },
  slotCardActive: { borderColor: "#EF4444", backgroundColor: "#EF444415" },
  slotLabel: { fontSize: 10, color: "#F0F4FF", fontWeight: "700" },
  riskIndicator: { width: 24, height: 4, borderRadius: 2 },
  mapContainer: { height: 220, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: "#1F2A44" },
  hsCard: {
    backgroundColor: "#141A2E",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1F2A44",
    gap: 8,
  },
  hsHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  hsName: { fontSize: 15, fontWeight: "800", color: "#F0F4FF" },
  hsZone: { fontSize: 11, color: "#8892B0", marginTop: 2 },
  densityBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  densityText: { fontSize: 10, fontWeight: "900" },
  forecastRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#0A0F1C",
    padding: 10,
    borderRadius: 10,
  },
  forecastBox: { gap: 2 },
  forecastLabel: { fontSize: 9, color: "#8892B0" },
  forecastVal: { fontSize: 12, fontWeight: "800", color: "#F0F4FF" },
  crimeLabel: { fontSize: 12, fontWeight: "700", color: "#F59E0B" },
  factorText: { fontSize: 11, color: "#8892B0", lineHeight: 15 },
  explainBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderColor: "#1F2A44",
  },
  explainText: { fontSize: 9, color: "#06B6D4", flex: 1 },
});
