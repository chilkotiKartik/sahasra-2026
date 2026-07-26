import * as React from "react";
import { StyleSheet, Platform } from "react-native";
import MapView, { Marker, UrlTile, PROVIDER_DEFAULT, Region } from "react-native-maps";

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  title?: string;
  color?: string;
}

/**
 * Keyless map (Phase 6). Uses OpenStreetMap raster tiles via UrlTile with
 * mapType="none" so NO Google Maps API key or billing is required on either
 * platform. This is the free path.
 */
export function OsmMap({
  markers = [], initial, userLocation, onMarkerPress, style,
}: {
  markers?: MapMarker[];
  initial: { lat: number; lng: number; zoomDelta?: number };
  userLocation?: { lat: number; lng: number } | null;
  onMarkerPress?: (id: string) => void;
  style?: any;
}) {
  const delta = initial.zoomDelta ?? 0.08;
  const region: Region = {
    latitude: initial.lat, longitude: initial.lng, latitudeDelta: delta, longitudeDelta: delta,
  };
  return (
    <MapView
      style={[styles.map, style]}
      provider={PROVIDER_DEFAULT}
      // On Android, mapType="none" hides Google base tiles so no key is needed;
      // OSM UrlTile provides the imagery.
      mapType={Platform.OS === "android" ? "none" : "standard"}
      initialRegion={region}
    >
      <UrlTile urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maximumZ={19} flipY={false} />
      {userLocation ? (
        <Marker coordinate={{ latitude: userLocation.lat, longitude: userLocation.lng }} title="You" pinColor="#3B82F6" />
      ) : null}
      {markers.map((m) => (
        <Marker
          key={m.id}
          coordinate={{ latitude: m.lat, longitude: m.lng }}
          title={m.title}
          pinColor={m.color || "#EF4444"}
          onPress={() => onMarkerPress?.(m.id)}
        />
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({ map: { flex: 1 } });
