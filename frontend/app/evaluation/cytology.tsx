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
import { api } from "@/src/api/client";
import { sheetsSync } from "@/src/api/sheetsSync";

const CELL_COLORS = { pc: "#3B82F6", ic: "#A855F7", sic: "#F97316", sc: "#22C55E", cc: "#EF4444" };

interface CellInfo {
  key: keyof typeof CELL_COLORS;
  label: string;
  full: string;
  hint: string;
  image: string;
  details: string[];
}

const CELLS: CellInfo[] = [
  {
    key: "pc",
    label: "PC",
    full: "Parabasal Cells",
    hint: "Round to oval, large nucleus",
    image: "https://images.pexels.com/photos/8533045/pexels-photo-8533045.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    details: [
      "Smallest of the vaginal epithelial cells.",
      "Round to oval, large central nucleus.",
      "Predominant during anestrus and diestrus.",
      "High proportion → not in heat.",
    ],
  },
  {
    key: "ic",
    label: "IC",
    full: "Intermediate Cells",
    hint: "Low nucleus-to-cytoplasm ratio",
    image: "https://images.pexels.com/photos/13949979/pexels-photo-13949979.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    details: [
      "Larger than parabasal cells.",
      "Polygonal shape, more cytoplasm.",
      "Smaller nucleus than PC.",
      "Seen in stage transitions.",
    ],
  },
  {
    key: "sic",
    label: "SIC",
    full: "Small Intermediate Cells",
    hint: "Polygonal, abundant cytoplasm",
    image: "https://images.pexels.com/photos/8533045/pexels-photo-8533045.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    details: [
      "Transitional cells between IC and SC.",
      "Abundant cytoplasm with compact nucleus.",
      "Indicates progressing estrogenic effect.",
    ],
  },
  {
    key: "sc",
    label: "SC",
    full: "Superficial Cells",
    hint: "Flat, angular, small pyknotic nucleus",
    image: "https://images.pexels.com/photos/8533045/pexels-photo-8533045.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    details: [
      "Largest cell type — angular borders.",
      "Small dark pyknotic nucleus.",
      "High proportion → peak estrogen → estrus.",
      "Optimal breeding when SC + CC ≥ 80%.",
    ],
  },
  {
    key: "cc",
    label: "CC",
    full: "Cornified Cells",
    hint: "Fully keratinized, no visible nucleus",
    image: "https://images.pexels.com/photos/13949979/pexels-photo-13949979.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    details: [
      "Fully keratinized, anuclear cells.",
      "Sharp edges, shrivelled appearance.",
      "Hallmark of full cornification — peak estrus.",
      "Critical marker for mating decision.",
    ],
  },
];

export default function CytologyCalc() {
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
  const remaining = 100 - total;
  const ci = nums.sc + nums.cc;
  const isValid = Math.abs(total - 100) < 0.5;

  const donutData = total > 0 ? CELLS.map((c) => ({ value: nums[c.key], color: CELL_COLORS[c.key] })) : [{ value: 1, color: theme.border }];

  const submit = async () => {
    if (!user || !params.dog_id) return;
    if (!isValid) {
      toast.show(`Total must equal 100 (currently ${total}).`, "error");
      return;
    }
    setBusy(true);
    try {
      const result = await api.post("/calc/cytology", nums, { proestrus_bleeding_date: params.proestrus_date || undefined });
      const dog = await api.get<any>(`/dogs/${params.dog_id}`).catch(() => null);
      const ev = await api.post<{ id: string }>("/evaluations", {
        user_id: user.id,
        dog_id: params.dog_id,
        type: "cytology",
        inputs: nums,
        result,
        proestrus_bleeding_date: params.proestrus_date || "",
      });
      sheetsSync.evaluation({
        id: ev.id, user_id: user.id, user_name: user.name, user_email: user.email, user_mobile: user.mobile,
        dog_name: dog?.dog_name, owner_name: dog?.owner_name, owner_mobile: dog?.owner_mobile,
        breed: dog?.breed, age: dog?.age, sex: dog?.sex, whelping_count: dog?.whelping_count,
        previous_whelping_date: dog?.previous_whelping_date, proestrus_bleeding_date: dog?.proestrus_bleeding_date || params.proestrus_date,
        type: "cytology", inputs: nums, result,
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
      <ScreenHeader title="Cytology Calculator" subtitle="Tap a cell label to learn more" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Donut summary */}
          <View style={[styles.donutCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <DonutChart data={donutData} size={170} strokeWidth={20} centerLabel="Total" centerValue={`${total}/100`} theme={theme} />
            <View style={{ marginTop: 12, alignItems: "center" }}>
              <Text style={[styles.ciLabel, { color: theme.textMuted }]}>Cornification Index</Text>
              <Text style={[styles.ciValue, { color: theme.text }]}>{ci.toFixed(0)}%</Text>
            </View>
            <View style={[styles.progressTrack, { backgroundColor: theme.inputBg }]}>
              <View style={[styles.progressFill, { width: `${Math.min(100, Math.max(0, ci))}%`, backgroundColor: ci >= 80 ? "#22C55E" : ci >= 60 ? "#EAB308" : ci >= 30 ? "#F97316" : "#3B82F6" }]} />
            </View>
            <Text style={[styles.remaining, { color: remaining === 0 ? "#22C55E" : remaining < 0 ? "#EF4444" : theme.textMuted }]}>
              {remaining === 0 ? "✓ Total = 100" : remaining > 0 ? `Add ${remaining} more cells` : `Reduce by ${Math.abs(remaining)} cells`}
            </Text>
          </View>

          {/* Inputs — single-line per cell */}
          <View style={{ gap: 10 }}>
            {CELLS.map((c) => (
              <View key={c.key} style={[styles.inputRow, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Pressable
                  testID={`cytology-${c.key}-info`}
                  onPress={() => setInfo(c)}
                  style={({ pressed }) => [styles.cellTag, { backgroundColor: CELL_COLORS[c.key], opacity: pressed ? 0.85 : 1 }]}
                  hitSlop={4}
                >
                  <Text style={styles.cellTagText}>{c.label}</Text>
                  <Ionicons name="information-circle" size={14} color="rgba(255,255,255,0.95)" />
                </Pressable>
                <View style={styles.middle}>
                  <Text style={[styles.cellFull, { color: theme.text }]} numberOfLines={1}>{c.full}</Text>
                  <View style={[styles.bar, { backgroundColor: theme.inputBg }]}>
                    <View style={[styles.barFill, { width: `${Math.min(100, nums[c.key])}%`, backgroundColor: CELL_COLORS[c.key] }]} />
                  </View>
                </View>
                <View style={[styles.inputWrap, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                  <TextInput
                    testID={`cytology-${c.key}-input`}
                    value={vals[c.key]}
                    onChangeText={(t) => setVals((v) => ({ ...v, [c.key]: t.replace(/[^0-9.]/g, "") }))}
                    placeholder="0"
                    placeholderTextColor={theme.textMuted}
                    keyboardType="decimal-pad"
                    style={[styles.bigInput, { color: theme.text }]}
                  />
                  <Text style={[styles.unit, { color: theme.textMuted }]}>%</Text>
                </View>
              </View>
            ))}
          </View>

          <Pressable
            testID="cytology-calculate-button"
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
      <Modal testID="cytology-info-modal" visible={!!info} transparent animationType="fade" onRequestClose={() => setInfo(null)}>
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
              <Pressable testID="cytology-info-close" onPress={() => setInfo(null)} hitSlop={12}>
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
              testID="cytology-info-got-it"
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
  remaining: { fontSize: 12, fontWeight: "700", marginTop: 10 },

  inputRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 10, borderRadius: 14, borderWidth: 1 },
  cellTag: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 8, paddingVertical: 10, borderRadius: 10, minWidth: 64, justifyContent: "center" },
  cellTagText: { color: "#fff", fontWeight: "800", fontSize: 13, letterSpacing: 0.3 },
  middle: { flex: 1, gap: 6 },
  cellFull: { fontSize: 13, fontWeight: "700" },
  bar: { height: 4, borderRadius: 4, overflow: "hidden" },
  barFill: { height: 4, borderRadius: 4 },
  inputWrap: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 6, minWidth: 88 },
  bigInput: { width: 56, fontSize: 22, fontWeight: "800", textAlign: "center", padding: 0, letterSpacing: -0.5 },
  unit: { fontSize: 14, fontWeight: "800", marginLeft: 2 },

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
