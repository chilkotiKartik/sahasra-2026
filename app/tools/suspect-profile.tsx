import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function SuspectProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // 5-Axis Risk Indicators
  const riskMetrics = [
    { label: "Prior FIRs History", score: 92, color: "#EF4444" },
    { label: "MO Cosine Similarity", score: 88, color: "#06B6D4" },
    { label: "Financial Trail Complexity", score: 75, color: "#8B5CF6" },
    { label: "Gang Degree Centrality", score: 94, color: "#EF4444" },
    { label: "Bail Violation Risk Index", score: 85, color: "#F59E0B" },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Pressable style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={20} color="#F0F4FF" />
        <Text style={styles.backText}>Back to Gang Networks</Text>
      </Pressable>

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{params.name ? (params.name as string)[0] : "S"}</Text>
        </View>
        <Text style={styles.name}>{params.name || "Ramesh Kumar"}</Text>
        <Text style={styles.alias}>Alias: "{params.alias || "Cobra"}"</Text>

        <View style={styles.badgeRow}>
          <View style={styles.gangBadge}>
            <Text style={styles.gangText}>{params.gangName || "Peenya Pulsar Syndicate"}</Text>
          </View>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{params.role || "Kingpin"}</Text>
          </View>
        </View>

        <View style={styles.icjsCard}>
          <Ionicons name="shield-outline" size={18} color="#F59E0B" />
          <Text style={styles.icjsText}>ICJS Court Status: {params.icjsStatus || "Out on Bail"}</Text>
        </View>

        {/* Advanced Criminological 5-Axis Risk Radar Matrix */}
        <View style={styles.radarCard}>
          <View style={styles.radarHeader}>
            <Ionicons name="speedometer-outline" size={20} color="#EF4444" />
            <Text style={styles.radarTitle}>Criminological Recidivism Risk Matrix</Text>
          </View>
          <Text style={styles.radarDesc}>
            Ensemble AI evaluates 5 criminological dimensions to predict re-offending likelihood and prioritize surveillance.
          </Text>

          <View style={styles.axisList}>
            {riskMetrics.map((metric) => (
              <View key={metric.label} style={styles.axisRow}>
                <View style={styles.axisLabelRow}>
                  <Text style={styles.axisLabel}>{metric.label}</Text>
                  <Text style={[styles.axisScore, { color: metric.color }]}>{metric.score}%</Text>
                </View>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${metric.score}%`, backgroundColor: metric.color }]} />
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.metaGrid}>
          <View style={styles.metaBox}>
            <Text style={styles.metaVal}>{params.firsCount || "14"}</Text>
            <Text style={styles.metaSub}>Linked FIRs</Text>
          </View>
          <View style={styles.metaBox}>
            <Text style={styles.metaVal}>{params.centrality ? `${(parseFloat(params.centrality as string) * 100).toFixed(0)}%` : "94%"}</Text>
            <Text style={styles.metaSub}>Degree Centrality</Text>
          </View>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Last Known Location</Text>
          <Text style={styles.infoValue}>{params.location || "Peenya 2nd Stage, Bengaluru"}</Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Modus Operandi Vector Summary</Text>
          <Text style={styles.infoValue}>{params.moSummary || "High speed pulsar bike chain snatching under unlit flyovers."}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0F1C" },
  content: { padding: 18, gap: 16 },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 },
  backText: { fontSize: 13, color: "#F0F4FF", fontWeight: "600" },
  profileCard: {
    backgroundColor: "#141A2E",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1F2A44",
    gap: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#8B5CF6",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 32, fontWeight: "800", color: "#FFFFFF" },
  name: { fontSize: 20, fontWeight: "800", color: "#F0F4FF" },
  alias: { fontSize: 13, color: "#8B5CF6", fontWeight: "700" },
  badgeRow: { flexDirection: "row", gap: 8, marginVertical: 4 },
  gangBadge: { backgroundColor: "#8B5CF620", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: "#8B5CF6" },
  gangText: { fontSize: 11, fontWeight: "700", color: "#8B5CF6" },
  roleBadge: { backgroundColor: "#EF444420", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: "#EF4444" },
  roleText: { fontSize: 11, fontWeight: "800", color: "#EF4444" },
  icjsCard: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#F59E0B15", padding: 12, borderRadius: 12, width: "100%", justifyContent: "center", borderWidth: 1, borderColor: "#F59E0B" },
  icjsText: { fontSize: 12, fontWeight: "800", color: "#F59E0B" },
  radarCard: {
    width: "100%",
    backgroundColor: "#0A0F1C",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EF444440",
    gap: 10,
  },
  radarHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  radarTitle: { fontSize: 13, fontWeight: "800", color: "#EF4444" },
  radarDesc: { fontSize: 10, color: "#8892B0", lineHeight: 14 },
  axisList: { gap: 8, marginTop: 4 },
  axisRow: { gap: 4 },
  axisLabelRow: { flexDirection: "row", justifyContent: "space-between" },
  axisLabel: { fontSize: 10, color: "#F0F4FF", fontWeight: "600" },
  axisScore: { fontSize: 10, fontWeight: "800" },
  track: { height: 6, backgroundColor: "#141A2E", borderRadius: 3, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 3 },
  metaGrid: { flexDirection: "row", gap: 12, width: "100%" },
  metaBox: { flex: 1, backgroundColor: "#0A0F1C", padding: 14, borderRadius: 12, alignItems: "center", borderWidth: 1, borderColor: "#1F2A44" },
  metaVal: { fontSize: 18, fontWeight: "900", color: "#F0F4FF" },
  metaSub: { fontSize: 10, color: "#8892B0", marginTop: 2 },
  infoBox: { width: "100%", backgroundColor: "#0A0F1C", padding: 12, borderRadius: 12, borderWidth: 1, borderColor: "#1F2A44", gap: 4 },
  infoTitle: { fontSize: 10, color: "#8892B0", fontWeight: "700" },
  infoValue: { fontSize: 12, color: "#F0F4FF", lineHeight: 16 },
});
