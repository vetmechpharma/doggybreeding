import React from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/src/theme/ThemeContext";
import { ScreenHeader } from "@/src/components/ScreenHeader";

const DATA: Record<string, { title: string; color: string; image: string; desc: string; details: string[] }> = {
  pc: {
    title: "Parabasal Cells (PC)",
    color: "#3B82F6",
    image: "https://images.pexels.com/photos/8533045/pexels-photo-8533045.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    desc: "Round to oval shaped cells with large nucleus-to-cytoplasm ratio.",
    details: [
      "Smallest of the vaginal epithelial cells.",
      "Round to oval, with a relatively large central nucleus.",
      "Predominant during anestrus and diestrus.",
      "High proportion of PC indicates the dog is not in heat.",
    ],
  },
  ic: {
    title: "Intermediate Cells (IC)",
    color: "#A855F7",
    image: "https://images.pexels.com/photos/13949979/pexels-photo-13949979.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    desc: "Low nucleus-to-cytoplasm ratio.",
    details: [
      "Larger than parabasal cells.",
      "Polygonal shape with more abundant cytoplasm.",
      "Smaller nucleus compared to PC.",
      "Seen in transitions between cycle stages.",
    ],
  },
  sic: {
    title: "Small Intermediate Cells (SIC)",
    color: "#F97316",
    image: "https://images.pexels.com/photos/8533045/pexels-photo-8533045.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    desc: "Large polygonal shape with abundant cytoplasm with small nucleus.",
    details: [
      "Transitional cells between intermediate and superficial.",
      "Abundant cytoplasm with smaller, more compact nucleus.",
      "Indicates progressing estrogenic effect.",
    ],
  },
  sc: {
    title: "Superficial Cells (SC)",
    color: "#22C55E",
    image: "https://images.pexels.com/photos/8533045/pexels-photo-8533045.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    desc: "Large flat angular cells with irregular border having small pyknotic nucleus.",
    details: [
      "Largest of the cell types — angular borders.",
      "Small dark pyknotic nucleus or no nucleus.",
      "High proportion indicates peak estrogen — estrus.",
      "Optimal breeding window when SC + CC ≥ 80%.",
    ],
  },
  cc: {
    title: "Cornified Cells (CC)",
    color: "#EF4444",
    image: "https://images.pexels.com/photos/13949979/pexels-photo-13949979.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    desc: "Fully keratinized cells with no visible nucleus.",
    details: [
      "Fully keratinized, anuclear cells.",
      "Appear shrivelled with sharp edges.",
      "Hallmark of full cornification — peak estrus.",
      "Critical marker for mating decision.",
    ],
  },
};

export default function CellDetail() {
  const { theme } = useTheme();
  const { cellType } = useLocalSearchParams<{ cellType: string }>();
  const item = DATA[cellType?.toLowerCase() || ""] || DATA.pc;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={["bottom"]}>
      <ScreenHeader title={item.title} subtitle="Cytology reference" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Image source={{ uri: item.image }} style={styles.img} />
        <View style={[styles.badge, { backgroundColor: item.color }]}>
          <Text style={styles.badgeText}>{item.title}</Text>
        </View>
        <Text style={[styles.lead, { color: theme.text }]}>{item.desc}</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Key Characteristics</Text>
          {item.details.map((d, i) => (
            <View key={i} style={styles.bulletRow}>
              <View style={[styles.bulletDot, { backgroundColor: item.color }]} />
              <Text style={[styles.bullet, { color: theme.textMuted }]}>{d}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, gap: 14, paddingBottom: 32 },
  img: { width: "100%", height: 200, borderRadius: 18 },
  badge: { alignSelf: "flex-start", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
  badgeText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  lead: { fontSize: 16, fontWeight: "700", lineHeight: 23 },
  card: { padding: 16, borderRadius: 18, borderWidth: 1, gap: 8 },
  cardTitle: { fontSize: 13, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase" },
  bulletRow: { flexDirection: "row", gap: 10, alignItems: "flex-start", paddingVertical: 4 },
  bulletDot: { width: 8, height: 8, borderRadius: 4, marginTop: 7 },
  bullet: { flex: 1, fontSize: 13, lineHeight: 20 },
});
