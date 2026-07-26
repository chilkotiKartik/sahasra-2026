import * as React from "react";
import { View, Text, StyleSheet } from "react-native";
import { moderateScale } from "react-native-size-matters";
import { Screen } from "@/lib/ui";
import { useTheme } from "@/lib/theme";
import { useApi } from "@/lib/hooks";
import { OsmMap, MapMarker } from "@/components/OsmMap";
import { watchPosition, DEFAULT_GEO, Geo } from "@/lib/location";
import { wsUrl } from "@/lib/config";
import { getAccessToken } from "@/lib/auth";

interface Incident { id: string; title: string; geo: { lat: number; lng: number }; priority: string }
const PRIORITY_COLOR: Record<string, string> = { P1: "#EF4444", P2: "#F59E0B", P3: "#3B82F6", P4: "#6B7280" };

export default function OfficerMap() {
  const theme = useTheme();
  const { data, reload } = useApi<{ incidents: Incident[] }>("/api/v2/incidents", [], { pollMs: 12000 });
  const [me, setMe] = React.useState<Geo | null>(null);

  // Live GPS: real position updates as the officer moves (Phase 6 watchPosition).
  React.useEffect(() => {
    let unsub = () => {};
    watchPosition(setMe).then((u) => (unsub = u));
    return () => unsub();
  }, []);

  // Realtime incident pins via WebSocket (Phase 6): a new incident logged by
  // another officer appears here without manual refresh.
  React.useEffect(() => {
    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(wsUrl(`/ws?token=${getAccessToken() ?? ""}`));
      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          if (msg.type === "incident:new" || msg.type === "incident:update" || msg.type === "sos:new") reload();
        } catch {}
      };
    } catch {}
    return () => ws?.close();
  }, [reload]);

  const markers: MapMarker[] = (data?.incidents ?? []).map((i) => ({
    id: i.id, lat: i.geo.lat, lng: i.geo.lng, title: i.title, color: PRIORITY_COLOR[i.priority],
  }));

  return (
    <Screen edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Field Map</Text>
        <Text style={[styles.sub, { color: theme.muted }]}>Live incidents · {markers.length} pins</Text>
      </View>
      <OsmMap
        initial={{ lat: me?.lat ?? DEFAULT_GEO.lat, lng: me?.lng ?? DEFAULT_GEO.lng }}
        markers={markers}
        userLocation={me}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { padding: moderateScale(16), paddingBottom: moderateScale(8) },
  title: { fontSize: moderateScale(20), fontWeight: "800", fontFamily: "Inter_700Bold" },
  sub: { fontSize: moderateScale(12), marginTop: 2, fontFamily: "Inter_400Regular" },
});
