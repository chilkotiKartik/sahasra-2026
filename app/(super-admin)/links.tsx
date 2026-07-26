import * as React from "react";
import { View, Text, StyleSheet } from "react-native";
import { moderateScale, verticalScale } from "react-native-size-matters";
import { GitCompareArrows } from "lucide-react-native";
import { Screen, ScreenHeader, Card, LoadingState, ErrorState, EmptyState } from "@/lib/ui";
import { useTheme } from "@/lib/theme";
import { useApi } from "@/lib/hooks";

interface Incident { id: string; title: string; stationId: string; address: string }
interface Link { incidentA: string; incidentB: string; reason: string; detail: string; score: number; a: Incident; b: Incident }

export default function CaseLinks() {
  const theme = useTheme();
  const { data, loading, error, reload } = useApi<{ links: Link[] }>("/api/v2/analytics/case-links");

  if (loading) return <Screen><LoadingState label="Analysing cross-station links…" /></Screen>;
  if (error) return <Screen><ErrorState message={error} onRetry={reload} /></Screen>;

  const links = data?.links ?? [];

  return (
    <Screen scroll onRefresh={reload} refreshing={loading}>
      <ScreenHeader title="Cross-Jurisdiction Links" subtitle="MO / shared-entity matches across stations" />
      {links.length === 0 ? <EmptyState title="No links found" hint="Cases at different stations sharing an MO or entity will surface here." /> : null}
      {links.map((l, idx) => (
        <Card key={idx}>
          <View style={styles.head}>
            <GitCompareArrows size={18} color={theme.warning} />
            <Text style={[styles.reason, { color: theme.warning }]}>{l.reason.replace("_", " ").toUpperCase()}</Text>
            <Text style={[styles.score, { color: theme.muted }]}>score {l.score.toFixed(2)}</Text>
          </View>
          <Text style={[styles.detail, { color: theme.text }]}>{l.detail}</Text>
          <View style={styles.pair}>
            <Text style={[styles.case, { color: theme.muted }]}>▸ {l.a?.title} — {l.a?.address}</Text>
            <Text style={[styles.case, { color: theme.muted }]}>▸ {l.b?.title} — {l.b?.address}</Text>
          </View>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  reason: { flex: 1, fontSize: moderateScale(12), fontWeight: "800" },
  score: { fontSize: moderateScale(11), fontFamily: "Inter_400Regular" },
  detail: { fontSize: moderateScale(14), fontWeight: "600", marginBottom: 8, fontFamily: "Inter_500Medium" },
  pair: { gap: 4 },
  case: { fontSize: moderateScale(12), fontFamily: "Inter_400Regular" },
});
