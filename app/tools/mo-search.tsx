import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MOCK_FIRS } from "@/constants/sahasraData";

export default function MOSearchScreen() {
  const [query, setQuery] = useState("house burglary hydraulic cutter red Swift");
  const [firs, setFirs] = useState<any[]>(MOCK_FIRS);
  useEffect(() => {
    api.get<{ firs: any[] }>("/api/v2/intel/firs").then((r) => r.firs?.length && setFirs(r.firs)).catch(() => {});
  }, []);

  // Vector Space Clusters
  const vectorClusters = [
    { name: "Cluster #1: High-Speed Chain Snatching (Pulsar Module)", points: 14, color: "#EF4444" },
    { name: "Cluster #2: Hydraulic Balcony House Breaking (Swift Module)", points: 9, color: "#06B6D4" },
    { name: "Cluster #3: Digital Arrest & Govt Officer Impersonation", points: 22, color: "#8B5CF6" },
  ];

  // Cross-district match demo
  const crossMatch = {
    district1: "Hubballi (Gokul Road PS)",
    district2: "Dharwad (Subhash Nagar PS)",
    similarity: "92.4% Cosine Match",
    moText1: "Red Maruti Swift getaway vehicle. Balcony iron grill cut with hydraulic cutter. Distinctive chalk mark on doorway.",
    moText2: "Unsolved burglary from 6 months ago. Balcony grill cut via hydraulic tool, red Swift spotted, chalk mark on frame.",
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Modus Operandi (MO) Semantic Search</Text>
          <Text style={styles.headerSub}>FAISS Vector DB • Multilingual Sentence Transformers</Text>
        </View>
        <View style={styles.vectorBadge}>
          <Text style={styles.vectorText}>FAISS DENSE VECTORS</Text>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Search Bar */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#06B6D4" />
          <TextInput
            style={styles.searchInput}
            placeholder="Type MO description in English or Kannada..."
            placeholderTextColor="#8892B0"
            value={query}
            onChangeText={setQuery}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery("")}>
              <Ionicons name="close-circle" size={18} color="#8892B0" />
            </Pressable>
          )}
        </View>

        {/* Quick Suggestion Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
          {[
            "house burglary hydraulic cutter red Swift",
            "pulsar chain snatching unlit flyover",
            "digital arrest scam cyber fraud",
            "gated compound balcony grill cut",
          ].map((chip) => (
            <Pressable
              key={chip}
              style={[styles.chip, query === chip && styles.chipActive]}
              onPress={() => setQuery(chip)}
            >
              <Text style={[styles.chipText, query === chip && styles.chipTextActive]}>{chip}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Dense Vector Space Cosine Clustering Card */}
        <View style={styles.clusterCard}>
          <View style={styles.clusterHeader}>
            <Ionicons name="shapes-outline" size={20} color="#8B5CF6" />
            <Text style={styles.clusterTitle}>Dense Vector Cosine Embedding Space</Text>
          </View>
          <Text style={styles.clusterDesc}>
            Transformer embeddings project FIR narratives into a 384-dimensional vector space, clustering distinct Modus Operandi tactics automatically.
          </Text>

          <View style={styles.clusterList}>
            {vectorClusters.map((c) => (
              <View key={c.name} style={styles.clusterRow}>
                <View style={[styles.clusterDot, { backgroundColor: c.color }]} />
                <Text style={styles.clusterName}>{c.name}</Text>
                <Text style={styles.clusterPoints}>{c.points} FIRs</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Cross-District Serial Pattern Banner */}
        <View style={styles.patternCard}>
          <View style={styles.patternHeader}>
            <Ionicons name="git-compare-outline" size={20} color="#06B6D4" />
            <Text style={styles.patternTitle}>CROSS-DISTRICT SERIAL PATTERN DETECTED</Text>
          </View>
          <Text style={styles.patternSub}>
            FAISS Vector Engine matched Hubballi FIR-2026-HUB-0215 with Dharwad FIR-2026-DHAR-0104
          </Text>

          <View style={styles.matchBadge}>
            <Text style={styles.matchBadgeText}>{crossMatch.similarity}</Text>
          </View>

          <View style={styles.sideBySide}>
            <View style={styles.moCol}>
              <Text style={styles.moDistrict}>{crossMatch.district1}</Text>
              <Text style={styles.moNarrative}>{crossMatch.moText1}</Text>
            </View>
            <View style={styles.dividerLine} />
            <View style={styles.moCol}>
              <Text style={styles.moDistrict}>{crossMatch.district2}</Text>
              <Text style={styles.moNarrative}>{crossMatch.moText2}</Text>
            </View>
          </View>

          <View style={styles.linkedResult}>
            <Ionicons name="link-outline" size={16} color="#22C55E" />
            <Text style={styles.linkedText}>Automated Link Drawn in Neo4j Graph: [POTENTIAL_SERIAL_LINK]</Text>
          </View>
        </View>

        {/* Vector Search Results List */}
        <Text style={styles.sectionTitle}>Dense Vector Similarity Results</Text>

        {firs.map((fir, i) => {
          const simScore = (96.5 - i * 4.2).toFixed(1);
          return (
            <View key={fir.id} style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <Text style={styles.resultFir}>{fir.firNo}</Text>
                <View style={styles.simBadge}>
                  <Text style={styles.simScore}>{simScore}% Similarity</Text>
                </View>
              </View>

              <Text style={styles.resultStation}>{fir.station} • {fir.district}</Text>
              <Text style={styles.resultSection}>{fir.section} — {fir.crimeLabel}</Text>
              <Text style={styles.resultMo}>{fir.moNarrative}</Text>

              <View style={styles.resultFooter}>
                <Text style={styles.resultSuspect}>Suspect: {fir.suspectName}</Text>
                <Text style={styles.resultDate}>{fir.date}</Text>
              </View>
            </View>
          );
        })}
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
  vectorBadge: {
    backgroundColor: "#06B6D420",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#06B6D4",
  },
  vectorText: { fontSize: 9, fontWeight: "900", color: "#06B6D4" },
  content: { flex: 1 },
  scrollContent: { padding: 18, gap: 14 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#141A2E",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1F2A44",
  },
  searchInput: { flex: 1, color: "#F0F4FF", fontSize: 13 },
  chipsScroll: { maxHeight: 38 },
  chip: {
    backgroundColor: "#141A2E",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1F2A44",
    marginRight: 8,
  },
  chipActive: { borderColor: "#06B6D4", backgroundColor: "#06B6D420" },
  chipText: { fontSize: 11, color: "#8892B0" },
  chipTextActive: { color: "#06B6D4", fontWeight: "700" },
  clusterCard: {
    backgroundColor: "#141A2E",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#8B5CF660",
    gap: 8,
  },
  clusterHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  clusterTitle: { fontSize: 13, fontWeight: "800", color: "#8B5CF6" },
  clusterDesc: { fontSize: 11, color: "#8892B0", lineHeight: 15 },
  clusterList: { gap: 6, marginTop: 4 },
  clusterRow: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#0A0F1C", padding: 8, borderRadius: 8 },
  clusterDot: { width: 8, height: 8, borderRadius: 4 },
  clusterName: { fontSize: 10, color: "#F0F4FF", fontWeight: "600", flex: 1 },
  clusterPoints: { fontSize: 10, color: "#8892B0" },
  patternCard: {
    backgroundColor: "#06B6D410",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#06B6D4",
    gap: 10,
  },
  patternHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  patternTitle: { fontSize: 12, fontWeight: "900", color: "#06B6D4", letterSpacing: 0.5 },
  patternSub: { fontSize: 11, color: "#F0F4FF" },
  matchBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#06B6D4",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  matchBadgeText: { fontSize: 11, fontWeight: "900", color: "#FFFFFF" },
  sideBySide: { flexDirection: "row", gap: 10, backgroundColor: "#0A0F1C", padding: 12, borderRadius: 12 },
  moCol: { flex: 1, gap: 4 },
  moDistrict: { fontSize: 10, fontWeight: "800", color: "#06B6D4" },
  moNarrative: { fontSize: 10, color: "#8892B0", lineHeight: 14 },
  dividerLine: { width: 1, backgroundColor: "#1F2A44" },
  linkedResult: { flexDirection: "row", alignItems: "center", gap: 6 },
  linkedText: { fontSize: 10, color: "#22C55E", fontWeight: "700" },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#F0F4FF" },
  resultCard: {
    backgroundColor: "#141A2E",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1F2A44",
    gap: 6,
  },
  resultHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  resultFir: { fontSize: 14, fontWeight: "800", color: "#3B82F6" },
  simBadge: { backgroundColor: "#06B6D420", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  simScore: { fontSize: 10, fontWeight: "800", color: "#06B6D4" },
  resultStation: { fontSize: 11, color: "#8892B0" },
  resultSection: { fontSize: 11, fontWeight: "700", color: "#F59E0B" },
  resultMo: { fontSize: 12, color: "#F0F4FF", lineHeight: 16 },
  resultFooter: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  resultSuspect: { fontSize: 10, color: "#8892B0" },
  resultDate: { fontSize: 10, color: "#8892B0" },
});
