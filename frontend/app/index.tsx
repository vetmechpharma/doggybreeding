import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/src/auth/AuthContext";
import { PatternBackground } from "@/src/components/PatternBackground";

const LOGO_URL = "https://customer-assets.emergentagent.com/job_453e719f-8513-486c-b1fd-4be9ca8fb67d/artifacts/j7h9vi8t_logo.jpg";
const TANUVAS_URL = "https://customer-assets.emergentagent.com/job_canine-cycle/artifacts/365nah86_tanuvas_logo.png";
const SPLASH_DURATION = 6000;

export default function Splash() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const progress = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;
  const [navigated, setNavigated] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(progress, { toValue: 1, duration: SPLASH_DURATION - 200, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
      Animated.timing(fade, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    ).start();
  }, [progress, fade, float]);

  const go = () => {
    if (navigated || loading) return;
    setNavigated(true);
    if (user) router.replace("/(tabs)/dashboard");
    else router.replace("/login");
  };

  useEffect(() => {
    if (loading) return;
    const t = setTimeout(go, SPLASH_DURATION);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user]);

  const barW = progress.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });
  const logoY = float.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });

  return (
    <Pressable testID="splash-screen" onPress={go} style={{ flex: 1 }}>
      <LinearGradient
        colors={["#0F172A", "#1E3A8A", "#6D28D9", "#DB2777"]}
        locations={[0, 0.3, 0.7, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        <PatternBackground color="#ffffff" opacity={0.05} />

        <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <Animated.View style={{ opacity: fade, alignItems: "center", width: "100%" }}>
              {/* TANUVAS — minimal, no card */}
              <View style={styles.topRow}>
                <Image source={{ uri: TANUVAS_URL }} style={styles.tanuvasSeal} resizeMode="contain" />
              </View>
              <View style={styles.fundedRow}>
                <View style={styles.leafLine} />
                <Text style={styles.fundedSmall}>FUNDED BY</Text>
                <View style={styles.leafLine} />
              </View>
              <Text style={styles.fundedBig}>TANUVAS</Text>
              <Text style={styles.fundedSub}>TAMIL NADU VETERINARY AND ANIMAL SCIENCES UNIVERSITY</Text>

              {/* Logo with circular gradient frame so the white bg looks intentional */}
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
                {/* Glow */}
                <View style={styles.glow1} />
                <View style={styles.glow2} />
              </Animated.View>

              {/* Single unified info panel — no multiple cards */}
              <View style={styles.infoPanel}>
                <Text style={styles.instTitle}>Veterinary College and Research Institute</Text>
                <Text style={styles.instCity}>Namakkal</Text>
                <Text style={styles.instDept}>Department of Veterinary Gynaecology and Obstetrics</Text>

                <View style={styles.hairline} />

                <View style={styles.guidedLabel}>
                  <Ionicons name="ribbon" size={11} color="#FFD700" />
                  <Text style={styles.guidedText}>GUIDED BY</Text>
                  <Ionicons name="ribbon" size={11} color="#FFD700" />
                </View>
                <Text style={styles.facultyLine}>
                  Dr. R. Shreemathi  ·  Dr. Mridul Sarma  ·  Dr. S. Manokaran
                </Text>
                <Text style={styles.facultyLine}>
                  Dr. M. Palanisamy  ·  Dr. M. Selvaraju
                </Text>

                <View style={styles.hairline} />

                <View style={styles.devRow}>
                  <View>
                    <Text style={styles.devLabel}>Developed by</Text>
                    <Text style={styles.devName}>
                      <Text style={{ color: "#fff" }}>ANI</Text>
                      <Text style={{ color: "#FB923C" }}>Mitra</Text>
                      <Text style={{ color: "#fff" }}> Software</Text>
                    </Text>
                    <Text style={styles.devSub}>A Division of VETMECH Pharmaceuticals Pvt. Ltd.</Text>
                  </View>
                </View>
                <View style={styles.contactRow}>
                  <View style={styles.contactChip}>
                    <Ionicons name="person" size={12} color="#fff" />
                    <Text style={styles.contactText}>Dr. T. Lokesh</Text>
                  </View>
                  <View style={styles.contactChip}>
                    <Ionicons name="call" size={12} color="#fff" />
                    <Text style={styles.contactText}>+91 99444 72488</Text>
                  </View>
                </View>
              </View>

              {/* Version + loading */}
              <View style={styles.versionPill}>
                <View style={styles.versionDot} />
                <Text style={styles.versionText}>Version 1.0.0</Text>
              </View>

              <View style={styles.barTrack}>
                <Animated.View style={[styles.barFill, { width: barW }]}>
                  <LinearGradient
                    colors={["#A78BFA", "#F472B6", "#FFFFFF"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ flex: 1 }}
                  />
                </Animated.View>
              </View>
              <Text style={styles.loadingText}>L O A D I N G . . .</Text>

              <Text testID="splash-skip-hint" style={styles.skipHint}>Tap anywhere to continue</Text>
              <Text style={styles.copyright}>© 2025 All Rights Reserved</Text>
            </Animated.View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 24, paddingVertical: 16, alignItems: "center" },

  // TANUVAS
  topRow: { alignItems: "center", marginTop: 4 },
  tanuvasSeal: { width: 88, height: 88, marginBottom: 4 },
  fundedRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 },
  leafLine: { width: 30, height: 1, backgroundColor: "rgba(255,215,0,0.8)" },
  fundedSmall: { color: "rgba(255,215,0,0.95)", fontSize: 10, fontWeight: "900", letterSpacing: 3 },
  fundedBig: { color: "#fff", fontSize: 30, fontWeight: "900", letterSpacing: 4, marginTop: 2 },
  fundedSub: { color: "rgba(255,255,255,0.85)", fontSize: 10, fontWeight: "700", letterSpacing: 1.4, marginTop: 4, textAlign: "center", paddingHorizontal: 12 },

  // Logo with framed circle
  logoFrame: { marginTop: 22, alignItems: "center", justifyContent: "center", width: 220, height: 220 },
  logoRing: {
    width: 200,
    height: 200,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
  },
  logoInner: {
    flex: 1,
    width: "100%",
    borderRadius: 96,
    overflow: "hidden",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  logoImg: { width: "100%", height: "100%" },
  glow1: { position: "absolute", width: 240, height: 240, borderRadius: 240, borderWidth: 1, borderColor: "rgba(255,255,255,0.25)" },
  glow2: { position: "absolute", width: 270, height: 270, borderRadius: 270, borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" },

  // Info panel (no inner cards)
  infoPanel: {
    width: "100%",
    marginTop: 28,
    paddingHorizontal: 6,
    alignItems: "center",
  },
  instTitle: { color: "#fff", fontSize: 15, fontWeight: "800", textAlign: "center", letterSpacing: -0.2 },
  instCity: { color: "#fff", fontSize: 13, fontWeight: "700", marginTop: 2 },
  instDept: { color: "rgba(255,255,255,0.85)", fontSize: 12, marginTop: 4, textAlign: "center", lineHeight: 17, fontWeight: "500" },
  hairline: { width: "60%", height: StyleSheet.hairlineWidth, backgroundColor: "rgba(255,255,255,0.4)", marginVertical: 14 },

  guidedLabel: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  guidedText: { color: "#FFD700", fontSize: 10, fontWeight: "900", letterSpacing: 3 },
  facultyLine: { color: "rgba(255,255,255,0.95)", fontSize: 11.5, fontWeight: "700", marginTop: 2, textAlign: "center" },

  devRow: { alignItems: "center" },
  devLabel: { color: "rgba(255,255,255,0.75)", fontSize: 10, fontWeight: "700", letterSpacing: 1.4, textAlign: "center" },
  devName: { fontSize: 18, fontWeight: "900", letterSpacing: -0.3, textAlign: "center", marginTop: 3 },
  devSub: { color: "rgba(255,255,255,0.75)", fontSize: 10, fontWeight: "600", marginTop: 3, textAlign: "center" },
  contactRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8, marginTop: 10 },
  contactChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.14)", borderWidth: 1, borderColor: "rgba(255,255,255,0.18)" },
  contactText: { color: "#fff", fontSize: 11, fontWeight: "700" },

  // Version + loading
  versionPill: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 18, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.14)" },
  versionDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#22D3EE" },
  versionText: { color: "#fff", fontSize: 10, fontWeight: "800", letterSpacing: 1 },

  barTrack: { width: 220, height: 4, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 4, overflow: "hidden", marginTop: 14 },
  barFill: { height: 4, borderRadius: 4, overflow: "hidden" },
  loadingText: { color: "rgba(255,255,255,0.9)", fontSize: 11, fontWeight: "800", letterSpacing: 4, marginTop: 8 },

  skipHint: { color: "rgba(255,255,255,0.75)", fontSize: 11, marginTop: 14, fontWeight: "600" },
  copyright: { color: "rgba(255,255,255,0.6)", fontSize: 9.5, marginTop: 6, fontWeight: "600" },
});
