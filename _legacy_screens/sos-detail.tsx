import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function SOSDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Pressable style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={20} color="#F0F4FF" />
        <Text style={styles.backText}>Back to SOS Alerts</Text>
      </Pressable>

      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>🆘 SOS Emergency Alert</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>Active Dispatch</Text>
          </View>
        </View>

        <Text style={styles.user}>{params.userName || "Citizen in Distress"}</Text>
        <Text style={styles.time}>{params.time || "Just now"}</Text>

        <View style={styles.metaBox}>
          <Ionicons name="location-outline" size={16} color="#EF4444" />
          <Text style={styles.metaText}>GPS Stream: Peenya 1st Stage (13.0287° N, 77.5194° E)</Text>
        </View>

        <View style={styles.metaBox}>
          <Ionicons name="mic-outline" size={16} color="#06B6D4" />
          <Text style={styles.metaText}>Audio Evidence: Background Recording File #REC-8812.m4a</Text>
        </View>

        <View style={styles.dispatchBox}>
          <Ionicons name="car-sport" size={20} color="#22C55E" />
          <View style={{ flex: 1 }}>
            <Text style={styles.dispatchTitle}>Akka Pade Unit #2 Dispatched</Text>
            <Text style={styles.dispatchSub}>ETA 4 minutes to location</Text>
          </View>
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
  card: {
    backgroundColor: "#141A2E",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#EF4444",
    gap: 12,
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 18, fontWeight: "900", color: "#EF4444" },
  statusBadge: { backgroundColor: "#EF444420", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: "#EF4444" },
  statusText: { fontSize: 10, fontWeight: "900", color: "#EF4444" },
  user: { fontSize: 16, fontWeight: "800", color: "#F0F4FF" },
  time: { fontSize: 11, color: "#8892B0" },
  metaBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#0A0F1C", padding: 12, borderRadius: 12, borderWidth: 1, borderColor: "#1F2A44" },
  metaText: { fontSize: 11, color: "#F0F4FF", flex: 1 },
  dispatchBox: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#22C55E15", padding: 14, borderRadius: 12, borderWidth: 1, borderColor: "#22C55E" },
  dispatchTitle: { fontSize: 13, fontWeight: "800", color: "#22C55E" },
  dispatchSub: { fontSize: 11, color: "#8892B0" },
});
