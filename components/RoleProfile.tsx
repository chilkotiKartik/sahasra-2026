import * as React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { moderateScale, verticalScale } from "react-native-size-matters";
import { LogOut, Sun, Moon, ShieldAlert, BadgeCheck } from "lucide-react-native";
import { useRouter } from "expo-router";
import { Screen, ScreenHeader, Card, Button } from "@/lib/ui";
import { useTheme, RoleAccent } from "@/lib/theme";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { triggerTestError, isSentryEnabled } from "@/lib/monitoring";

/** Shared profile screen for all roles (not one of the 24 role features). */
export function RoleProfile() {
  const theme = useTheme();
  const { user, logout } = useAuth();
  const { theme: mode, setTheme } = useApp();
  const router = useRouter();
  const accent = user ? RoleAccent[user.role] : theme.primary;

  const onLogout = async () => {
    await logout();
    // Full stack reset so back-navigation can't reach protected screens.
    router.replace("/(auth)/login");
  };

  const roleLabel =
    user?.role === "officer" ? "Police Officer" : user?.role === "station_head" ? "Station Head" : "Super Admin";

  return (
    <Screen scroll>
      <ScreenHeader title="Profile" subtitle="Session & settings" />

      <Card>
        <View style={styles.idRow}>
          <View style={[styles.avatar, { backgroundColor: accent + "22", borderColor: accent }]}>
            <BadgeCheck size={28} color={accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, { color: theme.text }]}>{user?.name}</Text>
            <Text style={[styles.meta, { color: theme.muted }]}>{roleLabel} · {user?.rank}</Text>
            <Text style={[styles.meta, { color: theme.muted }]}>Badge {user?.badge} · {user?.phone}</Text>
          </View>
        </View>
      </Card>

      <Card>
        <Pressable style={styles.settingRow} onPress={() => setTheme(mode === "dark" ? "light" : "dark")}>
          {mode === "dark" ? <Sun size={18} color={theme.text} /> : <Moon size={18} color={theme.text} />}
          <Text style={[styles.settingText, { color: theme.text }]}>Theme</Text>
          <Text style={[styles.settingValue, { color: theme.muted }]}>{mode === "dark" ? "Dark" : "Light"}</Text>
        </Pressable>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <Pressable style={styles.settingRow} onPress={triggerTestError}>
          <ShieldAlert size={18} color={theme.warning} />
          <Text style={[styles.settingText, { color: theme.text }]}>Send test error</Text>
          <Text style={[styles.settingValue, { color: theme.muted }]}>
            Sentry {isSentryEnabled() ? "on" : "off"}
          </Text>
        </Pressable>
      </Card>

      <Button label="Log out" onPress={onLogout} color={theme.danger} />
      <View style={{ height: verticalScale(8) }} />
      <Text style={[styles.version, { color: theme.muted }]}>SAHASRA v1.0.0</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  idRow: { flexDirection: "row", alignItems: "center", gap: moderateScale(14) },
  avatar: { width: moderateScale(56), height: moderateScale(56), borderRadius: moderateScale(16), borderWidth: 1, alignItems: "center", justifyContent: "center" },
  name: { fontSize: moderateScale(17), fontWeight: "800", fontFamily: "Inter_700Bold" },
  meta: { fontSize: moderateScale(12), marginTop: 2, fontFamily: "Inter_400Regular" },
  settingRow: { flexDirection: "row", alignItems: "center", gap: moderateScale(12), paddingVertical: verticalScale(10) },
  settingText: { flex: 1, fontSize: moderateScale(14), fontFamily: "Inter_500Medium" },
  settingValue: { fontSize: moderateScale(12), fontFamily: "Inter_400Regular" },
  divider: { height: 1, marginVertical: 4 },
  version: { fontSize: moderateScale(11), textAlign: "center", fontFamily: "Inter_400Regular" },
});
