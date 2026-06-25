import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/src/auth/AuthContext";
import { useToast } from "@/src/components/Toast";
import { PatternBackground } from "@/src/components/PatternBackground";

const LOGO_URL = "https://customer-assets.emergentagent.com/job_453e719f-8513-486c-b1fd-4be9ca8fb67d/artifacts/j7h9vi8t_logo.jpg";

const GOOGLE_CONFIGURED = Boolean(
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
  process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ||
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
);

const FEATURE_CHIPS: { icon: keyof typeof Ionicons.glyphMap; label: string; color: string }[] = [
  { icon: "telescope", label: "Cytology", color: "#A78BFA" },
  { icon: "flask", label: "Progesterone", color: "#34D399" },
  { icon: "pulse", label: "Heat Cycle", color: "#F472B6" },
  { icon: "document-text", label: "PDF Reports", color: "#FBBF24" },
];

export default function Login() {
  const router = useRouter();
  const { loginGoogleStub } = useAuth();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(40)).current;
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: 1, duration: 2400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 2400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    ).start();
  }, [fade, slide, float]);

  const logoY = float.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });

  const handleGoogle = async () => {
    if (!GOOGLE_CONFIGURED) {
      toast.show("Google Sign-In not configured. Use Continue without Google for now.", "info");
      return;
    }
    toast.show("Google sign-in ready — add client IDs in .env to enable.", "info");
  };

  const handleQuickStart = async () => {
    setBusy(true);
    try {
      const gid = `quick-${Date.now()}`;
      const u = await loginGoogleStub({ google_id: gid, name: "Veterinarian", email: "", photo_url: "" });
      router.replace({ pathname: "/register", params: { user_id: u.id, prefilled: "1" } });
    } catch (e: any) {
      toast.show(e.message || "Failed to continue", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={["#0F172A", "#1E3A8A", "#6D28D9", "#DB2777"]}
        locations={[0, 0.3, 0.7, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <PatternBackground color="#ffffff" opacity={0.05} />

      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            {/* Hero with floating logo */}
            <Animated.View style={[styles.hero, { opacity: fade, transform: [{ translateY: slide }] }]}>
              <Animated.View style={[styles.logoFrame, { transform: [{ translateY: logoY }] }]}>
                <LinearGradient
                  colors={["rgba(255,255,255,0.9)", "rgba(255,255,255,0.55)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.logoRing}
                >
                  <View style={styles.logoInner}>
                    <Image source={{ uri: LOGO_URL }} style={styles.logoImg} resizeMode="contain" />
                  </View>
                </LinearGradient>
                <View style={styles.logoGlow} />
              </Animated.View>

              <Text style={styles.brand}>Doggy Breeding App</Text>
              <View style={styles.taglineRow}>
                <View style={styles.tagDot} /><Text style={styles.tag}>BREED</Text>
                <View style={styles.tagDot} /><Text style={styles.tag}>TRACK</Text>
                <View style={styles.tagDot} /><Text style={styles.tag}>CARE</Text>
              </View>
            </Animated.View>

            {/* Feature chips — single horizontal row */}
            <Animated.View style={[styles.chipRow, { opacity: fade }]}>
              {FEATURE_CHIPS.map((f) => (
                <View key={f.label} style={styles.chip}>
                  <View style={[styles.chipDot, { backgroundColor: f.color }]}>
                    <Ionicons name={f.icon} size={14} color="#fff" />
                  </View>
                  <Text style={styles.chipText}>{f.label}</Text>
                </View>
              ))}
            </Animated.View>

            {/* Auth panel (single, glassy, no inner card boxes) */}
            <Animated.View style={[styles.authPanel, { opacity: fade, transform: [{ translateY: slide }] }]}>
              <Text style={styles.authTitle}>Welcome</Text>
              <Text style={styles.authSub}>Sign in to begin canine reproductive evaluations</Text>

              <Pressable
                testID="google-sign-in-button"
                onPress={handleGoogle}
                style={({ pressed }) => [styles.googleBtn, { opacity: GOOGLE_CONFIGURED ? (pressed ? 0.85 : 1) : 0.55 }]}
              >
                <View style={styles.googleIconWrap}>
                  <Ionicons name="logo-google" size={18} color="#0F172A" />
                </View>
                <Text style={styles.googleText}>Sign in with Google</Text>
              </Pressable>

              {!GOOGLE_CONFIGURED && (
                <Text style={styles.helper}>Add EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID to .env to enable</Text>
              )}

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.or}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              <Pressable
                testID="continue-without-google-button"
                onPress={handleQuickStart}
                disabled={busy}
                style={({ pressed }) => [styles.primaryBtn, { opacity: busy ? 0.6 : pressed ? 0.85 : 1 }]}
              >
                <LinearGradient
                  colors={["#FB7185", "#F472B6", "#A78BFA"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.primaryGradient}
                >
                  <Text style={styles.primaryText}>{busy ? "Setting up…" : "Continue without Google"}</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </LinearGradient>
              </Pressable>

              <Text style={styles.fineprint}>
                By continuing, you agree to use this app for veterinary, educational and breeding purposes only.
              </Text>
            </Animated.View>

            <Text style={styles.footer}>ANIMitra Software  •  +91 99444 72488</Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 24, paddingTop: 24, paddingBottom: 32, gap: 22, minHeight: "100%" },

  // Hero
  hero: { alignItems: "center", marginTop: 12 },
  logoFrame: { width: 150, height: 150, alignItems: "center", justifyContent: "center" },
  logoRing: { width: 134, height: 134, borderRadius: 67, padding: 5, alignItems: "center", justifyContent: "center" },
  logoInner: { flex: 1, width: "100%", borderRadius: 64, overflow: "hidden", backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  logoImg: { width: "100%", height: "100%" },
  logoGlow: { position: "absolute", width: 168, height: 168, borderRadius: 168, borderWidth: 1, borderColor: "rgba(255,255,255,0.25)" },

  brand: { color: "#fff", fontSize: 26, fontWeight: "900", letterSpacing: -0.5, marginTop: 14, textAlign: "center" },
  taglineRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  tagDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.65)" },
  tag: { color: "#fff", fontSize: 11, fontWeight: "800", letterSpacing: 3 },

  // Feature chips
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" },
  chip: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.12)", borderWidth: 1, borderColor: "rgba(255,255,255,0.18)" },
  chipDot: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  chipText: { color: "#fff", fontSize: 11, fontWeight: "700" },

  // Auth panel — single glass panel, no inner cards
  authPanel: {
    backgroundColor: "rgba(255,255,255,0.10)",
    borderColor: "rgba(255,255,255,0.20)",
    borderWidth: 1,
    borderRadius: 26,
    padding: 22,
    gap: 14,
  },
  authTitle: { color: "#fff", fontSize: 24, fontWeight: "900", letterSpacing: -0.5 },
  authSub: { color: "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: "500", marginTop: -8, marginBottom: 6 },

  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fff",
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  googleIconWrap: { width: 26, height: 26, borderRadius: 13, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center" },
  googleText: { color: "#0F172A", fontWeight: "800", fontSize: 15, flex: 1, textAlign: "center", marginRight: 26 },
  helper: { fontSize: 11, color: "rgba(255,255,255,0.7)", textAlign: "center", marginTop: -8 },

  dividerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.2)" },
  or: { color: "rgba(255,255,255,0.75)", fontSize: 11, fontWeight: "800", letterSpacing: 1.5 },

  primaryBtn: { borderRadius: 14, overflow: "hidden" },
  primaryGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 14 },
  primaryText: { color: "#fff", fontWeight: "800", fontSize: 15 },

  fineprint: { fontSize: 11, color: "rgba(255,255,255,0.7)", textAlign: "center", lineHeight: 16, marginTop: 4 },

  footer: { color: "rgba(255,255,255,0.7)", fontSize: 11, textAlign: "center", fontWeight: "600" },
});
