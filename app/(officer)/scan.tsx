import * as React from "react";
import { View, Text, StyleSheet, TextInput, Platform, Alert } from "react-native";
import { moderateScale, verticalScale } from "react-native-size-matters";
import { CameraView, useCameraPermissions } from "expo-camera";
import { QrCode } from "lucide-react-native";
import { Screen, ScreenHeader, Card, Button, LoadingState } from "@/lib/ui";
import { useTheme } from "@/lib/theme";
import { useApi } from "@/lib/hooks";
import { api } from "@/lib/api";

interface Incident { id: string; title: string }
interface Evidence { id: string; label: string; qrCode: string; incidentId: string }

export default function ScanEvidence() {
  const theme = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const cases = useApi<{ incidents: Incident[] }>("/api/v2/incidents?mine=1");
  const [caseId, setCaseId] = React.useState<string | null>(null);
  const evidence = useApi<{ evidence: Evidence[] }>(caseId ? `/api/v2/evidence?incidentId=${caseId}` : null, [caseId]);

  const [code, setCode] = React.useState("");
  const [scanning, setScanning] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const lastScan = React.useRef(0);

  const onScanned = (res: { data: string }) => {
    const now = Date.now();
    if (now - lastScan.current < 1500) return; // debounce
    lastScan.current = now;
    setCode(res.data);
    setScanning(false);
  };

  const logEvidence = async () => {
    if (!caseId) return Alert.alert("Select a case first");
    if (!code.trim()) return Alert.alert("Scan or enter an evidence code/label");
    setSaving(true);
    try {
      await api.post("/api/v2/evidence", { incidentId: caseId, label: code.trim() });
      setCode("");
      evidence.reload();
      Alert.alert("Evidence logged", "Tagged to the case with a chain-of-custody entry.");
    } catch (e: any) {
      Alert.alert("Failed", e?.message || "Could not log evidence.");
    } finally {
      setSaving(false);
    }
  };

  if (cases.loading) return <Screen><LoadingState label="Loading your cases…" /></Screen>;

  return (
    <Screen scroll>
      <ScreenHeader title="QR Evidence Tagging" subtitle="Scan & log evidence to a case" />

      <Card>
        <Text style={[styles.label, { color: theme.muted }]}>SELECT CASE</Text>
        {(cases.data?.incidents ?? []).map((c) => (
          <Text
            key={c.id}
            onPress={() => setCaseId(c.id)}
            style={[styles.caseRow, { color: caseId === c.id ? "#fff" : theme.text, backgroundColor: caseId === c.id ? theme.primary : theme.cardAlt }]}
          >
            {c.title}
          </Text>
        ))}
        {(cases.data?.incidents ?? []).length === 0 ? <Text style={{ color: theme.muted }}>No cases assigned to scan against.</Text> : null}
      </Card>

      <Card>
        <Text style={[styles.label, { color: theme.muted }]}>EVIDENCE CODE</Text>
        {scanning && Platform.OS !== "web" ? (
          <View style={styles.scanner}>
            <CameraView
              style={StyleSheet.absoluteFill}
              barcodeScannerSettings={{ barcodeTypes: ["qr", "code128", "ean13"] }}
              onBarcodeScanned={onScanned}
            />
          </View>
        ) : null}
        <TextInput
          style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
          placeholder="Scanned code appears here (or type it)"
          placeholderTextColor={theme.muted}
          value={code}
          onChangeText={setCode}
        />
        <View style={styles.btnRow}>
          {Platform.OS !== "web" ? (
            <View style={{ flex: 1 }}>
              <Button
                label={scanning ? "Stop" : "Scan QR"}
                variant="outline"
                color={theme.accent}
                onPress={async () => {
                  if (!permission?.granted) {
                    const r = await requestPermission();
                    if (!r.granted) return Alert.alert("Camera permission needed to scan.");
                  }
                  setScanning((s) => !s);
                }}
              />
            </View>
          ) : null}
          <View style={{ flex: 1 }}>
            <Button label="Log evidence" onPress={logEvidence} loading={saving} color={theme.primary} disabled={!caseId} />
          </View>
        </View>
      </Card>

      {caseId ? (
        <Card>
          <Text style={[styles.label, { color: theme.muted }]}>LOGGED EVIDENCE</Text>
          {(evidence.data?.evidence ?? []).length === 0 ? (
            <Text style={{ color: theme.muted }}>None yet for this case.</Text>
          ) : (
            (evidence.data?.evidence ?? []).map((e) => (
              <View key={e.id} style={styles.evRow}>
                <QrCode size={16} color={theme.accent} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.evLabel, { color: theme.text }]}>{e.label}</Text>
                  <Text style={[styles.evCode, { color: theme.muted }]}>{e.qrCode}</Text>
                </View>
              </View>
            ))
          )}
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: moderateScale(10), fontWeight: "800", letterSpacing: 1, marginBottom: 8, fontFamily: "Inter_600SemiBold" },
  caseRow: { borderRadius: moderateScale(8), paddingHorizontal: moderateScale(12), paddingVertical: verticalScale(10), marginBottom: 6, fontSize: moderateScale(13), overflow: "hidden", fontFamily: "Inter_400Regular" },
  input: { borderWidth: 1, borderRadius: moderateScale(10), paddingHorizontal: moderateScale(12), paddingVertical: verticalScale(10), fontSize: moderateScale(14), fontFamily: "Inter_400Regular" },
  scanner: { height: verticalScale(200), borderRadius: moderateScale(12), overflow: "hidden", marginBottom: verticalScale(10) },
  btnRow: { flexDirection: "row", gap: moderateScale(10), marginTop: verticalScale(10) },
  evRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: verticalScale(8) },
  evLabel: { fontSize: moderateScale(13), fontWeight: "600", fontFamily: "Inter_500Medium" },
  evCode: { fontSize: moderateScale(10), marginTop: 2, fontFamily: "Inter_400Regular" },
});
