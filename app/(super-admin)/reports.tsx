import * as React from "react";
import { View, Text, StyleSheet, TextInput, Platform, Share, Alert } from "react-native";
import { moderateScale, verticalScale } from "react-native-size-matters";
import { Screen, ScreenHeader, Card, StatTile, Button, LoadingState } from "@/lib/ui";
import { useTheme } from "@/lib/theme";
import { api } from "@/lib/api";

interface Report {
  generatedAt: string; range: { from: string; to: string };
  stations: { station: string; code: string; total: number; open: number; resolved: number }[];
  totals: { total: number; open: number; resolved: number };
  csv: string;
}

export default function ReportGenerator() {
  const theme = useTheme();
  const [from, setFrom] = React.useState("2026-01-01");
  const [to, setTo] = React.useState("2026-12-31");
  const [report, setReport] = React.useState<Report | null>(null);
  const [loading, setLoading] = React.useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const r = await api.get<Report>(`/api/v2/reports/state?from=${from}&to=${to}`);
      setReport(r);
    } catch (e: any) {
      Alert.alert("Failed", e?.message || "Could not generate report.");
    } finally { setLoading(false); }
  };

  const exportCsv = async () => {
    if (!report) return;
    const filename = `sahasra_state_report_${report.range.from}_${report.range.to}.csv`;
    if (Platform.OS === "web") {
      const blob = new Blob([report.csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
    } else {
      // Real native share sheet (email/drive/etc.) with the CSV content.
      await Share.share({ title: filename, message: report.csv });
    }
  };

  return (
    <Screen scroll>
      <ScreenHeader title="Report Generator" subtitle="Department-wide, date-ranged" />
      <Card>
        <Text style={[styles.label, { color: theme.muted }]}>DATE RANGE (YYYY-MM-DD)</Text>
        <View style={styles.rangeRow}>
          <TextInput style={[inp(theme), { flex: 1 }]} value={from} onChangeText={setFrom} placeholder="from" placeholderTextColor={theme.muted} />
          <TextInput style={[inp(theme), { flex: 1 }]} value={to} onChangeText={setTo} placeholder="to" placeholderTextColor={theme.muted} />
        </View>
        <Button label="Generate report" onPress={generate} loading={loading} color={theme.warning} />
      </Card>

      {loading ? <LoadingState /> : null}

      {report ? (
        <>
          <View style={styles.row}>
            <StatTile label="Total" value={report.totals.total} color={theme.primary} />
            <StatTile label="Open" value={report.totals.open} color={theme.warning} />
            <StatTile label="Resolved" value={report.totals.resolved} color={theme.success} />
          </View>
          <Card>
            <Text style={[styles.label, { color: theme.muted, marginBottom: 8 }]}>PER STATION</Text>
            {report.stations.map((s) => (
              <View key={s.code} style={styles.stRow}>
                <Text style={[styles.stName, { color: theme.text }]}>{s.station}</Text>
                <Text style={[styles.stNums, { color: theme.muted }]}>{s.resolved}/{s.total} resolved</Text>
              </View>
            ))}
          </Card>
          <Button label="⬇  Export CSV" onPress={exportCsv} color={theme.accent} />
          <Text style={{ color: theme.muted, fontSize: moderateScale(10), textAlign: "center", marginTop: 8, fontFamily: "Inter_400Regular" }}>
            Generated {new Date(report.generatedAt).toLocaleString()}
          </Text>
        </>
      ) : null}
    </Screen>
  );
}

const inp = (theme: any) => ({ borderWidth: 1, borderRadius: moderateScale(10), paddingHorizontal: moderateScale(12), paddingVertical: verticalScale(10), fontSize: moderateScale(14), backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text, fontFamily: "Inter_400Regular" });
const styles = StyleSheet.create({
  label: { fontSize: moderateScale(10), fontWeight: "800", letterSpacing: 1, fontFamily: "Inter_600SemiBold" },
  rangeRow: { flexDirection: "row", gap: 10, marginTop: 8, marginBottom: verticalScale(12) },
  row: { flexDirection: "row", gap: moderateScale(10), marginBottom: verticalScale(10) },
  stRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  stName: { fontSize: moderateScale(13), fontFamily: "Inter_500Medium" },
  stNums: { fontSize: moderateScale(12), fontFamily: "Inter_400Regular" },
});
