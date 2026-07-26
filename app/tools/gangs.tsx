import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Modal,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { WebView } from "react-native-webview";
import { MOCK_GANGS, MOCK_SUSPECTS } from "@/constants/sahasraData";

interface FinancialTrail {
  id: string;
  sourceAccount: string;
  destinationAccount: string;
  amount: string;
  flag: "SUSPICIOUS_UPI_POOL" | "MULE_ACCOUNT" | "CRYPTO_CASHOUT";
  linkedSuspect: string;
}

export default function GangsScreen() {
  const router = useRouter();
  const [gangsData, setGangsData] = useState<any[]>(MOCK_GANGS);
  const [suspectsData, setSuspectsData] = useState<any[]>(MOCK_SUSPECTS);
  useEffect(() => {
    api.get<{ gangs: any[] }>("/api/v2/intel/gangs").then((r) => r.gangs?.length && setGangsData(r.gangs)).catch(() => {});
    api.get<{ suspects: any[] }>("/api/v2/intel/suspects").then((r) => r.suspects?.length && setSuspectsData(r.suspects)).catch(() => {});
  }, []);
  const [activeTab, setActiveTab] = useState<"network" | "financial">("network");
  const [viewMode, setViewMode] = useState<"graph" | "list">("graph");
  const [selectedSuspectNode, setSelectedSuspectNode] = useState<any>(null);

  const financialTrails: FinancialTrail[] = [
    {
      id: "fin_01",
      sourceAccount: "UPI: cobra.ramesh@upi",
      destinationAccount: "ICICI Mule A/C #90123849102",
      amount: "₹ 4,50,000",
      flag: "MULE_ACCOUNT",
      linkedSuspect: "Ramesh Kumar (Cobra Ramesh)",
    },
    {
      id: "fin_02",
      sourceAccount: "Axis Bank A/C #11029384",
      destinationAccount: "Crypto Wallet 0x8F...39A1",
      amount: "₹ 12,00,000",
      flag: "CRYPTO_CASHOUT",
      linkedSuspect: "Sunil Gowda (Grill Gowda)",
    },
  ];

  const generateGraphHTML = () => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <script type="text/javascript" src="https://unpkg.com/vis-network/standalone/umd/vis-network.min.js"></script>
      <style type="text/css">
        html, body {
          width: 100%;
          height: 100%;
          margin: 0;
          padding: 0;
          background-color: #0A0F1C;
          overflow: hidden;
        }
        #network {
          width: 100%;
          height: 100%;
          background-color: #0A0F1C;
        }
      </style>
    </head>
    <body>
      <div id="network"></div>
      <script type="text/javascript">
        var nodes = new vis.DataSet([
          // Gangs
          { id: "gang_1", label: "Peenya Pulsar Syndicate", group: "gang", shape: "star", color: "#F59E0B", size: 25, font: { color: "#F0F4FF", size: 12, face: "sans-serif" } },
          { id: "gang_2", label: "Hydraulic Swift Ring", group: "gang", shape: "star", color: "#F59E0B", size: 25, font: { color: "#F0F4FF", size: 12, face: "sans-serif" } },

          // Suspects
          { id: "suspect_001", label: "Cobra Ramesh\\n(Kingpin)", group: "suspect", shape: "dot", color: "#EF4444", size: 22, font: { color: "#F0F4FF", size: 11, face: "sans-serif" } },
          { id: "suspect_002", label: "Grill Gowda\\n(Kingpin)", group: "suspect", shape: "dot", color: "#EF4444", size: 22, font: { color: "#F0F4FF", size: 11, face: "sans-serif" } },
          { id: "suspect_003", label: "Hydraulic Rakesh\\n(Lt.)", group: "suspect", shape: "dot", color: "#8B5CF6", size: 18, font: { color: "#F0F4FF", size: 11, face: "sans-serif" } },
          { id: "suspect_004", label: "Speedo Manja\\n(Op)", group: "suspect", shape: "dot", color: "#3B82F6", size: 18, font: { color: "#F0F4FF", size: 11, face: "sans-serif" } },

          // Vehicles
          { id: "vehicle_1", label: "KA-04-HB-9021\\n(Black Pulsar)", group: "vehicle", shape: "triangle", color: "#8892B0", size: 15, font: { color: "#8892B0", size: 9, face: "sans-serif" } },
          { id: "vehicle_2", label: "KA-01-MH-9988\\n(Red Swift)", group: "vehicle", shape: "triangle", color: "#8892B0", size: 15, font: { color: "#8892B0", size: 9, face: "sans-serif" } },

          // Accounts
          { id: "acc_1", label: "UPI: cobra.ramesh@upi", group: "financial", shape: "diamond", color: "#10B981", size: 15, font: { color: "#10B981", size: 9, face: "sans-serif" } },
          { id: "acc_2", label: "ICICI Mule A/C #90123", group: "financial", shape: "diamond", color: "#10B981", size: 15, font: { color: "#10B981", size: 9, face: "sans-serif" } },
          { id: "acc_3", label: "Axis Bank #11029", group: "financial", shape: "diamond", color: "#10B981", size: 15, font: { color: "#10B981", size: 9, face: "sans-serif" } },
          { id: "acc_4", label: "Crypto Wallet 0x8F", group: "financial", shape: "diamond", color: "#10B981", size: 15, font: { color: "#10B981", size: 9, face: "sans-serif" } }
        ]);

        var edges = new vis.DataSet([
          { from: "suspect_001", to: "gang_1", label: "LEADER", color: { color: "#EF4444" }, width: 2 },
          { from: "suspect_004", to: "gang_1", label: "MEMBER", color: { color: "#3B82F6" } },
          { from: "suspect_002", to: "gang_2", label: "LEADER", color: { color: "#EF4444" }, width: 2 },
          { from: "suspect_003", to: "gang_2", label: "MEMBER", color: { color: "#8B5CF6" } },

          { from: "suspect_001", to: "vehicle_1", label: "RIDE", color: { color: "#8892B0" } },
          { from: "suspect_004", to: "vehicle_1", label: "RIDE", color: { color: "#8892B0" } },
          { from: "suspect_002", to: "vehicle_2", label: "DRIVE", color: { color: "#8892B0" } },
          { from: "suspect_003", to: "vehicle_2", label: "DRIVE", color: { color: "#8892B0" } },

          { from: "suspect_001", to: "acc_1", label: "OWNER", color: { color: "#10B981" } },
          { from: "acc_1", to: "acc_2", label: "TRANSFER ₹4.5L", color: { color: "#10B981" }, arrows: "to", width: 2 },
          { from: "suspect_002", to: "acc_3", label: "OWNER", color: { color: "#10B981" } },
          { from: "acc_3", to: "acc_4", label: "CASHOUT ₹12L", color: { color: "#10B981" }, arrows: "to", width: 2 },

          { from: "suspect_001", to: "suspect_004", label: "37 CALLS (DAILY)", color: { color: "#8B5CF6" }, dashes: true },
          { from: "suspect_002", to: "suspect_003", label: "18 CALLS (WEEKLY)", color: { color: "#8B5CF6" }, dashes: true }
        ]);

        var container = document.getElementById('network');
        var data = { nodes: nodes, edges: edges };
        var options = {
          nodes: {
            borderWidth: 2,
            shadow: true
          },
          edges: {
            color: '#1F2A44',
            font: { color: '#8892B0', size: 8, strokeWidth: 0 },
            smooth: { type: "continuous" }
          },
          physics: {
            barnesHut: {
              gravitationalConstant: -2500,
              centralGravity: 0.3,
              springLength: 90,
              springConstant: 0.04
            },
            stabilization: { iterations: 120 }
          }
        };
        var network = new vis.Network(container, data, options);
        network.on("click", function(params) {
          if (params.nodes.length > 0) {
            var nodeId = params.nodes[0];
            var message = JSON.stringify({ type: 'node_click', id: nodeId });
            window.ReactNativeWebView.postMessage(message);
          }
        });
      </script>
    </body>
    </html>
    `;
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "node_click") {
        const suspectId = data.id;
        const match = suspectsData.find(s => s.id === suspectId);
        if (match) {
          setSelectedSuspectNode(match);
        } else {
          const titleMap: Record<string, string> = {
            gang_1: "Peenya Pulsar Syndicate",
            gang_2: "Hydraulic Swift Ring",
            vehicle_1: "KA-04-HB-9021 (Black Pulsar 220)",
            vehicle_2: "KA-01-MH-9988 (Red Maruti Swift)",
            acc_1: "UPI: cobra.ramesh@upi",
            acc_2: "ICICI Mule A/C #90123849102",
            acc_3: "Axis Bank A/C #11029384",
            acc_4: "Crypto Wallet 0x8F...39A1"
          };
          const name = titleMap[suspectId] || suspectId;
          Alert.alert("Link Node Inspected", `Entity: ${name}\nConnected to corresponding crime syndicate record.`);
        }
      }
    } catch (e) {
      console.log("Error parsing webview message:", e);
    }
  };


  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Criminal & Financial Link Analysis</Text>
          <Text style={styles.headerSub}>Neo4j Graph Science • Money Trails & Organized Rings</Text>
        </View>
        <View style={styles.engineBadge}>
          <Text style={styles.engineText}>NEO4J GDS</Text>
        </View>
      </View>

      {/* Sub Tab Bar: Network vs Financial */}
      <View style={styles.tabBar}>
        <Pressable
          style={[styles.tabItem, activeTab === "network" && styles.tabItemActive]}
          onPress={() => setActiveTab("network")}
        >
          <Ionicons name="git-network-outline" size={16} color={activeTab === "network" ? "#8B5CF6" : "#8892B0"} />
          <Text style={[styles.tabText, activeTab === "network" && styles.tabTextActive]}>Gang Networks</Text>
        </Pressable>

        <Pressable
          style={[styles.tabItem, activeTab === "financial" && styles.tabItemActive]}
          onPress={() => setActiveTab("financial")}
        >
          <Ionicons name="card-outline" size={16} color={activeTab === "financial" ? "#8B5CF6" : "#8892B0"} />
          <Text style={[styles.tabText, activeTab === "financial" && styles.tabTextActive]}>Financial Money Trails</Text>
        </Pressable>
      </View>

      {activeTab === "network" && (
        <View style={styles.viewModeContainer}>
          <Pressable
            style={[styles.viewModeBtn, viewMode === "graph" && styles.viewModeBtnActive]}
            onPress={() => setViewMode("graph")}
          >
            <Ionicons name="git-branch" size={13} color={viewMode === "graph" ? "#8B5CF6" : "#8892B0"} />
            <Text style={[styles.viewModeText, viewMode === "graph" && styles.viewModeTextActive]}>Interactive Link Graph</Text>
          </Pressable>
          <Pressable
            style={[styles.viewModeBtn, viewMode === "list" && styles.viewModeBtnActive]}
            onPress={() => setViewMode("list")}
          >
            <Ionicons name="list" size={13} color={viewMode === "list" ? "#8B5CF6" : "#8892B0"} />
            <Text style={[styles.viewModeText, viewMode === "list" && styles.viewModeTextActive]}>Syndicate List</Text>
          </Pressable>
        </View>
      )}

      {activeTab === "network" ? (
        viewMode === "graph" ? (
          <View style={{ flex: 1, position: "relative" }}>
            <WebView
              originWhitelist={["*"]}
              source={{ html: generateGraphHTML() }}
              style={{ flex: 1, backgroundColor: "#0A0F1C" }}
              onMessage={handleWebViewMessage}
            />

            {/* Legend Overlay */}
            <View style={styles.legendContainer}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: "#F59E0B" }]} />
                <Text style={styles.legendText}>Syndicate</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: "#EF4444" }]} />
                <Text style={styles.legendText}>Kingpin</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: "#8B5CF6" }]} />
                <Text style={styles.legendText}>Lieutenant</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: "#6B7280" }]} />
                <Text style={styles.legendText}>Vehicle</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: "#10B981" }]} />
                <Text style={styles.legendText}>Financials</Text>
              </View>
            </View>

            {/* Suspect Node Detail Panel Overlay */}
            {selectedSuspectNode && (
              <View style={styles.selectedNodeCard}>
                <View style={styles.selectedNodeHeader}>
                  <Text style={styles.selectedNodeName}>{selectedSuspectNode.name} ({selectedSuspectNode.alias})</Text>
                  <Pressable onPress={() => setSelectedSuspectNode(null)}>
                    <Ionicons name="close" size={18} color="#8892B0" />
                  </Pressable>
                </View>
                <Text style={styles.selectedNodeSub}>{selectedSuspectNode.role} • {selectedSuspectNode.gangName}</Text>
                <Text style={styles.selectedNodeDetail}>MO: {selectedSuspectNode.moVectorSummary}</Text>
                <View style={styles.selectedNodeStats}>
                  <Text style={styles.selectedNodeStat}>Centrality: {(selectedSuspectNode.degreeCentrality * 100).toFixed(0)}%</Text>
                  <Text style={styles.selectedNodeStat}>FIRs: {selectedSuspectNode.firsCount}</Text>
                  <Text style={styles.selectedNodeStat}>Status: {selectedSuspectNode.icjsStatus}</Text>
                </View>
                <Pressable
                  style={styles.selectedNodeBtn}
                  onPress={() => {
                    const node = selectedSuspectNode;
                    setSelectedSuspectNode(null);
                    router.push({
                      pathname: "/tools/suspect-profile",
                      params: {
                        id: node.id,
                        name: node.name,
                        alias: node.alias,
                        gangName: node.gangName,
                        role: node.role,
                        icjsStatus: node.icjsStatus,
                        firsCount: node.firsCount.toString(),
                        centrality: node.degreeCentrality.toString(),
                        location: node.lastKnownLocation,
                        district: node.district,
                        moSummary: node.moVectorSummary,
                      },
                    });
                  }}
                >
                  <Text style={styles.selectedNodeBtnText}>View Full Criminal Profile</Text>
                </Pressable>
              </View>
            )}
          </View>
        ) : (
          <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
            {/* Louvain Algorithm Summary Card */}
            <View style={styles.algoCard}>
              <View style={styles.algoHeader}>
                <Ionicons name="git-network-outline" size={20} color="#8B5CF6" />
                <Text style={styles.algoTitle}>Graph Neural Network & Centrality</Text>
              </View>
              <Text style={styles.algoDesc}>
                Algorithms analyze co-occurrence in CCTNS FIRs, shared vehicles, and financial trails to automatically uncover hidden crime syndicates and flag kingpins.
              </Text>
              <View style={styles.algoPills}>
                <View style={styles.pill}>
                  <Text style={styles.pillText}>Louvain Modular Clusters: 2 Active</Text>
                </View>
                <View style={styles.pill}>
                  <Text style={styles.pillText}>Degree Centrality: Max 0.94</Text>
                </View>
              </View>
            </View>

            {/* Organized Crime Rings */}
            <Text style={styles.sectionTitle}>Identified Crime Syndicates</Text>

            {gangsData.map((gang) => (
              <View key={gang.id} style={styles.gangCard}>
                <View style={styles.gangHeader}>
                  <View>
                    <Text style={styles.gangName}>{gang.name}</Text>
                    <Text style={styles.gangZone}>{gang.primaryZone}</Text>
                  </View>
                  <View style={styles.riskBadge}>
                    <Text style={styles.riskText}>Risk Score: {gang.riskScore}/100</Text>
                  </View>
                </View>

                <View style={styles.leaderRow}>
                  <Ionicons name="ribbon-outline" size={16} color="#EF4444" />
                  <Text style={styles.leaderLabel}>Identified Kingpin (Degree Centrality High):</Text>
                  <Text style={styles.leaderName}>{gang.leader}</Text>
                </View>

                <View style={styles.districtsRow}>
                  <Text style={styles.districtsLabel}>Active Districts:</Text>
                  {gang.activeDistricts.map((d) => (
                    <View key={d} style={styles.distChip}>
                      <Text style={styles.distText}>{d}</Text>
                    </View>
                  ))}
                </View>

                {/* Network Nodes Grid */}
                <Text style={styles.nodesTitle}>Key Suspect Nodes ({gang.suspects.length})</Text>
                <View style={styles.nodesGrid}>
                  {gang.suspects.map((s) => (
                    <Pressable
                      key={s.id}
                      style={styles.nodeCard}
                      onPress={() =>
                        router.push({
                          pathname: "/tools/suspect-profile",
                          params: {
                            id: s.id,
                            name: s.name,
                            alias: s.alias,
                            gangName: s.gangName,
                            role: s.role,
                            icjsStatus: s.icjsStatus,
                            firsCount: s.firsCount.toString(),
                            centrality: s.degreeCentrality.toString(),
                            location: s.lastKnownLocation,
                            district: s.district,
                            moSummary: s.moVectorSummary,
                          },
                        })
                      }
                    >
                      <View style={styles.nodeAvatar}>
                        <Text style={styles.nodeAvatarText}>{s.name[0]}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={styles.nodeTopRow}>
                          <Text style={styles.nodeName}>{s.alias}</Text>
                          {s.role === "Kingpin" && (
                            <View style={styles.kingpinBadge}>
                              <Text style={styles.kingpinText}>KINGPIN</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.nodeSub}>{s.role} • {s.firsCount} FIRs</Text>
                        <Text style={styles.nodeCentrality}>Centrality: {(s.degreeCentrality * 100).toFixed(0)}%</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color="#8892B0" />
                    </Pressable>
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>
        )
      ) : (
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          {/* Financial Crime Overview */}
          <View style={styles.algoCard}>
            <View style={styles.algoHeader}>
              <Ionicons name="card-outline" size={20} color="#06B6D4" />
              <Text style={styles.algoTitle}>Financial Transaction & Mule Account Link Engine</Text>
            </View>
            <Text style={styles.algoDesc}>
              Detects illicit fund flows between extortion/robbery proceeds, bank mule accounts, UPI VPAs, and crypto cashout wallets linked to suspect profiles.
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Flagged Suspicious Money Trails ({financialTrails.length})</Text>

          {financialTrails.map((trail) => (
            <View key={trail.id} style={styles.trailCard}>
              <View style={styles.trailHeader}>
                <View style={styles.flagPill}>
                  <Text style={styles.flagText}>{trail.flag}</Text>
                </View>
                <Text style={styles.trailAmount}>{trail.amount}</Text>
              </View>

              <View style={styles.trailFlow}>
                <View style={styles.accBox}>
                  <Text style={styles.accLabel}>Source Account</Text>
                  <Text style={styles.accVal}>{trail.sourceAccount}</Text>
                </View>
                <Ionicons name="arrow-forward" size={18} color="#8B5CF6" />
                <View style={styles.accBox}>
                  <Text style={styles.accLabel}>Destination Mule</Text>
                  <Text style={styles.accVal}>{trail.destinationAccount}</Text>
                </View>
              </View>

              <View style={styles.trailFooter}>
                <Ionicons name="link-outline" size={14} color="#EF4444" />
                <Text style={styles.trailSuspect}>Linked Suspect: {trail.linkedSuspect}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
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
  engineBadge: {
    backgroundColor: "#8B5CF620",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#8B5CF6",
  },
  engineText: { fontSize: 10, fontWeight: "900", color: "#8B5CF6" },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#141A2E",
    padding: 4,
    marginHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1F2A44",
  },
  tabItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
  },
  tabItemActive: { backgroundColor: "#8B5CF620" },
  tabText: { fontSize: 11, color: "#8892B0", fontWeight: "600" },
  tabTextActive: { color: "#8B5CF6", fontWeight: "800" },
  content: { flex: 1 },
  scrollContent: { padding: 18, gap: 16 },
  algoCard: {
    backgroundColor: "#141A2E",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1F2A44",
    gap: 8,
  },
  algoHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  algoTitle: { fontSize: 14, fontWeight: "800", color: "#8B5CF6" },
  algoDesc: { fontSize: 11, color: "#8892B0", lineHeight: 16 },
  algoPills: { flexDirection: "row", gap: 8, marginTop: 4 },
  pill: { backgroundColor: "#8B5CF615", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  pillText: { fontSize: 10, color: "#8B5CF6", fontWeight: "700" },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#F0F4FF" },
  gangCard: {
    backgroundColor: "#141A2E",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#1F2A44",
    gap: 10,
  },
  gangHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  gangName: { fontSize: 16, fontWeight: "800", color: "#F0F4FF" },
  gangZone: { fontSize: 11, color: "#8892B0", marginTop: 2 },
  riskBadge: { backgroundColor: "#EF444420", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: "#EF4444" },
  riskText: { fontSize: 10, fontWeight: "900", color: "#EF4444" },
  leaderRow: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#0A0F1C", padding: 10, borderRadius: 10 },
  leaderLabel: { fontSize: 11, color: "#8892B0" },
  leaderName: { fontSize: 11, fontWeight: "800", color: "#F0F4FF" },
  districtsRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  districtsLabel: { fontSize: 11, color: "#8892B0" },
  distChip: { backgroundColor: "#3B82F620", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  distText: { fontSize: 10, color: "#3B82F6", fontWeight: "700" },
  nodesTitle: { fontSize: 12, fontWeight: "700", color: "#8892B0", marginTop: 4 },
  nodesGrid: { gap: 8 },
  nodeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#0A0F1C",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1F2A44",
  },
  nodeAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#8B5CF6", alignItems: "center", justifyContent: "center" },
  nodeAvatarText: { fontSize: 16, fontWeight: "800", color: "#FFFFFF" },
  nodeTopRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  nodeName: { fontSize: 13, fontWeight: "700", color: "#F0F4FF" },
  kingpinBadge: { backgroundColor: "#EF444420", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  kingpinText: { fontSize: 8, fontWeight: "900", color: "#EF4444" },
  nodeSub: { fontSize: 10, color: "#8892B0" },
  nodeCentrality: { fontSize: 9, color: "#8B5CF6", fontWeight: "700" },

  // Financial Trail Styles
  trailCard: {
    backgroundColor: "#141A2E",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#8B5CF660",
    gap: 10,
  },
  trailHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  flagPill: { backgroundColor: "#8B5CF620", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  flagText: { fontSize: 10, fontWeight: "900", color: "#8B5CF6" },
  trailAmount: { fontSize: 16, fontWeight: "900", color: "#22C55E" },
  trailFlow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#0A0F1C", padding: 12, borderRadius: 12 },
  accBox: { flex: 1, gap: 2 },
  accLabel: { fontSize: 9, color: "#8892B0" },
  accVal: { fontSize: 11, fontWeight: "700", color: "#F0F4FF" },
  trailFooter: { flexDirection: "row", alignItems: "center", gap: 6, paddingTop: 4 },
  trailSuspect: { fontSize: 11, fontWeight: "700", color: "#EF4444" },

  // New Link Graph & Legend Styles
  viewModeContainer: {
    flexDirection: "row",
    backgroundColor: "#141A2E",
    padding: 3,
    marginHorizontal: 18,
    marginVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#1F2A44",
  },
  viewModeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 6,
    borderRadius: 6,
  },
  viewModeBtnActive: {
    backgroundColor: "#8B5CF620",
  },
  viewModeText: {
    fontSize: 10,
    color: "#8892B0",
    fontWeight: "600",
  },
  viewModeTextActive: {
    color: "#8B5CF6",
    fontWeight: "700",
  },
  legendContainer: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(20, 26, 46, 0.95)",
    borderWidth: 1,
    borderColor: "#1F2A44",
    padding: 8,
    borderRadius: 8,
    gap: 4,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 9,
    color: "#F0F4FF",
    fontWeight: "600",
  },
  selectedNodeCard: {
    position: "absolute",
    bottom: 10,
    left: 10,
    right: 10,
    backgroundColor: "rgba(20, 26, 46, 0.98)",
    borderWidth: 1,
    borderColor: "#8B5CF680",
    borderRadius: 12,
    padding: 12,
    gap: 6,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  selectedNodeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectedNodeName: {
    fontSize: 13,
    fontWeight: "800",
    color: "#F0F4FF",
  },
  selectedNodeSub: {
    fontSize: 10,
    color: "#8B5CF6",
    fontWeight: "700",
  },
  selectedNodeDetail: {
    fontSize: 10,
    color: "#8892B0",
    lineHeight: 14,
    marginVertical: 2,
  },
  selectedNodeStats: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#0A0F1C",
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#1F2A44",
  },
  selectedNodeStat: {
    fontSize: 9,
    color: "#F0F4FF",
    fontWeight: "700",
  },
  selectedNodeBtn: {
    backgroundColor: "#8B5CF6",
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 4,
  },
  selectedNodeBtnText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
