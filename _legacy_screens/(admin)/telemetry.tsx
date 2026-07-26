import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ProgressBarAndroid, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function AdminTelemetry() {
  const [syncProgress, setSyncProgress] = useState(0.85);
  const [nodes, setNodes] = useState([
    { name: "Central Intelligence Hub", status: "ONLINE", latency: "12ms" },
    { name: "CCTNS State Database Link", status: "ONLINE", latency: "42ms" },
    { name: "ANPR Detection Network", status: "ONLINE", latency: "8ms" },
    { name: "Namma 112 Dispatch Node", status: "ONLINE", latency: "16ms" },
    { name: "DBSCAN Predictive Server", status: "DEGRADED", latency: "310ms" },
  ]);

  const [anprHits, setAnprHits] = useState([
    { id: 1, plate: "KA-03-ME-9092", location: "Koramangala Ring Rd", time: "1m ago", status: "UNREGISTERED" },
    { id: 2, plate: "KA-51-MB-1122", location: "Peenya Industrial Area", time: "3m ago", status: "SUSPECT_MATCH" },
    { id: 3, plate: "KA-01-HH-4882", location: "MG Road Junction", time: "8m ago", status: "SPEED_EXCESS" },
  ]);

  const [drones, setDrones] = useState([
    { id: "DRONE-A", battery: 94, status: "PATROLLING", sector: "Indiranagar" },
    { id: "DRONE-B", battery: 67, status: "PATROLLING", sector: "Peenya" },
    { id: "DRONE-C", battery: 12, status: "RETURNING", sector: "Koramangala" },
    { id: "DRONE-D", battery: 100, status: "DOCK_CHARGING", sector: "HQ Base" },
  ]);

  // Simulate real-time progress & hit triggers
  useEffect(() => {
    const timer = setInterval(() => {
      // Simulate ANPR hit
      const newHit = {
        id: Date.now(),
        plate: `KA-0${Math.floor(1 + Math.random()*9)}-${String.fromCharCode(65 + Math.floor(Math.random()*26))}${String.fromCharCode(65 + Math.floor(Math.random()*26))}-${Math.floor(1000 + Math.random()*9000)}`,
        location: ["Hebbal Flyover", "Whitefield Main", "Silk Board", "Jayanagar 4th Block"][Math.floor(Math.random()*4)],
        time: "Just now",
        status: ["SPEED_EXCESS", "SUSPECT_MATCH", "UNREGISTERED"][Math.floor(Math.random()*3)],
      };
      setAnprHits(prev => [newHit, ...prev.slice(0, 3)]);

      // Randomize battery on drones
      setDrones(prev => prev.map(d => {
        if (d.status === "PATROLLING") {
          const newBatt = Math.max(0, d.battery - 1);
          return { ...d, battery: newBatt, status: newBatt < 10 ? "RETURNING" : "PATROLLING" };
        } else if (d.status === "DOCK_CHARGING") {
          const newBatt = Math.min(100, d.battery + 5);
          return { ...d, battery: newBatt, status: newBatt === 100 ? "PATROLLING" : "DOCK_CHARGING" };
        } else if (d.status === "RETURNING" && d.battery <= 10) {
          return { ...d, status: "DOCK_CHARGING" };
        }
        return d;
      }));

      // Sync progress
      setSyncProgress(prev => (prev >= 1 ? 0.90 : prev + 0.01));
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>System Integration Health</Text>
        <Text style={styles.subtitle}>Super Admin Operations & Diagnostic Control</Text>
      </View>

      {/* Database Sync Status */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="cloud-upload" size={18} color="#EF4444" />
          <Text style={styles.cardTitle}>State CCTNS Central Cloud Sync</Text>
        </View>
        <Text style={styles.syncLabel}>Operational Integration: {(syncProgress * 100).toFixed(0)}% Synchronized</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressBar, { width: `${syncProgress * 100}%` }]} />
        </View>
        <Text style={styles.syncSub}>Last verified database handshake 4s ago</Text>
      </View>

      {/* Network Nodes Latency */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="server" size={18} color="#EF4444" />
          <Text style={styles.cardTitle}>Active Infrastructure Nodes</Text>
        </View>
        <View style={styles.nodesList}>
          {nodes.map((node, i) => (
            <View key={i} style={styles.nodeRow}>
              <View style={styles.nodeLeft}>
                <View style={[styles.statusDot, node.status === "ONLINE" ? styles.dotOnline : styles.dotDegraded]} />
                <Text style={styles.nodeName}>{node.name}</Text>
              </View>
              <Text style={styles.nodeLatency}>{node.latency}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Real-time ANPR Alarms */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="eye" size={18} color="#EF4444" />
          <Text style={styles.cardTitle}>Safe City ANPR Alarms (Live)</Text>
        </View>
        <View style={styles.anprList}>
          {anprHits.map((hit) => (
            <View key={hit.id} style={styles.anprRow}>
              <View style={styles.anprLeft}>
                <View style={styles.plateBadge}>
                  <Text style={styles.plateText}>{hit.plate}</Text>
                </View>
                <View>
                  <Text style={styles.anprLoc}>{hit.location}</Text>
                  <Text style={styles.anprTime}>{hit.time}</Text>
                </View>
              </View>
              <View style={[
                styles.statusBadge,
                hit.status === "SUSPECT_MATCH" ? styles.badgeSuspect : hit.status === "SPEED_EXCESS" ? styles.badgeSpeed : styles.badgeUnreg
              ]}>
                <Text style={styles.statusBadgeText}>{hit.status}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Drone Patrol Grid */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="airplane" size={18} color="#EF4444" />
          <Text style={styles.cardTitle}>KSP Autonomous Drone Fleet</Text>
        </View>
        <View style={styles.droneGrid}>
          {drones.map((drone) => (
            <View key={drone.id} style={styles.droneCard}>
              <View style={styles.droneHeader}>
                <Text style={styles.droneId}>{drone.id}</Text>
                <Text style={[
                  styles.droneStatus,
                  drone.status === "PATROLLING" ? { color: "#10B981" } : drone.status === "RETURNING" ? { color: "#F59E0B" } : { color: "#3B82F6" }
                ]}>
                  {drone.status}
                </Text>
              </View>
              <Text style={styles.droneSector}>Sector: {drone.sector}</Text>
              <View style={styles.batteryRow}>
                <Ionicons 
                  name={drone.battery > 50 ? "battery-full" : drone.battery > 20 ? "battery-dead" : "battery-dead"} 
                  size={16} 
                  color={drone.battery > 50 ? "#10B981" : drone.battery > 20 ? "#F59E0B" : "#EF4444"} 
                />
                <Text style={styles.batteryText}>{drone.battery}% Charged</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#060913" },
  content: { padding: 16, gap: 16 },
  header: { marginBottom: 10 },
  title: { fontSize: 20, fontWeight: "900", color: "#F0F4FF", fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 11, color: "#8892B0", fontFamily: "Inter_400Regular" },

  card: { backgroundColor: "#0D1326", borderWidth: 1, borderColor: "#1F2A44", borderRadius: 18, padding: 16, gap: 12 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  cardTitle: { fontSize: 13, fontWeight: "800", color: "#F0F4FF", fontFamily: "Inter_700Bold", letterSpacing: 0.5 },

  syncLabel: { fontSize: 11, color: "#8892B0", fontFamily: "Inter_500Medium" },
  progressTrack: { height: 8, backgroundColor: "#141A2E", borderRadius: 4, overflow: "hidden" },
  progressBar: { height: "100%", backgroundColor: "#EF4444", borderRadius: 4 },
  syncSub: { fontSize: 9, color: "#4B5563", fontFamily: "Inter_400Regular" },

  nodesList: { gap: 10 },
  nodeRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 4 },
  nodeLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  dotOnline: { backgroundColor: "#10B981", shadowColor: "#10B981", shadowRadius: 4, shadowOpacity: 0.8 },
  dotDegraded: { backgroundColor: "#F59E0B", shadowColor: "#F59E0B", shadowRadius: 4, shadowOpacity: 0.8 },
  nodeName: { fontSize: 11, color: "#F0F4FF", fontFamily: "Inter_500Medium" },
  nodeLatency: { fontSize: 11, color: "#8892B0", fontFamily: "monospace" },

  anprList: { gap: 10 },
  anprRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#080C18", borderRadius: 12, padding: 10 },
  anprLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  plateBadge: { backgroundColor: "#1F2A44", borderWidth: 1, borderColor: "#3B82F6", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  plateText: { fontSize: 10, fontWeight: "900", color: "#F0F4FF", fontFamily: "monospace" },
  anprLoc: { fontSize: 10, fontWeight: "bold", color: "#F0F4FF", fontFamily: "Inter_600SemiBold" },
  anprTime: { fontSize: 8, color: "#8892B0", fontFamily: "Inter_400Regular" },
  statusBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  statusBadgeText: { fontSize: 8, fontWeight: "900", color: "#FFFFFF", fontFamily: "Inter_700Bold" },
  badgeSuspect: { backgroundColor: "#EF4444" },
  badgeSpeed: { backgroundColor: "#F59E0B" },
  badgeUnreg: { backgroundColor: "#3B82F6" },

  droneGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  droneCard: { width: "48%", backgroundColor: "#080C18", borderWidth: 1, borderColor: "#1F2A44", borderRadius: 12, padding: 10, gap: 4 },
  droneHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  droneId: { fontSize: 11, fontWeight: "bold", color: "#F0F4FF", fontFamily: "Inter_700Bold" },
  droneStatus: { fontSize: 8, fontWeight: "800", fontFamily: "Inter_700Bold" },
  droneSector: { fontSize: 9, color: "#8892B0", fontFamily: "Inter_500Medium" },
  batteryRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  batteryText: { fontSize: 9, color: "#8892B0", fontFamily: "Inter_400Regular" },
});
