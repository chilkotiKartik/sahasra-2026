import * as React from "react";
import { View, Text, StyleSheet, TextInput } from "react-native";
import { moderateScale, verticalScale } from "react-native-size-matters";
import { ShieldCheck, ShieldX } from "lucide-react-native";
import { Screen, ScreenHeader, Card, LoadingState, ErrorState } from "@/lib/ui";
import { useTheme } from "@/lib/theme";
import { useApi } from "@/lib/hooks";

interface AuditRow { id: string; seq: number; actorId: string; actorRole: string; action: string; target: string; at: string; hash: string }
interface AuditResp { logs: AuditRow[]; integrity: { valid: boolean; brokenAt: number | null } }

export default function AuditLog() {
  const theme = useTheme();
  const [q, setQ] = React.useState("");
  const { data, loading, error, reload } = useApi<AuditResp>(`/api/v2/audit?q=${encodeURIComponent(q)}`, [q]);

  if (loading && !data) return <Screen><LoadingState label="Loading audit log…" /></Screen>;
  if (error) return <Screen><ErrorState message={error} onRetry={reload} /></Screen>;

  const integrity = data?.integrity;

  return (
    <Screen scroll onRefresh={reload} refreshing={loading}>
      <ScreenHeader title="System Audit Log" subtitle="Tamper-evident (SHA-256 hash chain)" />

      <Card style={{ flexDirection: "row", alignItems: "center", gap: moderateScale(12) } as any}>
        {integrity?.valid ? <ShieldCheck size={28} color={theme.success} /> : <ShieldX size={28} color={theme.danger} />}
        <View style={{ flex: 1 }}>
          <Text style={[styles.integTitle, { color: integrity?.valid ? theme.success : theme.danger }]}>
            {integrity?.valid ? "Chain integrity VERIFIED" : `Chain BROKEN at #${integrity?.brokenAt}`}
          </Text>
          <Text style={[styles.meta, { color: theme.muted }]}>{data?.logs.length ?? 0} entries</Text>
        </View>
      </Card>

      <TextInput
        style={[styles.search, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
        placeholder="Search action / target / actor…"
        placeholderTextColor={theme.muted}
        value={q}
        onChangeText={setQ}
      />

      {(data?.logs ?? []).map((l) => (
        <Card key={l.id}>
          <View style={styles.rowBetween}>
            <Text style={[styles.action, { color: theme.text }]}>#{l.seq} · {l.action}</Text>
            <Text style={[styles.role, { color: theme.warning }]}>{l.actorRole}</Text>
          </View>
          <Text style={[styles.meta, { color: theme.muted }]}>{l.target} · {new Date(l.at).toLocaleString()}</Text>
          <Text style={[styles.hash, { color: theme.muted }]} numberOfLines={1}>hash: {l.hash}</Text>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  integTitle: { fontSize: moderateScale(14), fontWeight: "800", fontFamily: "Inter_600SemiBold" },
  search: { borderWidth: 1, borderRadius: moderateScale(10), paddingHorizontal: moderateScale(12), paddingVertical: verticalScale(10), marginBottom: verticalScale(12), fontSize: moderateScale(13), fontFamily: "Inter_400Regular" },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  action: { fontSize: moderateScale(13), fontWeight: "700", fontFamily: "Inter_600SemiBold" },
  role: { fontSize: moderateScale(10), fontWeight: "800" },
  meta: { fontSize: moderateScale(11), marginTop: 3, fontFamily: "Inter_400Regular" },
  hash: { fontSize: moderateScale(9), marginTop: 4, fontFamily: "Inter_400Regular" },
});
