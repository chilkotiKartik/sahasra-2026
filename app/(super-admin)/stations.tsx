import * as React from "react";
import { View, Text, StyleSheet, TextInput, Alert } from "react-native";
import { moderateScale, verticalScale } from "react-native-size-matters";
import { Screen, ScreenHeader, Card, LoadingState, ErrorState, Button } from "@/lib/ui";
import { useTheme } from "@/lib/theme";
import { useApi } from "@/lib/hooks";
import { api } from "@/lib/api";

interface Station { id: string; name: string; code: string; district: string; headId: string | null }

export default function Stations() {
  const theme = useTheme();
  const { data, loading, error, reload } = useApi<{ stations: Station[] }>("/api/v2/stations");
  const [name, setName] = React.useState("");
  const [code, setCode] = React.useState("");
  const [district, setDistrict] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const create = async () => {
    if (!name.trim() || !code.trim()) {
      Alert.alert("Missing fields", "Name and code are required.");
      return;
    }
    setSaving(true);
    try {
      await api.post("/api/v2/stations", { name: name.trim(), code: code.trim(), district: district.trim() });
      setName(""); setCode(""); setDistrict("");
      reload();
    } catch (e: any) {
      Alert.alert("Failed", e?.message || "Could not create station.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Screen><LoadingState label="Loading stations…" /></Screen>;
  if (error) return <Screen><ErrorState message={error} onRetry={reload} /></Screen>;

  return (
    <Screen scroll onRefresh={reload} refreshing={loading}>
      <ScreenHeader title="Station Management" subtitle={`${data?.stations.length ?? 0} stations`} />

      <Card>
        <Text style={[styles.label, { color: theme.muted }]}>NEW STATION</Text>
        <TextInput style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]} placeholder="Name" placeholderTextColor={theme.muted} value={name} onChangeText={setName} />
        <TextInput style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]} placeholder="Code (e.g. HSR)" placeholderTextColor={theme.muted} autoCapitalize="characters" value={code} onChangeText={setCode} />
        <TextInput style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]} placeholder="District" placeholderTextColor={theme.muted} value={district} onChangeText={setDistrict} />
        <Button label="Create station" onPress={create} loading={saving} color={theme.warning} />
      </Card>

      {data?.stations.map((s) => (
        <Card key={s.id}>
          <View style={styles.rowBetween}>
            <Text style={[styles.name, { color: theme.text }]}>{s.name}</Text>
            <Text style={[styles.code, { color: theme.warning }]}>{s.code}</Text>
          </View>
          <Text style={[styles.meta, { color: theme.muted }]}>{s.district || "—"} · {s.headId ? "Head assigned" : "No head"}</Text>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: moderateScale(10), fontWeight: "800", letterSpacing: 1, marginBottom: 8, fontFamily: "Inter_600SemiBold" },
  input: { borderWidth: 1, borderRadius: moderateScale(10), paddingHorizontal: moderateScale(12), paddingVertical: verticalScale(10), marginBottom: verticalScale(10), fontSize: moderateScale(14), fontFamily: "Inter_400Regular" },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  name: { fontSize: moderateScale(15), fontWeight: "700", fontFamily: "Inter_600SemiBold" },
  code: { fontSize: moderateScale(13), fontWeight: "800" },
  meta: { fontSize: moderateScale(12), marginTop: 2, fontFamily: "Inter_400Regular" },
});
