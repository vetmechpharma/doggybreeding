import React from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/src/theme/ThemeContext";
import { ScreenHeader } from "@/src/components/ScreenHeader";

// Per-method visuals. We use real microscopy images for the two cytology
// calculators, and Ionicons for the other methods. All render inside a fixed
// square panel with `resizeMode="cover"` so nothing gets clipped mid-label.
const CYTOLOGY_IMG = "https://customer-assets.emergentagent.com/job_canine-cycle/artifacts/2mjp3e8h_SC%20%282%29.webp";
const CYTOLOGY_FLEX_IMG = "https://customer-assets.emergentagent.com/job_canine-cycle/artifacts/5ovty7ut_CC%20%282%29.webp";

type MethodKey = "cytology" | "cytology_flex" | "progesterone" | "vaginoscope";

interface MethodCard {
  key: MethodKey;
  title: string;
  subtitle: string;
  color: string;
  bg: string;                          // pale tint behind the icon/image
  image?: string;                       // microscopy image URI (if any)
  icon?: keyof typeof Ionicons.glyphMap; // fallback / other methods
  available: boolean;
}

const METHODS: MethodCard[] = [
  {
    key: "cytology",
    title: "Vaginal Cytology (100 Cells)",
    subtitle: "Enter percentages of PC, IC, SIC, SC, CC that total 100",
    color: "#7C3AED",
    bg: "#EDE9FE",
    image: CYTOLOGY_IMG,
    available: true,
  },
  {
    key: "cytology_flex",
    title: "Vaginal Cytology (More Than 100 Cells)",
    subtitle: "Enter raw cell counts — total & % auto-calculated",
    color: "#6D28D9",
    bg: "#EDE9FE",
    image: CYTOLOGY_FLEX_IMG,
    available: true,
  },
  {
    key: "progesterone",
    title: "Progesterone Analysis",
    subtitle: "Serum hormone classification (ng/ml)",
    color: "#0D9488",
    bg: "#CCFBF1",
    icon: "flask",
    available: true,
  },
  {
    key: "vaginoscope",
    title: "Vaginoscope",
    subtitle: "Future Module — direct vaginal visualization",
    color: "#BE185D",
    bg: "#FCE7F3",
    icon: "eye",
    available: false,
  },
];

const PANEL = 96; // square visual panel size

export default function EvalType() {
  const { theme } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ dog_id?: string; proestrus_date?: string }>();

  const pick = (m: MethodCard) => {
    if (!m.available) return;
    if (m.key === "cytology") {
      router.push({ pathname: "/evaluation/cytology", params: { dog_id: params.dog_id || "", proestrus_date: params.proestrus_date || "" } });
    } else if (m.key === "cytology_flex") {
      router.push({ pathname: "/evaluation/cytology-flex", params: { dog_id: params.dog_id || "", proestrus_date: params.proestrus_date || "" } });
    } else if (m.key === "progesterone") {
      router.push({ pathname: "/evaluation/progesterone", params: { dog_id: params.dog_id || "", proestrus_date: params.proestrus_date || "" } });
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={["bottom"]}>
      <ScreenHeader title="Choose Evaluation Method" subtitle="Tap a method to begin" />
      <ScrollView contentContainerStyle={styles.scroll}>
        {METHODS.map((m) => (
          <Pressable
            key={m.key}
            testID={`method-${m.key}`}
            onPress={() => pick(m)}
            disabled={!m.available}
            style={({ pressed }) => [
              styles.card,
              {
                backgroundColor: theme.card,
                borderColor: m.available ? m.color : theme.border,
                opacity: !m.available ? 0.6 : pressed ? 0.85 : 1,
              },
            ]}
          >
            <View style={[styles.imageFrame, { backgroundColor: m.bg, borderColor: m.color + "44" }]}>
              {m.image ? (
                <Image
                  source={{ uri: m.image }}
                  style={{ width: PANEL, height: PANEL, borderRadius: 14 }}
                  resizeMode="cover"
                />
              ) : (
                <Ionicons name={m.icon || "help-circle"} size={54} color={m.color} />
              )}
            </View>

            <View style={styles.textBlock}>
              <View style={[styles.colorBar, { backgroundColor: m.color }]} />
              <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>{m.title}</Text>
              <Text style={[styles.subtitle, { color: theme.textMuted }]} numberOfLines={2}>{m.subtitle}</Text>
              <View style={styles.actionRow}>
                {m.available ? (
                  <View style={[styles.actionPill, { backgroundColor: m.color }]}>
                    <Text style={styles.actionText}>Start</Text>
                    <Ionicons name="arrow-forward" size={14} color="#fff" />
                  </View>
                ) : (
                  <View style={[styles.actionPill, { backgroundColor: theme.border }]}>
                    <Ionicons name="lock-closed" size={12} color={theme.textMuted} />
                    <Text style={[styles.actionText, { color: theme.textMuted }]}>Coming Soon</Text>
                  </View>
                )}
              </View>
            </View>
          </Pressable>
        ))}

        <Text style={[styles.note, { color: theme.textMuted }]}>
          You can combine Cytology + Progesterone results in a single evaluation for the most accurate breeding window.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, gap: 14, paddingBottom: 32 },
  card: {
    flexDirection: "row",
    gap: 14,
    padding: 12,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: "center",
  },
  imageFrame: {
    width: PANEL,
    height: PANEL,
    borderRadius: 18,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  textBlock: { flex: 1, gap: 4 },
  colorBar: { width: 36, height: 4, borderRadius: 2, marginBottom: 4 },
  title: { fontSize: 16, fontWeight: "800", letterSpacing: -0.2 },
  subtitle: { fontSize: 12, lineHeight: 17 },
  actionRow: { flexDirection: "row", marginTop: 8 },
  actionPill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999 },
  actionText: { color: "#fff", fontSize: 12, fontWeight: "800", letterSpacing: 0.3 },
  note: { fontSize: 12, textAlign: "center", marginTop: 8, lineHeight: 18, paddingHorizontal: 8 },
});
