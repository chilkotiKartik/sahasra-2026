import * as React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { moderateScale, verticalScale } from "react-native-size-matters";
import { useRouter } from "expo-router";
import {
  Camera, FileSearch, Users, Flame, Search, MessageSquareText,
  ShieldUser, IdCard, ListChecks, Radar, Heart,
} from "lucide-react-native";
import { Screen, ScreenHeader } from "@/lib/ui";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/context/AuthContext";

interface Tool { key: string; label: string; desc: string; icon: any; color: string; roles: string[] }

const TOOLS: Tool[] = [
  { key: "cctns", label: "CCTNS", desc: "Crime & criminal records", icon: FileSearch, color: "#3B82F6", roles: ["officer", "station_head", "super_admin"] },
  { key: "anpr", label: "ANPR", desc: "Number-plate recognition", icon: Camera, color: "#06B6D4", roles: ["officer", "station_head", "super_admin"] },
  { key: "mo-search", label: "MO Search", desc: "Modus operandi matching", icon: Search, color: "#8B5CF6", roles: ["officer", "station_head", "super_admin"] },
  { key: "gangs", label: "Gang Network", desc: "Organised-crime links", icon: Users, color: "#EF4444", roles: ["station_head", "super_admin"] },
  { key: "hotspots", label: "Hotspots", desc: "Predictive crime zones", icon: Flame, color: "#F59E0B", roles: ["officer", "station_head", "super_admin"] },
  { key: "nlp-query", label: "AI Copilot", desc: "Natural-language queries", icon: MessageSquareText, color: "#22C55E", roles: ["officer", "station_head", "super_admin"] },
  { key: "akka-pade", label: "Akka Pade", desc: "Beat & patrol force", icon: ShieldUser, color: "#0891B2", roles: ["officer", "station_head", "super_admin"] },
  { key: "incidents", label: "Incidents", desc: "Live incident board", icon: ListChecks, color: "#7C3AED", roles: ["station_head", "super_admin"] },
  { key: "telemetry", label: "Fleet Telemetry", desc: "Patrol vehicle tracking", icon: Radar, color: "#10B981", roles: ["station_head", "super_admin"] },
  { key: "wellness", label: "Wellness", desc: "Officer fatigue & rest check", icon: Heart, color: "#EC4899", roles: ["officer", "station_head", "super_admin"] },
  { key: "badge", label: "Digital Badge", desc: "Verifiable officer ID", icon: IdCard, color: "#64748B", roles: ["officer", "station_head", "super_admin"] },
];

export function IntelHub() {
  const theme = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const role = user?.role ?? "officer";
  const tools = TOOLS.filter((t) => t.roles.includes(role));

  return (
    <Screen scroll>
      <ScreenHeader title="Intelligence" subtitle="KSP crime-intelligence toolkit" />
      <View style={styles.grid}>
        {tools.map((t) => {
          const Icon = t.icon;
          return (
            <Pressable
              key={t.key}
              style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => router.push(`/tools/${t.key}` as any)}
            >
              <View style={[styles.iconWrap, { backgroundColor: t.color + "22" }]}>
                <Icon size={moderateScale(22)} color={t.color} />
              </View>
              <Text style={[styles.label, { color: theme.text }]}>{t.label}</Text>
              <Text style={[styles.desc, { color: theme.muted }]}>{t.desc}</Text>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: moderateScale(10) },
  card: { width: "47%", borderWidth: 1, borderRadius: moderateScale(16), padding: moderateScale(14), marginBottom: verticalScale(10) },
  iconWrap: { width: moderateScale(44), height: moderateScale(44), borderRadius: moderateScale(12), alignItems: "center", justifyContent: "center", marginBottom: verticalScale(10) },
  label: { fontSize: moderateScale(14), fontWeight: "700", fontFamily: "Inter_600SemiBold" },
  desc: { fontSize: moderateScale(11), marginTop: 2, fontFamily: "Inter_400Regular" },
});
