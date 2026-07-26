import * as React from "react";
import { View, Text, StyleSheet, TextInput, Alert, Switch } from "react-native";
import { moderateScale, verticalScale } from "react-native-size-matters";
import { Screen, ScreenHeader, Card, LoadingState, ErrorState, Button } from "@/lib/ui";
import { useTheme } from "@/lib/theme";
import { useApi } from "@/lib/hooks";
import { api } from "@/lib/api";

interface User { id: string; badge: string; name: string; role: string; rank: string; stationId: string | null; active: boolean }
interface Station { id: string; name: string }
const ROLES = ["officer", "station_head", "super_admin"] as const;

export default function UserManagement() {
  const theme = useTheme();
  const users = useApi<{ users: User[] }>("/api/v2/users");
  const stations = useApi<{ stations: Station[] }>("/api/v2/stations");

  const [badge, setBadge] = React.useState("");
  const [name, setName] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState<(typeof ROLES)[number]>("officer");
  const [stationId, setStationId] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  const create = async () => {
    if (!badge.trim() || !name.trim() || !password) { Alert.alert("Missing fields", "Badge, name and password required."); return; }
    setSaving(true);
    try {
      await api.post("/api/v2/users", { badge: badge.trim(), name: name.trim(), password, role, rank: role, stationId });
      setBadge(""); setName(""); setPassword("");
      users.reload();
      Alert.alert("Account created", `${name} can now sign in with badge ${badge}.`);
    } catch (e: any) {
      Alert.alert("Failed", e?.message || "Could not create user.");
    } finally { setSaving(false); }
  };

  const toggleActive = async (u: User) => {
    await api.patch(`/api/v2/users/${u.id}`, { active: !u.active });
    users.reload();
  };

  if (users.loading) return <Screen><LoadingState label="Loading users…" /></Screen>;
  if (users.error) return <Screen><ErrorState message={users.error} onRetry={users.reload} /></Screen>;

  return (
    <Screen scroll onRefresh={() => { users.reload(); stations.reload(); }} refreshing={users.loading}>
      <ScreenHeader title="User & Role Management" subtitle={`${users.data?.users.length ?? 0} accounts`} />

      <Card>
        <Text style={[styles.label, { color: theme.muted }]}>NEW ACCOUNT</Text>
        <TextInput style={inp(theme)} placeholder="Badge (e.g. KSP-1099)" placeholderTextColor={theme.muted} autoCapitalize="characters" value={badge} onChangeText={setBadge} />
        <TextInput style={inp(theme)} placeholder="Full name" placeholderTextColor={theme.muted} value={name} onChangeText={setName} />
        <TextInput style={inp(theme)} placeholder="Temp password" placeholderTextColor={theme.muted} secureTextEntry value={password} onChangeText={setPassword} />
        <View style={styles.wrap}>
          {ROLES.map((r) => (
            <Text key={r} onPress={() => setRole(r)} style={[styles.opt, { color: role === r ? "#fff" : theme.text, backgroundColor: role === r ? theme.warning : theme.cardAlt }]}>{r.replace("_", " ")}</Text>
          ))}
        </View>
        {role !== "super_admin" ? (
          <View style={styles.wrap}>
            {(stations.data?.stations ?? []).map((s) => (
              <Text key={s.id} onPress={() => setStationId(s.id)} style={[styles.opt, { color: stationId === s.id ? "#fff" : theme.text, backgroundColor: stationId === s.id ? theme.primary : theme.cardAlt }]}>{s.name}</Text>
            ))}
          </View>
        ) : null}
        <Button label="Create account" onPress={create} loading={saving} color={theme.warning} />
      </Card>

      {(users.data?.users ?? []).map((u) => (
        <Card key={u.id} style={{ flexDirection: "row", alignItems: "center" } as any}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, { color: theme.text }]}>{u.name}</Text>
            <Text style={[styles.meta, { color: theme.muted }]}>{u.badge} · {u.role.replace("_", " ")}</Text>
          </View>
          <Switch value={u.active} onValueChange={() => toggleActive(u)} trackColor={{ true: theme.success, false: theme.border }} thumbColor="#fff" />
        </Card>
      ))}
    </Screen>
  );
}

const inp = (theme: any) => ({ borderWidth: 1, borderRadius: moderateScale(10), paddingHorizontal: moderateScale(12), paddingVertical: verticalScale(10), marginBottom: verticalScale(10), fontSize: moderateScale(14), backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text, fontFamily: "Inter_400Regular" });
const styles = StyleSheet.create({
  label: { fontSize: moderateScale(10), fontWeight: "800", letterSpacing: 1, marginBottom: 8, fontFamily: "Inter_600SemiBold" },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: verticalScale(10) },
  opt: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: moderateScale(11), fontWeight: "700", overflow: "hidden", textTransform: "capitalize" },
  name: { fontSize: moderateScale(14), fontWeight: "700", fontFamily: "Inter_600SemiBold" },
  meta: { fontSize: moderateScale(12), marginTop: 2, fontFamily: "Inter_400Regular" },
});
