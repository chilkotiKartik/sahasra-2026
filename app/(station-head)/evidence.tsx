import * as React from "react";
import { View, Text, StyleSheet } from "react-native";
import { moderateScale, verticalScale } from "react-native-size-matters";
import { Package, ChevronRight } from "lucide-react-native";
import { Screen, ScreenHeader, Card, LoadingState, ErrorState, EmptyState } from "@/lib/ui";
import { useTheme } from "@/lib/theme";
import { useApi } from "@/lib/hooks";

interface Evidence {
  id: string; label: string; qrCode: string; incidentId: string;
  custodyLog: { userId: string; action: string; at: string }[];
}

export default function EvidenceLocker() {
  const theme = useTheme();
  // Station-scoped on the server for station_head (read-only oversight).
  const { data, loading, error, reload } = useApi<{ evidence: Evidence[] }>("/api/v2/evidence");
  const [openId, setOpenId] = React.useState<string | null>(null);

  if (loading) return <Screen><LoadingState label="Loading evidence locker…" /></Screen>;
  if (error) return <Screen><ErrorState message={error} onRetry={reload} /></Screen>;

  const rows = data?.evidence ?? [];

  return (
    <Screen scroll onRefresh={reload} refreshing={loading}>
      <ScreenHeader title="Evidence Locker" subtitle={`${rows.length} items · chain-of-custody`} />
      {rows.length === 0 ? <EmptyState title="Locker empty" hint="Evidence logged by officers appears here for audit." /> : null}
      {rows.map((e) => (
        <Card key={e.id}>
          <View style={styles.row}>
            <Package size={18} color={theme.secondary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: theme.text }]}>{e.label}</Text>
              <Text style={[styles.code, { color: theme.muted }]}>{e.qrCode}</Text>
            </View>
            <Text onPress={() => setOpenId(openId === e.id ? null : e.id)} style={{ color: theme.secondary, fontSize: 12, fontFamily: "Inter_500Medium" }}>
              {e.custodyLog.length} events
            </Text>
          </View>
          {openId === e.id ? (
            <View style={styles.custody}>
              {e.custodyLog.map((c, idx) => (
                <View key={idx} style={styles.custodyRow}>
                  <ChevronRight size={12} color={theme.muted} />
                  <Text style={[styles.custodyText, { color: theme.muted }]}>
                    {c.action} · {c.userId} · {new Date(c.at).toLocaleString()}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  label: { fontSize: moderateScale(14), fontWeight: "700", fontFamily: "Inter_600SemiBold" },
  code: { fontSize: moderateScale(10), marginTop: 2, fontFamily: "Inter_400Regular" },
  custody: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#8882" },
  custodyRow: { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 3 },
  custodyText: { fontSize: moderateScale(11), fontFamily: "Inter_400Regular" },
});
