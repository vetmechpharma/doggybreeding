import React from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/src/theme/ThemeContext";
import { ScreenHeader } from "@/src/components/ScreenHeader";

const REF_IMG = "https://customer-assets.emergentagent.com/job_453e719f-8513-486c-b1fd-4be9ca8fb67d/artifacts/qmzn6gx5_Picture2.png";

interface MethodCard {
  key: "cytology" | "progesterone" | "vaginoscope";
  title: string;
  subtitle: string;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
  available: boolean;
}

const METHODS: MethodCard[] = [
  { key: "cytology", title: "Vaginal Exfoliative Cytology", subtitle: "Microscopic cell count analysis", color: "#7C3AED", icon: "telescope", available: true },
  { key: "progesterone", title: "Progesterone Analysis", subtitle: "Serum hormone classification", color: "#0D9488", icon: "flask", available: true },
  { key: "vaginoscope", title: "Vaginoscope", subtitle: "Future Module", color: "#BE185D", icon: "videocam", available: false },
];

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
      <ScreenHeader title="Choose Evaluation Method" subtitle="Select your diagnostic technique" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Image source={{ uri: REF_IMG }} style={styles.banner} resizeMode="cover" />

        <View style={{ gap: 14 }}>
          {METHODS.map((m) => (
            <Pressable
              key={m.key}
              testID={`method-${m.key}`}
              onPress={() => pick(m)}
              disabled={!m.available}
              style={({ pressed }) => [
                styles.card,
                { backgroundColor: theme.card, borderColor: m.available ? m.color : theme.border, opacity: !m.available ? 0.6 : pressed ? 0.85 : 1 },
              ]}
            >
              <View style={[styles.iconWrap, { backgroundColor: m.color }]}>
                <Ionicons name={m.icon} size={28} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: theme.text }]}>{m.title}</Text>
                <Text style={[styles.sub, { color: theme.textMuted }]}>{m.subtitle}</Text>
              </View>
              <Ionicons name={m.available ? "chevron-forward" : "lock-closed"} size={20} color={theme.textMuted} />
            </Pressable>
          ))}
        </View>

        <Text style={[styles.note, { color: theme.textMuted }]}>
          You can combine Cytology + Progesterone results in a single evaluation for the most accurate breeding window.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, gap: 16, paddingBottom: 32 },
  banner: { width: "100%", height: 140, borderRadius: 16 },
  card: { flexDirection: "row", alignItems: "center", gap: 14, padding: 18, borderRadius: 18, borderWidth: 2 },
  iconWrap: { width: 56, height: 56, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 15, fontWeight: "800", letterSpacing: -0.2 },
  sub: { fontSize: 12, marginTop: 3 },
  note: { fontSize: 12, textAlign: "center", marginTop: 8, lineHeight: 18, paddingHorizontal: 8 },
});
