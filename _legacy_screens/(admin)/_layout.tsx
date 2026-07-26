import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";

export default function AdminLayout() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#0D1326",
          borderTopColor: "#1F2A44",
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: isSuperAdmin ? "#F59E0B" : "#EF4444",
        tabBarInactiveTintColor: "#8892B0",
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "700",
          fontFamily: "Inter_700Bold",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: isSuperAdmin ? "Super Admin Command" : "Police Command",
          tabBarIcon: ({ color, size }: any) => (
            <Ionicons name="terminal-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="telemetry"
        options={{
          title: "System Health",
          href: isSuperAdmin ? undefined : null,
          tabBarIcon: ({ color, size }: any) => (
            <Ionicons name="pulse-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="incidents"
        options={{
          title: "Live Dispatch",
          tabBarIcon: ({ color, size }: any) => (
            <Ionicons name="shield-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "My Profile",
          tabBarIcon: ({ color, size }: any) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="badge"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
