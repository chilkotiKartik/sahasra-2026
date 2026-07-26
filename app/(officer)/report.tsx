import * as React from "react";
import { View, Text, StyleSheet, TextInput, Image, Alert, Platform } from "react-native";
import { moderateScale, verticalScale } from "react-native-size-matters";
import { Camera, ImagePlus, MapPin, CloudOff } from "lucide-react-native";
import { Screen, ScreenHeader, Card, Button } from "@/lib/ui";
import { useTheme } from "@/lib/theme";
import { capturePhoto, pickPhoto, uploadImage, PickedImage } from "@/lib/media";
import { getCurrentPosition, Geo } from "@/lib/location";
import { submitOrQueue, queuedCount } from "@/lib/offline";

const PRIORITIES = ["P1", "P2", "P3", "P4"] as const;

export default function QuickReport() {
  const theme = useTheme();
  const [title, setTitle] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [priority, setPriority] = React.useState<(typeof PRIORITIES)[number]>("P3");
  const [img, setImg] = React.useState<PickedImage | null>(null);
  const [geo, setGeo] = React.useState<Geo | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [pending, setPending] = React.useState(0);

  React.useEffect(() => {
    getCurrentPosition().then(setGeo);
    queuedCount().then(setPending);
  }, []);

  const addPhoto = async (fromCamera: boolean) => {
    const pic = fromCamera && Platform.OS !== "web" ? await capturePhoto() : await pickPhoto();
    if (pic) setImg(pic);
  };

  const submit = async () => {
    if (!title.trim()) {
      Alert.alert("Title required", "Enter a short title for the incident.");
      return;
    }
    setBusy(true);
    try {
      let photoUrl: string | null = null;
      if (img) {
        try {
          photoUrl = await uploadImage(img);
        } catch {
          photoUrl = null; // photo upload can fail while offline; report still queues
        }
      }
      const payload = {
        title: title.trim(), category: category.trim() || "general", priority,
        geo: geo || undefined, address: geo ? `${geo.lat.toFixed(4)}, ${geo.lng.toFixed(4)}` : "", photoUrl,
      };
      const { queued } = await submitOrQueue(payload);
      const count = await queuedCount();
      setPending(count);
      Alert.alert(
        queued ? "Saved offline" : "Report submitted",
        queued ? "No connection — report queued and will sync automatically." : "Incident logged to the station.",
      );
      setTitle(""); setCategory(""); setPriority("P3"); setImg(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen scroll>
      <ScreenHeader title="Quick Incident Report" subtitle="Geotagged field capture" />

      {pending > 0 ? (
        <Card style={{ flexDirection: "row", alignItems: "center", gap: 10 } as any}>
          <CloudOff size={18} color={theme.warning} />
          <Text style={{ color: theme.warning, fontSize: moderateScale(12), fontFamily: "Inter_500Medium" }}>
            {pending} report(s) queued offline — will auto-sync.
          </Text>
        </Card>
      ) : null}

      <Card>
        <Text style={[styles.label, { color: theme.muted }]}>TITLE</Text>
        <TextInput style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]} placeholder="e.g. Chain snatching reported" placeholderTextColor={theme.muted} value={title} onChangeText={setTitle} />

        <Text style={[styles.label, { color: theme.muted, marginTop: verticalScale(12) }]}>CATEGORY</Text>
        <TextInput style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]} placeholder="theft / assault / traffic…" placeholderTextColor={theme.muted} value={category} onChangeText={setCategory} />

        <Text style={[styles.label, { color: theme.muted, marginTop: verticalScale(12) }]}>PRIORITY</Text>
        <View style={styles.prioRow}>
          {PRIORITIES.map((p) => (
            <Text
              key={p}
              onPress={() => setPriority(p)}
              style={[styles.prio, { borderColor: theme.border, color: priority === p ? "#fff" : theme.text, backgroundColor: priority === p ? theme.primary : theme.cardAlt }]}
            >
              {p}
            </Text>
          ))}
        </View>

        <View style={[styles.geoRow]}>
          <MapPin size={14} color={geo ? theme.success : theme.muted} />
          <Text style={{ color: geo ? theme.success : theme.muted, fontSize: moderateScale(11), fontFamily: "Inter_400Regular" }}>
            {geo ? `Geotag: ${geo.lat.toFixed(4)}, ${geo.lng.toFixed(4)}` : "Locating… (grant location for geotag)"}
          </Text>
        </View>
      </Card>

      <Card>
        {img ? <Image source={{ uri: img.dataUrl }} style={styles.preview} resizeMode="cover" /> : null}
        <View style={styles.photoBtns}>
          <View style={{ flex: 1 }}><Button label="Camera" onPress={() => addPhoto(true)} variant="outline" color={theme.accent} /></View>
          <View style={{ flex: 1 }}><Button label="Gallery" onPress={() => addPhoto(false)} variant="outline" color={theme.accent} /></View>
        </View>
      </Card>

      <Button label="Submit report" onPress={submit} loading={busy} color={theme.primary} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: moderateScale(10), fontWeight: "800", letterSpacing: 1, marginBottom: 6, fontFamily: "Inter_600SemiBold" },
  input: { borderWidth: 1, borderRadius: moderateScale(10), paddingHorizontal: moderateScale(12), paddingVertical: verticalScale(10), fontSize: moderateScale(14), fontFamily: "Inter_400Regular" },
  prioRow: { flexDirection: "row", gap: moderateScale(8) },
  prio: { flex: 1, textAlign: "center", borderWidth: 1, borderRadius: moderateScale(10), paddingVertical: verticalScale(10), fontSize: moderateScale(13), fontWeight: "700", overflow: "hidden" },
  geoRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: verticalScale(12) },
  preview: { width: "100%", height: verticalScale(160), borderRadius: moderateScale(10), marginBottom: verticalScale(10) },
  photoBtns: { flexDirection: "row", gap: moderateScale(10) },
});
