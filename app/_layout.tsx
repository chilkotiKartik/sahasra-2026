import { Stack, useRouter, useSegments, usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as Notifications from "expo-notifications";
import * as React from "react";
import { View, StyleSheet, ActivityIndicator, Text } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from "@expo-google-fonts/inter";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth, type Role } from "@/context/AuthContext";
import { AppProvider, useApp } from "@/context/AppContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { queryClient } from "@/lib/query-client";
import { useTheme } from "@/lib/theme";
import { initSentry } from "@/lib/monitoring";
import { setPendingLink, takePendingLink, pathAllowedForRole, routeFromNotification, isRoleGroup } from "@/lib/deeplink";

initSentry();
SplashScreen.preventAutoHideAsync().catch(() => {});

/** Which route group a role belongs in. Single source of truth for routing. */
const ROLE_GROUP: Record<Role, string> = {
  officer: "(officer)",
  station_head: "(station-head)",
  super_admin: "(super-admin)",
};

function Splash() {
  const theme = useTheme();
  return (
    <View style={[styles.splash, { backgroundColor: theme.bg }]}>
      <View style={[styles.badge, { borderColor: theme.primary, backgroundColor: theme.card }]}>
        <Text style={[styles.logo, { color: theme.primary }]}>SAHASRA</Text>
      </View>
      <ActivityIndicator color={theme.primary} style={{ marginTop: 20 }} />
    </View>
  );
}

/**
 * Auth gate (Phase 1/2): redirects based on the SERVER-verified role and blocks
 * rendering of the wrong stack — no flash of protected content.
 */
function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const pathname = usePathname();
  const router = useRouter();

  const group = segments[0]; // "(auth)" | "(officer)" | "(station-head)" | "(super-admin)" | "incident" | undefined
  const inAuthGroup = group === "(auth)";
  const targetGroup = user ? ROLE_GROUP[user.role] : null;

  // A logged-in user is misplaced only if they're on ANOTHER role's stack, or
  // still on the auth stack. Shared routes (e.g. /incident/123) are fine.
  const onForeignRoleStack = !!user && isRoleGroup(group) && group !== targetGroup;
  const misplaced = !!user && (onForeignRoleStack || inAuthGroup);
  const needsRedirect = isLoading || (!user && !inAuthGroup) || misplaced;

  React.useEffect(() => {
    if (isLoading) return;
    if (!user) {
      if (!inAuthGroup) {
        // Remember the intended deep link before bouncing to login.
        setPendingLink(pathname);
        router.replace("/(auth)/login");
      }
    } else if (misplaced) {
      router.replace(`/${targetGroup}` as any);
    } else {
      // On the correct stack (or a shared route) — continue a saved deep link.
      const pending = takePendingLink();
      if (pending && pending !== pathname && pathAllowedForRole(pending, user.role)) {
        router.replace(pending as any);
      }
    }
  }, [user, isLoading, group, targetGroup, inAuthGroup, misplaced, pathname]);

  if (needsRedirect) return <Splash />;
  return <>{children}</>;
}

/** Routes a push-notification tap to the exact screen (deep linking). */
function useNotificationRouting() {
  const { user } = useAuth();
  const router = useRouter();
  React.useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (!user) {
        // Not logged in yet — stash and continue after auth.
        const path = routeFromNotification(data, "officer");
        if (path) setPendingLink(path);
        return;
      }
      const path = routeFromNotification(data, user.role);
      if (path && pathAllowedForRole(path, user.role)) router.push(path as any);
    });
    return () => sub.remove();
  }, [user]);
}

function RootNav() {
  const { mode } = useTheme();
  const theme = useTheme();
  useNotificationRouting();
  return (
    <>
      <StatusBar style={mode === "dark" ? "light" : "dark"} />
      <AuthGate>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.bg } }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(officer)" />
          <Stack.Screen name="(station-head)" />
          <Stack.Screen name="(super-admin)" />
          <Stack.Screen name="incident/[id]" options={{ presentation: "card" }} />
          <Stack.Screen name="tools" />
        </Stack>
      </AuthGate>
    </>
  );
}

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AppProvider>
          <AuthProvider>
            <NotificationProvider>
              <GestureHandlerRootView style={{ flex: 1 }}>{children}</GestureHandlerRootView>
            </NotificationProvider>
          </AuthProvider>
        </AppProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold,
  });

  React.useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <Providers>
      <RootNav />
    </Providers>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: "center", justifyContent: "center" },
  badge: {
    width: 96, height: 96, borderRadius: 28, alignItems: "center", justifyContent: "center", borderWidth: 2,
  },
  logo: { fontSize: 16, fontWeight: "900", letterSpacing: 2, fontFamily: "Inter_700Bold" },
});
