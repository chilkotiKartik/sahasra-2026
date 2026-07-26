import * as React from "react";
import { View, Text, StyleSheet } from "react-native";
import { moderateScale, verticalScale } from "react-native-size-matters";
import { useRouter } from "expo-router";
import { Screen, Card } from "@/lib/ui";
import { useTheme } from "@/lib/theme";
import { useApi } from "@/lib/hooks";
import { OsmMap, MapMarker } from "@/components/OsmMap";
import { DEFAULT_GEO } from "@/lib/location";

interface Incident { id: string; title: string; geo: { lat: number; lng: number }; priority: string; category: string; stationId: string }
const PRIORITY_COLOR: Record<string, string> = { P1: "#EF4444", P2: "#F59E0B", P3: "#3B82F6", P4: "#6B7280" };

export default function StateMap() {
  const theme = useTheme();
  const router = useRouter();
  const { data } = useApi<{ incidents: Incident[] }>("/api/v2/incidents"); // all stations for super admin
  const incs = data?.incidents ?? [];

  // Trend by category (real counts).
  const trend = React.useMemo(() => {
    const c: Record<string, number> = {};
    incs.forEach((i) => (c[i.category] = (c[i.category] || 0) + 1));
    return Object.entries(c).sort((a, b) => b[1] - a[1]);
  }, [incs]);
  const max = trend[0]?.[1] || 1;

  const markers: MapMarker[] = incs.map((i) => ({ id: i.id, lat: i.geo.lat, lng: i.geo.lng, title: `${i.title} (${i.priority})`, color: PRIORITY_COLOR[i.priority] }));

  return (
    <Screen edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>State-Wide Map</Text>
        <Text style={[styles.sub, { color: theme.muted }]}>{incs.length} incidents · all stations</Text>
      </View>
      <View style={{ height: verticalScale(260) }}>
        <OsmMap
          initial={{ lat: DEFAULT_GEO.lat, lng: DEFAULT_GEO.lng, zoomDelta: 0.25 }}
          markers={markers}
          onMarkerPress={(id) => router.push(`/incident/${id}` as any)}
        />
      </View>
      <View style={{ padding: moderateScale(16) }}>
        <Text style={[styles.section, { color: theme.muted }]}>CATEGORY TREND</Text>
        {trend.map(([cat, n]) => (
          <View key={cat} style={styles.barRow}>
            <Text style={[styles.barLabel, { color: theme.text }]}>{cat}</Text>
            <View style={[styles.barTrack, { backgroundColor: theme.cardAlt }]}>
              <View style={[styles.barFill, { width: `${(n / max) * 100}%`, backgroundColor: theme.warning }]} />
            </View>
            <Text style={[styles.barVal, { color: theme.muted }]}>{n}</Text>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { padding: moderateScale(16), paddingBottom: moderateScale(8) },
  title: { fontSize: moderateScale(20), fontWeight: "800", fontFamily: "Inter_700Bold" },
  sub: { fontSize: moderateScale(12), marginTop: 2, fontFamily: "Inter_400Regular" },
  section: { fontSize: moderateScale(11), fontWeight: "800", letterSpacing: 1, marginBottom: verticalScale(10) },
  barRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  barLabel: { width: "28%", fontSize: moderateScale(11), fontFamily: "Inter_400Regular" },
  barTrack: { flex: 1, height: 14, borderRadius: 7, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 7 },
  barVal: { width: 24, textAlign: "right", fontSize: moderateScale(11), fontFamily: "Inter_500Medium" },
});
