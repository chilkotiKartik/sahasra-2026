import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import type { Complaint, SOSAlert, Worker, PoliceStation, RiskZone, GeoPoint } from "@/context/AppContext";

export type MapFilter = "all" | "complaints" | "sos" | "workers" | "police" | "risks" | "hospitals" | "fire" | "anpr" | "hotspots";

export interface EmergencyServiceMarker {
  id: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
  phone?: string;
  address?: string;
  district?: string;
}

interface Props {
  complaints?: Complaint[];
  sosAlerts?: SOSAlert[];
  workers?: Worker[];
  policeStations?: PoliceStation[];
  riskZones?: RiskZone[];
  emergencyServices?: EmergencyServiceMarker[];
  filter?: MapFilter;
  userLocation?: GeoPoint | null;
  userDistrict?: string;
  style?: any;
}

const BENGALURU_DISTRICT_CENTERS: Record<string, { lat: number; lng: number; zoom: number }> = {
  "Bengaluru Urban":   { lat: 12.9716, lng: 77.5946, zoom: 12 },
  "Bengaluru Rural":   { lat: 13.1986, lng: 77.7063, zoom: 11 },
  "Peenya":            { lat: 13.0287, lng: 77.5194, zoom: 14 },
  "Koramangala":       { lat: 12.9352, lng: 77.6146, zoom: 14 },
  "Indiranagar":       { lat: 12.9784, lng: 77.6408, zoom: 14 },
  "Whitefield":        { lat: 12.9698, lng: 77.7500, zoom: 13 },
  "Jayanagar":         { lat: 12.9291, lng: 77.5823, zoom: 14 },
  "Electronic City":   { lat: 12.8456, lng: 77.6603, zoom: 13 },
  "Malleswaram":       { lat: 13.0034, lng: 77.5675, zoom: 14 },
  "Hebbal":            { lat: 13.0358, lng: 77.5970, zoom: 14 },
};

const DEFAULT_CENTER = { lat: 12.9716, lng: 77.5946, zoom: 12 };

interface MarkerData {
  lat: number;
  lng: number;
  color: string;
  type: string;
  title: string;
  subtitle: string;
  emoji: string;
  phone?: string;
}

function buildLeafletHTML(
  markers: MarkerData[],
  center: { lat: number; lng: number; zoom: number }
): string {
  const markersJson = JSON.stringify(markers);
  const cLat = center.lat;
  const cLng = center.lng;
  const cZoom = center.zoom;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin=""/>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body,#map{width:100%;height:100%;background:#0A0F1C}
  .leaflet-container{background:#0A0F1C}
  .leaflet-popup-content-wrapper{background:#141A2E;border:1px solid #1F2A44;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.6);padding:0}
  .leaflet-popup-content{margin:0;color:#F0F4FF}
  .leaflet-popup-tip{background:#141A2E}
  .leaflet-popup-tip-container{display:none}
  .leaflet-control-zoom{border:1px solid #1F2A44!important;border-radius:10px!important;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.4)!important}
  .leaflet-control-zoom a{background:#141A2E!important;color:#F0F4FF!important;border:none!important;font-size:16px!important;width:32px!important;height:32px!important;line-height:32px!important;border-bottom:1px solid #1F2A44!important}
  .leaflet-control-zoom a:last-child{border-bottom:none!important}
  .leaflet-control-zoom a:hover{background:#1F2A44!important;color:#fff!important}
  .leaflet-control-attribution{background:rgba(10,15,28,0.9)!important;color:#8892B0!important;font-size:9px!important;border-radius:6px!important;border:1px solid #1F2A44!important;padding:2px 6px!important}
  .leaflet-control-attribution a{color:#3B82F6!important}
  .popup-box{padding:12px;min-width:180px}
  .popup-title{font-weight:700;font-size:13px;color:#F0F4FF;margin-bottom:4px;font-family:sans-serif;line-height:1.3}
  .popup-sub{font-size:11px;color:#8892B0;font-family:sans-serif;line-height:1.4}
  .popup-type{display:inline-block;font-size:9px;font-weight:700;letter-spacing:0.5px;padding:2px 7px;border-radius:4px;margin-bottom:6px;text-transform:uppercase}
  .popup-call{background:#22C55E;color:#fff;border:none;border-radius:6px;padding:6px 12px;font-size:11px;font-weight:700;cursor:pointer;margin-top:8px;width:100%}
  .custom-div-icon{background:transparent!important;border:none!important}
  @keyframes pulse {
    0% { transform: scale(0.6); opacity: 1; }
    100% { transform: scale(2.2); opacity: 0; }
  }
</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
<script>
var map = L.map('map', {
  center: [${cLat}, ${cLng}],
  zoom: ${cZoom},
  zoomControl: true,
  attributionControl: true
});

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; OpenStreetMap &copy; CARTO (Karnataka KSP)',
  subdomains: 'abcd',
  maxZoom: 19
}).addTo(map);

var markersData = ${markersJson};

markersData.forEach(function(m) {
  var markerIcon;
  if (m.type === "sos") {
    markerIcon = L.divIcon({
      html: '<div style="position:relative;width:32px;height:32px;">' +
              '<div style="position:absolute;width:100%;height:100%;border-radius:50%;background:#EF4444;opacity:0.4;animation:pulse 1.5s infinite ease-out;transform-origin:center;"></div>' +
              '<div style="position:absolute;width:20px;height:20px;border-radius:50%;background:#EF4444;top:6px;left:6px;border:2px solid #fff;display:flex;align-items:center;justify-content:center;box-shadow:0 0 10px #EF4444;">' +
                '<span style="font-size:10px;color:#fff;">🆘</span>' +
              '</div>' +
            '</div>',
      className: 'custom-div-icon',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
  } else if (m.type === "police") {
    markerIcon = L.divIcon({
      html: '<div style="width:24px;height:24px;background:#3B82F6;border-radius:50%;border:2px solid #fff;display:flex;align-items:center;justify-content:center;box-shadow:0 0 8px #3B82F6;">' +
              '<span style="font-size:12px;">👮</span>' +
            '</div>',
      className: 'custom-div-icon',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
  } else if (m.type === "worker") {
    markerIcon = L.divIcon({
      html: '<div style="position:relative;width:32px;height:32px;">' +
              '<div style="position:absolute;width:100%;height:100%;border-radius:50%;background:#EC4899;opacity:0.4;animation:pulse 1.8s infinite ease-out;transform-origin:center;"></div>' +
              '<div style="position:absolute;width:20px;height:20px;border-radius:50%;background:#EC4899;top:6px;left:6px;border:2px solid #fff;display:flex;align-items:center;justify-content:center;box-shadow:0 0 8px #EC4899;">' +
                '<span style="font-size:10px;color:#fff;">🚗</span>' +
              '</div>' +
            '</div>',
      className: 'custom-div-icon',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
  } else if (m.type === "hotspot" || m.type === "risk") {
    markerIcon = L.divIcon({
      html: '<div style="position:relative;width:36px;height:36px;">' +
              '<div style="position:absolute;width:100%;height:100%;border-radius:50%;background:#F59E0B;opacity:0.3;animation:pulse 2s infinite ease-out;transform-origin:center;"></div>' +
              '<div style="position:absolute;width:22px;height:22px;border-radius:50%;background:#F59E0B;top:7px;left:7px;border:2px solid #fff;display:flex;align-items:center;justify-content:center;box-shadow:0 0 10px #F59E0B;">' +
                '<span style="font-size:10px;color:#fff;">⚠️</span>' +
              '</div>' +
            '</div>',
      className: 'custom-div-icon',
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });
  } else {
    markerIcon = L.divIcon({
      html: '<div style="width:22px;height:22px;background:' + m.color + ';border-radius:50%;border:2px solid #fff;display:flex;align-items:center;justify-content:center;box-shadow:0 0 6px ' + m.color + ';">' +
              '<span style="font-size:11px;">📢</span>' +
            '</div>',
      className: 'custom-div-icon',
      iconSize: [22, 22],
      iconAnchor: [11, 11]
    });
  }

  var marker = L.marker([m.lat, m.lng], { icon: markerIcon }).addTo(map);

  var typeBadgeColor = m.color;
  var html = '<div class="popup-box">' +
    '<span class="popup-type" style="background:' + typeBadgeColor + '20;color:' + typeBadgeColor + '">' + m.type.toUpperCase() + '</span>' +
    '<div class="popup-title">' + m.title + '</div>' +
    '<div class="popup-sub">' + m.subtitle + '</div>';
  if (m.phone) {
    html += '<div style="font-size:11px;color:#22C55E;margin-top:6px;font-weight:bold;">📞 Call ' + m.phone + '</div>';
  }
  html += '</div>';
  marker.bindPopup(html, { maxWidth: 220, closeButton: false });
});
</script>
</body>
</html>`;
}

export default function KarnatakaMap({
  complaints = [],
  sosAlerts = [],
  workers = [],
  policeStations = [],
  riskZones = [],
  filter = "all",
  userDistrict = "Bengaluru Urban",
  style,
}: Props) {
  
  // Coordinate Projector & Filters
  const center = useMemo(() => {
    if (userDistrict && BENGALURU_DISTRICT_CENTERS[userDistrict]) {
      return BENGALURU_DISTRICT_CENTERS[userDistrict];
    }
    return DEFAULT_CENTER;
  }, [userDistrict]);

  const markers = useMemo(() => {
    const result: MarkerData[] = [];

    if (filter === "all" || filter === "complaints") {
      complaints.forEach((c) => {
        if (c.lat && c.lng) {
          result.push({
            lat: c.lat,
            lng: c.lng,
            color: c.priority === "P1" ? "#EF4444" : c.priority === "P2" ? "#F59E0B" : "#3B82F6",
            type: "complaint",
            emoji: "📢",
            title: c.title,
            subtitle: `${c.department || "KSP"} • ${c.status || "Pending"}`,
          });
        }
      });
    }

    if (filter === "all" || filter === "sos") {
      sosAlerts.forEach((s) => {
        if (s.lat && s.lng) {
          result.push({
            lat: s.lat,
            lng: s.lng,
            color: "#EF4444",
            type: "sos",
            emoji: "🆘",
            title: `SOS: ${s.userName || "Citizen"}`,
            subtitle: `Active Emergency Signal`,
            phone: "+91 99999 11200",
          });
        }
      });
    }

    if (filter === "all" || filter === "police") {
      policeStations.forEach((p) => {
        if (p.geo?.lat && p.geo?.lng) {
          result.push({
            lat: p.geo.lat,
            lng: p.geo.lng,
            color: "#3B82F6",
            type: "police",
            emoji: "👮",
            title: p.name,
            subtitle: p.address || "Police Station Jurisdiction",
            phone: p.phone,
          });
        }
      });
    }

    if (filter === "all" || filter === "workers") {
      workers.forEach((w: any) => {
        const lat = w.geo?.lat || w.lat;
        const lng = w.geo?.lng || w.lng;
        if (lat && lng) {
          result.push({
            lat,
            lng,
            color: "#EC4899",
            type: "worker",
            emoji: "🚗",
            title: w.name,
            subtitle: `Akka Patrol Unit • ${w.status || "Patrolling"}`,
            phone: w.phone || "",
          });
        }
      });
    }

    if (filter === "all" || filter === "risks" || filter === "hotspots") {
      riskZones.forEach((r) => {
        if (r.center?.lat && r.center?.lng) {
          result.push({
            lat: r.center.lat,
            lng: r.center.lng,
            color: "#F59E0B",
            type: "hotspot",
            emoji: "⚠️",
            title: `Hotspot: ${r.name}`,
            subtitle: `Crime Risk Index: ${r.riskLevel || "HIGH"}`,
          });
        }
      });
    }

    return result;
  }, [complaints, sosAlerts, workers, policeStations, riskZones, filter]);

  const mapHtml = useMemo(() => {
    return buildLeafletHTML(markers, center);
  }, [markers, center]);

  return (
    <View style={[styles.container, style]}>
      <iframe
        key={`${center.lat}-${center.lng}-${filter}`}
        srcDoc={mapHtml}
        style={{ width: "100%", height: "100%", border: "none", borderRadius: "16px", backgroundColor: "#0A0F1C" }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0F1C" },
});
