import { Tabs } from "expo-router";
import { LayoutDashboard, MapPin, FilePlus2, FolderOpen, User, Radar } from "lucide-react-native";
import { useTheme } from "@/lib/theme";

export default function OfficerLayout() {
  const theme = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.muted,
        tabBarStyle: { backgroundColor: theme.card, borderTopColor: theme.border },
        tabBarLabelStyle: { fontSize: 10, fontFamily: "Inter_500Medium" },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Duty", tabBarIcon: ({ color, size }: { color: string; size: number }) => <LayoutDashboard color={color} size={size} /> }} />
      <Tabs.Screen name="map" options={{ title: "Map", tabBarIcon: ({ color, size }: { color: string; size: number }) => <MapPin color={color} size={size} /> }} />
      <Tabs.Screen name="report" options={{ title: "Report", tabBarIcon: ({ color, size }: { color: string; size: number }) => <FilePlus2 color={color} size={size} /> }} />
      <Tabs.Screen name="cases" options={{ title: "Cases", tabBarIcon: ({ color, size }: { color: string; size: number }) => <FolderOpen color={color} size={size} /> }} />
      <Tabs.Screen name="intel" options={{ title: "Intel", tabBarIcon: ({ color, size }: { color: string; size: number }) => <Radar color={color} size={size} /> }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: ({ color, size }: { color: string; size: number }) => <User color={color} size={size} /> }} />
      {/* Pushable routes, hidden from the tab bar */}
      <Tabs.Screen name="sos" options={{ href: null }} />
      <Tabs.Screen name="scan" options={{ href: null }} />
    </Tabs>
  );
}
