import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/src/theme/ThemeContext";

export const ScreenHeader: React.FC<{ title: string; subtitle?: string; right?: React.ReactNode; back?: boolean }>
  = ({ title, subtitle, right, back = true }) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  // Always reserve at least the status-bar height even when insets report 0
  // (edge-to-edge on some Android devices initially returns 0 before measure).
  const top = Math.max(insets.top, 12);
  return (
    <View style={[styles.wrap, { paddingTop: top + 8, backgroundColor: theme.bg, borderBottomColor: theme.border }]}>
      <View style={styles.row}>
        {back ? (
          <Pressable testID="screen-back-button" onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={26} color={theme.text} />
          </Pressable>
        ) : <View style={{ width: 26 }} />}
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>{title}</Text>
          {subtitle ? <Text style={[styles.sub, { color: theme.textMuted }]} numberOfLines={1}>{subtitle}</Text> : null}
        </View>
        <View style={{ minWidth: 26, alignItems: "flex-end" }}>{right}</View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  backBtn: { width: 26 },
  title: { fontSize: 17, fontWeight: "800", letterSpacing: -0.3 },
  sub: { fontSize: 11, marginTop: 2 },
});
