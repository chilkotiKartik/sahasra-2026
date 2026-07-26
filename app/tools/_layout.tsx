import { Stack } from "expo-router";
import { useTheme } from "@/lib/theme";

/** Shared "Intelligence" stack — reachable from every role's Intel tab. */
export default function IntelLayout() {
  const theme = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.bg },
        animation: "slide_from_right",
      }}
    />
  );
}
