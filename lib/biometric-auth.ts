import AsyncStorage from "@react-native-async-storage/async-storage";

export interface BiometricAuthState {
  isEnabled: boolean;
  biometricType: "fingerprint" | "face" | "pin" | null;
}

const BIOMETRIC_ENABLED_KEY = "@sahasra_biometric_enabled";
const BIOMETRIC_TYPE_KEY = "@sahasra_biometric_type";

export async function isBiometricAvailable(): Promise<boolean> {
  // Simulates AndroidX BiometricPrompt capability check
  return true;
}

export async function getBiometricStatus(): Promise<BiometricAuthState> {
  try {
    const enabled = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
    const type = await AsyncStorage.getItem(BIOMETRIC_TYPE_KEY);
    return {
      isEnabled: enabled === "true",
      biometricType: (type as BiometricAuthState["biometricType"]) || "fingerprint",
    };
  } catch (err) {
    return { isEnabled: false, biometricType: null };
  }
}

export async function setBiometricStatus(enabled: boolean, type: "fingerprint" | "face" | "pin" = "fingerprint"): Promise<void> {
  try {
    await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, enabled ? "true" : "false");
    await AsyncStorage.setItem(BIOMETRIC_TYPE_KEY, type);
  } catch (err) {
    console.error("Failed to update biometric status:", err);
  }
}

export async function authenticateWithBiometrics(): Promise<{ success: boolean; error?: string }> {
  const status = await getBiometricStatus();
  if (!status.isEnabled) {
    return { success: false, error: "Biometric login is not enabled" };
  }
  // In a full mobile deployment, this integrates native BiometricPrompt
  return { success: true };
}
