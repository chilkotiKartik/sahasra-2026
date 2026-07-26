import * as React from "react";
import { View, Text, StyleSheet, Pressable, Modal } from "react-native";
import { moderateScale, verticalScale } from "react-native-size-matters";
import { Screen, ScreenHeader, Card, LoadingState, ErrorState, EmptyState, Button } from "@/lib/ui";
import { useTheme } from "@/lib/theme";
import { useApi } from "@/lib/hooks";
import { api } from "@/lib/api";

interface Incident { id: string; title: string; status: string; priority: string; assignedOfficerId: string | null; address: string }
interface User { id: string; name: string; badge: string }

const FILTERS = ["all", "reported", "assigned", "in_progress", "resolved"] as const;

export default function StationCases() {
  const theme = useTheme();
  const cases = useApi<{ incidents: Incident[] }>("/api/v2/incidents");
  const officers = useApi<{ users: User[] }>("/api/v2/users");
  const [filter, setFilter] = React.useState<(typeof FILTERS)[number]>("all");
  const [assignFor, setAssignFor] = React.useState<Incident | null>(null);
  const [busy, setBusy] = React.useState(false);

  const reassign = async (officerId: string) => {
    if (!assignFor) return;
    setBusy(true);
    try {
      await api.patch(`/api/v2/incidents/${assignFor.id}`, { assignedOfficerId: officerId, status: "assigned" });
      setAssignFor(null);
      cases.reload();
    } finally {
      setBusy(false);
    }
  };

  if (cases.loading) return <Screen><LoadingState label="Loading station cases…" /></Screen>;
  if (cases.error) return <Screen><ErrorState message={cases.error} onRetry={cases.reload} /></Screen>;

  const list = (cases.data?.incidents ?? []).filter((i) => filter === "all" || i.status === filter);
  const officerName = (id: string | null) => officers.data?.users.find((u) => u.id === id)?.name ?? (id ? "Assigned" : "Unassigned");

  return (
    <Screen scroll onRefresh={() => { cases.reload(); officers.reload(); }} refreshing={cases.loading}>
      <ScreenHeader title="Station Case Review" subtitle={`${cases.data?.incidents.length ?? 0} cases`} />

      <View style={styles.filters}>
        {FILTERS.map((f) => (
          <Text key={f} onPress={() => setFilter(f)}
            style={[styles.chip, { color: filter === f ? "#fff" : theme.text, backgroundColor: filter === f ? theme.secondary : theme.cardAlt }]}>
            {f.replace("_", " ")}
          </Text>
        ))}
      </View>

      {list.length === 0 ? <EmptyState title="No cases" hint="Nothing matches this filter." /> : null}
      {list.map((i) => (
        <Card key={i.id}>
          <Text style={[styles.title, { color: theme.text }]}>{i.title}</Text>
          <Text style={[styles.meta, { color: theme.muted }]}>{i.address} · {i.priority} · {i.status}</Text>
          <Text style={[styles.meta, { color: theme.muted }]}>Officer: {officerName(i.assignedOfficerId)}</Text>
          <Button label="Reassign officer" onPress={() => setAssignFor(i)} variant="outline" color={theme.secondary} />
        </Card>
      ))}

      <Modal visible={!!assignFor} transparent animationType="slide" onRequestClose={() => setAssignFor(null)}>
        <View style={styles.modalWrap}>
          <View style={[styles.modal, { backgroundColor: theme.card }]}>
            <Text style={[styles.title, { color: theme.text, marginBottom: 12 }]}>Assign to…</Text>
            {(officers.data?.users ?? []).filter(u => u.badge?.startsWith("KSP")).map((u) => (
              <Pressable key={u.id} style={[styles.optRow, { borderColor: theme.border }]} onPress={() => reassign(u.id)} disabled={busy}>
                <Text style={{ color: theme.text, fontFamily: "Inter_500Medium" }}>{u.name}</Text>
                <Text style={{ color: theme.muted, fontSize: 11 }}>{u.badge}</Text>
              </Pressable>
            ))}
            <Button label="Cancel" onPress={() => setAssignFor(null)} variant="outline" color={theme.muted} />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  filters: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: verticalScale(12) },
  chip: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7, fontSize: moderateScale(11), fontWeight: "700", overflow: "hidden", textTransform: "capitalize" },
  title: { fontSize: moderateScale(14), fontWeight: "700", fontFamily: "Inter_600SemiBold" },
  meta: { fontSize: moderateScale(12), marginTop: 3, marginBottom: 4, fontFamily: "Inter_400Regular" },
  modalWrap: { flex: 1, justifyContent: "flex-end", backgroundColor: "#0008" },
  modal: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  optRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderRadius: 10, padding: 14, marginBottom: 8 },
});
