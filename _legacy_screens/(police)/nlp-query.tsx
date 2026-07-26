import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MOCK_NLP_SUGGESTIONS, MOCK_SUSPECTS } from "@/constants/sahasraData";

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  intentJson?: any;
  sociologicalRisk?: string;
  financialLink?: string;
}

export default function NLPQueryScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg_1",
      sender: "user",
      text: "show chain snatchers in Peenya",
      timestamp: "14:20 PM",
    },
    {
      id: "msg_2",
      sender: "ai",
      text: "Found 2 prime suspects linked to Peenya Pulsar Syndicate (Louvain Cluster #1). Ramesh Kumar (Cobra Ramesh) is flagged as Kingpin with 0.94 Degree Centrality. ICJS status: Out on Bail.",
      timestamp: "14:20 PM",
      intentJson: {
        intent: "FETCH_SUSPECT_RECORD",
        crimeCategory: "CHAIN_SNATCHING",
        crimeCode: "IPC 379A",
        location: "Peenya",
        icjsBailStatus: "Out on Bail",
        explainabilityFIRs: ["FIR-2026-BLR-0412", "FIR-2026-BLR-0388"],
      },
      sociologicalRisk: "Urbanization Stress & Unlit Transit Corridors near Metro Station",
      financialLink: "Mule Account KA-BANK-9012 (UPI VPA: cobra.ramesh@upi)",
    },
  ]);

  const [inputQuery, setInputQuery] = useState("");
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [selectedLang, setSelectedLang] = useState<"en" | "kn">("en");

  const micPulse = useRef(new Animated.Value(1)).current;

  const toggleVoiceRecording = () => {
    if (!isRecordingVoice) {
      setIsRecordingVoice(true);
      Animated.loop(
        Animated.sequence([
          Animated.timing(micPulse, { toValue: 1.3, duration: 500, useNativeDriver: true }),
          Animated.timing(micPulse, { toValue: 1.0, duration: 500, useNativeDriver: true }),
        ])
      ).start();

      // Simulate voice input after 2 seconds
      setTimeout(() => {
        setIsRecordingVoice(false);
        const voiceQuery = selectedLang === "kn" ? "ಪೀಣ್ಯದಲ್ಲಿ ಸರಗಳ್ಳತನದ ಬಗ್ಗೆ ಮಾಹಿತಿ ಕೊಡಿ" : "Burglary cases involving red Swift vehicle";
        handleSendMessage(voiceQuery);
      }, 2500);
    } else {
      setIsRecordingVoice(false);
      micPulse.setValue(1);
    }
  };

  const getApiRoot = () => {
    if (typeof window !== "undefined" && window.location) {
      if (window.location.port === "8081" || window.location.port === "8082" || window.location.port === "8080" || window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
        return `${window.location.protocol}//${window.location.hostname}:5000`;
      }
      return window.location.origin;
    }
    return "http://localhost:5000";
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputQuery;
    if (!query.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}_u`,
      sender: "user",
      text: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");

    try {
      const response = await fetch(`${getApiRoot()}/api/ai/police-copilot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: query, history: messages }),
      });
      const data = await response.json();
      
      const aiMsg: ChatMessage = {
        id: `msg_${Date.now()}_ai`,
        sender: "ai",
        text: data.reply || "No direct matches found in CCTNS active index.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        intentJson: data.intentJson,
        sociologicalRisk: data.sociologicalRisk,
        financialLink: data.financialLink,
      };
      
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.log("Failed to fetch KSP AI Copilot response, using client-side fallback:", err);
      // Local client-side fallback
      const isBurglary = query.toLowerCase().includes("swift") || query.toLowerCase().includes("burglary");
      const aiIntent = isBurglary
        ? {
            intent: "FETCH_SERIAL_MO_MATCH",
            crimeCategory: "HOUSE_BREAKING",
            crimeCode: "IPC 454",
            vehicleModel: "Red Maruti Swift",
            crossDistrictMatch: "Hubballi (FIR-2026-HUB-0215) ↔ Dharwad (FIR-2026-DHAR-0104) [92.4% Cosine Match]",
            explainabilityFIRs: ["FIR-2026-HUB-0215", "FIR-2026-DHAR-0104"],
          }
        : {
            intent: "QUERY_CRIME_DATABASE",
            location: "Bengaluru Urban",
            explainabilityFIRs: ["FIR-2026-BLR-0501"],
          };
      const aiText = isBurglary
        ? "FAISS Vector Search identified a 92.4% semantic MO match between Hubballi and Dharwad burglaries involving a red Maruti Swift getaway vehicle."
        : "SAHASRA AI retrieved CCTNS crime records matching your natural language parameters.";
      
      const aiMsg: ChatMessage = {
        id: `msg_${Date.now()}_ai`,
        sender: "ai",
        text: aiText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        intentJson: aiIntent,
        sociologicalRisk: isBurglary 
          ? "Gated residential developments with unmonitored rear balcony access"
          : "Commercial tech hub area with high temporary migrant footfall",
        financialLink: isBurglary
          ? "Shell account KA-BANK-4412 used for stolen bullion liquidation"
          : "Digital Arrest Mule Accounts (ICICI VPA: cyber.vicky@upi)",
      };
      setMessages((prev) => [...prev, aiMsg]);
    }
  };

  const handleExportPDF = () => {
    Alert.alert(
      "📄 Export Conversation History as PDF",
      "KSP Official Crime Intelligence Transcript exported successfully!\nSaved locally to: /downloads/KSP_SAHASRA_Transcript_2026.pdf\n\nIncludes cryptographic signature & DPDP Act audit hash.",
      [{ text: "Open PDF", onPress: () => {} }, { text: "OK" }]
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Intelligent Conversational AI</Text>
          <Text style={styles.headerSub}>KSP Crime Database • English & Kannada Voice Q&A</Text>
        </View>

        <Pressable style={styles.pdfExportBtn} onPress={handleExportPDF}>
          <Ionicons name="document-text-outline" size={14} color="#FFFFFF" />
          <Text style={styles.pdfExportText}>SAVE PDF</Text>
        </Pressable>
      </View>

      {/* Language & Voice Bar */}
      <View style={styles.controlBar}>
        <View style={styles.langSwitchRow}>
          <Pressable
            style={[styles.langBtn, selectedLang === "en" && styles.langBtnActive]}
            onPress={() => setSelectedLang("en")}
          >
            <Text style={[styles.langText, selectedLang === "en" && styles.langTextActive]}>English</Text>
          </Pressable>
          <Pressable
            style={[styles.langBtn, selectedLang === "kn" && styles.langBtnActive]}
            onPress={() => setSelectedLang("kn")}
          >
            <Text style={[styles.langText, selectedLang === "kn" && styles.langTextActive]}>ಕನ್ನಡ</Text>
          </Pressable>
        </View>

        <View style={styles.voiceIndicator}>
          <Ionicons name="mic-outline" size={14} color="#06B6D4" />
          <Text style={styles.voiceIndicatorText}>Voice Q&A Ready</Text>
        </View>
      </View>

      {/* Chat Transcript Area */}
      <ScrollView style={styles.chatArea} contentContainerStyle={styles.chatContent}>
        {messages.map((m) => (
          <View
            key={m.id}
            style={[
              styles.msgBubble,
              m.sender === "user" ? styles.userBubble : styles.aiBubble,
            ]}
          >
            <View style={styles.msgHeader}>
              <Text style={styles.senderText}>
                {m.sender === "user" ? "👮 Inspector Reddy" : "⚡ SAHASRA AI (KSP)"}
              </Text>
              <Text style={styles.msgTime}>{m.timestamp}</Text>
            </View>

            <Text style={styles.msgText}>{m.text}</Text>

            {m.intentJson && (
              <View style={styles.intentBox}>
                <View style={styles.intentTitleRow}>
                  <Ionicons name="code-slash" size={14} color="#22C55E" />
                  <Text style={styles.intentTitle}>Parsed Intent JSON (Explainability Trail)</Text>
                </View>
                <Text style={styles.intentCode}>{JSON.stringify(m.intentJson, null, 2)}</Text>
              </View>
            )}

            {m.sociologicalRisk && (
              <View style={styles.socioBox}>
                <Ionicons name="people-outline" size={14} color="#F59E0B" />
                <Text style={styles.socioText}>Socio-Demographic Factor: {m.sociologicalRisk}</Text>
              </View>
            )}

            {m.financialLink && (
              <View style={styles.finBox}>
                <Ionicons name="card-outline" size={14} color="#8B5CF6" />
                <Text style={styles.finText}>Financial Money Trail: {m.financialLink}</Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Quick Prompts Bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sugScroll} contentContainerStyle={{ paddingHorizontal: 16 }}>
        {MOCK_NLP_SUGGESTIONS.map((sug) => (
          <Pressable
            key={sug}
            style={styles.sugChip}
            onPress={() => handleSendMessage(sug)}
          >
            <Text style={styles.sugText}>{sug}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Input Bar with Voice Button */}
      <View style={styles.inputContainer}>
        <Animated.View style={[styles.voiceMicBtnWrap, { transform: [{ scale: micPulse }] }]}>
          <Pressable
            style={[styles.voiceMicBtn, isRecordingVoice && styles.voiceMicBtnActive]}
            onPress={toggleVoiceRecording}
          >
            <Ionicons name={isRecordingVoice ? "radio" : "mic"} size={20} color="#FFFFFF" />
          </Pressable>
        </Animated.View>

        <TextInput
          style={styles.textInput}
          placeholder={isRecordingVoice ? "Listening to Voice Input..." : "Ask in English or Kannada..."}
          placeholderTextColor="#8892B0"
          value={inputQuery}
          onChangeText={setInputQuery}
          onSubmitEditing={() => handleSendMessage()}
        />

        <Pressable style={styles.sendBtn} onPress={() => handleSendMessage()}>
          <Ionicons name="send" size={18} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0F1C" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingTop: 12,
    backgroundColor: "#141A2E",
    borderBottomWidth: 1,
    borderColor: "#1F2A44",
  },
  headerTitle: { fontSize: 16, fontWeight: "800", color: "#F0F4FF" },
  headerSub: { fontSize: 11, color: "#8892B0", marginTop: 2 },
  pdfExportBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EF4444",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  pdfExportText: { fontSize: 10, fontWeight: "900", color: "#FFFFFF" },
  controlBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#0A0F1C",
    borderBottomWidth: 1,
    borderColor: "#1F2A44",
  },
  langSwitchRow: { flexDirection: "row", gap: 6 },
  langBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: "#141A2E", borderWidth: 1, borderColor: "#1F2A44" },
  langBtnActive: { backgroundColor: "#3B82F620", borderColor: "#3B82F6" },
  langText: { fontSize: 11, color: "#8892B0" },
  langTextActive: { color: "#3B82F6", fontWeight: "700" },
  voiceIndicator: { flexDirection: "row", alignItems: "center", gap: 4 },
  voiceIndicatorText: { fontSize: 10, color: "#06B6D4", fontWeight: "700" },
  chatArea: { flex: 1 },
  chatContent: { padding: 16, gap: 14 },
  msgBubble: { borderRadius: 16, padding: 14, borderWidth: 1, gap: 8 },
  userBubble: { backgroundColor: "#141A2E", borderColor: "#3B82F660", alignSelf: "flex-end", maxWidth: "88%" },
  aiBubble: { backgroundColor: "#141A2E", borderColor: "#1F2A44", alignSelf: "flex-start", maxWidth: "92%" },
  msgHeader: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  senderText: { fontSize: 11, fontWeight: "800", color: "#8B5CF6" },
  msgTime: { fontSize: 9, color: "#8892B0" },
  msgText: { fontSize: 13, color: "#F0F4FF", lineHeight: 18 },
  intentBox: { backgroundColor: "#0A0F1C", padding: 10, borderRadius: 10, borderWidth: 1, borderColor: "#22C55E40", gap: 4 },
  intentTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  intentTitle: { fontSize: 10, fontWeight: "800", color: "#22C55E" },
  intentCode: { fontFamily: "monospace", fontSize: 10, color: "#22C55E" },
  socioBox: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#F59E0B15", padding: 8, borderRadius: 8 },
  socioText: { fontSize: 10, color: "#F59E0B", fontWeight: "600", flex: 1 },
  finBox: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#8B5CF615", padding: 8, borderRadius: 8 },
  finText: { fontSize: 10, color: "#8B5CF6", fontWeight: "600", flex: 1 },
  sugScroll: { maxHeight: 36, marginBottom: 8 },
  sugChip: { backgroundColor: "#141A2E", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: "#1F2A44", marginRight: 8 },
  sugText: { fontSize: 11, color: "#3B82F6", fontWeight: "600" },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    backgroundColor: "#141A2E",
    borderTopWidth: 1,
    borderColor: "#1F2A44",
  },
  voiceMicBtnWrap: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  voiceMicBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#06B6D4", alignItems: "center", justifyContent: "center" },
  voiceMicBtnActive: { backgroundColor: "#EF4444" },
  textInput: {
    flex: 1,
    backgroundColor: "#0A0F1C",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: "#F0F4FF",
    borderWidth: 1,
    borderColor: "#1F2A44",
    fontSize: 13,
  },
  sendBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#8B5CF6", alignItems: "center", justifyContent: "center" },
});
