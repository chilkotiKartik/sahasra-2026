import * as ImagePicker from "expo-image-picker";
import { api } from "./api";

/** A picked image as a base64 data URL, ready to POST to /api/v2/uploads. */
export interface PickedImage {
  dataUrl: string;
  width: number;
  height: number;
}

function toDataUrl(base64: string, mime = "image/jpeg"): string {
  return `data:${mime};base64,${base64}`;
}

/** Launch the camera (Officer geotagged field capture). Returns null if cancelled/denied. */
export async function capturePhoto(): Promise<PickedImage | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) return null;
  const res = await ImagePicker.launchCameraAsync({ base64: true, quality: 0.5, allowsEditing: false });
  if (res.canceled || !res.assets?.[0]?.base64) return null;
  const a = res.assets[0];
  return { dataUrl: toDataUrl(a.base64!), width: a.width, height: a.height };
}

/** Pick from library (fallback / web). */
export async function pickPhoto(): Promise<PickedImage | null> {
  const res = await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.5, mediaTypes: ["images"] });
  if (res.canceled || !res.assets?.[0]?.base64) return null;
  const a = res.assets[0];
  return { dataUrl: toDataUrl(a.base64!, a.mimeType || "image/jpeg"), width: a.width, height: a.height };
}

/** Upload a picked image, returning the durable retrieval URL. */
export async function uploadImage(img: PickedImage): Promise<string> {
  const { url } = await api.post<{ url: string }>("/api/v2/uploads", { dataUrl: img.dataUrl });
  return url;
}
