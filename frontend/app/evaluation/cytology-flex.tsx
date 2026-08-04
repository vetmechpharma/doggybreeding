import React, { useMemo, useState } from "react";
import { Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/src/theme/ThemeContext";
import { useAuth } from "@/src/auth/AuthContext";
import { useToast } from "@/src/components/Toast";
import { ScreenHeader } from "@/src/components/ScreenHeader";
import { DonutChart } from "@/src/components/DonutChart";
import { sheetsSync } from "@/src/api/sheetsSync";
import { classifyCytology, localDB } from "@/src/lib/offline";

// Flexible-total cytology calculator.
// Doctors can enter any raw cell counts (e.g. 100/150/200/250 total).
// Total = Σ cell counts. Percentages = (count / total) × 100.
// Percentages are passed to classifyCytology so the interpretation is identical
// to the 100-cell calculator.

const CELL_COLORS = { pc: "#3B82F6", ic: "#A855F7", sic: "#F97316", sc: "#22C55E", cc: "#EF4444" };
const CELL_IMAGES: Record<keyof typeof CELL_COLORS, string> = {
  pc: "https://customer-assets.emergentagent.com/job_canine-cycle/artifacts/0s4im4u4_PC.webp",
  ic: "https://customer-assets.emergentagent.com/job_canine-cycle/artifacts/3x80s4ru_IC.webp",
  sic: "https://customer-assets.emergentagent.com/job_canine-cycle/artifacts/q0m69qma_SIC%20%282%29.webp",
  sc: "https://customer-assets.emergentagent.com/job_canine-cycle/artifacts/2mjp3e8h_SC%20%282%29.webp",
  cc: "https://customer-assets.emergentagent.com/job_canine-cycle/artifacts/5ovty7ut_CC%20%282%29.webp",
};

interface CellInfo {
  key: keyof typeof CELL_COLORS;
  label: string;
  full: string;
  hint: string;
  image: string;
  details: string[];
}

const CELLS: CellInfo[] = [
  { key: "pc",  label: "PC",  full: "Parabasal Cells",              hint: "Round to oval, large nucleus",           image: CELL_IMAGES.pc,
    details: ["Smallest of the vaginal epithelial cells.", "Round to oval, large central nucleus.", "Predominant during anestrus and diestrus.", "High proportion → not in heat."] },
  { key: "ic",  label: "IC",  full: "Intermediate Cells",           hint: "Low nucleus-to-cytoplasm ratio",         image: CELL_IMAGES.ic,
    details: ["Larger than parabasal cells.", "Polygonal shape, more cytoplasm.", "Smaller nucleus than PC.", "Seen in stage transitions."] },
  { key: "sic", label: "SIC", full: "Superficial Intermediate Cells", hint: "Polygonal, abundant cytoplasm",       image: CELL_IMAGES.sic,
    details: ["Transitional cells between IC and SC.", "Abundant cytoplasm with compact nucleus.", "Indicates progressing estrogenic effect."] },
  { key: "sc",  label: "SC",  full: "Superficial Cells",            hint: "Flat, angular, small pyknotic nucleus",  image: CELL_IMAGES.sc,
    details: ["Largest cell type — angular borders.", "Small dark pyknotic nucleus.", "High proportion → peak estrogen → estrus.", "Optimal breeding when SC + CC ≥ 80%."] },
  { key: "cc",  label: "CC",  full: "Cornified Cells",              hint: "Fully keratinized, no visible nucleus",  image: CELL_IMAGES.cc,
    details: ["Fully keratinized, anuclear cells.", "Sharp edges, shrivelled appearance.", "Hallmark of full cornification — peak estrus.", "Critical marker for mating decision."] },
];

export default function CytologyFlex() {
  const { theme } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
  const params = useLocalSearchParams<{ dog_id?: string; proestrus_date?: string }>();

  const [vals, setVals] = useState<Record<string, string>>({ pc: "", ic: "", sic: "", sc: "", cc: "" });
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<CellInfo | null>(null);

  const nums = useMemo(() => ({
    pc: Number(vals.pc) || 0,
    ic: Number(vals.ic) || 0,
    sic: Number(vals.sic) || 0,
    sc: Number(vals.sc) || 0,
    cc: Number(vals.cc) || 0,
  }), [vals]);

  const total = nums.pc + nums.ic + nums.sic + nums.sc + nums.cc;
  const isValid = total >= 5; // at least a handful of cells to be meaningful

  // Live percentages (rounded to 1 decimal for display)
  const pct = useMemo(() => {
    if (total <= 0) return { pc: 0, ic: 0, sic: 0, sc: 0, cc: 0 };
    return {
      pc: (nums.pc / total) * 100,
      ic: (nums.ic / total) * 100,
      sic: (nums.sic / total) * 100,
      sc: (nums.sc / total) * 100,
      cc: (nums.cc / total) * 100,
    };
  }, [nums, total]);

  const ciPct = pct.sc + pct.cc; // Cornification Index (%)

  const donutData = total > 0 ? CELLS.map((c) => ({ value: nums[c.key], color: CELL_COLORS[c.key] })) : [{ value: 1, color: theme.border }];

  const submit = async () => {
    if (!user || !params.dog_id) return;
    if (!isValid) {
      toast.show("Enter at least 5 cells across categories.", "error");
      return;
    }
    setBusy(true);
    try {
      // Feed the percentages to classifyCytology so the interpretation is
      // identical to the 100-cell calculator.
      const result = classifyCytology(pct, params.proestrus_date || null);

      // Save both the raw counts (what the user entered) and the derived
      // percentages so the Report screen and PDF can show both.
      const inputs = {
        ...nums,
        total_cells: total,
        pct_pc: Math.round(pct.pc * 10) / 10,
        pct_ic: Math.round(pct.ic * 10) / 10,
        pct_sic: Math.round(pct.sic * 10) / 10,
        pct_sc: Math.round(pct.sc * 10) / 10,
        pct_cc: Math.round(pct.cc * 10) / 10,
        _mode: "flex" as const,
      };

      const dog = await localDB.getDog(params.dog_id);
      const ev = await localDB.createEval({
        user_id: user.id, dog_id: params.dog_id, type: "cytology",
        inputs, result, proestrus_bleeding_date: params.proestrus_date || null,
      });
      sheetsSync.evaluation({
        id: ev.id, user_id: user.id, user_name: user.name, user_email: user.email, user_mobile: user.mobile,
        dog_name: dog?.dog_name, owner_name: dog?.owner_name, owner_mobile: dog?.owner_mobile,
        breed: dog?.breed, age: dog?.age, sex: dog?.sex, whelping_count: dog?.whelping_count,
        proestrus_bleeding_date: dog?.proestrus_bleeding_date || params.proestrus_date,
        type: "cytology", inputs, result,
      });
      router.replace({ pathname: "/evaluation/result", params: { eval_id: ev.id } });
    } catch (e: any) {
      toast.show(e.message || "Calculation failed", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={["bottom"]}>
      <ScreenHeader title="Cytology (> 100 Cells)" subtitle="Enter raw counts — % auto-calculated" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Donut summary + Total */}
          <View style={[styles.donutCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <DonutChart data={donutData} size={170} strokeWidth={20} centerLabel="Total Cells" centerValue={`${total}`} theme={theme} />
            <View style={{ marginTop: 12, alignItems: "center" }}>
              <Text style={[styles.ciLabel, { color: theme.textMuted }]}>Cornification Index</Text>
              <Text style={[styles.ciValue, { color: theme.text }]}>{ciPct.toFixed(1)}%</Text>
            </View>
            <View style={[styles.progressTrack, { backgroundColor: theme.inputBg }]}>
              <View style={[styles.progressFill, { width: `${Math.min(100, Math.max(0, ciPct))}%`, backgroundColor: ciPct >= 80 ? "#22C55E" : ciPct >= 60 ? "#EAB308" : ciPct >= 30 ? "#F97316" : "#3B82F6" }]} />
            </View>
            <Text style={[styles.remaining, { color: total > 0 ? theme.textMuted : "#EF4444" }]}>
              {total > 0
                ? `Formula:  % = (count ÷ ${total}) × 100`
                : "Enter cell counts to see percentages"}
            </Text>
          </View>

          {/* Inputs */}
          <View style={{ gap: 10 }}>
            {CELLS.map((c) => (
              <View key={c.key} style={[styles.inputRow, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Pressable
                  testID={`cytoflex-${c.key}-info`}
                  onPress={() => setInfo(c)}
                  style={({ pressed }) => [styles.cellTag, { backgroundColor: CELL_COLORS[c.key], opacity: pressed ? 0.85 : 1 }]}
                  hitSlop={4}
                >
                  <Text style={styles.cellTagText}>{c.label}</Text>
                  <Ionicons name="information-circle" size={14} color="rgba(255,255,255,0.95)" />
                </Pressable>
                <View style={styles.middle}>
                  <Text style={[styles.cellFull, { color: theme.text }]} numberOfLines={1}>{c.full}</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <View style={[styles.bar, { backgroundColor: theme.inputBg, flex: 1 }]}>
                      <View style={[styles.barFill, { width: `${Math.min(100, pct[c.key])}%`, backgroundColor: CELL_COLORS[c.key] }]} />
                    </View>
                    <Text style={[styles.pctText, { color: theme.textMuted }]}>
                      {total > 0 ? `${pct[c.key].toFixed(1)}%` : "—"}
                    </Text>
                  </View>
                </View>
                <View style={[styles.inputWrap, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                  <TextInput
                    testID={`cytoflex-${c.key}-input`}
                    value={vals[c.key]}
                    onChangeText={(t) => setVals((v) => ({ ...v, [c.key]: t.replace(/[^0-9]/g, "") }))}
                    placeholder="0"
                    placeholderTextColor={theme.textMuted}
                    keyboardType="number-pad"
                    style={[styles.bigInput, { color: theme.text }]}
                  />
                  <Text style={[styles.unit, { color: theme.textMuted }]}>cells</Text>
                </View>
              </View>
            ))}
          </View>

          <Pressable
            testID="cytoflex-calculate-button"
            onPress={submit}
            disabled={busy || !isValid}
            style={({ pressed }) => [styles.btn, { backgroundColor: isValid ? theme.navy : theme.border, opacity: busy ? 0.6 : pressed ? 0.85 : 1 }]}
          >
            <Text style={styles.btnText}>{busy ? "Calculating…" : "Calculate Result"}</Text>
            <Ionicons name="analytics" size={18} color="#fff" />
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Info modal */}
      <Modal testID="cytoflex-info-modal" visible={!!info} transparent animationType="fade" onRequestClose={() => setInfo(null)}>
        <Pressable style={modalStyles.backdrop} onPress={() => setInfo(null)} />
        {info && (
          <View style={[modalStyles.sheet, { backgroundColor: theme.card }]}>
            <View style={modalStyles.headerRow}>
              <View style={[modalStyles.tag, { backgroundColor: CELL_COLORS[info.key] }]}>
                <Text style={modalStyles.tagText}>{info.label}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[modalStyles.title, { color: theme.text }]}>{info.full}</Text>
                <Text style={[modalStyles.subtitle, { color: theme.textMuted }]}>{info.hint}</Text>
              </View>
              <Pressable testID="cytoflex-info-close" onPress={() => setInfo(null)} hitSlop={12}>
                <Ionicons name="close" size={24} color={theme.text} />
              </Pressable>
            </View>
            <Image source={{ uri: info.image }} style={modalStyles.image} />
            <View style={{ marginTop: 12 }}>
              {info.details.map((d, i) => (
                <View key={i} style={modalStyles.bulletRow}>
                  <View style={[modalStyles.bulletDot, { backgroundColor: CELL_COLORS[info.key] }]} />
                  <Text style={[modalStyles.bullet, { color: theme.textMuted }]}>{d}</Text>
                </View>
              ))}
            </View>
            <Pressable
              testID="cytoflex-info-got-it"
              onPress={() => setInfo(null)}
              style={({ pressed }) => [modalStyles.gotIt, { backgroundColor: theme.navy, opacity: pressed ? 0.85 : 1 }]}
            >
              <Text style={{ color: "#fff", fontWeight: "800", fontSize: 14 }}>Got it</Text>
            </Pressable>
          </View>
        )}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, gap: 14, paddingBottom: 32 },
  donutCard: { padding: 18, borderRadius: 20, borderWidth: 1, alignItems: "center" },
  ciLabel: { fontSize: 10, fontWeight: "800", letterSpacing: 1.2, textTransform: "uppercase" },
  ciValue: { fontSize: 28, fontWeight: "800", letterSpacing: -1, marginTop: 4 },
  progressTrack: { width: "100%", height: 8, borderRadius: 8, marginTop: 10, overflow: "hidden" },
  progressFill: { height: 8, borderRadius: 8 },
  remaining: { fontSize: 12, fontWeight: "700", marginTop: 10, textAlign: "center" },

  inputRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 10, borderRadius: 14, borderWidth: 1 },
  cellTag: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 8, paddingVertical: 10, borderRadius: 10, minWidth: 64, justifyContent: "center" },
  cellTagText: { color: "#fff", fontWeight: "800", fontSize: 13, letterSpacing: 0.3 },
  middle: { flex: 1, gap: 6 },
  cellFull: { fontSize: 13, fontWeight: "700" },
  bar: { height: 4, borderRadius: 4, overflow: "hidden" },
  barFill: { height: 4, borderRadius: 4 },
  pctText: { fontSize: 11, fontWeight: "800", letterSpacing: 0.3, minWidth: 44, textAlign: "right" },
  inputWrap: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 6, minWidth: 92 },
  bigInput: { width: 50, fontSize: 20, fontWeight: "800", textAlign: "center", padding: 0, letterSpacing: -0.5 },
  unit: { fontSize: 11, fontWeight: "800", marginLeft: 2 },

  btn: { flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", paddingVertical: 16, borderRadius: 14, marginTop: 10 },
  btnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
});

const modalStyles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.55)" },
  sheet: { position: "absolute", left: 16, right: 16, top: "8%", bottom: "8%", borderRadius: 22, padding: 18 },
  headerRow: { flexDirection: "row", alignItems: "center" },
  tag: { width: 56, height: 56, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  tagText: { color: "#fff", fontWeight: "800", fontSize: 18 },
  title: { fontSize: 17, fontWeight: "800", letterSpacing: -0.3 },
  subtitle: { fontSize: 12, marginTop: 2 },
  image: { width: "100%", height: 180, borderRadius: 14, marginTop: 14 },
  bulletRow: { flexDirection: "row", gap: 10, alignItems: "flex-start", paddingVertical: 5 },
  bulletDot: { width: 8, height: 8, borderRadius: 4, marginTop: 7 },
  bullet: { flex: 1, fontSize: 13, lineHeight: 20 },
  gotIt: { paddingVertical: 14, alignItems: "center", borderRadius: 12, marginTop: 14 },
});
