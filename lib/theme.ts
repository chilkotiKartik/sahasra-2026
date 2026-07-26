import { useApp } from "@/context/AppContext";

export interface ThemeColors {
  bg: string;
  card: string;
  cardAlt: string;
  border: string;
  primary: string;
  secondary: string;
  accent: string;
  warning: string;
  danger: string;
  success: string;
  text: string;
  muted: string;
  inputBg: string;
}

export const Colors: Record<"light" | "dark", ThemeColors> = {
  light: {
    bg: "#F8FAFC", card: "#FFFFFF", cardAlt: "#F1F5F9", border: "#E2E8F0",
    primary: "#2563EB", secondary: "#7C3AED", accent: "#0891B2", warning: "#D97706",
    danger: "#DC2626", success: "#059669", text: "#0F172A", muted: "#64748B", inputBg: "#F1F5F9",
  },
  dark: {
    bg: "#0A0F1C", card: "#141A2E", cardAlt: "#1B2338", border: "#1F2A44",
    primary: "#3B82F6", secondary: "#8B5CF6", accent: "#06B6D4", warning: "#F59E0B",
    danger: "#EF4444", success: "#22C55E", text: "#F0F4FF", muted: "#8892B0", inputBg: "#0A0F1C",
  },
};

/** Role accent colors so each stack reads as a distinct product. */
export const RoleAccent: Record<string, string> = {
  officer: "#3B82F6", // blue — field
  station_head: "#8B5CF6", // purple — oversight
  super_admin: "#F59E0B", // amber — command
};

export function useTheme(): ThemeColors & { mode: "light" | "dark" } {
  const { theme } = useApp();
  return { ...Colors[theme], mode: theme };
}
