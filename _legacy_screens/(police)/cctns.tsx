import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  Alert,
  TextInput,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { MOCK_FIRS, MOCK_SUSPECTS, FIRItem } from "@/constants/sahasraData";
import { useAuth } from "@/context/AuthContext";

export default function CCTNSScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [firs, setFirs] = useState<FIRItem[]>(MOCK_FIRS);
  const [selectedMergeFIR, setSelectedMergeFIR] = useState<FIRItem | null>(null);

  // New FIR Form State
  const [showRegModal, setShowRegModal] = useState(false);
  const [formCategory, setFormCategory] = useState("1"); // 1=FIR, 3=UDR, 8=Zero FIR
  const [formBrief, setFormBrief] = useState("");
  const [formGravity, setFormGravity] = useState("heinous");
  const [formCompName, setFormCompName] = useState("");
  const [formCompAge, setFormCompAge] = useState("");
  const [formCompGender, setFormCompGender] = useState("F");
  const [formAccusedName, setFormAccusedName] = useState("");
  const [formAccusedAlias, setFormAccusedAlias] = useState("");
  const [formAct, setFormAct] = useState("IPC");
  const [formSection, setFormSection] = useState("Section 379A");
  const [humanAlerts, setHumanAlerts] = useState(true);

  const handleRegisterFIR = () => {
    if (!formBrief.trim() || !formCompName.trim() || !formAccusedName.trim()) {
      Alert.alert("Validation Error", "Please fill in all mandatory fields (Brief facts, Complainant, Accused name).");
      return;
    }
    const runningNo = String(firs.length + 1).padStart(5, "0");
    const crimeNoGenerated = `${formCategory}404430002026${runningNo}`;
    
    const newFIR: FIRItem = {
      id: `fir_${Date.now()}`,
      firNo: crimeNoGenerated,
      station: user?.station || "Koramangala PS",
      district: user?.district || "Bengaluru Urban",
      crimeCode: formSection.replace(" ", "_"),
      crimeLabel: formBrief.slice(0, 30),
      section: formSection,
      category: formGravity as any,
      date: new Date().toISOString().split("T")[0],
      time: new Date().toTimeString().slice(0, 5),
      location: "Sector Hub Beat",
      moNarrative: formBrief,
      suspectName: formAccusedName,
      status: "Under Investigation",
      icjsStatus: "In Custody",
      lat: 12.93,
      lng: 77.61,
      suspectAlias: formAccusedAlias || "None",
    };

    setFirs(prev => [newFIR, ...prev]);
    setShowRegModal(false);
    
    let alertMsg = `FIR ${crimeNoGenerated} registered successfully and linked to CCTNS database.`;
    if (humanAlerts) {
      alertMsg += `\n\n[HUMAN LIAISON ACTIVED]: Automated SMS progress updates subscribed for "${formCompName}". Victim Support Services counselor auto-assigned.`;
    }
    Alert.alert("CCTNS SUCCESS", alertMsg);

    // Reset Form
    setFormBrief("");
    setFormCompName("");
    setFormCompAge("");
    setFormAccusedName("");
    setFormAccusedAlias("");
  };

  const interAgencyConnectors = [
    { name: "CCTNS Karnataka", status: "ONLINE", icon: "cloud-done", count: "1,100 Stations" },
    { name: "ICJS Court & Bail", status: "ONLINE", icon: "shield-checkmark", count: "Real-time" },
    { name: "e-Prisons Database", status: "ONLINE", icon: "lock-closed", count: "34 Prisons" },
    { name: "FSL Forensics (FPB)", status: "ONLINE", icon: "finger-print", count: "Auto Fingerprint" },
  ];

  const handleApproveMerge = () => {
    Alert.alert(
      "Entity Merge Approved",
      `CCTNS Record permanently linked for ${selectedMergeFIR?.suspectName} to database entity ID ${selectedMergeFIR?.phoneticSimilarityMatch?.matchedId}.`,
      [{ text: "OK", onPress: () => setSelectedMergeFIR(null) }]
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>CCTNS FIR & Suspect Database</Text>
          <Text style={styles.headerSub}>Ingesting IIF-1 to IIF-5 • ICJS Real-time Integration</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Pressable style={styles.registerBtn} onPress={() => setShowRegModal(true)}>
            <Ionicons name="add-circle" size={14} color="#FFFFFF" />
            <Text style={styles.registerBtnText}>REGISTER FIR</Text>
          </Pressable>
          <View style={styles.syncBadge}>
            <View style={styles.greenDot} />
            <Text style={styles.syncText}>CCTNS ACTIVE</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Inter-Agency Integration Matrix */}
        <Text style={styles.sectionTitle}>Inter-Agency Intelligence Connectors</Text>
        <View style={styles.agencyGrid}>
          {interAgencyConnectors.map((agency) => (
            <View key={agency.name} style={styles.agencyCard}>
              <Ionicons name={agency.icon as any} size={18} color="#22C55E" />
              <View style={{ flex: 1 }}>
                <Text style={styles.agencyName}>{agency.name}</Text>
                <Text style={styles.agencySub}>{agency.count}</Text>
              </View>
              <View style={styles.onlinePill}>
                <Text style={styles.onlineText}>LIVE</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Phonetic Entity Resolution Alert Card */}
        <View style={styles.mergeCard}>
          <View style={styles.mergeHeader}>
            <Ionicons name="git-merge-outline" size={20} color="#8B5CF6" />
            <Text style={styles.mergeTitle}>Jaro-Winkler Phonetic Entity Resolution</Text>
          </View>
          <Text style={styles.mergeDesc}>
            AI detected duplicate suspect entries across CCTNS stations (Similarity &gt; 85%). SCRB Analyst approval required for permanent entity consolidation.
          </Text>
          {firs.filter((f) => 
            f.phoneticSimilarityMatch && 
            (!user?.station || f.station.toLowerCase().includes(user.station.replace(" PS", "").toLowerCase()))
          ).map((f) => (
            <Pressable
              key={f.id}
              style={styles.mergeRow}
              onPress={() => setSelectedMergeFIR(f)}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.mergeNames}>
                  "{f.suspectName}" ↔ "{f.phoneticSimilarityMatch?.matchedName}"
                </Text>
                <Text style={styles.mergeScore}>
                  Similarity: {((f.phoneticSimilarityMatch?.similarityScore || 0) * 100).toFixed(0)}% • Station: {f.station}
                </Text>
              </View>
              <View style={styles.reviewBtn}>
                <Text style={styles.reviewBtnText}>REVIEW MERGE →</Text>
              </View>
            </Pressable>
          ))}
        </View>

        {/* FIR Feed */}
        <Text style={styles.sectionTitle}>Ingested CCTNS IIF Records ({
          firs.filter(item => 
            !user?.station || 
            item.station.toLowerCase().includes(user.station.replace(" PS", "").toLowerCase())
          ).length
        })</Text>

        {firs
          .filter(item => 
            !user?.station || 
            item.station.toLowerCase().includes(user.station.replace(" PS", "").toLowerCase())
          )
          .map((item) => (
          <Pressable
            key={item.id}
            style={styles.firCard}
            onPress={() =>
              router.push({
                pathname: "/fir-detail",
                params: {
                  id: item.id,
                  firNo: item.firNo,
                  station: item.station,
                  district: item.district,
                  crimeLabel: item.crimeLabel,
                  section: item.section,
                  category: item.category,
                  date: item.date,
                  time: item.time,
                  location: item.location,
                  moNarrative: item.moNarrative,
                  suspectName: item.suspectName,
                  status: item.status,
                  icjsStatus: item.icjsStatus,
                },
              })
            }
          >
            <View style={styles.firCardHeader}>
              <Text style={styles.firNo}>{item.firNo}</Text>
              <View
                style={[
                  styles.categoryPill,
                  {
                    backgroundColor:
                      item.category === "heinous"
                        ? "#EF444420"
                        : item.category === "grave"
                        ? "#F59E0B20"
                        : "#3B82F620",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.categoryText,
                    {
                      color:
                        item.category === "heinous"
                          ? "#EF4444"
                          : item.category === "grave"
                          ? "#F59E0B"
                          : "#3B82F6",
                    },
                  ]}
                >
                  {item.crimeLabel.toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={styles.firMetaRow}>
              <Text style={styles.firStation}>{item.station} • {item.district}</Text>
              <Text style={styles.firSection}>{item.section}</Text>
            </View>

            <Text style={styles.firNarrative} numberOfLines={2}>{item.moNarrative}</Text>

            <View style={styles.firFooter}>
              <View style={styles.suspectBox}>
                <Ionicons name="person-outline" size={14} color="#8892B0" />
                <Text style={styles.suspectText}>Accused: {item.suspectName}</Text>
              </View>

              <View
                style={[
                  styles.icjsBadge,
                  {
                    borderColor:
                      item.icjsStatus === "Out on Bail"
                        ? "#F59E0B"
                        : item.icjsStatus === "In Custody"
                        ? "#22C55E"
                        : "#8892B0",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.icjsText,
                    {
                      color:
                        item.icjsStatus === "Out on Bail"
                          ? "#F59E0B"
                          : item.icjsStatus === "In Custody"
                          ? "#22C55E"
                          : "#8892B0",
                    },
                  ]}
                >
                  ICJS: {item.icjsStatus}
                </Text>
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>

      {/* Entity Resolution Review Modal */}
      <Modal visible={!!selectedMergeFIR} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Entity Resolution Approval</Text>
              <Pressable onPress={() => setSelectedMergeFIR(null)}>
                <Ionicons name="close" size={24} color="#8892B0" />
              </Pressable>
            </View>

            {selectedMergeFIR && (
              <View style={{ gap: 14 }}>
                <View style={[styles.matchScoreCard, { backgroundColor: "#8B5CF615", borderColor: "#8B5CF6" }]}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={[styles.matchScoreTitle, { color: "#8B5CF6" }]}>InLegalBERT Semantic MO Similarity</Text>
                    <Text style={{ fontSize: 9, fontWeight: "bold", color: "#8B5CF6" }}>
                      TRANSFORMER INGESTED
                    </Text>
                  </View>
                  <Text style={[styles.matchScoreVal, { color: "#8B5CF6" }]}>
                    91.2% Cosine Match
                  </Text>
                </View>

                <View style={styles.compareRow}>
                  <View style={styles.compareCol}>
                    <Text style={styles.compareLabel}>CCTNS FIR Narrative</Text>
                    <Text style={styles.compareVal}>{selectedMergeFIR.suspectName}</Text>
                    <Text style={styles.compareSub}>FIR: {selectedMergeFIR.firNo}</Text>
                    <Text style={[styles.compareNarrativeBox, { color: "#8892B0" }]}>
                      {selectedMergeFIR.moNarrative}
                    </Text>
                  </View>

                  <View style={styles.compareCol}>
                    <Text style={styles.compareLabel}>Linked Case MO Narrative</Text>
                    <Text style={styles.compareVal}>{selectedMergeFIR.phoneticSimilarityMatch?.matchedName}</Text>
                    <Text style={styles.compareSub}>Matched ID: {selectedMergeFIR.phoneticSimilarityMatch?.matchedId}</Text>
                    <Text style={[styles.compareNarrativeBox, { color: "#8892B0" }]}>
                      Accused approached victim on black motorcycle, pretended to request road directions, then snatched gold chain from neck and fled Hebbal junction.
                    </Text>
                  </View>
                </View>

                <Text style={styles.legalNote}>
                  DPDP Act 2023 Compliance Note: Cosine similarity calculated on InLegalBERT high-dimensional vector embeddings. Analyst merge authorization required.
                </Text>

                <View style={styles.modalActions}>
                  <Pressable
                    style={styles.rejectBtn}
                    onPress={() => setSelectedMergeFIR(null)}
                  >
                    <Text style={styles.rejectText}>Reject Merge</Text>
                  </Pressable>
                  <Pressable style={styles.approveBtn} onPress={handleApproveMerge}>
                    <Text style={styles.approveText}>Approve Entity Merge</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* CCTNS FIR CaseMaster Registration Modal */}
      <Modal visible={showRegModal} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={[styles.modalCard, { height: "90%", borderTopLeftRadius: 28, borderTopRightRadius: 28 }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons name="document-text" size={22} color="#3B82F6" />
                <Text style={styles.modalTitle}>CCTNS Case Registration (IIF-1)</Text>
              </View>
              <Pressable onPress={() => setShowRegModal(false)}>
                <Ionicons name="close" size={24} color="#8892B0" />
              </Pressable>
            </View>

            <ScrollView style={{ flex: 1, marginTop: 10 }} contentContainerStyle={{ gap: 14, paddingBottom: 30 }}>
              
              {/* Section 1: CaseMaster */}
              <Text style={styles.formSectionHeader}>1. CaseMaster Details</Text>
              
              <View style={styles.formRow}>
                <Text style={styles.formLabel}>Case Category (CrimeNo Prefix)</Text>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {["1", "3", "8"].map((cat) => (
                    <Pressable
                      key={cat}
                      style={[styles.formSelectBtn, formCategory === cat && styles.formSelectActive]}
                      onPress={() => setFormCategory(cat)}
                    >
                      <Text style={[styles.formSelectText, formCategory === cat && styles.formSelectActiveText]}>
                        {cat === "1" ? "FIR (1)" : cat === "3" ? "UDR (3)" : "Zero FIR (8)"}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.formRow}>
                <Text style={styles.formLabel}>Gravity of Offence</Text>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {["heinous", "grave", "petty"].map((g) => (
                    <Pressable
                      key={g}
                      style={[styles.formSelectBtn, formGravity === g && styles.formSelectActive]}
                      onPress={() => setFormGravity(g)}
                    >
                      <Text style={[styles.formSelectText, formGravity === g && styles.formSelectActiveText]}>
                        {g.toUpperCase()}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.formRow}>
                <Text style={styles.formLabel}>Incident Brief Facts (BriefFacts) *</Text>
                <TextInput
                  style={styles.formInputMultiline}
                  placeholder="Enter modus operandi facts of the crime..."
                  placeholderTextColor="#4B5563"
                  value={formBrief}
                  onChangeText={setFormBrief}
                  multiline
                  numberOfLines={4}
                />
              </View>

              {/* Section 2: ComplainantDetails */}
              <Text style={styles.formSectionHeader}>2. ComplainantDetails Entity</Text>
              
              <View style={styles.formRow}>
                <Text style={styles.formLabel}>Complainant Name *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Complainant full name..."
                  placeholderTextColor="#4B5563"
                  value={formCompName}
                  onChangeText={setFormCompName}
                />
              </View>

              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={[styles.formRow, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Age (AgeYear)</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="25"
                    placeholderTextColor="#4B5563"
                    keyboardType="numeric"
                    value={formCompAge}
                    onChangeText={setFormCompAge}
                  />
                </View>
                <View style={[styles.formRow, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Gender</Text>
                  <View style={{ flexDirection: "row", gap: 6 }}>
                    {["M", "F", "T"].map((gen) => (
                      <Pressable
                        key={gen}
                        style={[styles.formSelectBtnMini, formCompGender === gen && styles.formSelectActive]}
                        onPress={() => setFormCompGender(gen)}
                      >
                        <Text style={[styles.formSelectText, formCompGender === gen && styles.formSelectActiveText]}>
                          {gen}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>

              {/* Section 3: Accused details */}
              <Text style={styles.formSectionHeader}>3. Accused & Legal Entities</Text>
              
              <View style={styles.formRow}>
                <Text style={styles.formLabel}>Accused Name *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Primary Accused name..."
                  placeholderTextColor="#4B5563"
                  value={formAccusedName}
                  onChangeText={setFormAccusedName}
                />
              </View>

              <View style={styles.formRow}>
                <Text style={styles.formLabel}>Accused Alias</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Alias or gang nickname..."
                  placeholderTextColor="#4B5563"
                  value={formAccusedAlias}
                  onChangeText={setFormAccusedAlias}
                />
              </View>

              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={[styles.formRow, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Act Code (ActID)</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="IPC"
                    placeholderTextColor="#4B5563"
                    value={formAct}
                    onChangeText={setFormAct}
                  />
                </View>
                <View style={[styles.formRow, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Section (SectionID)</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Section 379A"
                    placeholderTextColor="#4B5563"
                    value={formSection}
                    onChangeText={setFormSection}
                  />
                </View>
              </View>

              {/* Section 4: Humanizing Triggers */}
              <Text style={styles.formSectionHeader}>4. Victim Care & Citizen Support</Text>
              
              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.switchLabel}>Automated Progress Notifications</Text>
                  <Text style={styles.switchSub}>SMS notifications sent to complainant on CCTNS progress steps.</Text>
                </View>
                <Switch
                  value={humanAlerts}
                  onValueChange={setHumanAlerts}
                  trackColor={{ false: "#1F2A44", true: "#10B981" }}
                  thumbColor={humanAlerts ? "#FFFFFF" : "#8892B0"}
                />
              </View>

              {/* Actions */}
              <View style={[styles.modalActions, { marginTop: 10 }]}>
                <Pressable
                  style={styles.rejectBtn}
                  onPress={() => setShowRegModal(false)}
                >
                  <Text style={styles.rejectText}>Cancel</Text>
                </Pressable>
                <Pressable style={styles.approveBtn} onPress={handleRegisterFIR}>
                  <Text style={styles.approveText}>Submit Record</Text>
                </Pressable>
              </View>

            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0F1C" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 18,
    paddingTop: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#F0F4FF" },
  headerSub: { fontSize: 11, color: "#8892B0", marginTop: 2 },
  syncBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#22C55E20",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#22C55E",
  },
  greenDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#22C55E" },
  syncText: { fontSize: 10, fontWeight: "800", color: "#22C55E" },
  content: { flex: 1 },
  scrollContent: { padding: 18, gap: 16 },
  agencyGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  agencyCard: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#141A2E",
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1F2A44",
  },
  agencyName: { fontSize: 11, fontWeight: "700", color: "#F0F4FF" },
  agencySub: { fontSize: 9, color: "#8892B0" },
  onlinePill: { backgroundColor: "#22C55E20", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  onlineText: { fontSize: 8, fontWeight: "900", color: "#22C55E" },
  mergeCard: {
    backgroundColor: "#1F1A3A",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#8B5CF6",
    gap: 8,
  },
  mergeHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  mergeTitle: { fontSize: 13, fontWeight: "800", color: "#8B5CF6" },
  mergeDesc: { fontSize: 11, color: "#F0F4FF", lineHeight: 16 },
  mergeRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#141A2E",
    padding: 10,
    borderRadius: 10,
    marginTop: 4,
  },
  mergeNames: { fontSize: 12, fontWeight: "700", color: "#F0F4FF" },
  mergeScore: { fontSize: 10, color: "#8892B0" },
  reviewBtn: { backgroundColor: "#8B5CF6", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  reviewBtnText: { fontSize: 10, fontWeight: "800", color: "#FFFFFF" },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#F0F4FF" },
  firCard: {
    backgroundColor: "#141A2E",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1F2A44",
    gap: 8,
  },
  firCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  firNo: { fontSize: 14, fontWeight: "800", color: "#3B82F6" },
  categoryPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  categoryText: { fontSize: 10, fontWeight: "800" },
  firMetaRow: { flexDirection: "row", justifyContent: "space-between" },
  firStation: { fontSize: 11, color: "#8892B0" },
  firSection: { fontSize: 11, fontWeight: "700", color: "#F59E0B" },
  firNarrative: { fontSize: 12, color: "#F0F4FF", lineHeight: 17 },
  firFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  suspectBox: { flexDirection: "row", alignItems: "center", gap: 4 },
  suspectText: { fontSize: 11, color: "#8892B0" },
  icjsBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  icjsText: { fontSize: 9, fontWeight: "800" },
  modalBg: { flex: 1, backgroundColor: "#00000080", justifyContent: "flex-end" },
  modalCard: {
    backgroundColor: "#141A2E",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalTitle: { fontSize: 16, fontWeight: "800", color: "#F0F4FF" },
  matchScoreCard: {
    backgroundColor: "#8B5CF620",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#8B5CF6",
  },
  matchScoreTitle: { fontSize: 11, color: "#8B5CF6", fontWeight: "700" },
  matchScoreVal: { fontSize: 20, fontWeight: "900", color: "#F0F4FF" },
  compareRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginVertical: 8 },
  compareCol: { width: "48%", backgroundColor: "#0A0F1C", padding: 10, borderRadius: 10, borderWidth: 1, borderColor: "#1F2A44", gap: 2 },
  compareLabel: { fontSize: 9, color: "#8892B0", fontWeight: "700" },
  compareVal: { fontSize: 12, fontWeight: "800", color: "#F0F4FF" },
  compareSub: { fontSize: 10, color: "#8892B0" },
  compareNarrativeBox: { fontSize: 10, color: "#8892B0", lineHeight: 14, marginTop: 4, fontStyle: "italic" },
  legalNote: { fontSize: 10, color: "#8892B0", lineHeight: 14, marginVertical: 4 },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 12 },
  rejectBtn: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: "#EF4444", alignItems: "center" },
  rejectText: { fontSize: 12, fontWeight: "700", color: "#EF4444" },
  approveBtn: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: "#8B5CF6", alignItems: "center" },
  approveText: { fontSize: 12, fontWeight: "800", color: "#FFFFFF" },
  registerBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#3B82F6", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  registerBtnText: { fontSize: 10, fontWeight: "900", color: "#FFFFFF" },
  formSectionHeader: { fontSize: 12, fontWeight: "800", color: "#3B82F6", borderBottomWidth: 1, borderColor: "#1F2A44", paddingBottom: 6, marginTop: 10, letterSpacing: 0.5 },
  formRow: { gap: 4, marginBottom: 8 },
  formLabel: { fontSize: 10, color: "#8892B0", fontWeight: "700" },
  formInput: { backgroundColor: "#0A0F1C", borderWidth: 1, borderColor: "#1F2A44", borderRadius: 10, padding: 10, color: "#F0F4FF", fontSize: 11 },
  formInputMultiline: { backgroundColor: "#0A0F1C", borderWidth: 1, borderColor: "#1F2A44", borderRadius: 10, padding: 10, color: "#F0F4FF", fontSize: 11, textAlignVertical: "top", minHeight: 70 },
  formSelectBtn: { flex: 1, backgroundColor: "#0A0F1C", borderWidth: 1, borderColor: "#1F2A44", borderRadius: 10, padding: 10, alignItems: "center" },
  formSelectBtnMini: { flex: 1, backgroundColor: "#0A0F1C", borderWidth: 1, borderColor: "#1F2A44", borderRadius: 8, padding: 8, alignItems: "center" },
  formSelectActive: { borderColor: "#3B82F6", backgroundColor: "#3B82F620" },
  formSelectText: { fontSize: 10, color: "#8892B0", fontWeight: "700" },
  formSelectActiveText: { color: "#3B82F6" },
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#0A0F1C", padding: 12, borderRadius: 12, borderWidth: 1, borderColor: "#1F2A44", marginVertical: 6 },
  switchLabel: { fontSize: 11, fontWeight: "700", color: "#F0F4FF" },
  switchSub: { fontSize: 9, color: "#8892B0", marginTop: 2, lineHeight: 12 },
});
