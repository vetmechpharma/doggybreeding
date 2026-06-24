import React, { useState } from "react";
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/src/theme/ThemeContext";
import { useAuth } from "@/src/auth/AuthContext";
import { useToast } from "@/src/components/Toast";
import { brand } from "@/src/theme";

const LOGO_URL = "https://customer-assets.emergentagent.com/job_453e719f-8513-486c-b1fd-4be9ca8fb67d/artifacts/j7h9vi8t_logo.jpg";

const GOOGLE_CONFIGURED = Boolean(
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
  process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ||
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
);

export default function Login() {
  const { theme } = useTheme();
  const router = useRouter();
  const { loginGoogleStub } = useAuth();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const handleGoogle = async () => {
    if (!GOOGLE_CONFIGURED) {
      toast.show("Google Sign-In not configured. Add OAuth client IDs to .env. Use 'Continue without Google' for now.", "info");
      return;
    }
    // Real Google flow would call useAuthRequest here. For dev placeholder we
    // can't proceed without keys.
    toast.show("Google sign-in flow ready — add client IDs in .env to enable.", "info");
  };

  const handleQuickStart = async () => {
    setBusy(true);
    try {
      // Use Google stub: create a synthetic Google user that backend upserts.
      const gid = `quick-${Date.now()}`;
      const u = await loginGoogleStub({ google_id: gid, name: "Veterinarian", email: "", photo_url: "" });
      // Force registration flow to capture profile
      router.replace({ pathname: "/register", params: { user_id: u.id, prefilled: "1" } });
    } catch (e: any) {
      toast.show(e.message || "Failed to continue", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <LinearGradient colors={[...brand.splashGradient]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <View style={styles.brandWrap}>
              <Image source={{ uri: LOGO_URL }} style={styles.logo} resizeMode="contain" />
              <Text style={styles.title}>Doggy Breeding App</Text>
              <Text style={styles.tagline}>BREED  •  TRACK  •  CARE</Text>
            </View>

            <View style={[styles.card, { backgroundColor: theme.card }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Sign in to continue</Text>
              <Text style={[styles.cardSub, { color: theme.textMuted }]}>Professional canine reproductive evaluation</Text>

              <Pressable
                testID="google-sign-in-button"
                onPress={handleGoogle}
                style={({ pressed }) => [styles.googleBtn, { opacity: GOOGLE_CONFIGURED ? (pressed ? 0.85 : 1) : 0.55 }]}
              >
                <Ionicons name="logo-google" size={20} color="#fff" />
                <Text style={styles.googleText}>Sign in with Google</Text>
              </Pressable>

              {!GOOGLE_CONFIGURED && (
                <Text style={styles.helper}>
                  Add EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID to .env to enable Google sign-in.
                </Text>
              )}

              <View style={styles.dividerRow}>
                <View style={[styles.line, { backgroundColor: theme.border }]} />
                <Text style={[styles.or, { color: theme.textMuted }]}>OR</Text>
                <View style={[styles.line, { backgroundColor: theme.border }]} />
              </View>

              <Pressable
                testID="continue-without-google-button"
                onPress={handleQuickStart}
                disabled={busy}
                style={({ pressed }) => [styles.primaryBtn, { backgroundColor: theme.navy, opacity: pressed || busy ? 0.85 : 1 }]}
              >
                <Text style={styles.primaryText}>{busy ? "Setting up…" : "Continue without Google"}</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </Pressable>

              <Text style={[styles.fineprint, { color: theme.textMuted }]}>
                By continuing, you agree to use this app for veterinary, educational and breeding purposes only.
              </Text>
            </View>

            <Text style={styles.footer}>ANIMitra Software  •  +91 99444 72488</Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 24, paddingTop: 48, paddingBottom: 32, gap: 24 },
  brandWrap: { alignItems: "center", gap: 8 },
  logo: { width: 100, height: 100, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.95)" },
  title: { color: "#fff", fontSize: 26, fontWeight: "800", marginTop: 8, letterSpacing: -0.5 },
  tagline: { color: "rgba(255,255,255,0.9)", fontSize: 11, letterSpacing: 4, fontWeight: "700" },
  card: { padding: 24, borderRadius: 24, gap: 14 },
  cardTitle: { fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
  cardSub: { fontSize: 13, fontWeight: "500", marginBottom: 8 },
  googleBtn: { flexDirection: "row", gap: 10, alignItems: "center", justifyContent: "center", backgroundColor: "#0F172A", paddingVertical: 14, borderRadius: 12 },
  googleText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  helper: { fontSize: 11, color: "#94A3B8", textAlign: "center", marginTop: -4 },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 4 },
  line: { flex: 1, height: 1 },
  or: { fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  primaryBtn: { flexDirection: "row", gap: 10, alignItems: "center", justifyContent: "center", paddingVertical: 14, borderRadius: 12 },
  primaryText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  fineprint: { fontSize: 11, textAlign: "center", marginTop: 8, lineHeight: 16 },
  footer: { color: "rgba(255,255,255,0.85)", fontSize: 12, textAlign: "center", marginTop: 8 },
});
