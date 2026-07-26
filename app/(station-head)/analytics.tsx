import * as React from "react";
import { View, StyleSheet } from "react-native";
import { moderateScale, verticalScale } from "react-native-size-matters";
import { Screen, ScreenHeader, Card, StatTile, LoadingState, ErrorState, Button } from "@/lib/ui";
import { useTheme } from "@/lib/theme";
import { useApi } from "@/lib/hooks";
import { Text } from "react-native";
import { useRouter } from "expo-router";

interface Analytics {
  total: number; resolved: number; open: number; avgResolutionHours: number; officers: number; onDuty: number;
}

export default function StationAnalytics() {
  const theme = useTheme();
  const router = useRouter();
  // Computed from real incident data server-side, not fixed numbers.
  const { data, loading, error, reload } = useApi<Analytics>("/api/v2/analytics/station");

  if (loading) return <Screen><LoadingState label="Computing station metrics…" /></Screen>;
  if (error) return <Screen><ErrorState message={error} onRetry={reload} /></Screen>;

  const a = data!;
  const resolutionRate = a.total ? Math.round((a.resolved / a.total) * 100) : 0;

  return (
    <Screen scroll onRefresh={reload} refreshing={loading}>
      <ScreenHeader title="Station Performance" subtitle="Live, computed from case data" />
      <View style={styles.row}>
        <StatTile label="Total Cases" value={a.total} color={theme.primary} />
        <StatTile label="Open" value={a.open} color={theme.warning} />
      </View>
      <View style={styles.row}>
        <StatTile label="Resolved" value={a.resolved} color={theme.success} />
        <StatTile label="Resolution %" value={`${resolutionRate}%`} color={theme.accent} />
      </View>
      <View style={styles.row}>
        <StatTile label="Avg Resolution (h)" value={a.avgResolutionHours} color={theme.secondary} />
        <StatTile label="On Duty / Officers" value={`${a.onDuty}/${a.officers}`} color={theme.primary} />
      </View>
      <Text style={{ color: theme.muted, fontSize: moderateScale(11), fontWeight: "800", letterSpacing: 1, marginBottom: verticalScale(8), fontFamily: "Inter_600SemiBold" }}>STATION TOOLS</Text>
      <Button label="🗓  Shift Scheduling" onPress={() => router.push("/(station-head)/shifts")} variant="outline" color={theme.secondary} />
      <View style={{ height: verticalScale(8) }} />
      <Button label="📦  Evidence Locker" onPress={() => router.push("/(station-head)/evidence")} variant="outline" color={theme.secondary} />
      <View style={{ height: verticalScale(8) }} />
      <Button label="🔥  Local Hotspot Map" onPress={() => router.push("/(station-head)/hotspots")} variant="outline" color={theme.secondary} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: moderateScale(10), marginBottom: verticalScale(10) },
});
