import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { stageColors, stageLabels, stageOrder, StageKey } from "@/src/theme";

export const HeatTimeline: React.FC<{ current: StageKey | null; theme: any; compact?: boolean }>
  = ({ current, theme, compact = false }) => {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.row, compact && { paddingVertical: 4 }]}>
      {stageOrder.map((s, i) => {
        const active = s === current || (current === "ESTRUS_OVULATION" && s === "ESTRUS");
        const color = stageColors[s];
        return (
          <View key={s} style={styles.item}>
            <View style={[styles.dot, { backgroundColor: active ? color : theme.border, transform: [{ scale: active ? 1.2 : 1 }] }]}>
              {active && <View style={[styles.dotInner, { backgroundColor: "#fff" }]} />}
            </View>
            <Text style={[styles.label, { color: active ? theme.text : theme.textMuted, fontWeight: active ? "800" : "600" }]} numberOfLines={2}>
              {stageLabels[s].split(" ").map((w, idx) => <Text key={idx}>{w}{"\n"}</Text>)}
            </Text>
            {i < stageOrder.length - 1 && (
              <View style={[styles.arrow, { backgroundColor: theme.border }]}>
                <Ionicons name="chevron-forward" size={14} color={theme.textMuted} style={{ position: "absolute", right: -8, top: -7 }} />
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  row: { paddingVertical: 12, paddingHorizontal: 8, gap: 0, alignItems: "center" },
  item: { alignItems: "center", flexDirection: "row" },
  dot: { width: 28, height: 28, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  dotInner: { width: 8, height: 8, borderRadius: 8 },
  label: { fontSize: 10, marginHorizontal: 8, textAlign: "center", maxWidth: 60 },
  arrow: { width: 24, height: 2, marginHorizontal: 4 },
});
