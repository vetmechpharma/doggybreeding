import React, { useState } from "react";
import { KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/src/theme/ThemeContext";
import { useAuth } from "@/src/auth/AuthContext";
import { useToast } from "@/src/components/Toast";
import { ScreenHeader } from "@/src/components/ScreenHeader";

// Feedback is delivered directly via WhatsApp to the app support number.
// No backend / cloud sync — a simple deep-link that opens WhatsApp with the
// message prefilled.
const SUPPORT_WHATSAPP = "919488709436"; // +91 94887 09436

export default function FeedbackScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState("");
  const [busy, setBusy] = useState(false);

  const buildMessage = () => {
    const stars = "★".repeat(rating) + "☆".repeat(5 - rating);
    const from = user?.name ? `From: ${user.name}${user.mobile ? ` (${user.mobile})` : ""}${user.hospital ? ` — ${user.hospital}` : ""}` : "From: Anonymous user";
    return `🐕 *Doggy Breeding App Feedback*\n\n${from}\nRating: ${stars} (${rating}/5)\n\nComments:\n${comments.trim() || "—"}`;
  };

  const submit = async () => {
    setBusy(true);
    try {
      const text = buildMessage();
      const url = `whatsapp://send?phone=${SUPPORT_WHATSAPP}&text=${encodeURIComponent(text)}`;
      const webUrl = `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(text)}`;
      let opened = false;
      try {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
          opened = true;
        }
      } catch {
        /* fallthrough */
      }
      if (!opened) {
        try {
          await Linking.openURL(webUrl);
          opened = true;
        } catch {
          /* fallthrough */
        }
      }
      if (!opened) {
        // Final fallback — native share sheet
        await Share.share({ message: text });
      }
      toast.show("Opening WhatsApp…", "success");
      // give WhatsApp a moment to launch before popping the screen
      setTimeout(() => router.back(), 400);
    } catch (e: any) {
      toast.show(e?.message || "Failed to open WhatsApp", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={["bottom"]}>
      <ScreenHeader title="Feedback" subtitle="Share your feedback via WhatsApp" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={[styles.hint, { backgroundColor: "#25D36620", borderColor: "#25D366" }]}>
            <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
            <Text style={[styles.hintText, { color: theme.text }]}>
              Tap “Share via WhatsApp” — your message will open in WhatsApp with the app team’s number pre-filled.
            </Text>
          </View>

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
            style={({ pressed }) => [styles.btn, { backgroundColor: "#25D366", opacity: busy ? 0.6 : pressed ? 0.85 : 1 }]}
          >
            <Ionicons name="logo-whatsapp" size={18} color="#fff" />
            <Text style={styles.btnText}>{busy ? "Opening…" : "Share via WhatsApp"}</Text>
          </Pressable>

          <Text style={[styles.contactHint, { color: theme.textMuted }]}>Delivered to +91 94887 09436</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, gap: 12, paddingBottom: 32 },
  hint: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 12, borderWidth: 1 },
  hintText: { flex: 1, fontSize: 12, lineHeight: 18, fontWeight: "600" },
  label: { fontSize: 13, fontWeight: "800", letterSpacing: 0.5 },
  starRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 8, marginTop: 8 },
  area: { borderWidth: 1, borderRadius: 14, padding: 14, fontSize: 14, minHeight: 140, textAlignVertical: "top" },
  btn: { flexDirection: "row", gap: 10, alignItems: "center", justifyContent: "center", paddingVertical: 16, borderRadius: 14, marginTop: 16 },
  btnText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  contactHint: { fontSize: 11, textAlign: "center", marginTop: 10, fontWeight: "600", letterSpacing: 0.4 },
});
