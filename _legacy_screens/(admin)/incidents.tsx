import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import { useApp } from "@/context/AppContext";
import { getThemeColors } from "@/constants/theme";
import KarnatakaMap from "@/components/KarnatakaMap";

export default function AdminIncidents() {
  const { theme: activeTheme } = useApp();
  const theme = getThemeColors(activeTheme);
  const [viewMode, setViewMode] = useState<"graph" | "map">("graph");
  const [selectedNode, setSelectedNode] = useState<any | null>(null);

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

  const NODE_DETAILS: Record<string, { title: string; subtitle: string; description: string; alertLevel: string; ipcAna: string }> = {
    synd_1: {
      title: "Peenya Robbery Cartel",
      subtitle: "Active Organized Crime Syndicate",
      description: "Louvain community modular index flags 3 key offenders linked via shared getaway vehicle (KA-04-MH-1234). Operating near unlit metro flyovers.",
      alertLevel: "HIGH RISK",
      ipcAna: "IPC Sec 379A (Chain Snatching) / Sec 392 (Robbery)"
    },
    synd_2: {
      title: "UPI Phishing Ring 09",
      subtitle: "Cyber Fraud Network Cluster",
      description: "Financial link engine flagged 14 connected mule bank accounts routing illicit proceeds via dummy scrap dealer UPI IDs. Main cashout points in Peenya.",
      alertLevel: "CRITICAL CRIME",
      ipcAna: "IT Act Sec 66D / IPC Sec 420 (Cheating)"
    },
    s_1: {
      title: "Cobra Ramesh (Kingpin)",
      subtitle: "Syndicate Organizer & Coordinator",
      description: "Degree centrality 87%. Direct links to 12 active house-breaking FIRs across Peenya and Hubballi. State ICJS lists active bail conditions.",
      alertLevel: "WANTED LEADER",
      ipcAna: "IPC Sec 454 (Lurking House Trespass)"
    },
    s_2: {
      title: "Mule Gowda (Manager)",
      subtitle: "UPI Account Operations Manager",
      description: "Manages 4 active UPI virtual private addresses (VPAs) used to redirect phishing victim deposits. Communications intercept validated.",
      alertLevel: "ACTIVE THREAT",
      ipcAna: "IPC Sec 120B (Criminal Conspiracy)"
    },
    bank_1: {
      title: "SBI Mule A/C *9982",
      subtitle: "Extortion Proceeds Deposit Point",
      description: "Flagged for sudden ₹14.5 Lakhs UPI inflow in last 48 hours. Registered name is dummy entity 'Ramesh Scrap Traders'.",
      alertLevel: "MULE ACCOUNT",
      ipcAna: "PMLA Act 2002 / IPC Sec 411"
    },
    cam_1: {
      title: "CCTV SC_004 (Silk Board)",
      subtitle: "Safe City Camera Node",
      description: "Edge AI camera which captured license plate KA-04-MH-1234 matching suspect profiles on the CCTNS hotlist.",
      alertLevel: "SURVEILLANCE MATCH",
      ipcAna: "Safe City Camera Telemetry Feed"
    }
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "node_click") {
        const details = NODE_DETAILS[data.nodeId];
        if (details) {
          setSelectedNode(details);
        } else {
          setSelectedNode({
            title: `Node: ${data.nodeId}`,
            subtitle: "Network Entity Info",
            description: `Automated node node details for ${data.nodeId}. Real-time property link analysis is active on super admin console.`,
            alertLevel: "MONITORED",
            ipcAna: "CCTNS Link Resolution"
          });
        }
      }
    } catch (err) {
      console.log("Failed to parse link graph message:", err);
    }
  };

  const generateAdminGraphHTML = () => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>SAHASRA AI Command Graph</title>
        <script type="text/javascript" src="https://unpkg.com/vis-network/standalone/umd/vis-network.min.js"></script>
        <style type="text/css">
          html, body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            background-color: #0A0F1C;
            overflow: hidden;
          }
          #network {
            width: 100%;
            height: 100%;
          }
        </style>
      </head>
      <body>
        <div id="network"></div>
        <script type="text/javascript">
          var nodes = new vis.DataSet([
            // Syndicates
            { id: "synd_1", label: "Peenya Robbery Cartel", shape: "star", color: "#EF4444", size: 26, font: { color: "#F0F4FF", size: 12, face: "sans-serif" } },
            { id: "synd_2", label: "UPI Phishing Ring 09", shape: "star", color: "#F59E0B", size: 26, font: { color: "#F0F4FF", size: 12, face: "sans-serif" } },

            // Suspects
            { id: "s_1", label: "Cobra Ramesh\\n(Kingpin)", shape: "dot", color: "#EF4444", size: 20, font: { color: "#F0F4FF", size: 10, face: "sans-serif" } },
            { id: "s_2", label: "Mule Gowda\\n(Manager)", shape: "dot", color: "#8B5CF6", size: 16, font: { color: "#F0F4FF", size: 10, face: "sans-serif" } },
            { id: "s_3", label: "Rakesh K.\\n(Runner)", shape: "dot", color: "#3B82F6", size: 12, font: { color: "#F0F4FF", size: 10, face: "sans-serif" } },

            // Mule accounts
            { id: "bank_1", label: "SBI Mule (A/C: *9982)", shape: "diamond", color: "#10B981", size: 16, font: { color: "#F0F4FF", size: 10, face: "sans-serif" } },
            { id: "bank_2", label: "HDFC VPA (mule@ybl)", shape: "diamond", color: "#10B981", size: 16, font: { color: "#F0F4FF", size: 10, face: "sans-serif" } },

            // Patrol Assets & Camera feeds
            { id: "cam_1", label: "CCTV CAM_PL_04", shape: "triangle", color: "#06B6D4", size: 15, font: { color: "#F0F4FF", size: 10, face: "sans-serif" } },
            { id: "patrol_1", label: "Akka Patrol #3", shape: "square", color: "#3B82F6", size: 15, font: { color: "#F0F4FF", size: 10, face: "sans-serif" } }
          ]);

          var edges = new vis.DataSet([
            { from: "synd_1", to: "s_1", label: "commands", color: { color: "#EF4444", opacity: 0.8 } },
            { from: "s_1", to: "s_2", label: "coordinates", color: { color: "#8B5CF6", opacity: 0.6 } },
            { from: "s_2", to: "s_3", label: "funds flow", color: { color: "#8B5CF6", opacity: 0.6 } },
            { from: "s_3", to: "bank_1", label: "deposits", color: { color: "#10B981", opacity: 0.8 } },
            { from: "s_2", to: "bank_2", label: "UPI route", color: { color: "#10B981", opacity: 0.8 } },
            { from: "bank_1", to: "synd_2", label: "extortion proceeds", color: { color: "#F59E0B", opacity: 0.6 } },
            { from: "cam_1", to: "s_1", label: "captured ANPR", color: { color: "#06B6D4", opacity: 0.6 } },
            { from: "patrol_1", to: "s_1", label: "intercepting", color: { color: "#3B82F6", opacity: 0.6 } }
          ]);

          var container = document.getElementById('network');
          var data = { nodes: nodes, edges: edges };
          var options = {
            nodes: {
              borderWidth: 2,
              shadow: true
            },
            edges: {
              width: 2,
              font: { size: 8, color: "#8892B0", strokeWidth: 0, align: "middle" },
              arrows: { to: { enabled: true, scaleFactor: 0.8 } }
            },
            physics: {
              barnesHut: { gravitationalConstant: -3000, centralGravity: 0.3, springLength: 95 },
              stabilization: { iterations: 150 }
            }
          };
          var network = new vis.Network(container, data, options);

          network.on("selectNode", function (params) {
            if (params.nodes.length > 0) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: "node_click", nodeId: params.nodes[0] }));
            }
          });
        </script>
      </body>
      </html>
    `;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Syndicate Intelligence & Network War Room</Text>
        <Text style={[styles.subtitle, { color: theme.muted }]}>Cross-District Syndicate Graph, Financial Mule Trails & Global Heatmap</Text>
      </View>

      {/* Segmented Control Selector Tabs */}
      <View style={styles.tabsRow}>
        <Pressable
          style={[styles.tabBtn, viewMode === "graph" && styles.tabBtnActive]}
          onPress={() => setViewMode("graph")}
        >
          <Ionicons name="git-branch" size={14} color={viewMode === "graph" ? "#EF4444" : "#8892B0"} />
          <Text style={[styles.tabText, viewMode === "graph" && styles.tabTextActive]}>Interactive Link Graph</Text>
        </Pressable>

        <Pressable
          style={[styles.tabBtn, viewMode === "map" && styles.tabBtnActive]}
          onPress={() => setViewMode("map")}
        >
          <Ionicons name="map" size={14} color={viewMode === "map" ? "#EF4444" : "#8892B0"} />
          <Text style={[styles.tabText, viewMode === "map" && styles.tabTextActive]}>Global Threat Map</Text>
        </Pressable>
      </View>

      {/* Main Display Frame */}
      {viewMode === "graph" ? (
        <View style={styles.graphWrapper}>
          <WebView
            originWhitelist={["*"]}
            source={{ html: generateAdminGraphHTML() }}
            style={{ flex: 1, backgroundColor: "#0A0F1C" }}
            onMessage={handleWebViewMessage}
          />

          {/* Floating node info sheet */}
          {selectedNode ? (
            <View style={[styles.infoSheet, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <View style={styles.infoSheetHeader}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={[styles.infoTitle, { color: theme.text }]}>{selectedNode.title}</Text>
                  <Text style={{ fontSize: 9, color: theme.muted }}>{selectedNode.subtitle}</Text>
                </View>
                <View style={styles.dangerBadge}>
                  <Text style={styles.dangerText}>{selectedNode.alertLevel}</Text>
                </View>
              </View>

              <Text style={[styles.infoBody, { color: theme.text }]}>{selectedNode.description}</Text>
              
              <View style={styles.ipcRow}>
                <Ionicons name="document-text-outline" size={12} color="#EF4444" />
                <Text style={{ fontSize: 9, color: "#EF4444", fontWeight: "700" }}>{selectedNode.ipcAna}</Text>
              </View>

              <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
                <Pressable
                  style={styles.actionBtn}
                  onPress={() => {
                    Alert.alert("TACTICAL INITIATED", `Command Center dispatched intelligence intercept team for node: ${selectedNode.title}`);
                  }}
                >
                  <Text style={styles.actionText}>DISPATCH INTEL INTERCEPT</Text>
                </Pressable>
                <Pressable
                  style={[styles.actionBtn, { backgroundColor: "transparent", borderWidth: 1, borderColor: "#8892B0" }]}
                  onPress={() => setSelectedNode(null)}
                >
                  <Text style={[styles.actionText, { color: "#8892B0" }]}>DISMISS</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.instructionBanner}>
              <Ionicons name="help-circle-outline" size={16} color="#8892B0" />
              <Text style={styles.instructionText}>Tap any syndicate node or transaction point to view link analytics</Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.mapWrapper}>
          <KarnatakaMap
            complaints={complaints as any}
            sosAlerts={sosAlerts}
            policeStations={policeStations}
            riskZones={riskZones}
            filter="all"
            userDistrict="Bengaluru Urban"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#060913" },
  header: { padding: 16, paddingTop: 12 },
  title: { fontSize: 15, fontWeight: "900", color: "#F0F4FF", fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 10, color: "#8892B0", marginTop: 2, fontFamily: "Inter_400Regular" },

  tabsRow: { flexDirection: "row", paddingHorizontal: 16, gap: 10, marginBottom: 12 },
  tabBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, backgroundColor: "#0D1326", borderWidth: 1, borderColor: "#1F2A44", flex: 1, justifyContent: "center" },
  tabBtnActive: { borderColor: "#EF4444", backgroundColor: "#EF444410" },
  tabText: { fontSize: 11, color: "#8892B0", fontWeight: "700" },
  tabTextActive: { color: "#EF4444" },

  graphWrapper: { flex: 1, position: "relative" },
  mapWrapper: { flex: 1, borderTopWidth: 1, borderColor: "#1F2A44" },

  infoSheet: { position: "absolute", bottom: 20, left: 16, right: 16, borderRadius: 20, borderWidth: 1, padding: 16, gap: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 10 },
  infoSheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  infoTitle: { fontSize: 13, fontWeight: "900" },
  dangerBadge: { backgroundColor: "#EF444420", borderWidth: 1, borderColor: "#EF444488", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  dangerText: { fontSize: 8, color: "#EF4444", fontWeight: "900" },
  infoBody: { fontSize: 10, lineHeight: 14 },
  ipcRow: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#EF444410", padding: 6, borderRadius: 8 },

  actionBtn: { flex: 1, backgroundColor: "#EF4444", paddingVertical: 8, borderRadius: 10, alignItems: "center" },
  actionText: { fontSize: 9, fontWeight: "900", color: "#FFFFFF" },

  instructionBanner: { position: "absolute", bottom: 20, alignSelf: "center", backgroundColor: "rgba(13,19,38,0.9)", borderWidth: 1, borderColor: "#1F2A44", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, flexDirection: "row", alignItems: "center", gap: 6 },
  instructionText: { fontSize: 9, color: "#8892B0", fontWeight: "700" },
});
