import * as React from "react";
import { View, Text, StyleSheet } from "react-native";
import { moderateScale, verticalScale } from "react-native-size-matters";
import { Screen, ScreenHeader, Card, LoadingState, ErrorState, EmptyState, Button } from "@/lib/ui";
import { useTheme } from "@/lib/theme";
import { useApi } from "@/lib/hooks";
import { api } from "@/lib/api";

interface Approval {
  id: string; sosId: string; requestedOfficerId: string; status: string; createdAt: string;
}

export default function DispatchQueue() {
  const theme = useTheme();
  // Approvals are auto-created when an officer triggers SOS (cross-role link).
  const { data, loading, error, reload } = useApi<{ approvals: Approval[] }>("/api/v2/approvals", [], { pollMs: 8000 });
  const [busy, setBusy] = React.useState<string | null>(null);

  const decide = async (id: string, status: "approved" | "rejected") => {
    setBusy(id);
    try {
      await api.patch(`/api/v2/approvals/${id}`, { status });
      reload();
    } finally {
      setBusy(null);
    }
  };

  if (loading) return <Screen><LoadingState label="Loading dispatch queue…" /></Screen>;
  if (error) return <Screen><ErrorState message={error} onRetry={reload} /></Screen>;

  const pending = data?.approvals.filter((a) => a.status === "pending") ?? [];
  const decided = data?.approvals.filter((a) => a.status !== "pending") ?? [];

  return (
    <Screen scroll onRefresh={reload} refreshing={loading}>
      <ScreenHeader title="Dispatch Approvals" subtitle={`${pending.length} awaiting authorization`} />
      {pending.length === 0 && decided.length === 0 ? (
        <EmptyState title="Queue clear" hint="SOS escalations from officers appear here for your authorization." />
      ) : null}

      {pending.map((a) => (
        <Card key={a.id}>
          <Text style={[styles.title, { color: theme.text }]}>SOS escalation</Text>
          <Text style={[styles.meta, { color: theme.muted }]}>Officer {a.requestedOfficerId} · {new Date(a.createdAt).toLocaleTimeString()}</Text>
          <View style={styles.actions}>
            <View style={{ flex: 1 }}>
              <Button label="Approve dispatch" onPress={() => decide(a.id, "approved")} color={theme.success} loading={busy === a.id} />
            </View>
            <View style={{ flex: 1 }}>
              <Button label="Reject" onPress={() => decide(a.id, "rejected")} color={theme.danger} variant="outline" disabled={busy === a.id} />
            </View>
          </View>
        </Card>
      ))}

      {decided.length > 0 ? <Text style={[styles.section, { color: theme.muted }]}>DECIDED</Text> : null}
      {decided.map((a) => (
        <Card key={a.id}>
          <View style={styles.rowBetween}>
            <Text style={[styles.meta, { color: theme.text }]}>Officer {a.requestedOfficerId}</Text>
            <Text style={[styles.badge, { color: a.status === "approved" ? theme.success : theme.danger }]}>{a.status.toUpperCase()}</Text>
          </View>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: moderateScale(15), fontWeight: "700", fontFamily: "Inter_600SemiBold" },
  meta: { fontSize: moderateScale(12), marginTop: 4, fontFamily: "Inter_400Regular" },
  actions: { flexDirection: "row", gap: moderateScale(10), marginTop: verticalScale(12) },
  section: { fontSize: moderateScale(11), fontWeight: "800", letterSpacing: 1, marginVertical: verticalScale(8) },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  badge: { fontSize: moderateScale(11), fontWeight: "800" },
});
