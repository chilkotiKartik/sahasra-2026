import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, Image, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";

export default function AdminBadgeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(true);

  const reauthBiometrics = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setIsVerified(true);
      Alert.alert(
        "BIOMETRICS VERIFIED",
        "Retina scan and biometric handshake completed. Super Admin override clearance is active."
      );
    }, 1200);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#F0F4FF" />
        </Pressable>
        <Text style={styles.headerTitle}>Super Control Pass</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Hologram Secure Pass Card */}
      <View style={styles.badgeWrapper}>
        <View style={styles.badgeCard}>
          {/* Card Hologram Seal */}
          <View style={styles.holoSeal}>
            <Text style={styles.holoSealText}>KSP-HQ</Text>
          </View>

          {/* Top Header */}
          <View style={styles.cardHeader}>
            <Text style={styles.kspTitle}>KARNATAKA STATE POLICE</Text>
            <Text style={styles.kspSub}>HQ COMMAND & INTELLIGENCE ACCESS</Text>
          </View>

          {/* User Details Section */}
          <View style={styles.cardBody}>
            {/* Portrait Image */}
            <View style={styles.avatarContainer}>
              <Image
                source={require("@/assets/images/ksp_admin_avatar.png")}
                style={styles.avatarImage}
                resizeMode="cover"
              />
              <View style={styles.activeDot} />
            </View>

            {/* Officer Metadata */}
            <View style={styles.details}>
              <Text style={styles.detailLabel}>COMMANDER NAME</Text>
              <Text style={styles.detailVal}>{user?.name || "Director General"}</Text>

              <Text style={styles.detailLabel}>SUPER DESIGNATION</Text>
              <Text style={styles.detailVal}>{user?.rank || "Director General of Police"}</Text>

              <Text style={styles.detailLabel}>PASS SECURITY ID</Text>
              <Text style={styles.badgeId}>{user?.badge || "DG-01-HQ"}</Text>
            </View>
          </View>

          {/* Middle Stats / Access Rights */}
          <View style={styles.accessSection}>
            <View style={styles.accessCol}>
              <Text style={styles.accessLabel}>CLEARANCE LEVEL</Text>
              <Text style={[styles.accessVal, { color: "#EF4444" }]}>LEVEL 5 (CRITICAL)</Text>
            </View>
            <View style={styles.accessCol}>
              <Text style={styles.accessLabel}>SECTOR ACCESS</Text>
              <Text style={styles.accessVal}>ALL NODES (FULL)</Text>
            </View>
          </View>

          {/* Simulated QR Code / Encryption Grid */}
          <View style={styles.qrSection}>
            <View style={styles.qrGrid}>
              {/* Draw a mock matrix QR code layout using colored blocks */}
              <View style={{ flexDirection: "row" }}>
                <View style={[styles.qrBlock, styles.qrFilled, { width: 14, height: 14 }]} />
                <View style={[styles.qrBlock, { width: 14 }]} />
                <View style={[styles.qrBlock, styles.qrFilled, { width: 14, height: 14 }]} />
              </View>
              <View style={{ flexDirection: "row", marginTop: 4 }}>
                <View style={[styles.qrBlock, { width: 14 }]} />
                <View style={[styles.qrBlock, styles.qrFilled, { width: 14, height: 14 }]} />
                <View style={[styles.qrBlock, { width: 14 }]} />
              </View>
              <View style={{ flexDirection: "row", marginTop: 4 }}>
                <View style={[styles.qrBlock, styles.qrFilled, { width: 14, height: 14 }]} />
                <View style={[styles.qrBlock, { width: 14 }]} />
                <View style={[styles.qrBlock, styles.qrFilled, { width: 14, height: 14 }]} />
              </View>
            </View>
            <Text style={styles.qrText}>ENCRYPTED ACCESS KEY: NODE-SH-9920</Text>
          </View>

          {/* Verification Badge footer */}
          <View style={styles.badgeFooter}>
            <View style={[styles.statusIndicator, isVerified ? styles.statusActive : styles.statusOffline]}>
              <View style={styles.statusGlow} />
              <Text style={styles.statusLabelText}>
                {isVerifying ? "RETINA SCANNING..." : (isVerified ? "SECURE COMMAND ACTIVE" : "LOCKOUT")}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Control Actions */}
      <View style={styles.controls}>
        <Pressable 
          style={[styles.handshakeBtn, isVerifying && { opacity: 0.7 }]} 
          onPress={reauthBiometrics}
          disabled={isVerifying}
        >
          <Ionicons name="finger-print" size={22} color="#FFFFFF" />
          <Text style={styles.handshakeText}>
            {isVerifying ? "SCANNING RETINA..." : "RE-AUTHENTICATE BIOMETRICS"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#060913", padding: 18, justifyContent: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 30 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#F0F4FF", fontFamily: "Inter_700Bold" },

  badgeWrapper: { alignItems: "center", marginBottom: 40 },
  badgeCard: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: "#0D1326",
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "#EF444440",
    padding: 20,
    position: "relative",
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 20,
    overflow: "hidden",
  },
  holoSeal: {
    position: "absolute",
    top: -15,
    right: -15,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(239, 68, 68, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "45deg" }],
  },
  holoSealText: { fontSize: 8, fontWeight: "900", color: "#EF4444", opacity: 0.6 },
  
  cardHeader: { borderBottomWidth: 1, borderColor: "#1F2A44", paddingBottom: 12, marginBottom: 16 },
  kspTitle: { fontSize: 13, fontWeight: "900", color: "#F0F4FF", letterSpacing: 1.5, fontFamily: "Inter_700Bold", textAlign: "center" },
  kspSub: { fontSize: 8, fontWeight: "700", color: "#EF4444", letterSpacing: 0.5, textAlign: "center", marginTop: 2 },

  cardBody: { flexDirection: "row", gap: 16, marginBottom: 20 },
  avatarContainer: { position: "relative" },
  avatarImage: { width: 85, height: 110, borderRadius: 12, borderWidth: 1.5, borderColor: "#1F2A44" },
  activeDot: {
    position: "absolute",
    bottom: -4,
    right: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#10B981",
    borderWidth: 2,
    borderColor: "#0D1326",
  },

  details: { flex: 1, justifyContent: "center" },
  detailLabel: { fontSize: 7, fontWeight: "800", color: "#8892B0", letterSpacing: 0.5, marginBottom: 2 },
  detailVal: { fontSize: 12, fontWeight: "700", color: "#F0F4FF", fontFamily: "Inter_700Bold", marginBottom: 8 },
  badgeId: { fontSize: 13, fontWeight: "900", color: "#EF4444", fontFamily: "monospace" },

  accessSection: { 
    flexDirection: "row", 
    borderTopWidth: 1, 
    borderBottomWidth: 1, 
    borderColor: "#1F2A44", 
    paddingVertical: 10, 
    marginBottom: 20 
  },
  accessCol: { flex: 1, alignItems: "center" },
  accessLabel: { fontSize: 7, fontWeight: "800", color: "#8892B0", letterSpacing: 0.5, marginBottom: 2 },
  accessVal: { fontSize: 10, fontWeight: "700", color: "#F0F4FF", fontFamily: "Inter_700Bold" },

  qrSection: { alignItems: "center", marginBottom: 16 },
  qrGrid: { width: 50, height: 50, backgroundColor: "#141A2E", borderRadius: 8, padding: 4, justifyContent: "center", alignItems: "center" },
  qrBlock: { height: 14, backgroundColor: "transparent" },
  qrFilled: { backgroundColor: "#F0F4FF", borderRadius: 2 },
  qrText: { fontSize: 8, color: "#8892B0", fontFamily: "monospace", marginTop: 6 },

  badgeFooter: { alignItems: "center" },
  statusIndicator: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 8, 
    backgroundColor: "#080C18", 
    borderRadius: 20, 
    paddingHorizontal: 12, 
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#1F2A44",
  },
  statusActive: { borderColor: "#10B98140" },
  statusOffline: { borderColor: "#EF444440" },
  statusGlow: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#10B981" },
  statusLabelText: { fontSize: 8, fontWeight: "900", color: "#F0F4FF", letterSpacing: 0.5, fontFamily: "Inter_700Bold" },

  controls: { gap: 12 },
  handshakeBtn: {
    backgroundColor: "#EF4444",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 14,
  },
  handshakeText: { fontSize: 13, fontWeight: "800", color: "#FFFFFF", fontFamily: "Inter_700Bold" },
});
