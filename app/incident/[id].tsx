import * as React from "react";
import { View, Text, StyleSheet, Image, Pressable } from "react-native";
import { moderateScale, verticalScale } from "react-native-size-matters";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { Screen, Card, StatTile, LoadingState, ErrorState, Button } from "@/lib/ui";
import { useTheme } from "@/lib/theme";
import { useApi } from "@/lib/hooks";
import { api } from "@/lib/api";
import { API_ORIGIN } from "@/lib/config";
import { useAuth } from "@/context/AuthContext";

interface Incident {
  id: string; title: string; category: string; description: string; status: string;
  priority: string; address: string; mo: string; entities: string[]; photoUrl: string | null;
  assignedOfficerId: string | null; createdAt: string;
}
const STATUSES = ["reported", "assigned", "in_progress", "resolved", "closed"];

export default function IncidentDetail() {
  const theme = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, loading, error, reload } = useApi<{ incident: Incident }>(id ? `/api/v2/incidents/${id}` : null, [id]);
  const [busy, setBusy] = React.useState(false);

  const advance = async (status: string) => {
    setBusy(true);
    try {
      await api.patch(`/api/v2/incidents/${id}`, { status });
      reload();
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Screen><LoadingState label="Loading incident…" /></Screen>;
  if (error || !data) return <Screen><ErrorState message={error || "Not found"} onRetry={reload} /></Screen>;

  const inc = data.incident;
  const nextStatus = STATUSES[Math.min(STATUSES.indexOf(inc.status) + 1, STATUSES.length - 1)];

  return (
    <Screen scroll>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <ChevronLeft size={20} color={theme.primary} />
        <Text style={{ color: theme.primary, fontFamily: "Inter_500Medium" }}>Back</Text>
      </Pressable>

      <Text style={[styles.title, { color: theme.text }]}>{inc.title}</Text>
      <Text style={[styles.meta, { color: theme.muted }]}>{inc.address} · {inc.category}</Text>

      {inc.photoUrl ? (
        <Image source={{ uri: `${API_ORIGIN}${inc.photoUrl}` }} style={styles.photo} resizeMode="cover" />
      ) : null}

      <View style={styles.statRow}>
        <StatTile label="Priority" value={inc.priority} color={theme.warning} />
        <StatTile label="Status" value={inc.status} color={theme.primary} />
      </View>

      <Card>
        <Text style={[styles.h, { color: theme.text }]}>Description</Text>
        <Text style={[styles.body, { color: theme.muted }]}>{inc.description || "—"}</Text>
        {inc.mo ? <Text style={[styles.body, { color: theme.muted }]}>MO: {inc.mo}</Text> : null}
        {inc.entities?.length ? <Text style={[styles.body, { color: theme.muted }]}>Entities: {inc.entities.join(", ")}</Text> : null}
      </Card>

      {inc.status !== "closed" ? (
        <Button label={`Advance to "${nextStatus}"`} onPress={() => advance(nextStatus)} loading={busy} color={theme.success} />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { flexDirection: "row", alignItems: "center", marginBottom: verticalScale(10) },
  title: { fontSize: moderateScale(20), fontWeight: "800", fontFamily: "Inter_700Bold" },
  meta: { fontSize: moderateScale(12), marginTop: 4, marginBottom: verticalScale(12), fontFamily: "Inter_400Regular" },
  photo: { width: "100%", height: verticalScale(180), borderRadius: moderateScale(12), marginBottom: verticalScale(12) },
  statRow: { flexDirection: "row", gap: moderateScale(10), marginBottom: verticalScale(12) },
  h: { fontSize: moderateScale(14), fontWeight: "700", marginBottom: 6, fontFamily: "Inter_600SemiBold" },
  body: { fontSize: moderateScale(13), lineHeight: 20, marginTop: 4, fontFamily: "Inter_400Regular" },
});
