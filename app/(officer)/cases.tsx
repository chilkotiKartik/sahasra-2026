import * as React from "react";
import { View, Text, StyleSheet, FlatList, Pressable } from "react-native";
import { moderateScale, verticalScale } from "react-native-size-matters";
import { useRouter } from "expo-router";
import { Screen, ScreenHeader, LoadingState, ErrorState, EmptyState } from "@/lib/ui";
import { useTheme } from "@/lib/theme";
import { useApi } from "@/lib/hooks";

interface Incident {
  id: string; title: string; category: string; status: string; priority: string; address: string; createdAt: string;
}

const PRIORITY_COLOR: Record<string, string> = { P1: "#EF4444", P2: "#F59E0B", P3: "#3B82F6", P4: "#6B7280" };

export default function OfficerCases() {
  const theme = useTheme();
  const router = useRouter();
  const { data, loading, error, reload } = useApi<{ incidents: Incident[] }>("/api/v2/incidents?mine=1");

  if (loading) return <Screen><LoadingState label="Loading your case load…" /></Screen>;
  if (error) return <Screen><ErrorState message={error} onRetry={reload} /></Screen>;

  const cases = data?.incidents ?? [];

  return (
    <Screen>
      <View style={{ padding: moderateScale(16), paddingBottom: 0 }}>
        <ScreenHeader title="My Case Load" subtitle={`${cases.length} assigned`} />
      </View>
      {cases.length === 0 ? (
        <EmptyState title="No cases assigned" hint="Cases assigned to you will appear here." />
      ) : (
        <FlatList
          data={cases}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: moderateScale(16), paddingTop: 0, paddingBottom: verticalScale(32) }}
          onRefresh={reload}
          refreshing={loading}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.row, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => router.push(`/incident/${item.id}` as any)}
            >
              <View style={[styles.pBar, { backgroundColor: PRIORITY_COLOR[item.priority] || theme.muted }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: theme.text }]}>{item.title}</Text>
                <Text style={[styles.meta, { color: theme.muted }]}>{item.address} · {item.category}</Text>
              </View>
              <View style={[styles.statusChip, { backgroundColor: theme.cardAlt }]}>
                <Text style={[styles.statusText, { color: theme.muted }]}>{item.status}</Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: moderateScale(14), padding: moderateScale(12), marginBottom: verticalScale(10), gap: moderateScale(10) },
  pBar: { width: 4, alignSelf: "stretch", borderRadius: 2 },
  title: { fontSize: moderateScale(14), fontWeight: "700", fontFamily: "Inter_600SemiBold" },
  meta: { fontSize: moderateScale(11), marginTop: 2, fontFamily: "Inter_400Regular" },
  statusChip: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: moderateScale(10), fontWeight: "700", textTransform: "capitalize" },
});
