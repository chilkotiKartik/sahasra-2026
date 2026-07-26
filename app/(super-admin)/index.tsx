import * as React from "react";
import { View, Text, StyleSheet } from "react-native";
import { moderateScale, verticalScale } from "react-native-size-matters";
import { useRouter } from "expo-router";
import { Screen, ScreenHeader, Card, StatTile, LoadingState, ErrorState, Button } from "@/lib/ui";
import { useTheme } from "@/lib/theme";
import { useApi } from "@/lib/hooks";

interface Command {
  stationCount: number; officerCount: number; activeCases: number; sosToday: number; activeSos: number;
  perStation: { stationId: string; name: string; open: number; total: number }[];
}

export default function CommandCenter() {
  const theme = useTheme();
  const router = useRouter();
  // Real rollup aggregated across ALL stations, server-side.
  const { data, loading, error, reload } = useApi<Command>("/api/v2/analytics/command-center", [], { pollMs: 15000 });

  if (loading) return <Screen><LoadingState label="Aggregating state-wide data…" /></Screen>;
  if (error) return <Screen><ErrorState message={error} onRetry={reload} /></Screen>;

  const c = data!;
  return (
    <Screen scroll onRefresh={reload} refreshing={loading}>
      <ScreenHeader title="Command Center" subtitle="State-wide, all stations" />
      <View style={styles.row}>
        <StatTile label="Stations" value={c.stationCount} color={theme.primary} />
        <StatTile label="Officers" value={c.officerCount} color={theme.accent} />
      </View>
      <View style={styles.row}>
        <StatTile label="Active Cases" value={c.activeCases} color={theme.warning} />
        <StatTile label="Active SOS" value={c.activeSos} color={theme.danger} />
      </View>

      <Text style={[styles.section, { color: theme.muted }]}>COMMAND TOOLS</Text>
      <View style={styles.toolRow}>
        <View style={{ flex: 1 }}><Button label="🏢 Stations" onPress={() => router.push("/(super-admin)/stations")} variant="outline" color={theme.warning} /></View>
        <View style={{ flex: 1 }}><Button label="🔗 Case Links" onPress={() => router.push("/(super-admin)/links")} variant="outline" color={theme.warning} /></View>
      </View>
      <View style={styles.toolRow}>
        <View style={{ flex: 1 }}><Button label="📄 Reports" onPress={() => router.push("/(super-admin)/reports")} variant="outline" color={theme.warning} /></View>
        <View style={{ flex: 1 }}><Button label="🩺 Health" onPress={() => router.push("/(super-admin)/health")} variant="outline" color={theme.warning} /></View>
      </View>

      <Text style={[styles.section, { color: theme.muted }]}>PER-STATION</Text>
      {c.perStation.map((s) => (
        <Card key={s.stationId}>
          <View style={styles.rowBetween}>
            <Text style={[styles.name, { color: theme.text }]}>{s.name}</Text>
            <Text style={[styles.metric, { color: s.open > 0 ? theme.warning : theme.success }]}>{s.open} open</Text>
          </View>
          <Text style={[styles.meta, { color: theme.muted }]}>{s.total} total cases</Text>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: moderateScale(10), marginBottom: verticalScale(10) },
  section: { fontSize: moderateScale(11), fontWeight: "800", letterSpacing: 1, marginVertical: verticalScale(10) },
  toolRow: { flexDirection: "row", gap: moderateScale(10), marginBottom: verticalScale(10) },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  name: { fontSize: moderateScale(15), fontWeight: "700", fontFamily: "Inter_600SemiBold" },
  metric: { fontSize: moderateScale(13), fontWeight: "800" },
  meta: { fontSize: moderateScale(12), marginTop: 2, fontFamily: "Inter_400Regular" },
});
