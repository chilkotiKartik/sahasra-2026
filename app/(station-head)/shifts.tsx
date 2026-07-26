import * as React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { moderateScale, verticalScale } from "react-native-size-matters";
import { Trash2 } from "lucide-react-native";
import { Screen, ScreenHeader, Card, LoadingState, ErrorState, Button } from "@/lib/ui";
import { useTheme } from "@/lib/theme";
import { useApi } from "@/lib/hooks";
import { api } from "@/lib/api";

interface Shift { id: string; officerId: string; date: string; shift: string }
interface User { id: string; name: string; badge: string }

const SHIFTS = ["day", "evening", "night"] as const;
const todayISO = () => new Date().toISOString().slice(0, 10);

export default function ShiftScheduling() {
  const theme = useTheme();
  const shifts = useApi<{ shifts: Shift[] }>("/api/v2/shifts");
  const officers = useApi<{ users: User[] }>("/api/v2/users");
  const [date, setDate] = React.useState(todayISO());
  const [officerId, setOfficerId] = React.useState<string | null>(null);
  const [shift, setShift] = React.useState<(typeof SHIFTS)[number]>("day");
  const [busy, setBusy] = React.useState(false);

  const officerList = (officers.data?.users ?? []).filter((u) => u.badge?.startsWith("KSP"));

  const add = async () => {
    if (!officerId) return;
    setBusy(true);
    try {
      await api.post("/api/v2/shifts", { officerId, date, shift });
      shifts.reload();
    } finally {
      setBusy(false);
    }
  };
  const remove = async (id: string) => { await api.del(`/api/v2/shifts/${id}`); shifts.reload(); };

  if (shifts.loading) return <Screen><LoadingState label="Loading roster…" /></Screen>;
  if (shifts.error) return <Screen><ErrorState message={shifts.error} onRetry={shifts.reload} /></Screen>;

  const officerName = (id: string) => officerList.find((u) => u.id === id)?.name ?? id;

  return (
    <Screen scroll onRefresh={() => { shifts.reload(); officers.reload(); }} refreshing={shifts.loading}>
      <ScreenHeader title="Shift Scheduling" subtitle="Assign duty shifts (visible to officers)" />

      <Card>
        <Text style={[styles.label, { color: theme.muted }]}>OFFICER</Text>
        <View style={styles.wrap}>
          {officerList.map((u) => (
            <Text key={u.id} onPress={() => setOfficerId(u.id)}
              style={[styles.opt, { color: officerId === u.id ? "#fff" : theme.text, backgroundColor: officerId === u.id ? theme.secondary : theme.cardAlt }]}>
              {u.name}
            </Text>
          ))}
        </View>
        <Text style={[styles.label, { color: theme.muted, marginTop: 12 }]}>SHIFT · {date}</Text>
        <View style={styles.wrap}>
          {SHIFTS.map((s) => (
            <Text key={s} onPress={() => setShift(s)}
              style={[styles.opt, { color: shift === s ? "#fff" : theme.text, backgroundColor: shift === s ? theme.secondary : theme.cardAlt }]}>
              {s}
            </Text>
          ))}
        </View>
        <Button label="Add shift" onPress={add} loading={busy} color={theme.secondary} disabled={!officerId} />
      </Card>

      <Text style={[styles.section, { color: theme.muted }]}>SCHEDULED</Text>
      {(shifts.data?.shifts ?? []).length === 0 ? <Text style={{ color: theme.muted }}>No shifts scheduled.</Text> : null}
      {(shifts.data?.shifts ?? []).map((s) => (
        <Card key={s.id} style={{ flexDirection: "row", alignItems: "center" } as any}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: theme.text }]}>{officerName(s.officerId)}</Text>
            <Text style={[styles.meta, { color: theme.muted }]}>{s.date} · {s.shift}</Text>
          </View>
          <Pressable onPress={() => remove(s.id)} hitSlop={10}><Trash2 size={18} color={theme.danger} /></Pressable>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: moderateScale(10), fontWeight: "800", letterSpacing: 1, marginBottom: 8, fontFamily: "Inter_600SemiBold" },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 4 },
  opt: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: moderateScale(12), fontWeight: "600", overflow: "hidden", textTransform: "capitalize" },
  section: { fontSize: moderateScale(11), fontWeight: "800", letterSpacing: 1, marginVertical: verticalScale(12) },
  title: { fontSize: moderateScale(14), fontWeight: "700", fontFamily: "Inter_600SemiBold" },
  meta: { fontSize: moderateScale(12), marginTop: 2, fontFamily: "Inter_400Regular" },
});
