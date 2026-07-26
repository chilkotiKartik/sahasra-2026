import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface CameraSource {
  id: string;
  name: string;
  location: string;
  type: "Night-Vision" | "Thermal" | "Standard OSD";
}

const CAMERAS: CameraSource[] = [
  { id: "c1", name: "SC_004 Silk Board Junction", location: "Silk Board Crossing", type: "Night-Vision" },
  { id: "c2", name: "SC_012 Whitefield ANPR Gate", location: "Whitefield Main Road", type: "Standard OSD" },
  { id: "c3", name: "SC_025 Peenya Dark Spot #3", location: "Peenya Flyover Underpass", type: "Thermal" },
  { id: "c4", name: "SC_008 Koramangala 80ft Rd", location: "Koramangala 4th Block", type: "Night-Vision" },
];

interface LiveCctvViewerProps {
  initialCamId?: string;
  hasAnomaly?: boolean;
}

export default function LiveCctvViewer({ initialCamId, hasAnomaly = false }: LiveCctvViewerProps) {
  const [selectedCam, setSelectedCam] = useState<CameraSource>(CAMERAS[0]);
  const [isNightVision, setIsNightVision] = useState(true);
  const [detectedPlates, setDetectedPlates] = useState<string[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (initialCamId) {
      const match = CAMERAS.find(c => 
        c.id === initialCamId || 
        c.name.toLowerCase().includes(initialCamId.toLowerCase()) ||
        c.location.toLowerCase().includes(initialCamId.toLowerCase())
      );
      if (match) {
        setSelectedCam(match);
      }
    }
  }, [initialCamId]);

  // Simulated AI vehicle logs
  const vehicles = [
    { type: "Motorcycle", label: "KA-04-MH-1234 (Black Pulsar)", color: "#EF4444" },
    { type: "SUV", label: "KA-03-NB-8890 (White Fortuner)", color: "#10B981" },
    { type: "Sedan", label: "KA-01-PF-2022 (Silver Dzire)", color: "#3B82F6" },
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let frameCount = 0;

    // Moving bounding box coordinates
    const targets = [
      { x: 50, y: 80, vx: 1.2, vy: 0.4, w: 70, h: 50, label: "ACCUSED MOTORCYCLE MATCH", confidence: 91 },
      { x: 220, y: 120, vx: -0.8, vy: -0.2, w: 90, h: 70, label: "VEHICLE (SUV)", confidence: 98 },
      { x: 120, y: 150, vx: 0.5, vy: -0.5, w: 80, h: 60, label: "PEDESTRIAN DISTRESS ZONE", confidence: 84 },
    ];

    const render = () => {
      frameCount++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Draw CCTV background simulation grid
      ctx.fillStyle = isNightVision 
        ? (selectedCam.type === "Thermal" ? "#1e0b36" : "#061A13") 
        : "#080D18";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Thermal gradient simulation
      if (selectedCam.type === "Thermal") {
        const grad = ctx.createRadialGradient(
          canvas.width / 2, canvas.height / 2, 50,
          canvas.width / 2, canvas.height / 2, 200
        );
        grad.addColorStop(0, "#ff5500");
        grad.addColorStop(0.5, "#8800ff");
        grad.addColorStop(1, "#110022");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Draw gridlines
      ctx.strokeStyle = isNightVision ? "rgba(6, 182, 212, 0.08)" : "rgba(59, 130, 246, 0.08)";
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.width; i += 30) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
      }
      for (let i = 0; i < canvas.height; i += 30) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
      }

      // 2. Draw Simulated moving vehicle targets with tracking boxes
      targets.forEach((target, idx) => {
        // Move targets and bounce
        target.x += target.vx;
        target.y += target.vy;
        if (target.x < 10 || target.x + target.w > canvas.width - 10) target.vx *= -1;
        if (target.y < 30 || target.y + target.h > canvas.height - 30) target.vy *= -1;

        // Custom OSD bounding boxes
        const boxColor = target.label.includes("ACCUSED") 
          ? "#EF4444" 
          : (selectedCam.type === "Thermal" ? "#FFFF00" : "#06B6D4");
        ctx.strokeStyle = boxColor;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(target.x, target.y, target.w, target.h);

        // Corner bracket details
        ctx.fillStyle = boxColor;
        const cornerSize = 8;
        // Top-Left
        ctx.fillRect(target.x - 2, target.y - 2, cornerSize, 2);
        ctx.fillRect(target.x - 2, target.y - 2, 2, cornerSize);
        // Top-Right
        ctx.fillRect(target.x + target.w - cornerSize + 2, target.y - 2, cornerSize, 2);
        ctx.fillRect(target.x + target.w, target.y - 2, 2, cornerSize);
        // Bottom-Left
        ctx.fillRect(target.x - 2, target.y + target.h, cornerSize, 2);
        ctx.fillRect(target.x - 2, target.y + target.h - cornerSize + 2, 2, cornerSize);
        // Bottom-Right
        ctx.fillRect(target.x + target.w - cornerSize + 2, target.y + target.h, cornerSize, 2);
        ctx.fillRect(target.x + target.w, target.y + target.h - cornerSize + 2, 2, cornerSize);

        // Target Info Label
        ctx.font = "bold 9px monospace";
        ctx.fillText(`${target.label} [${target.confidence}%]`, target.x, target.y - 6);
      });

      // 3. Draw Scanline CRT flicker effect
      ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
      for (let i = 0; i < canvas.height; i += 4) {
        if (Math.floor(frameCount / 4) % 2 === i % 2) {
          ctx.fillRect(0, i, canvas.width, 1);
        }
      }

      // 4. CCTV HUD Text Overlay (Live Clock & Cam Data)
      ctx.fillStyle = selectedCam.type === "Thermal" ? "#FFFFFF" : "#00FF66";
      ctx.font = "10px monospace";
      ctx.fillText(`REC 🔴 ${selectedCam.name}`, 15, 25);
      
      const now = new Date();
      const timeStr = now.toISOString().replace("T", " ").substring(0, 19) + `.${(now.getMilliseconds() / 10).toFixed(0).padStart(2, "0")}`;
      ctx.fillText(timeStr, canvas.width - 150, 25);
      ctx.fillText(`OSD FEED: ${selectedCam.type} • 25 FPS`, 15, canvas.height - 15);
      ctx.fillText(`TELEMETRY: AUTO_ANPR ENABLED`, canvas.width - 200, canvas.height - 15);

      // Crosshairs in center
      ctx.strokeStyle = hasAnomaly ? "rgba(239, 68, 68, 0.4)" : "rgba(0, 255, 102, 0.3)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2 - 15, canvas.height / 2);
      ctx.lineTo(canvas.width / 2 + 15, canvas.height / 2);
      ctx.moveTo(canvas.width / 2, canvas.height / 2 - 15);
      ctx.lineTo(canvas.width / 2, canvas.height / 2 + 15);
      ctx.stroke();

      if (hasAnomaly) {
        const pulse = 15 + Math.sin(frameCount * 0.15) * 10;
        ctx.strokeStyle = "#EF4444";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, pulse, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = "rgba(239, 68, 68, 0.4)";
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, pulse + 15, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = "#EF4444";
        ctx.font = "bold 9px monospace";
        ctx.fillText("⚠️ THREAT ALERT: WEAPONS ACT / VIOLENCE", 15, 45);
        ctx.fillText("TARGET LOCK IN PROGRESS", 15, 60);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    // Periodically add simulated plate recognition log
    const plateInterval = setInterval(() => {
      const randomVehicle = vehicles[Math.floor(Math.random() * vehicles.length)];
      setDetectedPlates(prev => [
        `[${new Date().toLocaleTimeString()}] ${randomVehicle.type} Logged: ${randomVehicle.label}`,
        ...prev.slice(0, 4)
      ]);
    }, 3000);

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearInterval(plateInterval);
    };
  }, [selectedCam, isNightVision, hasAnomaly]);

  return (
    <View style={styles.container}>
      {/* CCTV Screen Box */}
      <View style={styles.screenWrapper}>
        <canvas
          ref={canvasRef}
          width={480}
          height={240}
          style={{ width: "100%", height: 240, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
        />
        
        {/* Live HUD Overlay */}
        <View style={styles.bottomTelemetry}>
          <Text style={styles.telemetryTitle}>
            📍 Active Camera: <Text style={{ color: "#06B6D4", fontWeight: "bold" }}>{selectedCam.location}</Text>
          </Text>
          <View style={styles.toggleRow}>
            <Pressable 
              style={[styles.toggleBtn, isNightVision && styles.toggleBtnActive]}
              onPress={() => setIsNightVision(!isNightVision)}
            >
              <Ionicons name="eye-outline" size={12} color={isNightVision ? "#0A0F1C" : "#8892B0"} />
              <Text style={[styles.toggleText, isNightVision && styles.toggleTextActive]}>Night Vision</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Camera Selection List */}
      <View style={styles.camSelectionCard}>
        <Text style={styles.sectionLabel}>Select Camera Source Node:</Text>
        <View style={styles.sourceGrid}>
          {CAMERAS.map((cam) => (
            <Pressable
              key={cam.id}
              style={[styles.camChip, selectedCam.id === cam.id && styles.camChipActive]}
              onPress={() => setSelectedCam(cam)}
            >
              <Ionicons 
                name="videocam" 
                size={12} 
                color={selectedCam.id === cam.id ? "#06B6D4" : "#8892B0"} 
              />
              <Text style={[styles.camChipText, selectedCam.id === cam.id && styles.camChipTextActive]}>
                {cam.location}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Real-time Recognition OSD logs */}
      <View style={styles.logsCard}>
        <Text style={styles.logsTitle}>🔴 CCTV Edge AI Recognition logs:</Text>
        {detectedPlates.length === 0 ? (
          <Text style={styles.logEmpty}>Acquiring ANPR/crowd metadata feed...</Text>
        ) : (
          detectedPlates.map((log, index) => (
            <Text key={index} style={styles.logText}>{log}</Text>
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: "100%", gap: 12 },
  screenWrapper: {
    width: "100%",
    backgroundColor: "#0A0F1C",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#06B6D480",
    overflow: "hidden",
  },
  bottomTelemetry: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#141A2E",
    padding: 10,
    borderTopWidth: 1,
    borderColor: "#06B6D440",
  },
  telemetryTitle: { fontSize: 11, color: "#8892B0" },
  toggleRow: { flexDirection: "row", gap: 6 },
  toggleBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: "#1F2A44" },
  toggleBtnActive: { backgroundColor: "#06B6D4", borderColor: "#06B6D4" },
  toggleText: { fontSize: 10, color: "#8892B0", fontWeight: "700" },
  toggleTextActive: { color: "#0A0F1C" },
  
  camSelectionCard: {
    backgroundColor: "#141A2E",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#1F2A44",
    gap: 8,
  },
  sectionLabel: { fontSize: 11, fontWeight: "700", color: "#8892B0" },
  sourceGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  camChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: "#0A0F1C", borderWidth: 1, borderColor: "#1F2A44" },
  camChipActive: { borderColor: "#06B6D4", backgroundColor: "#06B6D415" },
  camChipText: { fontSize: 10, color: "#8892B0", fontWeight: "600" },
  camChipTextActive: { color: "#06B6D4", fontWeight: "700" },

  logsCard: {
    backgroundColor: "#0A0F1C",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#1F2A44",
    gap: 4,
  },
  logsTitle: { fontSize: 11, fontWeight: "bold", color: "#EF4444", marginBottom: 4 },
  logText: { fontSize: 10, fontFamily: "monospace", color: "#22C55E" },
  logEmpty: { fontSize: 10, fontStyle: "italic", color: "#8892B0" },
});
