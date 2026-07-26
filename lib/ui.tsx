import * as React from "react";
import {
  View, Text, StyleSheet, ActivityIndicator, Pressable, ScrollView,
  RefreshControl, ViewStyle,
} from "react-native";
import { SafeAreaView, Edge } from "react-native-safe-area-context";
import { moderateScale, verticalScale } from "react-native-size-matters";
import { useTheme } from "./theme";

/** Screen root: SafeAreaView + themed bg. Wrap EVERY screen (Phase 4). */
export function Screen({
  children, edges = ["top", "left", "right"], scroll = false, onRefresh, refreshing,
}: {
  children: React.ReactNode;
  edges?: Edge[];
  scroll?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
}) {
  const theme = useTheme();
  if (scroll) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={edges}>
        <ScrollView
          contentContainerStyle={{ padding: moderateScale(16), paddingBottom: verticalScale(32) }}
          showsVerticalScrollIndicator={false}
          refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={theme.primary} /> : undefined}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={edges}>
      {children}
    </SafeAreaView>
  );
}

export function ScreenHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={styles.headerRow}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.h1, { color: theme.text }]}>{title}</Text>
        {subtitle ? <Text style={[styles.sub, { color: theme.muted }]}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const theme = useTheme();
  return <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }, style]}>{children}</View>;
}

export function StatTile({ label, value, color }: { label: string; value: string | number; color?: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.stat, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={[styles.statVal, { color: color || theme.primary }]}>{value}</Text>
      <Text style={[styles.statLbl, { color: theme.muted }]}>{label}</Text>
    </View>
  );
}

/** Phase 7: loading skeleton, error+retry, empty state. */
export function LoadingState({ label = "Loading…" }: { label?: string }) {
  const theme = useTheme();
  return (
    <View style={styles.center}>
      <ActivityIndicator color={theme.primary} size="large" />
      <Text style={[styles.stateText, { color: theme.muted }]}>{label}</Text>
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const theme = useTheme();
  return (
    <View style={styles.center}>
      <Text style={[styles.stateTitle, { color: theme.danger }]}>Something went wrong</Text>
      <Text style={[styles.stateText, { color: theme.muted }]}>{message}</Text>
      {onRetry ? (
        <Pressable style={[styles.retryBtn, { borderColor: theme.primary }]} onPress={onRetry}>
          <Text style={[styles.retryText, { color: theme.primary }]}>Retry</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  const theme = useTheme();
  return (
    <View style={styles.center}>
      <Text style={[styles.stateTitle, { color: theme.text }]}>{title}</Text>
      {hint ? <Text style={[styles.stateText, { color: theme.muted }]}>{hint}</Text> : null}
    </View>
  );
}

export function Button({ label, onPress, color, disabled, loading, variant = "solid" }: {
  label: string; onPress: () => void; color?: string; disabled?: boolean; loading?: boolean; variant?: "solid" | "outline";
}) {
  const theme = useTheme();
  const c = color || theme.primary;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        variant === "solid"
          ? { backgroundColor: c, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 }
          : { borderWidth: 1, borderColor: c, opacity: disabled ? 0.5 : pressed ? 0.7 : 1 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === "solid" ? "#fff" : c} />
      ) : (
        <Text style={[styles.btnText, { color: variant === "solid" ? "#fff" : c }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: verticalScale(16) },
  h1: { fontSize: moderateScale(22), fontWeight: "800", fontFamily: "Inter_700Bold" },
  sub: { fontSize: moderateScale(12), marginTop: 2, fontFamily: "Inter_400Regular" },
  card: { borderRadius: moderateScale(16), borderWidth: 1, padding: moderateScale(16), marginBottom: verticalScale(12) },
  stat: { flex: 1, borderRadius: moderateScale(14), borderWidth: 1, padding: moderateScale(12), alignItems: "center" },
  statVal: { fontSize: moderateScale(22), fontWeight: "800", fontFamily: "Inter_700Bold" },
  statLbl: { fontSize: moderateScale(10), marginTop: 4, textAlign: "center", fontFamily: "Inter_400Regular" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: moderateScale(32), minHeight: verticalScale(160) },
  stateTitle: { fontSize: moderateScale(16), fontWeight: "700", fontFamily: "Inter_600SemiBold" },
  stateText: { fontSize: moderateScale(13), textAlign: "center", marginTop: 8, fontFamily: "Inter_400Regular" },
  retryBtn: { marginTop: 16, borderWidth: 1, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  retryText: { fontSize: moderateScale(13), fontWeight: "700" },
  btn: { borderRadius: moderateScale(12), paddingVertical: verticalScale(13), alignItems: "center", justifyContent: "center" },
  btnText: { fontSize: moderateScale(14), fontWeight: "800", letterSpacing: 0.5, fontFamily: "Inter_600SemiBold" },
});
