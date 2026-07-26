import { Tabs } from "expo-router";
import { LayoutGrid, Map, UsersRound, ScrollText, User, Radar } from "lucide-react-native";
import { useTheme } from "@/lib/theme";

export default function SuperAdminLayout() {
  const theme = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.warning,
        tabBarInactiveTintColor: theme.muted,
        tabBarStyle: { backgroundColor: theme.card, borderTopColor: theme.border },
        tabBarLabelStyle: { fontSize: 10, fontFamily: "Inter_500Medium" },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Command", tabBarIcon: ({ color, size }: { color: string; size: number }) => <LayoutGrid color={color} size={size} /> }} />
      <Tabs.Screen name="statemap" options={{ title: "Map", tabBarIcon: ({ color, size }: { color: string; size: number }) => <Map color={color} size={size} /> }} />
      <Tabs.Screen name="users" options={{ title: "Users", tabBarIcon: ({ color, size }: { color: string; size: number }) => <UsersRound color={color} size={size} /> }} />
      <Tabs.Screen name="audit" options={{ title: "Audit", tabBarIcon: ({ color, size }: { color: string; size: number }) => <ScrollText color={color} size={size} /> }} />
      <Tabs.Screen name="intel" options={{ title: "Intel", tabBarIcon: ({ color, size }: { color: string; size: number }) => <Radar color={color} size={size} /> }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: ({ color, size }: { color: string; size: number }) => <User color={color} size={size} /> }} />
      {/* Pushable routes, hidden from tab bar */}
      <Tabs.Screen name="stations" options={{ href: null }} />
      <Tabs.Screen name="links" options={{ href: null }} />
      <Tabs.Screen name="reports" options={{ href: null }} />
      <Tabs.Screen name="health" options={{ href: null }} />
    </Tabs>
  );
}
