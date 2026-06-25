import React, { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/src/theme/ThemeContext";
import { useAuth } from "@/src/auth/AuthContext";
import { useToast } from "@/src/components/Toast";
import { ScreenHeader } from "@/src/components/ScreenHeader";
import { stageColors } from "@/src/theme";
import { api } from "@/src/api/client";
import { sheetsSync } from "@/src/api/sheetsSync";

const RANGES = [
  { range: "< 0.5", label: "Anestrus", color: stageColors.ANESTRUS, min: -1, max: 0.5 },
  { range: "0.5 – 1.0", label: "Early Proestrus", color: stageColors.EARLY_PROESTRUS, min: 0.5, max: 1.0 },
  { range: "1.1 – 1.9", label: "Late Proestrus", color: stageColors.LATE_PROESTRUS, min: 1.1, max: 1.9 },
  { range: "2.0 – 4.0", label: "Estrus", color: stageColors.ESTRUS, min: 2.0, max: 4.0 },
  { range: "4.1 – 18", label: "Estrus / Ovulation", color: stageColors.ESTRUS_OVULATION, min: 4.1, max: 18 },
  { range: "> 18", label: "Diestrus", color: stageColors.DIESTRUS, min: 18.01, max: 999 },
];

export default function ProgesteroneCalc() {
  const { theme } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
  const params = useLocalSearchParams<{ dog_id?: string; proestrus_date?: string }>();
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);

  const v = Number(value);
  const matched = useMemo(() => {
    if (!value || isNaN(v)) return null;
    return RANGES.find((r) => v > r.min && v <= r.max) || null;
  }, [v, value]);

  const submit = async () => {
    if (!user || !params.dog_id) return;
    if (!value || isNaN(v) || v < 0) {
      toast.show("Enter a valid progesterone value.", "error");
      return;
    }
    setBusy(true);
    try {
      const result = await api.post("/calc/progesterone", { value: v }, { proestrus_bleeding_date: params.proestrus_date || undefined });
      const dog = await api.get<any>(`/dogs/${params.dog_id}`).catch(() => null);
      const ev = await api.post<{ id: string }>("/evaluations", {
        user_id: user.id,
        dog_id: params.dog_id,
        type: "progesterone",
        inputs: { value: v },
        result,
        proestrus_bleeding_date: params.proestrus_date || "",
      });
      sheetsSync.evaluation({
        id: ev.id, user_id: user.id, user_name: user.name, user_email: user.email, user_mobile: user.mobile,
        dog_name: dog?.dog_name, owner_name: dog?.owner_name, owner_mobile: dog?.owner_mobile,
        breed: dog?.breed, age: dog?.age, sex: dog?.sex, whelping_count: dog?.whelping_count,
        previous_whelping_date: dog?.previous_whelping_date, proestrus_bleeding_date: dog?.proestrus_bleeding_date || params.proestrus_date,
        type: "progesterone", inputs: { value: v }, result,
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
      <ScreenHeader title="Progesterone Calculator" subtitle="Enter serum value in ng/ml" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Big input */}
          <View style={[styles.inputCard, { backgroundColor: theme.card, borderColor: matched?.color || theme.border }]}>
            <Text style={[styles.label, { color: theme.textMuted }]}>Progesterone</Text>
            <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "center", gap: 8 }}>
              <TextInput
                testID="progesterone-value-input"
                value={value}
                onChangeText={(t) => setValue(t.replace(/[^0-9.]/g, ""))}
                placeholder="0.0"
                placeholderTextColor={theme.textMuted}
                keyboardType="decimal-pad"
                style={[styles.bigInput, { color: theme.text }]}
              />
              <Text style={[styles.unit, { color: theme.textMuted }]}>ng/ml</Text>
            </View>
            {matched && (
              <View style={[styles.preview, { backgroundColor: matched.color + "22" }]}>
                <View style={[styles.previewDot, { backgroundColor: matched.color }]} />
                <Text style={[styles.previewLabel, { color: matched.color }]}>{matched.label}</Text>
              </View>
            )}
          </View>

          <Text style={[styles.section, { color: theme.textMuted }]}>Classification Reference</Text>

          <View style={{ gap: 8 }}>
            {RANGES.map((r) => {
              const active = matched?.label === r.label;
              return (
                <View key={r.label} style={[styles.refRow, { backgroundColor: theme.card, borderColor: active ? r.color : theme.border, borderWidth: active ? 2 : 1 }]}>
                  <View style={[styles.refDot, { backgroundColor: r.color }]} />
                  <Text style={[styles.refRange, { color: theme.text }]}>{r.range}</Text>
                  <Text style={[styles.refLabel, { color: theme.textMuted }]}>{r.label}</Text>
                </View>
              );
            })}
          </View>

          <Pressable
            testID="progesterone-calculate-button"
            onPress={submit}
            disabled={busy || !matched}
            style={({ pressed }) => [styles.btn, { backgroundColor: matched ? theme.navy : theme.border, opacity: busy ? 0.6 : pressed ? 0.85 : 1 }]}
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
  inputCard: { padding: 24, borderRadius: 22, borderWidth: 2, alignItems: "center" },
  label: { fontSize: 11, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase" },
  bigInput: { fontSize: 56, fontWeight: "800", letterSpacing: -2, minWidth: 120, textAlign: "center" },
  unit: { fontSize: 14, fontWeight: "700" },
  preview: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, marginTop: 8 },
  previewDot: { width: 10, height: 10, borderRadius: 5 },
  previewLabel: { fontSize: 13, fontWeight: "800", letterSpacing: 0.5, textTransform: "uppercase" },
  section: { fontSize: 11, fontWeight: "800", letterSpacing: 1.2, textTransform: "uppercase", marginTop: 6 },
  refRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 12 },
  refDot: { width: 12, height: 12, borderRadius: 6 },
  refRange: { fontSize: 14, fontWeight: "800", minWidth: 90 },
  refLabel: { fontSize: 13 },
  btn: { flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", paddingVertical: 16, borderRadius: 14, marginTop: 10 },
  btnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
});
