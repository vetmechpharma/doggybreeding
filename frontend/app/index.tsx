import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View, Image, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/src/auth/AuthContext";
import { PatternBackground } from "@/src/components/PatternBackground";

const LOGO_URL = "https://customer-assets.emergentagent.com/job_453e719f-8513-486c-b1fd-4be9ca8fb67d/artifacts/j7h9vi8t_logo.jpg";
const TANUVAS_URL = "https://customer-assets.emergentagent.com/job_canine-cycle/artifacts/365nah86_tanuvas_logo.png";
const SPLASH_DURATION = 6000;

const { height: SCREEN_H } = Dimensions.get("window");
const SHORT = SCREEN_H < 720;

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
      Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: true }),
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
  const logoY = float.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });

  // Scale token — phones < 720px (most pre-modern Android) get tighter sizing
  const LOGO = SHORT ? 130 : 170;
  const TANUVAS = SHORT ? 64 : 78;
  const GAP_LARGE = SHORT ? 10 : 14;
  const GAP_SMALL = SHORT ? 6 : 8;

  return (
    <Pressable testID="splash-screen" onPress={go} style={{ flex: 1 }}>
      <LinearGradient
        colors={["#0F172A", "#1E3A8A", "#6D28D9", "#DB2777"]}
        locations={[0, 0.3, 0.7, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <PatternBackground color="#ffffff" opacity={0.05} />

      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <Animated.View style={[styles.container, { opacity: fade }]}>
          {/* TOP: TANUVAS — compact */}
          <View style={styles.topSection}>
            <Image source={{ uri: TANUVAS_URL }} style={{ width: TANUVAS, height: TANUVAS }} resizeMode="contain" />
            <View style={styles.fundedRow}>
              <View style={styles.leafLine} />
              <Text style={styles.fundedSmall}>FUNDED BY</Text>
              <View style={styles.leafLine} />
            </View>
            <Text style={[styles.fundedBig, SHORT && { fontSize: 24 }]}>TANUVAS</Text>
            <Text style={styles.fundedSub} numberOfLines={2}>TAMIL NADU VETERINARY AND ANIMAL SCIENCES UNIVERSITY</Text>
          </View>

          {/* MIDDLE: Logo + info panel */}
          <View style={[styles.middleSection, { marginTop: GAP_LARGE }]}>
            <Animated.View style={[{ width: LOGO + 24, height: LOGO + 24, alignItems: "center", justifyContent: "center", transform: [{ translateY: logoY }] }]}>
              <LinearGradient
                colors={["rgba(255,255,255,0.95)", "rgba(255,255,255,0.55)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ width: LOGO, height: LOGO, borderRadius: LOGO / 2, padding: 5, alignItems: "center", justifyContent: "center" }}
              >
                <View style={{ flex: 1, width: "100%", borderRadius: LOGO / 2 - 5, overflow: "hidden", backgroundColor: "#fff" }}>
                  <Image source={{ uri: LOGO_URL }} style={{ width: "100%", height: "100%" }} resizeMode="contain" />
                </View>
              </LinearGradient>
              <View style={{ position: "absolute", width: LOGO + 16, height: LOGO + 16, borderRadius: (LOGO + 16) / 2, borderWidth: 1, borderColor: "rgba(255,255,255,0.18)" }} />
            </Animated.View>

            {/* Info panel — compact, no inner boxes */}
            <View style={[styles.infoPanel, { marginTop: GAP_LARGE }]}>
              <Text style={[styles.instTitle, SHORT && { fontSize: 13 }]} numberOfLines={1}>Veterinary College and Research Institute</Text>
              <Text style={styles.instCity}>Namakkal</Text>
              <Text style={styles.instDept} numberOfLines={1}>Department of Veterinary Gynaecology and Obstetrics</Text>

              <View style={[styles.hairline, { marginVertical: GAP_SMALL }]} />

              <View style={styles.guidedLabel}>
                <Ionicons name="ribbon" size={11} color="#FFD700" />
                <Text style={styles.guidedText}>GUIDED BY</Text>
                <Ionicons name="ribbon" size={11} color="#FFD700" />
              </View>
              <Text style={styles.facultyLine}>Dr. R. Shreemathi · Dr. Mridul Sarma · Dr. S. Manokaran</Text>
              <Text style={styles.facultyLine}>Dr. M. Palanisamy · Dr. M. Selvaraju</Text>

              <View style={[styles.hairline, { marginVertical: GAP_SMALL }]} />

              <Text style={styles.devLabel}>Developed by</Text>
              <Text style={[styles.devName, SHORT && { fontSize: 16 }]}>
                <Text style={{ color: "#fff" }}>ANI</Text>
                <Text style={{ color: "#FB923C" }}>Mitra</Text>
                <Text style={{ color: "#fff" }}> Software</Text>
              </Text>
              <Text style={styles.devSub}>A Division of VETMECH Pharmaceuticals Pvt. Ltd.</Text>
              <View style={[styles.contactRow, { marginTop: GAP_SMALL }]}>
                <View style={styles.contactChip}>
                  <Ionicons name="person" size={11} color="#fff" />
                  <Text style={styles.contactText}>Dr. T. Lokesh</Text>
                </View>
                <View style={styles.contactChip}>
                  <Ionicons name="call" size={11} color="#fff" />
                  <Text style={styles.contactText}>+91 99444 72488</Text>
                </View>
              </View>
            </View>
          </View>

          {/* BOTTOM: version + loading + copyright — always visible */}
          <View style={styles.bottomSection}>
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
          </View>
        </Animated.View>
      </SafeAreaView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8, alignItems: "center" },

  topSection: { alignItems: "center" },
  fundedRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  leafLine: { width: 26, height: 1, backgroundColor: "rgba(255,215,0,0.8)" },
  fundedSmall: { color: "rgba(255,215,0,0.95)", fontSize: 10, fontWeight: "900", letterSpacing: 2.5 },
  fundedBig: { color: "#fff", fontSize: 28, fontWeight: "900", letterSpacing: 3, marginTop: 2 },
  fundedSub: { color: "rgba(255,255,255,0.85)", fontSize: 10, fontWeight: "700", letterSpacing: 1.2, marginTop: 3, textAlign: "center" },

  middleSection: { alignItems: "center", width: "100%", flexShrink: 1 },

  infoPanel: { width: "100%", alignItems: "center", paddingHorizontal: 4 },
  instTitle: { color: "#fff", fontSize: 14.5, fontWeight: "800", textAlign: "center", letterSpacing: -0.2 },
  instCity: { color: "#fff", fontSize: 12.5, fontWeight: "700", marginTop: 1 },
  instDept: { color: "rgba(255,255,255,0.85)", fontSize: 11.5, marginTop: 3, textAlign: "center", fontWeight: "500" },

  hairline: { width: "60%", height: StyleSheet.hairlineWidth, backgroundColor: "rgba(255,255,255,0.35)" },

  guidedLabel: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  guidedText: { color: "#FFD700", fontSize: 10, fontWeight: "900", letterSpacing: 2.5 },
  facultyLine: { color: "rgba(255,255,255,0.95)", fontSize: 11, fontWeight: "700", marginTop: 1, textAlign: "center" },

  devLabel: { color: "rgba(255,255,255,0.75)", fontSize: 9.5, fontWeight: "700", letterSpacing: 1.2, textAlign: "center" },
  devName: { fontSize: 17, fontWeight: "900", letterSpacing: -0.3, textAlign: "center", marginTop: 1 },
  devSub: { color: "rgba(255,255,255,0.7)", fontSize: 9.5, fontWeight: "600", marginTop: 2, textAlign: "center" },
  contactRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 6 },
  contactChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.14)", borderWidth: 1, borderColor: "rgba(255,255,255,0.18)" },
  contactText: { color: "#fff", fontSize: 10.5, fontWeight: "700" },

  bottomSection: { marginTop: "auto", alignItems: "center", paddingTop: 10, width: "100%" },
  versionPill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.14)" },
  versionDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#22D3EE" },
  versionText: { color: "#fff", fontSize: 10, fontWeight: "800", letterSpacing: 1 },

  barTrack: { width: 200, height: 4, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 4, overflow: "hidden", marginTop: 10 },
  barFill: { height: 4, borderRadius: 4, overflow: "hidden" },
  loadingText: { color: "rgba(255,255,255,0.9)", fontSize: 10, fontWeight: "800", letterSpacing: 3.5, marginTop: 6 },
  skipHint: { color: "rgba(255,255,255,0.75)", fontSize: 10.5, marginTop: 8, fontWeight: "600" },
  copyright: { color: "rgba(255,255,255,0.6)", fontSize: 9.5, marginTop: 4, fontWeight: "600" },
});
