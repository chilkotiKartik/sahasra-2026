import * as React from "react";
import { View, Text, StyleSheet } from "react-native";
import { moderateScale, verticalScale } from "react-native-size-matters";
import { Screen } from "@/lib/ui";
import { useTheme } from "@/lib/theme";
import { useApi } from "@/lib/hooks";
import { OsmMap, MapMarker } from "@/components/OsmMap";
import { DEFAULT_GEO } from "@/lib/location";

interface Incident { id: string; title: string; geo: { lat: number; lng: number }; priority: string; category: string }
const PRIORITY_COLOR: Record<string, string> = { P1: "#EF4444", P2: "#F59E0B", P3: "#3B82F6", P4: "#6B7280" };

export default function LocalHotspots() {
  const theme = useTheme();
  // Server scopes incidents to the head's station jurisdiction only.
  const { data } = useApi<{ incidents: Incident[] }>("/api/v2/incidents");
  const incs = data?.incidents ?? [];

  // Simple density: count by rounded grid cell.
  const density = React.useMemo(() => {
    const cells: Record<string, number> = {};
    incs.forEach((i) => {
      const k = `${i.geo.lat.toFixed(2)},${i.geo.lng.toFixed(2)}`;
      cells[k] = (cells[k] || 0) + 1;
    });
    return Object.entries(cells).sort((a, b) => b[1] - a[1]);
  }, [incs]);

  const markers: MapMarker[] = incs.map((i) => ({ id: i.id, lat: i.geo.lat, lng: i.geo.lng, title: `${i.title} (${i.priority})`, color: PRIORITY_COLOR[i.priority] }));
  const center = incs[0]?.geo ?? DEFAULT_GEO;

  return (
    <Screen edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Local Hotspots</Text>
        <Text style={[styles.sub, { color: theme.muted }]}>{incs.length} incidents in jurisdiction · {density.length} clusters</Text>
      </View>
      <View style={{ height: verticalScale(300) }}>
        <OsmMap initial={{ lat: center.lat, lng: center.lng, zoomDelta: 0.12 }} markers={markers} />
      </View>
      <View style={styles.legend}>
        {density.slice(0, 3).map(([cell, n]) => (
          <Text key={cell} style={[styles.legendItem, { color: theme.muted }]}>🔥 {cell}: {n} incident(s)</Text>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { padding: moderateScale(16), paddingBottom: moderateScale(8) },
  title: { fontSize: moderateScale(20), fontWeight: "800", fontFamily: "Inter_700Bold" },
  sub: { fontSize: moderateScale(12), marginTop: 2, fontFamily: "Inter_400Regular" },
  legend: { padding: moderateScale(16) },
  legendItem: { fontSize: moderateScale(12), paddingVertical: 3, fontFamily: "Inter_400Regular" },
});
