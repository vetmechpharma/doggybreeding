import React from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/src/theme/ThemeContext";
import { ScreenHeader } from "@/src/components/ScreenHeader";

// User-provided 3-panel reference image. We render each panel by clipping
// the image inside a fixed-size container — panel 0 = Cytology, 1 = Progesterone,
// 2 = Vaginoscope.
const REF_IMG = "https://customer-assets.emergentagent.com/job_453e719f-8513-486c-b1fd-4be9ca8fb67d/artifacts/qmzn6gx5_Picture2.png";

interface MethodCard {
  key: "cytology" | "progesterone" | "vaginoscope";
  title: string;
  subtitle: string;
  color: string;
  panel: 0 | 1 | 2;
  available: boolean;
}

const METHODS: MethodCard[] = [
  {
    key: "cytology",
    title: "Vaginal Exfoliative Cytology",
    subtitle: "Microscopic cell count analysis (PC, IC, SIC, SC, CC)",
    color: "#7C3AED",
    panel: 0,
    available: true,
  },
  {
    key: "progesterone",
    title: "Progesterone Analysis",
    subtitle: "Serum hormone classification (ng/ml)",
    color: "#0D9488",
    panel: 1,
    available: true,
  },
  {
    key: "vaginoscope",
    title: "Vaginoscope",
    subtitle: "Future Module — direct vaginal visualization",
    color: "#BE185D",
    panel: 2,
    available: false,
  },
];

const PANEL_W = 110; // visible width of each panel inside the card
const PANEL_H = 130;
const IMG_W = PANEL_W * 3; // image rendered at 3x panel width, then offset to show one panel

export default function EvalType() {
  const { theme } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ dog_id?: string; proestrus_date?: string }>();

  const pick = (m: MethodCard) => {
    if (!m.available) return;
    if (m.key === "cytology") {
      router.push({ pathname: "/evaluation/cytology", params: { dog_id: params.dog_id || "", proestrus_date: params.proestrus_date || "" } });
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
            <View style={[styles.imageFrame, { backgroundColor: "#fff" }]}>
              <Image
                source={{ uri: REF_IMG }}
                style={{ width: IMG_W, height: PANEL_H, marginLeft: -m.panel * PANEL_W }}
                resizeMode="cover"
              />
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
    width: PANEL_W,
    height: PANEL_H,
    borderRadius: 14,
    overflow: "hidden",
    alignItems: "flex-start",
    justifyContent: "flex-start",
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
