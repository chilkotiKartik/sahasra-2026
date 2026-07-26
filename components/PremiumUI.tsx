import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated, Easing, Platform, Pressable } from "react-native";

export const colors = {
  bg: "#0A0F1C",
  card: "#141A2E",
  border: "#1F2A44",
  primary: "#3B82F6",
  secondary: "#8B5CF6",
  accent: "#06B6D4",
  warning: "#F59E0B",
  danger: "#EF4444",
  success: "#22C55E",
  text: "#F0F4FF",
  muted: "#8892B0",
};

export interface GlassCardProps {
  children: React.ReactNode;
  style?: any;
  glow?: "none" | "blue" | "purple" | "cyan" | "red" | "green";
  onPress?: () => void;
  padding?: number;
  borderRadius?: number;
}

export function GlassCard({ children, style, glow = "none", onPress, padding = 16, borderRadius = 16 }: GlassCardProps) {
  const borderAnim = useRef(new Animated.Value(0)).current;
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (glow !== "none") {
      Animated.loop(
        Animated.sequence([
          Animated.timing(borderAnim, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(borderAnim, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
    }
  }, [glow, borderAnim]);

  const glowColors: Record<string, string> = {
    blue: colors.primary,
    purple: colors.secondary,
    cyan: colors.accent,
    red: colors.danger,
    green: colors.success,
  };

  const borderColor = glow !== "none" ? borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border, glowColors[glow]],
  }) : colors.border;

  const shadowColor = glow !== "none" ? borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["transparent", glowColors[glow] + "40"],
  }) : "transparent";

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        onPressIn={() => setFocused(true)}
        onPressOut={() => setFocused(false)}
      >
        <Animated.View
          style={[
            styles.card,
            { padding, borderRadius, borderColor, shadowColor },
            style,
          ]}
        >
          <View style={styles.glassOverlay} />
          {children}
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <Animated.View
      style={[
        styles.card,
        { padding, borderRadius, borderColor, shadowColor },
        style,
      ]}
    >
      <View style={styles.glassOverlay} />
      {children}
    </Animated.View>
  );
}

export interface AnimatedCounterProps {
  value: number;
  decimals?: number;
  duration?: number;
  style?: any;
  prefix?: string;
  suffix?: string;
  color?: string;
}

export function AnimatedCounter({ value, decimals = 0, duration = 1200, style, prefix = "", suffix = "", color }: AnimatedCounterProps) {
  const anim = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    Animated.timing(anim, {
      toValue: value,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(value * eased);
      if (progress < 1) requestAnimationFrame(animate);
      else setDisplayValue(value);
    };
    requestAnimationFrame(animate);
  }, [value, duration, anim]);

  const formatted = displayValue.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return (
    <Text style={[styles.counter, { color: color || colors.text }, style]}>
      {prefix}{formatted}{suffix}
    </Text>
  );
}

export function Scanlines({ style, opacity = 0.03 }: { style?: any; opacity?: number }) {
  return (
    <View style={[styles.scanlines, style]}>
      {Array.from({ length: 20 }).map((_, i) => (
        <View key={i} style={[styles.scanline, { opacity }]} />
      ))}
    </View>
  );
}

export interface RadarWidgetProps {
  size?: number;
  blips?: number;
  theme?: "blue" | "green" | "amber";
}

export function RadarWidget({ size = 60, blips = 3, theme = "blue" }: RadarWidgetProps) {
  const rotation = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(Animated.timing(rotation, { toValue: 1, duration: 4000, easing: Easing.linear, useNativeDriver: true })).start();
    Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ])).start();
  }, [rotation, pulse]);

  const themeColors = {
    blue: { primary: colors.primary, secondary: colors.primary + "40", glow: colors.primary + "60" },
    green: { primary: colors.success, secondary: colors.success + "40", glow: colors.success + "60" },
    amber: { primary: colors.warning, secondary: colors.warning + "40", glow: colors.warning + "60" },
  };

  const c = themeColors[theme];

  return (
    <View style={{ width: size, height: size }}>
      <Animated.View style={[
        styles.radarBg,
        { width: size, height: size, borderColor: c.primary + "40" },
      ]}>
        <Animated.View style={[
          styles.radarSweep,
          { width: size, height: size, backgroundColor: c.glow },
          { transform: [{ rotate: rotation.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] }) }] },
        ]} />
        {Array.from({ length: blips }).map((_, i) => (
          <Animated.View key={i} style={[
            styles.radarBlip,
            { backgroundColor: c.primary, top: (size / 2) + Math.sin(i * 2) * (size * 0.3), left: (size / 2) + Math.cos(i * 2) * (size * 0.3) },
            { opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) },
          ]} />
        ))}
      </Animated.View>
    </View>
  );
}

export function LiveIndicator({ color = colors.success, size = 8 }: { color?: string; size?: number }) {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 1000, useNativeDriver: true }),
    ])).start();
  }, [pulse]);

  return (
    <View style={styles.liveContainer}>
      <Animated.View style={[
        styles.liveDot,
        { width: size, height: size, backgroundColor: color },
        { opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 0.4] }), transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.3] }) }] },
      ]} />
    </View>
  );
}

export function GradientBorder({ children, colors: gradColors = [colors.primary, colors.secondary], width = 1, radius = 16, style }: any) {
  return (
    <View style={[{ borderRadius: radius, padding: width }, style]}>
      <View style={{ borderRadius: radius - width, overflow: "hidden", backgroundColor: colors.card }}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card + "E0",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 8,
  },
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  counter: { fontFamily: "Inter_700Bold", fontSize: 28, lineHeight: 34 },
  scanlines: { ...StyleSheet.absoluteFillObject, flexDirection: "column", pointerEvents: "none" },
  scanline: { flex: 1, borderBottomWidth: 0.5, borderColor: "#fff" },
  radarBg: { borderRadius: 999, borderWidth: 1, overflow: "hidden", position: "relative" },
  radarSweep: { position: "absolute", top: 0, left: 0, borderRadius: 999, opacity: 0.15 },
  radarBlip: { position: "absolute", width: 6, height: 6, borderRadius: 3, transform: [{ translateX: -3 }, { translateY: -3 }] },
  liveContainer: { width: 16, height: 16, justifyContent: "center", alignItems: "center" },
  liveDot: { borderRadius: 999 },
});