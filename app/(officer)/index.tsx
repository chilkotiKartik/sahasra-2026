import * as React from "react";
import { View, Text, StyleSheet, Switch, Pressable, Alert } from "react-native";
import { moderateScale, verticalScale } from "react-native-size-matters";
import { CircleCheck, Circle, MapPin, TriangleAlert, QrCode } from "lucide-react-native";
import { useRouter } from "expo-router";
import { Screen, ScreenHeader, Card, StatTile, LoadingState, ErrorState, Button } from "@/lib/ui";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/context/AuthContext";
import { useApi } from "@/lib/hooks";
import { api } from "@/lib/api";
import { getCurrentPosition } from "@/lib/location";

interface DutyResp { duty: { officerId: string; onDuty: boolean }[] }
interface Incident { id: string; title: string; status: string; priority: string }
interface Checkpoint { id: string; label: string; checkedIn: boolean }

export default function OfficerDashboard() {
  const theme = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const duty = useApi<DutyResp>("/api/v2/duty");
  const cases = useApi<{ incidents: Incident[] }>("/api/v2/incidents?mine=1");
  const beats = useApi<{ checkpoints: Checkpoint[] }>("/api/v2/beats");

  const myDuty = duty.data?.duty.find((d) => d.officerId === user?.id);
  const [toggling, setToggling] = React.useState(false);
  const [checkingBeatId, setCheckingBeatId] = React.useState<string | null>(null);

  const onToggleDuty = async (next: boolean) => {
    setToggling(true);
    try {
      const geo = next ? await getCurrentPosition() : null;
      await api.post("/api/v2/duty", { onDuty: next, geo });
      duty.reload();
    } catch {
      /* surfaced via reload state */
    } finally {
      setToggling(false);
    }
  };

  const checkIn = async (id: string) => {
    setCheckingBeatId(id);
    try {
      const geo = await getCurrentPosition();
      if (!geo) {
        Alert.alert("GPS Verification Failed", "Unable to acquire GPS lock. Please check your location settings.");
        return;
      }
      await api.post(`/api/v2/beats/${id}/checkin`, { geo });
      Alert.alert(
        "Checkpoint Verified",
        `GPS location matched: ${geo.lat.toFixed(4)}, ${geo.lng.toFixed(4)}\nCheck-in recorded in SCRB logs.`
      );
      beats.reload();
    } catch (e: any) {
      Alert.alert("Check-in Failed", e?.message || "Server rejected check-in.");
    } finally {
      setCheckingBeatId(null);
    }
  };

  if (duty.loading) return <Screen><LoadingState label="Loading duty status…" /></Screen>;
  if (duty.error) return <Screen><ErrorState message={duty.error} onRetry={duty.reload} /></Screen>;

  const openCases = cases.data?.incidents.filter((i) => i.status !== "resolved" && i.status !== "closed").length ?? 0;
  const doneCheckpoints = beats.data?.checkpoints.filter((c) => c.checkedIn).length ?? 0;
  const totalCheckpoints = beats.data?.checkpoints.length ?? 0;

  return (
    <Screen scroll onRefresh={() => { duty.reload(); cases.reload(); beats.reload(); }} refreshing={false}>
      <ScreenHeader title={`Namaskara, ${user?.name?.split(" ").slice(-1)[0] || "Officer"}`} subtitle={`${user?.rank} · Badge ${user?.badge}`} />

      {/* Duty toggle (Officer feature #5 -> Head roster) */}
      <Card>
        <View style={styles.rowBetween}>
          <View>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Duty Status</Text>
            <Text style={[styles.cardHint, { color: myDuty?.onDuty ? theme.success : theme.muted }]}>
              {myDuty?.onDuty ? "● ON DUTY — visible on station roster" : "○ Off duty"}
            </Text>
          </View>
          <Switch
            value={!!myDuty?.onDuty}
            onValueChange={onToggleDuty}
            disabled={toggling}
            trackColor={{ true: theme.success, false: theme.border }}
            thumbColor="#fff"
          />
        </View>
      </Card>

      {/* Quick actions -> pushable routes */}
      <View style={styles.statRow}>
        <View style={{ flex: 1 }}>
          <Button label="🆘  SOS" onPress={() => router.push("/(officer)/sos")} color={theme.danger} />
        </View>
        <View style={{ flex: 1 }}>
          <Button label="Scan Evidence" onPress={() => router.push("/(officer)/scan")} variant="outline" color={theme.accent} />
        </View>
      </View>

      {/* Stat row */}
      <View style={styles.statRow}>
        <StatTile label="Open Cases" value={openCases} color={theme.primary} />
        <StatTile label="Beat Check-ins" value={`${doneCheckpoints}/${totalCheckpoints}`} color={theme.accent} />
      </View>

      {/* Beat checklist (Officer feature #4) */}
      <Card>
        <Text style={[styles.cardTitle, { color: theme.text, marginBottom: verticalScale(8) }]}>
          <MapPin size={14} color={theme.text} /> Beat Checkpoints
        </Text>
        {beats.loading ? (
          <Text style={{ color: theme.muted }}>Loading…</Text>
        ) : (
          (beats.data?.checkpoints ?? []).map((c) => (
            <Pressable key={c.id} style={styles.checkRow} onPress={() => !c.checkedIn && checkIn(c.id)}>
              {c.checkedIn ? <CircleCheck size={20} color={theme.success} /> : <Circle size={20} color={theme.muted} />}
              <Text style={[styles.checkLabel, { color: c.checkedIn ? theme.muted : theme.text, textDecorationLine: c.checkedIn ? "line-through" : "none" }]}>
                {c.label}
              </Text>
              {!c.checkedIn ? <Text style={[styles.checkAction, { color: theme.primary }]}>{checkingBeatId === c.id ? "Verifying..." : "Check in"}</Text> : null}
            </Pressable>
          ))
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardTitle: { fontSize: moderateScale(15), fontWeight: "700", fontFamily: "Inter_600SemiBold" },
  cardHint: { fontSize: moderateScale(12), marginTop: 4, fontFamily: "Inter_400Regular" },
  statRow: { flexDirection: "row", gap: moderateScale(10), marginBottom: verticalScale(12) },
  checkRow: { flexDirection: "row", alignItems: "center", paddingVertical: verticalScale(10), gap: moderateScale(10) },
  checkLabel: { flex: 1, fontSize: moderateScale(14), fontFamily: "Inter_400Regular" },
  checkAction: { fontSize: moderateScale(12), fontWeight: "700" },
});
