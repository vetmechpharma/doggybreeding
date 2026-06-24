import React, { useCallback, useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/src/theme/ThemeContext";
import { useAuth } from "@/src/auth/AuthContext";
import { api } from "@/src/api/client";
import { DonutChart } from "@/src/components/DonutChart";
import { stageColors } from "@/src/theme";

interface Stats {
  total: number;
  estrus: number;
  anestrus: number;
  diestrus: number;
  proestrus: number;
  by_stage: Record<string, number>;
  by_month: Record<string, number>;
}

const LOGO_URL = "https://customer-assets.emergentagent.com/job_453e719f-8513-486c-b1fd-4be9ca8fb67d/artifacts/j7h9vi8t_logo.jpg";

export default function Dashboard() {
  const { theme } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const s = await api.get<Stats>(`/stats/${user.id}`);
      setStats(s);
    } catch (e) { /* ignore */ }
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  useEffect(() => { load(); }, [load]);

  if (!user) {
    return <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} />;
  }

  const greet = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const donutData = stats && stats.total > 0 ? [
    { value: stats.estrus, color: stageColors.ESTRUS },
    { value: stats.anestrus, color: stageColors.ANESTRUS },
    { value: stats.diestrus, color: stageColors.DIESTRUS },
    { value: stats.proestrus, color: stageColors.LATE_PROESTRUS },
  ] : [{ value: 1, color: theme.border }];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.greet, { color: theme.textMuted }]}>{greet()},</Text>
            <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>Dr. {user.name}</Text>
            <Text style={[styles.cat, { color: theme.textMuted }]}>{user.category}{user.hospital ? `  •  ${user.hospital}` : ""}</Text>
          </View>
          <Image source={{ uri: LOGO_URL }} style={styles.logo} />
        </View>

        {/* Primary CTA */}
        <Pressable
          testID="dashboard-new-evaluation"
          onPress={() => router.push("/evaluation/new")}
          style={({ pressed }) => [styles.cta, { backgroundColor: theme.navy, opacity: pressed ? 0.9 : 1 }]}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.ctaTitle}>New Evaluation</Text>
            <Text style={styles.ctaSub}>Cytology  •  Progesterone  •  Combined</Text>
          </View>
          <View style={styles.ctaIcon}>
            <Ionicons name="add" size={28} color="#fff" />
          </View>
        </Pressable>

        {/* Stats grid */}
        <View style={styles.gridRow}>
          <StatCard label="Total" value={stats?.total ?? 0} color={theme.navy} icon="documents" theme={theme} testID="stat-total" />
          <StatCard label="Estrus" value={stats?.estrus ?? 0} color={stageColors.ESTRUS} icon="checkmark-circle" theme={theme} testID="stat-estrus" />
        </View>
        <View style={styles.gridRow}>
          <StatCard label="Anestrus" value={stats?.anestrus ?? 0} color={stageColors.ANESTRUS} icon="pause-circle" theme={theme} testID="stat-anestrus" />
          <StatCard label="Diestrus" value={stats?.diestrus ?? 0} color={stageColors.DIESTRUS} icon="alert-circle" theme={theme} testID="stat-diestrus" />
        </View>

        {/* Donut */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Cases by Stage</Text>
          <View style={{ alignItems: "center", marginVertical: 12 }}>
            <DonutChart
              data={donutData}
              size={180}
              strokeWidth={24}
              centerLabel="Total"
              centerValue={String(stats?.total ?? 0)}
              theme={theme}
            />
          </View>
          <View style={styles.legendRow}>
            <Legend color={stageColors.ESTRUS} label="Estrus" theme={theme} />
            <Legend color={stageColors.ANESTRUS} label="Anestrus" theme={theme} />
            <Legend color={stageColors.DIESTRUS} label="Diestrus" theme={theme} />
            <Legend color={stageColors.LATE_PROESTRUS} label="Proestrus" theme={theme} />
          </View>
        </View>

        {/* Quick actions */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Access</Text>
        <View style={styles.quickGrid}>
          <Quick icon="time" label="History" onPress={() => router.push("/(tabs)/history")} theme={theme} testID="quick-history" />
          <Quick icon="library" label="Learning" onPress={() => router.push("/(tabs)/learning")} theme={theme} testID="quick-learning" />
          <Quick icon="star" label="Feedback" onPress={() => router.push("/feedback")} theme={theme} testID="quick-feedback" />
          <Quick icon="information-circle" label="About" onPress={() => router.push("/about")} theme={theme} testID="quick-about" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ label, value, color, icon, theme, testID }: any) {
  return (
    <View testID={testID} style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={[styles.statIcon, { backgroundColor: color + "20" }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View>
        <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
        <Text style={[styles.statLabel, { color: theme.textMuted }]}>{label}</Text>
      </View>
    </View>
  );
}

function Legend({ color, label, theme }: any) {
  return (
    <View style={styles.legend}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={[styles.legendText, { color: theme.text }]}>{label}</Text>
    </View>
  );
}

function Quick({ icon, label, onPress, theme, testID }: any) {
  return (
    <Pressable testID={testID} onPress={onPress} style={({ pressed }) => [styles.quick, { backgroundColor: theme.card, borderColor: theme.border, opacity: pressed ? 0.85 : 1 }]}>
      <Ionicons name={icon} size={22} color={theme.navy} />
      <Text style={[styles.quickLabel, { color: theme.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, gap: 14, paddingBottom: 32 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingTop: 4 },
  greet: { fontSize: 13, fontWeight: "600" },
  name: { fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
  cat: { fontSize: 12, marginTop: 2 },
  logo: { width: 56, height: 56, borderRadius: 14, backgroundColor: "#fff" },
  cta: { flexDirection: "row", alignItems: "center", padding: 20, borderRadius: 20, gap: 12 },
  ctaTitle: { color: "#fff", fontSize: 20, fontWeight: "800", letterSpacing: -0.3 },
  ctaSub: { color: "rgba(255,255,255,0.85)", fontSize: 12, marginTop: 4 },
  ctaIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  gridRow: { flexDirection: "row", gap: 12 },
  statCard: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 16, borderWidth: 1 },
  statIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  statValue: { fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
  statLabel: { fontSize: 11, fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase" },
  card: { padding: 18, borderRadius: 20, borderWidth: 1 },
  cardTitle: { fontSize: 15, fontWeight: "800" },
  legendRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 14, marginTop: 4 },
  legend: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 10 },
  legendText: { fontSize: 12, fontWeight: "600" },
  sectionTitle: { fontSize: 13, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase", marginTop: 8 },
  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  quick: { flexBasis: "47%", flexGrow: 1, padding: 16, borderRadius: 16, borderWidth: 1, alignItems: "center", gap: 8 },
  quickLabel: { fontSize: 13, fontWeight: "700" },
});
