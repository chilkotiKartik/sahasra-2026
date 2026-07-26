import * as React from "react";
import {
  View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { moderateScale, verticalScale } from "react-native-size-matters";
import { Shield, Sun, Moon } from "lucide-react-native";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/lib/theme";

/** Seeded accounts (all password: sahasra123) — quick-fill for demo/testing. */
const DEMO = [
  { badge: "KSP-1001", label: "Officer", color: "#3B82F6" },
  { badge: "SH-KRM", label: "Station Head", color: "#8B5CF6" },
  { badge: "SA-001", label: "Super Admin", color: "#F59E0B" },
];

export default function Login() {
  const theme = useTheme();
  const { login } = useAuth();
  const { theme: mode, setTheme } = useApp();

  const [badge, setBadge] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const onSubmit = async () => {
    setError("");
    if (!badge.trim() || !password) {
      setError("Enter your badge ID and password.");
      return;
    }
    setLoading(true);
    try {
      await login(badge.trim(), password);
      // AuthGate handles redirect to the correct role stack.
    } catch (e: any) {
      setError(e?.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  const quickFill = (b: string) => {
    setBadge(b);
    setPassword("sahasra123");
    setError("");
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <Pressable
        style={[styles.themeBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
        onPress={() => setTheme(mode === "dark" ? "light" : "dark")}
        accessibilityLabel="Toggle theme"
      >
        {mode === "dark" ? <Sun size={16} color={theme.text} /> : <Moon size={16} color={theme.text} />}
      </Pressable>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={[styles.logo, { borderColor: theme.primary, backgroundColor: theme.card }]}>
            <Shield size={moderateScale(30)} color={theme.primary} />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>SAHASRA</Text>
          <Text style={[styles.subtitle, { color: theme.muted }]}>Karnataka State Police · Secure Portal</Text>

          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.label, { color: theme.muted }]}>BADGE ID</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
              placeholder="e.g. KSP-1001"
              placeholderTextColor={theme.muted}
              autoCapitalize="characters"
              autoCorrect={false}
              value={badge}
              onChangeText={setBadge}
            />

            <Text style={[styles.label, { color: theme.muted, marginTop: verticalScale(12) }]}>PASSWORD</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
              placeholder="Password"
              placeholderTextColor={theme.muted}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              onSubmitEditing={onSubmit}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable
              style={({ pressed }) => [
                styles.submit,
                { backgroundColor: theme.primary, opacity: loading ? 0.7 : pressed ? 0.85 : 1 },
              ]}
              onPress={onSubmit}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>SIGN IN</Text>}
            </Pressable>
          </View>

          <Text style={[styles.demoHint, { color: theme.muted }]}>Quick sign-in (demo accounts)</Text>
          <View style={styles.demoRow}>
            {DEMO.map((d) => (
              <Pressable
                key={d.badge}
                style={[styles.demoChip, { borderColor: d.color, backgroundColor: theme.card }]}
                onPress={() => quickFill(d.badge)}
              >
                <Text style={[styles.demoChipText, { color: d.color }]}>{d.label}</Text>
                <Text style={[styles.demoBadge, { color: theme.muted }]}>{d.badge}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  themeBtn: {
    position: "absolute", top: verticalScale(12), right: moderateScale(16), zIndex: 10,
    width: moderateScale(38), height: moderateScale(38), borderRadius: moderateScale(12),
    borderWidth: 1, alignItems: "center", justifyContent: "center",
  },
  scroll: { flexGrow: 1, justifyContent: "center", padding: moderateScale(24) },
  logo: {
    width: moderateScale(72), height: moderateScale(72), borderRadius: moderateScale(22),
    borderWidth: 2, alignItems: "center", justifyContent: "center", alignSelf: "center",
  },
  title: { fontSize: moderateScale(26), fontWeight: "900", letterSpacing: 2, textAlign: "center", marginTop: verticalScale(14), fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: moderateScale(12), textAlign: "center", marginTop: 4, fontFamily: "Inter_400Regular" },
  card: {
    marginTop: verticalScale(24), padding: moderateScale(20), borderRadius: moderateScale(20), borderWidth: 1,
  },
  label: { fontSize: moderateScale(10), fontWeight: "800", letterSpacing: 1, marginBottom: 6, fontFamily: "Inter_600SemiBold" },
  input: {
    borderWidth: 1, borderRadius: moderateScale(12), paddingHorizontal: moderateScale(14),
    paddingVertical: verticalScale(11), fontSize: moderateScale(14), fontFamily: "Inter_400Regular",
  },
  error: { color: "#EF4444", fontSize: moderateScale(12), marginTop: verticalScale(10), fontFamily: "Inter_500Medium" },
  submit: {
    marginTop: verticalScale(18), borderRadius: moderateScale(14), paddingVertical: verticalScale(14),
    alignItems: "center", justifyContent: "center",
  },
  submitText: { color: "#fff", fontSize: moderateScale(14), fontWeight: "800", letterSpacing: 1, fontFamily: "Inter_700Bold" },
  demoHint: { fontSize: moderateScale(11), textAlign: "center", marginTop: verticalScale(24), marginBottom: verticalScale(10), fontFamily: "Inter_400Regular" },
  demoRow: { flexDirection: "row", gap: moderateScale(8), justifyContent: "center" },
  demoChip: { flex: 1, borderWidth: 1, borderRadius: moderateScale(12), paddingVertical: verticalScale(10), alignItems: "center" },
  demoChipText: { fontSize: moderateScale(12), fontWeight: "700", fontFamily: "Inter_600SemiBold" },
  demoBadge: { fontSize: moderateScale(9), marginTop: 2, fontFamily: "Inter_400Regular" },
});
