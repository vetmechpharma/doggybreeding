import React from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/src/theme/ThemeContext";
import { stageColors, stageLabels, stageOrder } from "@/src/theme";

const MICROSCOPE_IMG = "https://images.pexels.com/photos/8533045/pexels-photo-8533045.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";

const CELL_TYPES = [
  { key: "pc", title: "Parabasal Cells (PC)", color: "#3B82F6", desc: "Round to oval cells with large nucleus-to-cytoplasm ratio." },
  { key: "ic", title: "Intermediate Cells (IC)", color: "#A855F7", desc: "Low nucleus-to-cytoplasm ratio." },
  { key: "sic", title: "Small Intermediate (SIC)", color: "#F97316", desc: "Large polygonal cells with abundant cytoplasm, small nucleus." },
  { key: "sc", title: "Superficial Cells (SC)", color: "#22C55E", desc: "Large flat angular cells with small pyknotic nucleus." },
  { key: "cc", title: "Cornified Cells (CC)", color: "#EF4444", desc: "Fully keratinized cells with no visible nucleus." },
];

export default function Learning() {
  const { theme } = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.title, { color: theme.text }]}>Learning Module</Text>
        <Text style={[styles.sub, { color: theme.textMuted }]}>Reproductive cycles, cytology and breeding science.</Text>

        {/* About Dog Mating */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>About Dog Mating</Text>
          <Text style={[styles.body, { color: theme.textMuted }]}>
            The canine reproductive cycle typically occurs every 6–8 months and is divided into four stages.
            Each stage has distinct hormonal, behavioral, and cytological characteristics.
          </Text>
          <View style={{ marginTop: 12, gap: 8 }}>
            {stageOrder.map((s) => (
              <View key={s} style={[styles.stageRow, { backgroundColor: theme.inputBg }]}>
                <View style={[styles.stageDot, { backgroundColor: stageColors[s] }]} />
                <Text style={[styles.stageName, { color: theme.text }]}>{stageLabels[s]}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Vaginal Cytology */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Vaginal Exfoliative Cytology</Text>
          <Image source={{ uri: MICROSCOPE_IMG }} style={styles.heroImg} />
          <Text style={[styles.body, { color: theme.textMuted }]}>
            Microscopic study of vaginal epithelial cells helps determine the stage of the estrous cycle.
            Different cell types appear in different proportions across stages.
          </Text>

          <Text style={[styles.subTitle, { color: theme.text }]}>Cell Types</Text>
          <View style={{ gap: 10 }}>
            {CELL_TYPES.map((c) => (
              <Pressable
                key={c.key}
                testID={`learning-cell-${c.key}`}
                onPress={() => router.push({ pathname: "/learning/[cellType]", params: { cellType: c.key } })}
                style={({ pressed }) => [styles.cellRow, { backgroundColor: theme.inputBg, opacity: pressed ? 0.85 : 1 }]}
              >
                <View style={[styles.cellDot, { backgroundColor: c.color }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cellTitle, { color: theme.text }]}>{c.title}</Text>
                  <Text style={[styles.cellDesc, { color: theme.textMuted }]} numberOfLines={2}>{c.desc}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
              </Pressable>
            ))}
          </View>
        </View>

        {/* Progesterone primer */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Progesterone Analysis</Text>
          <Text style={[styles.body, { color: theme.textMuted }]}>
            Serum progesterone (ng/ml) rises predictably through proestrus to estrus, peaking after ovulation.
            Tracking this rise gives the most accurate breeding window.
          </Text>
          <View style={{ gap: 6, marginTop: 8 }}>
            <Row label="< 0.5 ng/ml" right="Anestrus" theme={theme} color={stageColors.ANESTRUS} />
            <Row label="0.5 – 1.0" right="Early Proestrus" theme={theme} color={stageColors.EARLY_PROESTRUS} />
            <Row label="1.1 – 1.9" right="Late Proestrus" theme={theme} color={stageColors.LATE_PROESTRUS} />
            <Row label="2.0 – 4.0" right="Estrus" theme={theme} color={stageColors.ESTRUS} />
            <Row label="4.1 – 18" right="Estrus / Ovulation" theme={theme} color={stageColors.ESTRUS_OVULATION} />
            <Row label="> 18" right="Diestrus" theme={theme} color={stageColors.DIESTRUS} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, right, theme, color }: any) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 6 }}>
      <Text style={{ color: theme.text, fontWeight: "700", fontSize: 13 }}>{label}</Text>
      <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
        <Text style={{ color: theme.textMuted, fontSize: 12 }}>{right}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, gap: 14, paddingBottom: 80 },
  title: { fontSize: 24, fontWeight: "800", letterSpacing: -0.5 },
  sub: { fontSize: 12, marginBottom: 4 },
  card: { padding: 16, borderRadius: 20, borderWidth: 1, gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: "800" },
  body: { fontSize: 13, lineHeight: 20 },
  heroImg: { width: "100%", height: 140, borderRadius: 14, marginVertical: 8 },
  subTitle: { fontSize: 13, fontWeight: "800", letterSpacing: 0.8, textTransform: "uppercase", marginTop: 6 },
  stageRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 10, borderRadius: 10 },
  stageDot: { width: 10, height: 10, borderRadius: 5 },
  stageName: { fontSize: 13, fontWeight: "700" },
  cellRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 12 },
  cellDot: { width: 12, height: 50, borderRadius: 6 },
  cellTitle: { fontSize: 14, fontWeight: "800" },
  cellDesc: { fontSize: 12, marginTop: 2 },
});
