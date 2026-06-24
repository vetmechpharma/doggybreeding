import React, { useCallback, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/src/theme/ThemeContext";
import { useAuth } from "@/src/auth/AuthContext";
import { api } from "@/src/api/client";
import { stageColors, StageKey } from "@/src/theme";

interface EvalRow {
  id: string;
  type: string;
  created_at: string;
  dog_id: string;
  result: any;
  inputs: any;
}

interface DogLite { id: string; dog_name: string; owner_name: string; breed: string; owner_mobile: string }

export default function History() {
  const { theme } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const [evals, setEvals] = useState<EvalRow[]>([]);
  const [dogs, setDogs] = useState<Record<string, DogLite>>({});
  const [q, setQ] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const [evList, dogList] = await Promise.all([
        api.get<EvalRow[]>(`/evaluations`, { user_id: user.id, q: q || undefined }),
        api.get<DogLite[]>(`/dogs`, { user_id: user.id }),
      ]);
      setEvals(evList);
      const m: Record<string, DogLite> = {};
      dogList.forEach((d) => (m[d.id] = d));
      setDogs(m);
    } catch (e) { /* ignore */ }
  }, [user, q]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const renderItem = ({ item }: { item: EvalRow }) => {
    const dog = dogs[item.dog_id];
    const stageKey = (item.result?.stage_key as StageKey) || "ANESTRUS";
    const color = stageColors[stageKey] || theme.navy;
    const dt = new Date(item.created_at);
    return (
      <Pressable
        testID={`history-row-${item.id}`}
        onPress={() => router.push({ pathname: "/evaluation/result", params: { eval_id: item.id } })}
        style={({ pressed }) => [styles.row, { backgroundColor: theme.card, borderColor: theme.border, opacity: pressed ? 0.85 : 1 }]}
      >
        <View style={[styles.dot, { backgroundColor: color }]} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.dogName, { color: theme.text }]} numberOfLines={1}>{dog?.dog_name || "Dog"}  •  {dog?.breed || "—"}</Text>
          <Text style={[styles.owner, { color: theme.textMuted }]} numberOfLines={1}>
            {dog?.owner_name || "—"}  •  {dog?.owner_mobile || "—"}
          </Text>
          <View style={styles.metaRow}>
            <View style={[styles.chip, { backgroundColor: color + "22" }]}>
              <Text style={[styles.chipText, { color }]}>{item.result?.stage || stageKey}</Text>
            </View>
            <Text style={[styles.date, { color: theme.textMuted }]}>{dt.toLocaleDateString()}</Text>
            <Text style={[styles.type, { color: theme.textMuted }]}>{item.type.toUpperCase()}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={["top"]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.text }]}>History</Text>
        <Text style={[styles.sub, { color: theme.textMuted }]}>All previous evaluations</Text>
        <View style={[styles.searchBox, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
          <Ionicons name="search" size={18} color={theme.textMuted} />
          <TextInput
            testID="history-search-input"
            value={q}
            onChangeText={setQ}
            onSubmitEditing={load}
            placeholder="Search owner, dog, breed, mobile…"
            placeholderTextColor={theme.textMuted}
            style={{ flex: 1, color: theme.text, fontSize: 14 }}
            returnKeyType="search"
          />
          {q.length > 0 && (
            <Pressable onPress={() => { setQ(""); }}>
              <Ionicons name="close-circle" size={18} color={theme.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      <FlatList
        data={evals}
        keyExtractor={(e) => e.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="folder-open-outline" size={56} color={theme.textMuted} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No evaluations yet</Text>
            <Text style={[styles.emptySub, { color: theme.textMuted }]}>Tap New Evaluation on the dashboard to begin.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14, borderBottomWidth: 1, gap: 8 },
  title: { fontSize: 24, fontWeight: "800", letterSpacing: -0.5 },
  sub: { fontSize: 12 },
  searchBox: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, marginTop: 6 },
  list: { padding: 16, paddingBottom: 80 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  dot: { width: 6, height: 56, borderRadius: 6 },
  dogName: { fontSize: 15, fontWeight: "800" },
  owner: { fontSize: 12, marginTop: 2 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  chip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  chipText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5, textTransform: "uppercase" },
  date: { fontSize: 11 },
  type: { fontSize: 10, fontWeight: "700", letterSpacing: 0.8 },
  empty: { alignItems: "center", marginTop: 60, gap: 8, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 16, fontWeight: "800", marginTop: 8 },
  emptySub: { fontSize: 13, textAlign: "center" },
});
