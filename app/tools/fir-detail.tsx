import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function FIRDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Extract structured ER parameters or fallback to detailed case data
  const caseMasterId = params.id || "1041";
  const crimeNo = params.firNo || "104430006202600001";
  const caseNo = crimeNo.toString().slice(-9);
  
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Pressable style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={20} color="#F0F4FF" />
        <Text style={styles.backText}>Back to CCTNS Database</Text>
      </Pressable>

      {/* CaseMaster & ER Mapping Header */}
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.firNo}>{params.crimeLabel || "FIR CASE RECORD"}</Text>
          <View style={styles.catBadge}>
            <Text style={styles.catText}>CaseMaster ID: {caseMasterId}</Text>
          </View>
        </View>

        <View style={styles.erMetaTable}>
          <View style={styles.erMetaRow}>
            <Text style={styles.erMetaLabel}>Crime Number (CrimeNo):</Text>
            <Text style={styles.erMetaVal}>{crimeNo}</Text>
          </View>
          <View style={styles.erMetaRow}>
            <Text style={styles.erMetaLabel}>Case Number (CaseNo):</Text>
            <Text style={styles.erMetaVal}>{caseNo}</Text>
          </View>
          <View style={styles.erMetaRow}>
            <Text style={styles.erMetaLabel}>Jurisdiction (UnitID):</Text>
            <Text style={styles.erMetaVal}>{params.station || "Peenya PS"} ({params.district || "Bengaluru Urban"})</Text>
          </View>
          <View style={styles.erMetaRow}>
            <Text style={styles.erMetaLabel}>Gravity of Offence:</Text>
            <Text style={[styles.erMetaVal, { color: "#EF4444", fontWeight: "bold" }]}>
              {params.category === "heinous" ? "HEINOUS (Grade A)" : "GRAVE"}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <Text style={styles.label}>Modus Operandi Narrative (BriefFacts):</Text>
        <Text style={styles.moNarrative}>{params.moNarrative || "FIR Narrative details."}</Text>

        <View style={styles.metaBox}>
          <Text style={styles.metaLabel}>Incident Registered Date: {params.date || "2026-07-20"} {params.time || "21:30"}</Text>
          <Text style={styles.metaLabel}>GPS Coordinates: {params.lat || "13.028"}° N, {params.lng || "77.519"}° E</Text>
        </View>
      </View>

      {/* ER Section 2: Complainant Details (ComplainantDetails Table) */}
      <Text style={styles.sectionTitle}>Complainant Entity Details</Text>
      <View style={styles.detailCard}>
        <View style={styles.cardHeaderSmall}>
          <Ionicons name="person-circle-outline" size={18} color="#06B6D4" />
          <Text style={styles.cardHeaderTitleSmall}>Complainant Table (ComplainantID: C-902)</Text>
        </View>
        <View style={styles.erMetaTable}>
          <View style={styles.erMetaRow}>
            <Text style={styles.erMetaLabel}>Complainant Name:</Text>
            <Text style={styles.erMetaVal}>Ananya M.</Text>
          </View>
          <View style={styles.erMetaRow}>
            <Text style={styles.erMetaLabel}>Age / Gender:</Text>
            <Text style={styles.erMetaVal}>24 yrs / Female</Text>
          </View>
          <View style={styles.erMetaRow}>
            <Text style={styles.erMetaLabel}>Occupation ID:</Text>
            <Text style={styles.erMetaVal}>OCC-882 (Software Developer)</Text>
          </View>
          <View style={styles.erMetaRow}>
            <Text style={styles.erMetaLabel}>Caste / Religion ID:</Text>
            <Text style={styles.erMetaVal}>CST-101 / REL-01 (General)</Text>
          </View>
        </View>
      </View>

      {/* ER Section 3: Accused Details (Accused Table) */}
      <Text style={styles.sectionTitle}>Accused Entity Details</Text>
      <View style={[styles.detailCard, { borderColor: "#EF444440" }]}>
        <View style={styles.cardHeaderSmall}>
          <Ionicons name="warning-outline" size={18} color="#EF4444" />
          <Text style={styles.cardHeaderTitleSmall}>Accused Table (AccusedMasterID: A-304)</Text>
        </View>
        <View style={styles.erMetaTable}>
          <View style={styles.erMetaRow}>
            <Text style={styles.erMetaLabel}>Accused Name (Alias):</Text>
            <Text style={styles.erMetaVal}>{params.suspectName || "Suspect"} (Cobra Ramesh)</Text>
          </View>
          <View style={styles.erMetaRow}>
            <Text style={styles.erMetaLabel}>Accused Sorting ID:</Text>
            <Text style={styles.erMetaVal}>A1 (Primary Accused)</Text>
          </View>
          <View style={styles.erMetaRow}>
            <Text style={styles.erMetaLabel}>Age / Gender:</Text>
            <Text style={styles.erMetaVal}>29 yrs / Male</Text>
          </View>
          <View style={styles.erMetaRow}>
            <Text style={styles.erMetaLabel}>ICJS Jail/Bail Status:</Text>
            <Text style={[styles.erMetaVal, { color: "#F59E0B", fontWeight: "bold" }]}>
              {params.icjsStatus || "Out on Bail"}
            </Text>
          </View>
        </View>
      </View>

      {/* ER Section 4: Act & Section Association (ActSectionAssociation Table) */}
      <Text style={styles.sectionTitle}>Act & Section Associations</Text>
      <View style={styles.detailCard}>
        <View style={styles.cardHeaderSmall}>
          <Ionicons name="document-text-outline" size={18} color="#8B5CF6" />
          <Text style={styles.cardHeaderTitleSmall}>Legal Associations (ActSectionAssociation)</Text>
        </View>
        <View style={styles.erMetaTable}>
          <View style={styles.erMetaRow}>
            <Text style={styles.erMetaLabel}>Act Code (ActID):</Text>
            <Text style={styles.erMetaVal}>IPC (Indian Penal Code)</Text>
          </View>
          <View style={styles.erMetaRow}>
            <Text style={styles.erMetaLabel}>Specific Section (SectionID):</Text>
            <Text style={styles.erMetaVal}>{params.section || "Section 379A"}</Text>
          </View>
          <View style={styles.erMetaRow}>
            <Text style={styles.erMetaLabel}>Charge Description:</Text>
            <Text style={styles.erMetaVal}>Snatching (IPC 379A) / Cyber Fraud (IPC 66D)</Text>
          </View>
        </View>
      </View>

      {/* ER Section 5: Arrest & Surrender Details (ArrestSurrender Table) */}
      <Text style={styles.sectionTitle}>Arrest & Production Logistics</Text>
      <View style={styles.detailCard}>
        <View style={styles.cardHeaderSmall}>
          <Ionicons name="lock-closed-outline" size={18} color="#10B981" />
          <Text style={styles.cardHeaderTitleSmall}>Arrest Log (ArrestSurrenderID: AR-401)</Text>
        </View>
        <View style={styles.erMetaTable}>
          <View style={styles.erMetaRow}>
            <Text style={styles.erMetaLabel}>Logistics Type:</Text>
            <Text style={styles.erMetaVal}>Physical Arrest (Custody Mobile Unit)</Text>
          </View>
          <View style={styles.erMetaRow}>
            <Text style={styles.erMetaLabel}>Arrest Date / State:</Text>
            <Text style={styles.erMetaVal}>{params.date || "2026-07-21"} / Karnataka</Text>
          </View>
          <View style={styles.erMetaRow}>
            <Text style={styles.erMetaLabel}>Investigating Officer (IOID):</Text>
            <Text style={styles.erMetaVal}>Sub-Inspector Reddy (Emp ID: 489)</Text>
          </View>
          <View style={styles.erMetaRow}>
            <Text style={styles.erMetaLabel}>Produced Before Court (CourtID):</Text>
            <Text style={styles.erMetaVal}>1st Chief Metropolitan Magistrate (Court-01)</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0F1C" },
  content: { padding: 18, gap: 16 },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 },
  backText: { fontSize: 13, color: "#F0F4FF", fontWeight: "600" },
  card: {
    backgroundColor: "#141A2E",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#1F2A44",
    gap: 12,
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  firNo: { fontSize: 18, fontWeight: "800", color: "#3B82F6" },
  catBadge: { backgroundColor: "#EF444420", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  catText: { fontSize: 10, fontWeight: "800", color: "#EF4444" },
  station: { fontSize: 12, color: "#8892B0" },
  section: { fontSize: 13, fontWeight: "700", color: "#F59E0B" },
  divider: { height: 1, backgroundColor: "#1F2A44", marginVertical: 4 },
  label: { fontSize: 11, color: "#8892B0", fontWeight: "700" },
  moNarrative: { fontSize: 13, color: "#F0F4FF", lineHeight: 18 },
  metaBox: { backgroundColor: "#0A0F1C", padding: 12, borderRadius: 12, borderWidth: 1, borderColor: "#1F2A44", gap: 4 },
  metaLabel: { fontSize: 11, color: "#8892B0" },
  suspectBox: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#8B5CF615", padding: 12, borderRadius: 12, borderWidth: 1, borderColor: "#8B5CF6" },
  suspectName: { fontSize: 13, fontWeight: "800", color: "#F0F4FF" },
  icjsStatus: { fontSize: 11, color: "#F59E0B", fontWeight: "700" },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#F0F4FF", marginTop: 10 },
  
  erMetaTable: { gap: 6 },
  erMetaRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, borderBottomWidth: 0.5, borderColor: "#1F2A44" },
  erMetaLabel: { fontSize: 11, color: "#8892B0", fontFamily: "Inter_500Medium" },
  erMetaVal: { fontSize: 11, color: "#F0F4FF", fontWeight: "bold", fontFamily: "monospace" },
  
  detailCard: { backgroundColor: "#141A2E", borderRadius: 18, borderWidth: 1, borderColor: "#1F2A44", padding: 16, gap: 10 },
  cardHeaderSmall: { flexDirection: "row", alignItems: "center", gap: 8, borderBottomWidth: 1, borderColor: "#1F2A44", paddingBottom: 8 },
  cardHeaderTitleSmall: { fontSize: 12, fontWeight: "800", color: "#F0F4FF", letterSpacing: 0.5 },
});
