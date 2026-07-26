import { Tabs } from "expo-router";
import { Users, BellRing, FolderKanban, ChartColumn, User, Radar } from "lucide-react-native";
import { useTheme } from "@/lib/theme";

export default function StationHeadLayout() {
  const theme = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.secondary,
        tabBarInactiveTintColor: theme.muted,
        tabBarStyle: { backgroundColor: theme.card, borderTopColor: theme.border },
        tabBarLabelStyle: { fontSize: 10, fontFamily: "Inter_500Medium" },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Roster", tabBarIcon: ({ color, size }: { color: string; size: number }) => <Users color={color} size={size} /> }} />
      <Tabs.Screen name="dispatch" options={{ title: "Dispatch", tabBarIcon: ({ color, size }: { color: string; size: number }) => <BellRing color={color} size={size} /> }} />
      <Tabs.Screen name="cases" options={{ title: "Cases", tabBarIcon: ({ color, size }: { color: string; size: number }) => <FolderKanban color={color} size={size} /> }} />
      <Tabs.Screen name="analytics" options={{ title: "Station", tabBarIcon: ({ color, size }: { color: string; size: number }) => <ChartColumn color={color} size={size} /> }} />
      <Tabs.Screen name="intel" options={{ title: "Intel", tabBarIcon: ({ color, size }: { color: string; size: number }) => <Radar color={color} size={size} /> }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: ({ color, size }: { color: string; size: number }) => <User color={color} size={size} /> }} />
      {/* Pushable routes, hidden from tab bar */}
      <Tabs.Screen name="shifts" options={{ href: null }} />
      <Tabs.Screen name="evidence" options={{ href: null }} />
      <Tabs.Screen name="hotspots" options={{ href: null }} />
      <Tabs.Screen name="officer/[id]" options={{ href: null }} />
    </Tabs>
  );
}
