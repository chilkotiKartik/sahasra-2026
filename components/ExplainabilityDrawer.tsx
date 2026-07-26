import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Modal, Pressable, ScrollView, Animated, Easing } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "@/context/AppContext";
import { getThemeColors } from "@/constants/theme";

interface ShapleyWeight {
  feature: string;
  weight: number;
}

interface CriminologyTheory {
  name: string;
  tag: string;
  description: string;
  recommendation: string;
}

interface ExplainabilityDrawerProps {
  visible: boolean;
  onClose: () => void;
  hotspotName: string;
  recentFIRs?: string[];
  shapleyWeights?: ShapleyWeight[];
  theory?: CriminologyTheory;
}

interface AnimatedBarProps {
  weight: number;
  color: string;
  themeBg: string;
  visible: boolean;
}

function AnimatedBar({ weight, color, themeBg, visible }: AnimatedBarProps) {
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      widthAnim.setValue(0);
      Animated.timing(widthAnim, {
        toValue: weight,
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    }
  }, [visible, weight]);

  return (
    <View style={[styles.progressTrack, { backgroundColor: themeBg }]}>
      <Animated.View
        style={[
          styles.progressBar,
          {
            backgroundColor: color,
            width: widthAnim.interpolate({
              inputRange: [0, 100],
              outputRange: ["0%", "100%"],
            }),
          },
        ]}
      />
    </View>
  );
}

export default function ExplainabilityDrawer({
  visible,
  onClose,
  hotspotName,
  recentFIRs = ["FIR #48/2026", "FIR #102/2026", "FIR #115/2026", "FIR #203/2026"],
  shapleyWeights = [
    { feature: "Streetlight Outage Density (dark spots)", weight: 34.2 },
    { feature: "Alcohol/Liquor Shop Proximity (< 100m)", weight: 28.5 },
    { feature: "Historical Crime Propensity Index", weight: 21.1 },
    { feature: "Temporal Covariant (Holiday Weekend Shift)", weight: 16.2 }
  ],
  theory = {
    name: "Busy Streets Theory (CPTED Environmental Design)",
    tag: "Busy Streets",
    description: "Maintaining neighborhood cleanups, lighting repairs, and greening of vacant lots reduces opportunity for low-vigilance crime by nearly 40%.",
    recommendation: "Issue notice to BBMP to repair 8 unlit poles at Silk Board exit. Deploy patrol car WAS_02 during 22:00-02:00 window."
  }
}: ExplainabilityDrawerProps) {
  const { theme: activeTheme } = useApp();
  const theme = getThemeColors(activeTheme);
  const [activeTheoryTab, setActiveTheoryTab] = useState<"current" | "routine" | "rational">("current");

  const alternativeTheories = {
    routine: {
      name: "Routine Activity Theory (Cohen & Felson)",
      description: "Crime occurs when a motivated offender, a suitable target, and the absence of a capable guardian converge in time and space.",
      recommendation: "Deploy visible CCTV checkpoints and increase active citizen patrolling to act as 'capable guardians' in high-risk zones."
    },
    rational: {
      name: "Rational Choice Theory (Cornish & Clarke)",
      description: "Offenders make rational choices by weighing the effort, risks, and rewards of committing a crime versus the deterrents.",
      recommendation: "Increase the perceived effort of burgling by implementing mandatory smart door seals and high-decibel alarms in dark spots."
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalBg}>
        <Pressable style={styles.dismissArea} onPress={onClose} />
        
        <View style={[styles.drawerCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Ionicons name="analytics" size={20} color="#06B6D4" />
              <Text style={[styles.title, { color: theme.text }]}>Explainability Drawer (XAI)</Text>
            </View>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.muted} />
            </Pressable>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 16, paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
            {/* Target Area */}
            <View>
              <Text style={[styles.sub, { color: theme.muted }]}>TARGET JURISDICTION HOTSPOT</Text>
              <Text style={[styles.hotspotVal, { color: theme.text }]}>{hotspotName}</Text>
            </View>

            {/* Shapley Decompositions */}
            <View style={[styles.box, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
              <Text style={[styles.boxTitle, { color: theme.muted }]}>SHAP MATHEMATICAL FEATURE WEIGHTS</Text>
              <View style={{ gap: 8, marginTop: 4 }}>
                {shapleyWeights.map((w, i) => {
                  let barColor = "#3B82F6"; // default blue
                  if (i === 0) barColor = "#EF4444"; // highest = red
                  else if (i === 1) barColor = "#F59E0B"; // second = amber
                  else if (w.weight < 18) barColor = "#10B981"; // lower = green

                  return (
                    <View key={i} style={styles.weightRow}>
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={[styles.featureText, { color: theme.text }]}>{w.feature}</Text>
                        <AnimatedBar
                          weight={w.weight}
                          color={barColor}
                          themeBg={theme.bg}
                          visible={visible}
                        />
                      </View>
                      <Text style={[styles.weightText, { color: barColor }]}>
                        +{w.weight}%
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Contributing FIRs */}
            <View style={[styles.box, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
              <Text style={[styles.boxTitle, { color: theme.muted }]}>CONTRIBUTING CCTNS SOURCE RECORDS</Text>
              <View style={styles.firRow}>
                {recentFIRs.map((fir, i) => (
                  <View key={i} style={[styles.firChip, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                    <Ionicons name="document-text-outline" size={10} color="#3B82F6" />
                    <Text style={[styles.firText, { color: theme.text }]}>{fir}</Text>
                  </View>
                ))}
              </View>
              <Text style={[styles.auditHash, { color: theme.muted }]}>
                Legal Audit Ledger SHA-256 Hash: 8f9b4c2e...881a
              </Text>
            </View>

            {/* Criminological Theory Selector Tabs */}
            <View>
              <Text style={[styles.sub, { color: theme.muted, marginBottom: 6 }]}>CRIMINOLOGICAL ALIGNMENT FRAMEWORKS</Text>
              <View style={styles.theoryTabs}>
                <Pressable
                  style={[styles.theoryTabBtn, activeTheoryTab === "current" && styles.theoryTabBtnActive]}
                  onPress={() => setActiveTheoryTab("current")}
                >
                  <Text style={[styles.theoryTabText, activeTheoryTab === "current" && styles.theoryTabTextActive]}>CPTED</Text>
                </Pressable>
                <Pressable
                  style={[styles.theoryTabBtn, activeTheoryTab === "routine" && styles.theoryTabBtnActive]}
                  onPress={() => setActiveTheoryTab("routine")}
                >
                  <Text style={[styles.theoryTabText, activeTheoryTab === "routine" && styles.theoryTabTextActive]}>Routine Act.</Text>
                </Pressable>
                <Pressable
                  style={[styles.theoryTabBtn, activeTheoryTab === "rational" && styles.theoryTabBtnActive]}
                  onPress={() => setActiveTheoryTab("rational")}
                >
                  <Text style={[styles.theoryTabText, activeTheoryTab === "rational" && styles.theoryTabTextActive]}>Rational Ch.</Text>
                </Pressable>
              </View>
            </View>

            {/* Criminological Theory Description Box */}
            {activeTheoryTab === "current" ? (
              <View style={[styles.theoryBox, { backgroundColor: "#06B6D410", borderColor: "#06B6D4" }]}>
                <View style={styles.theoryHeader}>
                  <Ionicons name="ribbon" size={16} color="#06B6D4" />
                  <Text style={styles.theoryTitle}>{theory.name}</Text>
                </View>
                <Text style={[styles.theoryDesc, { color: theme.text }]}>{theory.description}</Text>
                <View style={[styles.recommendationBox, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                  <Text style={[styles.recTitle, { color: "#06B6D4" }]}>PROPOSED INTERVENTION ACTION:</Text>
                  <Text style={[styles.recDesc, { color: theme.text }]}>{theory.recommendation}</Text>
                </View>
              </View>
            ) : activeTheoryTab === "routine" ? (
              <View style={[styles.theoryBox, { backgroundColor: "#8B5CF610", borderColor: "#8B5CF6" }]}>
                <View style={styles.theoryHeader}>
                  <Ionicons name="shield-checkmark" size={16} color="#8B5CF6" />
                  <Text style={[styles.theoryTitle, { color: "#8B5CF6" }]}>{alternativeTheories.routine.name}</Text>
                </View>
                <Text style={[styles.theoryDesc, { color: theme.text }]}>{alternativeTheories.routine.description}</Text>
                <View style={[styles.recommendationBox, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                  <Text style={[styles.recTitle, { color: "#8B5CF6" }]}>PROPOSED GUARDIAN ACTION:</Text>
                  <Text style={[styles.recDesc, { color: theme.text }]}>{alternativeTheories.routine.recommendation}</Text>
                </View>
              </View>
            ) : (
              <View style={[styles.theoryBox, { backgroundColor: "#F59E0B10", borderColor: "#F59E0B" }]}>
                <View style={styles.theoryHeader}>
                  <Ionicons name="bulb" size={16} color="#F59E0B" />
                  <Text style={[styles.theoryTitle, { color: "#F59E0B" }]}>{alternativeTheories.rational.name}</Text>
                </View>
                <Text style={[styles.theoryDesc, { color: theme.text }]}>{alternativeTheories.rational.description}</Text>
                <View style={[styles.recommendationBox, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                  <Text style={[styles.recTitle, { color: "#F59E0B" }]}>PROPOSED DETERRENCE ACTION:</Text>
                  <Text style={[styles.recDesc, { color: theme.text }]}>{alternativeTheories.rational.recommendation}</Text>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBg: { flex: 1, backgroundColor: "#00000080", justifyContent: "flex-end" },
  dismissArea: { flex: 1 },
  drawerCard: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, height: "80%", borderWidth: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  title: { fontSize: 16, fontWeight: "800" },
  sub: { fontSize: 8, fontWeight: "800", letterSpacing: 0.5 },
  hotspotVal: { fontSize: 16, fontWeight: "800", marginTop: 2 },
  box: { padding: 12, borderRadius: 14, borderWidth: 1, gap: 4 },
  boxTitle: { fontSize: 8, fontWeight: "800", letterSpacing: 0.5 },
  weightRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  featureText: { fontSize: 10, fontWeight: "600" },
  progressTrack: { height: 6, borderRadius: 3, overflow: "hidden", marginTop: 4 },
  progressBar: { height: "100%", borderRadius: 3 },
  weightText: { fontSize: 11, fontWeight: "800", fontFamily: "monospace" },
  firRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  firChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  firText: { fontSize: 9, fontWeight: "700" },
  auditHash: { fontSize: 8, fontStyle: "italic", marginTop: 4 },
  
  theoryTabs: { flexDirection: "row", backgroundColor: "rgba(0,0,0,0.2)", padding: 3, borderRadius: 8 },
  theoryTabBtn: { flex: 1, paddingVertical: 6, alignItems: "center", borderRadius: 6 },
  theoryTabBtnActive: { backgroundColor: "rgba(255,255,255,0.08)" },
  theoryTabText: { fontSize: 9, color: "#8892B0", fontWeight: "700" },
  theoryTabTextActive: { color: "#FFFFFF" },

  theoryBox: { padding: 12, borderRadius: 14, borderWidth: 1, gap: 6 },
  theoryHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  theoryTitle: { fontSize: 12, fontWeight: "800", color: "#06B6D4" },
  theoryDesc: { fontSize: 10, lineHeight: 14 },
  recommendationBox: { padding: 10, borderRadius: 10, borderWidth: 1, marginTop: 4, gap: 2 },
  recTitle: { fontSize: 8, fontWeight: "900", letterSpacing: 0.5 },
  recDesc: { fontSize: 10, lineHeight: 14, fontWeight: "600" },
});
