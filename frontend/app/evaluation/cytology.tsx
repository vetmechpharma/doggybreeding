import React, { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/src/theme/ThemeContext";
import { useAuth } from "@/src/auth/AuthContext";
import { useToast } from "@/src/components/Toast";
import { ScreenHeader } from "@/src/components/ScreenHeader";
import { DonutChart } from "@/src/components/DonutChart";
import { api } from "@/src/api/client";

const CELL_COLORS = { pc: "#3B82F6", ic: "#A855F7", sic: "#F97316", sc: "#22C55E", cc: "#EF4444" };
const CELLS: Array<{ key: keyof typeof CELL_COLORS; label: string; hint: string }> = [
  { key: "pc", label: "PC", hint: "Parabasal" },
  { key: "ic", label: "IC", hint: "Intermediate" },
  { key: "sic", label: "SIC", hint: "Small Interm." },
  { key: "sc", label: "SC", hint: "Superficial" },
  { key: "cc", label: "CC", hint: "Cornified" },
];

export default function CytologyCalc() {
  const { theme } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
  const params = useLocalSearchParams<{ dog_id?: string; proestrus_date?: string }>();

  const [vals, setVals] = useState<Record<string, string>>({ pc: "", ic: "", sic: "", sc: "", cc: "" });
  const [busy, setBusy] = useState(false);

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
      const ev = await api.post<{ id: string }>("/evaluations", {
        user_id: user.id,
        dog_id: params.dog_id,
        type: "cytology",
        inputs: nums,
        result,
        proestrus_bleeding_date: params.proestrus_date || "",
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
      <ScreenHeader title="Cytology Calculator" subtitle="Enter cell counts (total = 100)" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Donut */}
          <View style={[styles.donutCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <DonutChart data={donutData} size={180} strokeWidth={20} centerLabel="Total" centerValue={`${total}/100`} theme={theme} />
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

          {/* Inputs */}
          <View style={{ gap: 10 }}>
            {CELLS.map((c) => (
              <View key={c.key} style={[styles.inputRow, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={[styles.cellChip, { backgroundColor: CELL_COLORS[c.key] }]}>
                  <Text style={styles.cellChipText}>{c.label}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cellName, { color: theme.text }]}>{c.label} <Text style={{ color: theme.textMuted, fontWeight: "500" }}>— {c.hint}</Text></Text>
                  <View style={[styles.bar, { backgroundColor: theme.inputBg }]}>
                    <View style={[styles.barFill, { width: `${Math.min(100, nums[c.key])}%`, backgroundColor: CELL_COLORS[c.key] }]} />
                  </View>
                </View>
                <TextInput
                  testID={`cytology-${c.key}-input`}
                  value={vals[c.key]}
                  onChangeText={(t) => setVals((v) => ({ ...v, [c.key]: t.replace(/[^0-9.]/g, "") }))}
                  placeholder="0"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="decimal-pad"
                  style={[styles.numInput, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
                />
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
  inputRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 14, borderWidth: 1 },
  cellChip: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  cellChipText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  cellName: { fontSize: 13, fontWeight: "800" },
  bar: { height: 4, borderRadius: 4, marginTop: 6, overflow: "hidden" },
  barFill: { height: 4, borderRadius: 4 },
  numInput: { width: 60, borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 10, textAlign: "center", fontWeight: "800", fontSize: 16 },
  btn: { flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", paddingVertical: 16, borderRadius: 14, marginTop: 10 },
  btnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
});
