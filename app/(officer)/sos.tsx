import * as React from "react";
import { View, Text, StyleSheet, Pressable, Linking, Alert, ActivityIndicator } from "react-native";
import { moderateScale, verticalScale } from "react-native-size-matters";
import { TriangleAlert, Phone } from "lucide-react-native";
import { Screen, ScreenHeader, Card, Button } from "@/lib/ui";
import { useTheme } from "@/lib/theme";
import { useApi } from "@/lib/hooks";
import { api } from "@/lib/api";
import { getCurrentPosition } from "@/lib/location";

interface Sos { id: string; status: string; note: string; createdAt: string }

export default function OfficerSos() {
  const theme = useTheme();
  const sos = useApi<{ sos: Sos[] }>("/api/v2/sos");
  const [sending, setSending] = React.useState(false);

  const triggerSos = async () => {
    setSending(true);
    try {
      const geo = (await getCurrentPosition()) ?? undefined;
      await api.post("/api/v2/sos", { geo, note: "Officer requires immediate backup" });
      Alert.alert("SOS sent", "Nearby officers and your station head have been alerted.");
      sos.reload();
    } catch (e: any) {
      Alert.alert("Failed", e?.message || "Could not send SOS.");
    } finally {
      setSending(false);
    }
  };

  const callControlRoom = () => {
    // Real native call to KSP control room (112 emergency).
    Linking.openURL("tel:112").catch(() => Alert.alert("Unable to place call"));
  };

  const active = sos.data?.sos.filter((s) => s.status !== "resolved") ?? [];

  return (
    <Screen scroll onRefresh={sos.reload} refreshing={sos.loading}>
      <ScreenHeader title="Emergency SOS" subtitle="One tap alerts your station + nearby units" />

      <Pressable
        onPress={triggerSos}
        disabled={sending}
        style={({ pressed }) => [styles.sosBtn, { backgroundColor: theme.danger, opacity: sending ? 0.7 : pressed ? 0.9 : 1 }]}
      >
        {sending ? <ActivityIndicator color="#fff" size="large" /> : <TriangleAlert size={moderateScale(48)} color="#fff" />}
        <Text style={styles.sosText}>{sending ? "SENDING…" : "SEND SOS"}</Text>
        <Text style={styles.sosSub}>Shares your live GPS location</Text>
      </Pressable>

      <View style={{ height: verticalScale(12) }} />
      <Button label="Call Control Room (112)" onPress={callControlRoom} color={theme.warning} variant="outline" />

      <View style={{ height: verticalScale(20) }} />
      <Text style={[styles.section, { color: theme.muted }]}>ACTIVE / RECENT SOS</Text>
      {active.length === 0 ? (
        <Card><Text style={{ color: theme.muted }}>No active SOS events.</Text></Card>
      ) : (
        active.map((s) => (
          <Card key={s.id}>
            <View style={styles.rowBetween}>
              <Text style={[styles.sosNote, { color: theme.text }]}>{s.note}</Text>
              <View style={[styles.badge, { backgroundColor: theme.danger + "22" }]}>
                <Text style={[styles.badgeText, { color: theme.danger }]}>{s.status.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={[styles.time, { color: theme.muted }]}>{new Date(s.createdAt).toLocaleString()}</Text>
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  sosBtn: { borderRadius: moderateScale(24), paddingVertical: verticalScale(36), alignItems: "center", justifyContent: "center" },
  sosText: { color: "#fff", fontSize: moderateScale(24), fontWeight: "900", letterSpacing: 2, marginTop: 12, fontFamily: "Inter_700Bold" },
  sosSub: { color: "#ffffffcc", fontSize: moderateScale(12), marginTop: 4, fontFamily: "Inter_400Regular" },
  section: { fontSize: moderateScale(11), fontWeight: "800", letterSpacing: 1, marginBottom: verticalScale(8) },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sosNote: { flex: 1, fontSize: moderateScale(14), fontWeight: "600", fontFamily: "Inter_500Medium" },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: moderateScale(9), fontWeight: "800" },
  time: { fontSize: moderateScale(11), marginTop: 6, fontFamily: "Inter_400Regular" },
});
