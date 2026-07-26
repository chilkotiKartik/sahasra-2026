import * as React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { moderateScale, verticalScale } from "react-native-size-matters";
import { ChevronRight } from "lucide-react-native";
import { useRouter } from "expo-router";
import { Screen, ScreenHeader, Card, LoadingState, ErrorState, EmptyState } from "@/lib/ui";
import { useTheme } from "@/lib/theme";
import { useApi } from "@/lib/hooks";

interface DutyRow {
  officerId: string; onDuty: boolean; updatedAt: string;
  officer: { name: string; badge: string; rank: string } | null;
}

export default function StationRoster() {
  const theme = useTheme();
  const router = useRouter();
  // Reads the SAME duty data officers write via their duty toggle (cross-role link).
  const { data, loading, error, reload } = useApi<{ duty: DutyRow[] }>("/api/v2/duty", [], { pollMs: 10000 });

  if (loading) return <Screen><LoadingState label="Loading officer roster…" /></Screen>;
  if (error) return <Screen><ErrorState message={error} onRetry={reload} /></Screen>;

  const rows = data?.duty ?? [];
  const onDuty = rows.filter((r) => r.onDuty).length;

  return (
    <Screen scroll onRefresh={reload} refreshing={loading}>
      <ScreenHeader title="Live Officer Roster" subtitle={`${onDuty} of ${rows.length} on duty now`} />
      {rows.length === 0 ? (
        <EmptyState title="No officers" hint="No duty records for this station yet." />
      ) : (
        rows.map((r) => (
          <Pressable key={r.officerId} onPress={() => router.push(`/(station-head)/officer/${r.officerId}` as any)}>
            <Card>
              <View style={styles.row}>
                <View style={[styles.dot, { backgroundColor: r.onDuty ? theme.success : theme.muted }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.name, { color: theme.text }]}>{r.officer?.name ?? r.officerId}</Text>
                  <Text style={[styles.meta, { color: theme.muted }]}>{r.officer?.rank} · {r.officer?.badge}</Text>
                </View>
                <Text style={[styles.status, { color: r.onDuty ? theme.success : theme.muted }]}>
                  {r.onDuty ? "ON DUTY" : "OFF"}
                </Text>
                <ChevronRight size={16} color={theme.muted} />
              </View>
            </Card>
          </Pressable>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: moderateScale(12) },
  dot: { width: 12, height: 12, borderRadius: 6 },
  name: { fontSize: moderateScale(15), fontWeight: "700", fontFamily: "Inter_600SemiBold" },
  meta: { fontSize: moderateScale(12), marginTop: 2, fontFamily: "Inter_400Regular" },
  status: { fontSize: moderateScale(11), fontWeight: "800", letterSpacing: 0.5 },
});
