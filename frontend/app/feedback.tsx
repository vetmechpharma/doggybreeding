import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/src/theme/ThemeContext";
import { useAuth } from "@/src/auth/AuthContext";
import { useToast } from "@/src/components/Toast";
import { ScreenHeader } from "@/src/components/ScreenHeader";
import { api } from "@/src/api/client";

export default function FeedbackScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      await api.post("/feedback", { user_id: user?.id || null, rating, comments: comments.trim() });
      toast.show("Thanks for the feedback!", "success");
      router.back();
    } catch (e: any) {
      toast.show(e.message || "Failed to send", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={["bottom"]}>
      <ScreenHeader title="Feedback" subtitle="Help us improve" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={[styles.label, { color: theme.text }]}>How would you rate the app?</Text>
          <View style={styles.starRow}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Pressable key={i} testID={`star-${i}`} onPress={() => setRating(i)}>
                <Ionicons name={i <= rating ? "star" : "star-outline"} size={36} color={i <= rating ? "#EAB308" : theme.textMuted} />
              </Pressable>
            ))}
          </View>

          <Text style={[styles.label, { color: theme.text, marginTop: 12 }]}>Comments</Text>
          <TextInput
            testID="feedback-comments-input"
            value={comments}
            onChangeText={setComments}
            placeholder="Tell us what worked, what didn't, and what you'd love next…"
            placeholderTextColor={theme.textMuted}
            multiline
            numberOfLines={6}
            style={[styles.area, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
          />

          <Pressable
            testID="feedback-submit-button"
            onPress={submit}
            disabled={busy}
            style={({ pressed }) => [styles.btn, { backgroundColor: theme.navy, opacity: busy ? 0.6 : pressed ? 0.85 : 1 }]}
          >
            <Text style={styles.btnText}>{busy ? "Sending…" : "Submit Feedback"}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, gap: 12, paddingBottom: 32 },
  label: { fontSize: 13, fontWeight: "800", letterSpacing: 0.5 },
  starRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 8, marginTop: 8 },
  area: { borderWidth: 1, borderRadius: 14, padding: 14, fontSize: 14, minHeight: 140, textAlignVertical: "top" },
  btn: { alignItems: "center", justifyContent: "center", paddingVertical: 16, borderRadius: 14, marginTop: 16 },
  btnText: { color: "#fff", fontWeight: "800", fontSize: 15 },
});
