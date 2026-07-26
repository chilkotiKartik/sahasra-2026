export const getThemeColors = (theme: "dark" | "light") => {
  if (theme === "light") {
    return {
      bg: "#F8FAFC",        // slate-50
      cardBg: "#FFFFFF",    // white
      text: "#0F172A",      // slate-900
      muted: "#64748B",     // slate-500
      border: "#E2E8F0",    // slate-200
      primary: "#3B82F6",   // blue
      secondary: "#8B5CF6", // purple
      success: "#10B981",   // green
      warning: "#F59E0B",   // amber
      danger: "#EF4444",    // red
      inputBg: "#F1F5F9",   // slate-100
      headerBg: "#FFFFFF",  // white
      overlayBg: "#FFFFFFFA"
    };
  }
  return {
    bg: "#0A0F1C",          // deep space dark
    cardBg: "#141A2E",      // dark slate
    text: "#F0F4FF",        // light gray-blue
    muted: "#8892B0",       // steel gray
    border: "#1F2A44",      // dark border
    primary: "#3B82F6",     // blue
    secondary: "#8B5CF6",   // purple
    success: "#22C55E",     // green
    warning: "#F59E0B",     // amber
    danger: "#EF4444",      // red
    inputBg: "#0A0F1C",     // deep space
    headerBg: "#141A2EFA",  // dark slate translucent
    overlayBg: "#141A2EFA"
  };
};
