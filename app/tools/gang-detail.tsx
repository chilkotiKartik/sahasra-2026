import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useApp } from "@/context/AppContext";
import { getThemeColors } from "@/constants/theme";

export default function GangDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme: activeTheme } = useApp();
  const theme = getThemeColors(activeTheme);

  // Network Nodes structure
  const nodes = [
    { id: "n1", label: "Cobra Ramesh", type: "accused", sub: "Leader / Kingpin", status: "Out on Bail" },
    { id: "n2", label: "Kariya Suresh", type: "accused", sub: "Co-accused", status: "In Custody" },
    { id: "n3", label: "Bullet Ravi", type: "accused", sub: "Co-accused / Rider", status: "Out on Bail" },
    { id: "n4", label: "KA-03-M-8891", type: "vehicle", sub: "Black Pulsar 220", status: "Imounded" },
    { id: "n5", label: "Silk Board Exit", type: "location", sub: "Primary Snatching Spot", status: "Active Hotspot" },
  ];

  // Financial Link relationships
  const financialLinks = [
    { from: "Kariya Suresh", to: "Cobra Ramesh", amount: "₹4,50,000", channel: "UPI (Paytm Shell Account)", flag: "HIGH RISK" },
    { from: "Bullet Ravi", to: "Cobra Ramesh", amount: "₹1,80,000", channel: "IMPS Transfer", flag: "SUSPICIOUS" },
    { from: "Cobra Ramesh", to: "Karnataka Gold Jewellers", amount: "₹8,20,000", channel: "Cash route laundering", flag: "LAUNDERING" },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} contentContainerStyle={styles.content}>
      <Pressable style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={20} color={theme.text} />
        <Text style={[styles.backText, { color: theme.text }]}>Back to Gang Networks</Text>
      </Pressable>

      <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: theme.text }]}>{params.name || "Peenya Syndicate Network"}</Text>
          <View style={styles.badgeMini}>
            <Text style={styles.badgeTextMini}>LOUVAIN CLUSTER ID: {params.louvainClusterId || "1"}</Text>
          </View>
        </View>

        <Text style={[styles.sub, { color: theme.muted }]}>{params.primaryZone || "West Zone & Cross-District Syndicates"}</Text>

        <View style={styles.riskCard}>
          <Ionicons name="warning-outline" size={20} color="#EF4444" />
          <Text style={styles.riskText}>Risk Rating: {params.riskScore || "92"}/100 • High Centrality Coefficient</Text>
        </View>

        {/* Louvain Network Node Graph visualization representation */}
        <View style={[styles.sectionBox, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.muted }]}>Louvain Network Property Graph (Interactive Nodes)</Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.graphContainer}>
            {nodes.map((node, i) => (
              <View key={i} style={[styles.graphNode, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <View style={[
                  styles.nodeBadge,
                  node.type === "accused" ? { backgroundColor: "#EF444420", borderColor: "#EF4444" } :
                  node.type === "vehicle" ? { backgroundColor: "#F59E0B20", borderColor: "#F59E0B" } :
                  { backgroundColor: "#10B98120", borderColor: "#10B981" }
                ]}>
                  <Ionicons 
                    name={node.type === "accused" ? "person" : node.type === "vehicle" ? "car" : "pin"} 
                    size={14} 
                    color={node.type === "accused" ? "#EF4444" : node.type === "vehicle" ? "#F59E0B" : "#10B981"} 
                  />
                  <Text style={[
                    styles.nodeBadgeText,
                    { color: node.type === "accused" ? "#EF4444" : node.type === "vehicle" ? "#F59E0B" : "#10B981" }
                  ]}>
                    {node.type.toUpperCase()}
                  </Text>
                </View>
                <Text style={[styles.nodeLabel, { color: theme.text }]}>{node.label}</Text>
                <Text style={[styles.nodeSub, { color: theme.muted }]}>{node.sub}</Text>
                <Text style={[styles.nodeStatus, { color: theme.primary }]}>{node.status}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Financial Link Analysis edges */}
        <View style={[styles.sectionBox, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.muted }]}>Financial Link Analysis (UPI & Cash Laundering Edges)</Text>
          
          <View style={{ gap: 10, marginTop: 4 }}>
            {financialLinks.map((link, i) => (
              <View key={i} style={[styles.linkRow, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <View style={styles.flowRow}>
                  <Text style={[styles.flowActor, { color: theme.text }]}>{link.from}</Text>
                  <Ionicons name="arrow-forward" size={14} color="#EF4444" />
                  <Text style={[styles.flowActor, { color: theme.text }]}>{link.to}</Text>
                </View>

                <View style={styles.detailRow}>
                  <View style={{ gap: 2 }}>
                    <Text style={[styles.amountText, { color: theme.text }]}>{link.amount}</Text>
                    <Text style={[styles.channelText, { color: theme.muted }]}>{link.channel}</Text>
                  </View>
                  <View style={[
                    styles.flagBadge,
                    { borderColor: link.flag === "HIGH RISK" || link.flag === "LAUNDERING" ? "#EF4444" : "#F59E0B" }
                  ]}>
                    <Text style={[
                      styles.flagText,
                      { color: link.flag === "HIGH RISK" || link.flag === "LAUNDERING" ? "#EF4444" : "#F59E0B" }
                    ]}>
                      {link.flag}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Operating Crime Types */}
        <View style={[styles.sectionBox, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.muted }]}>OPERATIONAL CRIME MODALITIES</Text>
          <Text style={[styles.modalityVal, { color: theme.text }]}>{params.crimeTypes || "Spatio-Temporal Snatching, Organized Pawn Fencing"}</Text>
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
  card: { borderRadius: 20, padding: 20, borderWidth: 1, gap: 12 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 18, fontWeight: "800", flex: 1 },
  badgeMini: { backgroundColor: "#8B5CF620", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: "#8B5CF6" },
  badgeTextMini: { fontSize: 8, fontWeight: "900", color: "#8B5CF6" },
  sub: { fontSize: 12, marginTop: -4 },
  riskCard: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#EF444415", padding: 12, borderRadius: 12, borderWidth: 1, borderColor: "#EF4444" },
  riskText: { fontSize: 11, fontWeight: "800", color: "#EF4444" },
  
  sectionBox: { padding: 12, borderRadius: 12, borderWidth: 1, gap: 6 },
  sectionTitle: { fontSize: 8, fontWeight: "800", letterSpacing: 0.5 },
  modalityVal: { fontSize: 12, fontWeight: "700" },

  graphContainer: { gap: 12, paddingVertical: 6 },
  graphNode: { width: 140, padding: 12, borderRadius: 14, borderWidth: 1, gap: 6, alignItems: "center" },
  nodeBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  nodeBadgeText: { fontSize: 8, fontWeight: "900" },
  nodeLabel: { fontSize: 12, fontWeight: "800", textAlign: "center" },
  nodeSub: { fontSize: 9, textAlign: "center" },
  nodeStatus: { fontSize: 9, fontWeight: "800", marginTop: 2 },

  linkRow: { padding: 12, borderRadius: 12, borderWidth: 1, gap: 8 },
  flowRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  flowActor: { fontSize: 11, fontWeight: "800" },
  detailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  amountText: { fontSize: 14, fontWeight: "900" },
  channelText: { fontSize: 9 },
  flagBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  flagText: { fontSize: 8, fontWeight: "900" },
});
