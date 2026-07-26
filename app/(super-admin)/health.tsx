import * as React from "react";
import { View, StyleSheet } from "react-native";
import { moderateScale, verticalScale } from "react-native-size-matters";
import { Screen, ScreenHeader, Card, StatTile, LoadingState, ErrorState } from "@/lib/ui";
import { useTheme } from "@/lib/theme";
import { useApi } from "@/lib/hooks";
import { Text } from "react-native";

interface Health { uptimeSeconds: number; memoryMb: number; auditEntries: number; sentryConfigured: boolean; timestamp: string }

export default function SystemHealth() {
  const theme = useTheme();
  const { data, loading, error, reload } = useApi<Health>("/api/v2/system/health");

  if (loading) return <Screen><LoadingState label="Reading system health…" /></Screen>;
  if (error) return <Screen><ErrorState message={error} onRetry={reload} /></Screen>;

  const h = data!;
  const uptime = h.uptimeSeconds > 3600 ? `${(h.uptimeSeconds / 3600).toFixed(1)}h` : `${Math.round(h.uptimeSeconds / 60)}m`;

  return (
    <Screen scroll onRefresh={reload} refreshing={loading}>
      <ScreenHeader title="System Health" subtitle="API server metrics (super-admin only)" />
      <View style={styles.row}>
        <StatTile label="Uptime" value={uptime} color={theme.success} />
        <StatTile label="Memory (MB)" value={h.memoryMb} color={theme.primary} />
      </View>
      <View style={styles.row}>
        <StatTile label="Audit Entries" value={h.auditEntries} color={theme.accent} />
        <StatTile label="Sentry" value={h.sentryConfigured ? "ON" : "OFF"} color={h.sentryConfigured ? theme.success : theme.muted} />
      </View>
      <Card>
        <Text style={{ color: theme.muted, fontSize: moderateScale(12), fontFamily: "Inter_400Regular" }}>
          Last polled: {new Date(h.timestamp).toLocaleString()}
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: "row", gap: moderateScale(10), marginBottom: verticalScale(10) } });
