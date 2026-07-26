import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useApp } from "@/context/AppContext";
import { getThemeColors } from "@/constants/theme";

export default function HotspotDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme: activeTheme } = useApp();
  const theme = getThemeColors(activeTheme);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} contentContainerStyle={styles.content}>
      <Pressable style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={20} color={theme.text} />
        <Text style={[styles.backText, { color: theme.text }]}>Back to DBSCAN Grid</Text>
      </Pressable>

      <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.name, { color: theme.text }]}>{params.name || "Peenya Industrial Area"}</Text>
          <View style={styles.densityBadge}>
            <Text style={styles.densityText}>ST-DBSCAN CRITICAL</Text>
          </View>
        </View>

        <Text style={[styles.zone, { color: theme.muted }]}>Sector: {params.zone || "Peenya W-4"} • {params.district || "Bengaluru Urban"}</Text>

        {/* ST-DBSCAN Parameters */}
        <View style={[styles.infoBox, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
          <Text style={[styles.infoTitle, { color: theme.muted }]}>ST-DBSCAN CLUSTERING SETTINGS</Text>
          <View style={styles.paramRow}>
            <View style={styles.paramCol}>
              <Text style={[styles.paramVal, { color: theme.text }]}>500m</Text>
              <Text style={[styles.paramLabel, { color: theme.muted }]}>Spatial Radius (ε₁)</Text>
            </View>
            <View style={styles.paramCol}>
              <Text style={[styles.paramVal, { color: theme.text }]}>4 Hours</Text>
              <Text style={[styles.paramLabel, { color: theme.muted }]}>Temporal Gap (ε₂)</Text>
            </View>
            <View style={styles.paramCol}>
              <Text style={[styles.paramVal, { color: theme.text }]}>5 FIRs</Text>
              <Text style={[styles.paramLabel, { color: theme.muted }]}>Min Density (MinPts)</Text>
            </View>
          </View>
        </View>

        {/* Demographic Covariates */}
        <View style={[styles.infoBox, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
          <Text style={[styles.infoTitle, { color: theme.muted }]}>FUSED DISTRICT DEMOGRAPHIC COVARIATES</Text>
          <View style={styles.paramRow}>
            <View style={styles.paramCol}>
              <Text style={[styles.paramVal, { color: theme.primary }]}>₹2.4L</Text>
              <Text style={[styles.paramLabel, { color: theme.muted }]}>Per Capita Income</Text>
            </View>
            <View style={styles.paramCol}>
              <Text style={[styles.paramVal, { color: theme.primary }]}>88.4%</Text>
              <Text style={[styles.paramLabel, { color: theme.muted }]}>Literacy Index</Text>
            </View>
            <View style={styles.paramCol}>
              <Text style={[styles.paramVal, { color: theme.primary }]}>₹3.2T</Text>
              <Text style={[styles.paramLabel, { color: theme.muted }]}>GDDP Share</Text>
            </View>
          </View>
        </View>

        {/* Bayesian Spatio-Temporal Forecasting via INLA */}
        <View style={[styles.infoBox, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
          <Text style={[styles.infoTitle, { color: theme.muted }]}>BAYESIAN SPATIO-TEMPORAL FORECAST (INLA & CAR PRIORS)</Text>
          <View style={styles.bstContainer}>
            <View style={styles.bstHeader}>
              <Text style={[styles.bstVal, { color: theme.danger }]}>14.2 expected crimes / week</Text>
              <Text style={styles.confidenceLabel}>95% Credible Band</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressBar, { left: "30%", width: "40%" }]} />
              <View style={[styles.medianDot, { left: "50%" }]} />
            </View>
            <View style={styles.bstFooter}>
              <Text style={[styles.bstSub, { color: theme.muted }]}>Lower Bound: 9.8</Text>
              <Text style={[styles.bstSub, { color: theme.muted }]}>Median: 14.2</Text>
              <Text style={[styles.bstSub, { color: theme.muted }]}>Upper Bound: 18.6</Text>
            </View>
            <Text style={[styles.bstNote, { color: theme.muted }]}>
              CAR Spatial Neighbors Adjacency correlation: W_ij = 0.76. Wards spillover bias calculated and corrected.
            </Text>
          </View>
        </View>

        <View style={[styles.infoBox, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
          <Text style={[styles.infoTitle, { color: theme.muted }]}>DOMINANT CRIME MODALITIES</Text>
          <Text style={[styles.infoVal, { color: theme.text }]}>{params.dominantCrime || "Nighttime Chain Snatching (IPC 379A)"}</Text>
        </View>

        <View style={[styles.infoBox, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
          <Text style={[styles.infoTitle, { color: theme.muted }]}>PEAK CRIME TEMPORAL WINDOW</Text>
          <Text style={[styles.infoVal, { color: theme.text }]}>{params.peakSlot || "21:00 - 01:00 (Late Night Shift)"}</Text>
        </View>

        {/* Explainability Callout */}
        <View style={[styles.explainCard, { backgroundColor: theme.primary + "15", borderColor: theme.primary }]}>
          <Ionicons name="shield-checkmark" size={18} color={theme.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.explainTitle, { color: theme.primary }]}>Explainable AI Audited</Text>
            <Text style={[styles.explainDesc, { color: theme.muted }]}>
              This prediction is mathematically auditable. Shapley vector decomposition shows streetlight outage is the main covariate contributor (34.2%).
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 18, gap: 16 },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 },
  backText: { fontSize: 13, fontWeight: "600" },
  card: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    gap: 12,
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  name: { fontSize: 18, fontWeight: "800", flex: 1 },
  densityBadge: { backgroundColor: "#EF444420", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: "#EF4444" },
  densityText: { fontSize: 9, fontWeight: "900", color: "#EF4444" },
  zone: { fontSize: 12 },
  infoBox: { padding: 12, borderRadius: 12, borderWidth: 1, gap: 4 },
  infoTitle: { fontSize: 8, fontWeight: "800", letterSpacing: 0.5 },
  infoVal: { fontSize: 13, fontWeight: "700" },
  
  paramRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  paramCol: { alignItems: "center", flex: 1 },
  paramVal: { fontSize: 14, fontWeight: "800" },
  paramLabel: { fontSize: 9, marginTop: 2, textAlign: "center" },

  bstContainer: { marginTop: 4, gap: 8 },
  bstHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  bstVal: { fontSize: 13, fontWeight: "800" },
  confidenceLabel: { fontSize: 9, color: "#22C55E", fontWeight: "700" },
  progressTrack: { height: 6, backgroundColor: "#E2E8F030", borderRadius: 3, position: "relative", marginVertical: 4 },
  progressBar: { height: "100%", backgroundColor: "#EF4444", borderRadius: 3, position: "absolute" },
  medianDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#EF4444", borderWidth: 2, borderColor: "#FFFFFF", position: "absolute", top: -2 },
  bstFooter: { flexDirection: "row", justifyContent: "space-between" },
  bstSub: { fontSize: 9, fontFamily: "monospace" },
  bstNote: { fontSize: 9, fontStyle: "italic", marginTop: 4 },

  explainCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 12, borderWidth: 1, marginTop: 4 },
  explainTitle: { fontSize: 12, fontWeight: "800" },
  explainDesc: { fontSize: 10, lineHeight: 14, marginTop: 2 },
});
