import * as React from "react";
import { View, Text, StyleSheet, TextInput, Pressable } from "react-native";
import { moderateScale, verticalScale } from "react-native-size-matters";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, MapPin } from "lucide-react-native";
import { Screen, Card, StatTile, Button, LoadingState } from "@/lib/ui";
import { useTheme } from "@/lib/theme";
import { useApi } from "@/lib/hooks";
import { api } from "@/lib/api";

interface DutyRow { officerId: string; onDuty: boolean; geo: { lat: number; lng: number } | null; officer: { name: string; badge: string; rank: string } | null }
interface Incident { id: string; title: string; status: string; assignedOfficerId: string | null }
interface Note { id: string; body: string; authorId: string; createdAt: string }

export default function OfficerDetail() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const duty = useApi<{ duty: DutyRow[] }>("/api/v2/duty");
  const cases = useApi<{ incidents: Incident[] }>("/api/v2/incidents");
  const notes = useApi<{ notes: Note[] }>(id ? `/api/v2/review-notes/${id}` : null, [id]);
  const [body, setBody] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const row = duty.data?.duty.find((d) => d.officerId === id);
  const load = (cases.data?.incidents ?? []).filter((i) => i.assignedOfficerId === id);
  const openLoad = load.filter((i) => i.status !== "resolved" && i.status !== "closed").length;

  const addNote = async () => {
    if (!body.trim()) return;
    setBusy(true);
    try {
      await api.post("/api/v2/review-notes", { officerId: id, body: body.trim() });
      setBody("");
      notes.reload();
    } finally {
      setBusy(false);
    }
  };

  if (duty.loading) return <Screen><LoadingState /></Screen>;

  return (
    <Screen scroll>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <ChevronLeft size={20} color={theme.secondary} />
        <Text style={{ color: theme.secondary, fontFamily: "Inter_500Medium" }}>Roster</Text>
      </Pressable>

      <Text style={[styles.name, { color: theme.text }]}>{row?.officer?.name ?? id}</Text>
      <Text style={[styles.meta, { color: theme.muted }]}>{row?.officer?.rank} · {row?.officer?.badge}</Text>

      <View style={styles.statRow}>
        <StatTile label="Status" value={row?.onDuty ? "On duty" : "Off"} color={row?.onDuty ? theme.success : theme.muted} />
        <StatTile label="Open Cases" value={openLoad} color={theme.primary} />
      </View>

      <Card style={{ flexDirection: "row", alignItems: "center", gap: 8 } as any}>
        <MapPin size={16} color={row?.geo ? theme.success : theme.muted} />
        <Text style={{ color: theme.muted, fontSize: moderateScale(12), fontFamily: "Inter_400Regular" }}>
          {row?.geo ? `Last location: ${row.geo.lat.toFixed(4)}, ${row.geo.lng.toFixed(4)}` : "No location (off duty)"}
        </Text>
      </Card>

      <Text style={[styles.section, { color: theme.muted }]}>PERFORMANCE REVIEW NOTES (private)</Text>
      <Card>
        <TextInput
          style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
          placeholder="Add a timestamped note…"
          placeholderTextColor={theme.muted}
          value={body}
          onChangeText={setBody}
          multiline
        />
        <Button label="Add note" onPress={addNote} loading={busy} color={theme.secondary} />
      </Card>

      {(notes.data?.notes ?? []).map((n) => (
        <Card key={n.id}>
          <Text style={[styles.noteBody, { color: theme.text }]}>{n.body}</Text>
          <Text style={[styles.noteMeta, { color: theme.muted }]}>{n.authorId} · {new Date(n.createdAt).toLocaleString()}</Text>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { flexDirection: "row", alignItems: "center", marginBottom: verticalScale(10) },
  name: { fontSize: moderateScale(20), fontWeight: "800", fontFamily: "Inter_700Bold" },
  meta: { fontSize: moderateScale(12), marginTop: 2, marginBottom: verticalScale(12), fontFamily: "Inter_400Regular" },
  statRow: { flexDirection: "row", gap: moderateScale(10), marginBottom: verticalScale(12) },
  section: { fontSize: moderateScale(11), fontWeight: "800", letterSpacing: 1, marginVertical: verticalScale(12) },
  input: { borderWidth: 1, borderRadius: moderateScale(10), padding: moderateScale(12), fontSize: moderateScale(14), minHeight: verticalScale(60), textAlignVertical: "top", marginBottom: verticalScale(10), fontFamily: "Inter_400Regular" },
  noteBody: { fontSize: moderateScale(13), lineHeight: 19, fontFamily: "Inter_400Regular" },
  noteMeta: { fontSize: moderateScale(10), marginTop: 6, fontFamily: "Inter_400Regular" },
});
