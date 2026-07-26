import * as React from "react";
import { View, Text, StyleSheet } from "react-native";

export interface MapMarker { id: string; lat: number; lng: number; title?: string; color?: string }

/**
 * Web fallback for OsmMap. react-native-maps has no web implementation, so on
 * web we render an embedded OpenStreetMap iframe (still keyless/free) centered
 * on the region, with a marker list beneath. Native devices get the real MapView.
 */
export function OsmMap({
  markers = [], initial, style,
}: {
  markers?: MapMarker[];
  initial: { lat: number; lng: number; zoomDelta?: number };
  userLocation?: { lat: number; lng: number } | null;
  onMarkerPress?: (id: string) => void;
  style?: any;
}) {
  const d = initial.zoomDelta ?? 0.08;
  const bbox = [initial.lng - d, initial.lat - d, initial.lng + d, initial.lat + d].join(",");
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik`;
  return (
    <View style={[styles.wrap, style]}>
      <iframe title="map" src={src} style={{ border: 0, width: "100%", height: "100%", minHeight: 260 }} />
      {markers.length > 0 ? (
        <View style={styles.list}>
          {markers.slice(0, 8).map((m) => (
            <Text key={m.id} style={styles.item}>📍 {m.title || `${m.lat.toFixed(3)}, ${m.lng.toFixed(3)}`}</Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, minHeight: 260 },
  list: { padding: 8 },
  item: { fontSize: 12, color: "#8892B0", paddingVertical: 2 },
});
