import React from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/src/theme/ThemeContext";
import { ScreenHeader } from "@/src/components/ScreenHeader";

const LOGO_URL = "https://customer-assets.emergentagent.com/job_453e719f-8513-486c-b1fd-4be9ca8fb67d/artifacts/j7h9vi8t_logo.jpg";

const FACULTY = [
  "Dr R Shreemathi",
  "Dr Mridul Sarma",
  "Dr S Manokaran",
  "Dr M Palanisamy",
  "Dr M Selvaraju",
];

export default function About() {
  const { theme } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={["bottom"]}>
      <ScreenHeader title="About" subtitle="Doggy Breeding App" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.hero, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Image source={{ uri: LOGO_URL }} style={styles.logo} />
          <Text style={[styles.appName, { color: theme.text }]}>Doggy Breeding App</Text>
          <Text style={[styles.tagline, { color: theme.textMuted }]}>BREED • TRACK • CARE</Text>
          <Text style={[styles.version, { color: theme.textMuted }]}>Version 1.0.0</Text>
        </View>

        <Section theme={theme} title="Institution">
          <Text style={[styles.body, { color: theme.text }]}>Veterinary College and Research Institute, Namakkal</Text>
          <Text style={[styles.body, { color: theme.textMuted }]}>Department of Veterinary Gynaecology and Obstetrics</Text>
        </Section>

        <Section theme={theme} title="Guided By">
          {FACULTY.map((f) => (
            <Text key={f} style={[styles.body, { color: theme.text }]}>• {f}</Text>
          ))}
        </Section>

        <Section theme={theme} title="Developed By">
          <Text style={[styles.body, { color: theme.text, fontWeight: "800" }]}>ANIMitra Software</Text>
          <Text style={[styles.body, { color: theme.textMuted }]}>+91 99444 72488</Text>
        </Section>

        <Section theme={theme} title="Purpose">
          <Text style={[styles.body, { color: theme.textMuted, lineHeight: 21 }]}>
            A professional veterinary tool for canine reproductive evaluation and breeding management.
            Combines vaginal exfoliative cytology, progesterone analysis and clinical timelines to
            determine the optimal breeding window.
          </Text>
        </Section>

        <Section theme={theme} title="Disclaimer">
          <Text style={[styles.body, { color: theme.textMuted, lineHeight: 21 }]}>
            This application provides decision support based on widely accepted veterinary protocols.
            Final breeding decisions should always be made by a qualified veterinarian based on the
            individual case.
          </Text>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children, theme }: any) {
  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={[styles.cardTitle, { color: theme.textMuted }]}>{title}</Text>
      <View style={{ gap: 4, marginTop: 6 }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, gap: 12, paddingBottom: 32 },
  hero: { alignItems: "center", paddingVertical: 28, paddingHorizontal: 16, borderRadius: 22, borderWidth: 1, gap: 6 },
  logo: { width: 96, height: 96, borderRadius: 22, backgroundColor: "#fff" },
  appName: { fontSize: 22, fontWeight: "800", letterSpacing: -0.5, marginTop: 12 },
  tagline: { fontSize: 11, letterSpacing: 3, fontWeight: "700" },
  version: { fontSize: 12, marginTop: 4 },
  card: { padding: 16, borderRadius: 16, borderWidth: 1 },
  cardTitle: { fontSize: 11, fontWeight: "800", letterSpacing: 1.2, textTransform: "uppercase" },
  body: { fontSize: 14, lineHeight: 22 },
});
