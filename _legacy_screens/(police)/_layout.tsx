import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";
import { useAuth } from "@/context/AuthContext";

export default function PoliceLayout() {
  const { user } = useAuth();
  const isEmergencyStaff = user?.role === "emergency_staff";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: isEmergencyStaff ? "#EF4444" : "#8B5CF6",
        tabBarInactiveTintColor: "#8892B0",
        tabBarStyle: {
          backgroundColor: "#141A2E",
          borderTopColor: "#1F2A44",
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "700",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: isEmergencyStaff ? "112 Dispatch" : "Command Center",
          tabBarIcon: ({ color, size }: any) => <Ionicons name="shield-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="cctns"
        options={{
          title: "CCTNS FIRs",
          href: isEmergencyStaff ? null : undefined,
          tabBarIcon: ({ color, size }: any) => <Ionicons name="folder-open-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="gangs"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="mo-search"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="hotspots"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="anpr"
        options={{
          title: "Surveillance",
          tabBarIcon: ({ color, size }: any) => <Ionicons name="videocam-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="akka-pade"
        options={{
          title: "Patrols",
          href: isEmergencyStaff ? undefined : null,
          tabBarIcon: ({ color, size }: any) => <Ionicons name="shield-checkmark-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="nlp-query"
        options={{
          title: "AI Terminal",
          href: isEmergencyStaff ? null : undefined,
          tabBarIcon: ({ color, size }: any) => <Ionicons name="terminal-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "My Profile",
          tabBarIcon: ({ color, size }: any) => <Ionicons name="person-outline" size={size} color={color} />,
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
