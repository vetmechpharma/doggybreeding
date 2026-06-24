import React from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/src/theme/ThemeContext";
import { useAuth } from "@/src/auth/AuthContext";

export default function Settings() {
  const { theme, mode, setMode, isDark } = useTheme();
  const router = useRouter();
  const { user, logout } = useAuth();

  const Row = ({ icon, label, value, onPress, right, testID }: any) => (
    <Pressable testID={testID} onPress={onPress} style={({ pressed }) => [styles.row, { backgroundColor: theme.card, borderColor: theme.border, opacity: pressed ? 0.85 : 1 }]}>
      <View style={[styles.iconWrap, { backgroundColor: theme.inputBg }]}>
        <Ionicons name={icon} size={18} color={theme.navy} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
        {value ? <Text style={[styles.value, { color: theme.textMuted }]}>{value}</Text> : null}
      </View>
      {right ?? <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />}
    </Pressable>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.title, { color: theme.text }]}>Settings</Text>

        {user && (
          <View style={[styles.profile, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.avatar, { backgroundColor: theme.navy }]}>
              <Text style={{ color: "#fff", fontWeight: "800", fontSize: 20 }}>{(user.name || "U")[0].toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, { color: theme.text }]}>{user.name}</Text>
              <Text style={[styles.role, { color: theme.textMuted }]}>{user.category}  •  {user.hospital || "—"}</Text>
              <Text style={[styles.role, { color: theme.textMuted }]}>{user.mobile}</Text>
            </View>
            <Pressable testID="edit-profile-button" onPress={() => router.push("/register")}>
              <Ionicons name="create-outline" size={22} color={theme.navy} />
            </Pressable>
          </View>
        )}

        <Text style={[styles.section, { color: theme.textMuted }]}>Appearance</Text>
        <View style={[styles.row, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.iconWrap, { backgroundColor: theme.inputBg }]}>
            <Ionicons name="moon" size={18} color={theme.navy} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: theme.text }]}>Dark Mode</Text>
            <Text style={[styles.value, { color: theme.textMuted }]}>{mode === "system" ? "Follows system" : mode}</Text>
          </View>
          <Switch
            testID="dark-mode-switch"
            value={isDark}
            onValueChange={(v) => setMode(v ? "dark" : "light")}
            trackColor={{ false: theme.border, true: theme.navy }}
          />
        </View>

        <Text style={[styles.section, { color: theme.textMuted }]}>Data</Text>
        <Row icon="cloud-upload" label="Sync to Cloud" value="Auto-sync when online" testID="sync-row" />
        <Row icon="download" label="Backup" value="Export evaluations" testID="backup-row" />

        <Text style={[styles.section, { color: theme.textMuted }]}>App</Text>
        <Row icon="star" label="Feedback" onPress={() => router.push("/feedback")} testID="feedback-row" />
        <Row icon="information-circle" label="About" onPress={() => router.push("/about")} testID="about-row" />

        <Pressable
          testID="logout-button"
          onPress={async () => { await logout(); router.replace("/login"); }}
          style={({ pressed }) => [styles.logout, { borderColor: theme.border, opacity: pressed ? 0.85 : 1 }]}
        >
          <Ionicons name="log-out" size={18} color="#EF4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>

        <Text style={[styles.footer, { color: theme.textMuted }]}>Doggy Breeding App  •  v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, gap: 10, paddingBottom: 80 },
  title: { fontSize: 24, fontWeight: "800", marginBottom: 8 },
  profile: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: 18, borderWidth: 1 },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  name: { fontSize: 16, fontWeight: "800" },
  role: { fontSize: 12, marginTop: 2 },
  section: { fontSize: 11, fontWeight: "800", letterSpacing: 1.2, textTransform: "uppercase", marginTop: 16, marginBottom: 2 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  iconWrap: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  label: { fontSize: 14, fontWeight: "700" },
  value: { fontSize: 11, marginTop: 2 },
  logout: { flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", paddingVertical: 14, borderRadius: 14, borderWidth: 1, marginTop: 20 },
  logoutText: { color: "#EF4444", fontWeight: "800" },
  footer: { textAlign: "center", marginTop: 20, fontSize: 11 },
});
