import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/src/auth/AuthContext";

const LOGO_URL = "https://customer-assets.emergentagent.com/job_453e719f-8513-486c-b1fd-4be9ca8fb67d/artifacts/j7h9vi8t_logo.jpg";
const TANUVAS_URL = "https://customer-assets.emergentagent.com/job_canine-cycle/artifacts/365nah86_tanuvas_logo.png";
const SPLASH_DURATION = 6000;

export default function Splash() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const progress = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const [navigated, setNavigated] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(progress, { toValue: 1, duration: SPLASH_DURATION - 200, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
      Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [progress, fade]);

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

  return (
    <Pressable testID="splash-screen" onPress={go} style={{ flex: 1 }}>
      <LinearGradient
        colors={["#1E3A8A", "#6D28D9", "#DB2777"]}
        locations={[0, 0.55, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        {/* Decorative bg blobs */}
        <View style={styles.blob1} />
        <View style={styles.blob2} />
        <View style={styles.blob3} />

        <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <Animated.View style={{ opacity: fade, alignItems: "center", width: "100%" }}>
              {/* TANUVAS Funding banner */}
              <Image source={{ uri: TANUVAS_URL }} style={styles.tanuvasSeal} resizeMode="contain" />
              <View style={styles.fundedBanner}>
                <Ionicons name="leaf" size={14} color="#FFD700" style={{ transform: [{ rotate: "-30deg" }] }} />
                <Text style={styles.fundedSmall}>FUNDED BY</Text>
                <Ionicons name="leaf" size={14} color="#FFD700" style={{ transform: [{ rotate: "30deg" }, { scaleX: -1 }] }} />
              </View>
              <Text style={styles.fundedBig}>TANUVAS</Text>
              <Text style={styles.fundedSub}>TAMIL NADU VETERINARY AND</Text>
              <Text style={styles.fundedSub}>ANIMAL SCIENCES UNIVERSITY</Text>

              {/* Doggy logo + wordmark */}
              <Image source={{ uri: LOGO_URL }} style={styles.doggyLogo} resizeMode="contain" />

              {/* Institution card */}
              <Card>
                <View style={styles.cardRow}>
                  <View style={styles.cardIcon}>
                    <Ionicons name="business" size={22} color="#4338CA" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>Veterinary College and Research Institute</Text>
                    <Text style={styles.cardSub}>Namakkal</Text>
                    <Text style={styles.cardDept}>Department of Veterinary{"\n"}Gynaecology and Obstetrics</Text>
                  </View>
                </View>
              </Card>

              {/* Guided By card */}
              <View style={styles.guidedHeader}>
                <View style={styles.guidedPill}>
                  <Text style={styles.guidedPillText}>GUIDED BY</Text>
                </View>
              </View>
              <Card>
                <View style={styles.facultyGrid}>
                  <Text style={styles.facultyName}>Dr. R. Shreemathi</Text>
                  <Text style={styles.facultySep}>|</Text>
                  <Text style={styles.facultyName}>Dr. Mridul Sarma</Text>
                  <Text style={styles.facultySep}>|</Text>
                  <Text style={styles.facultyName}>Dr. S. Manokaran</Text>
                </View>
                <View style={[styles.facultyGrid, { marginTop: 6 }]}>
                  <Text style={styles.facultyName}>Dr. M. Palanisamy</Text>
                  <Text style={styles.facultySep}>|</Text>
                  <Text style={styles.facultyName}>Dr. M. Selvaraju</Text>
                </View>
              </Card>

              {/* Developer / Contact card */}
              <Card>
                <View style={styles.devRow}>
                  <View style={[styles.devSide, { borderRightWidth: 1, borderRightColor: "rgba(0,0,0,0.08)", paddingRight: 12 }]}>
                    <View style={styles.devLogoBadge}>
                      <Text style={styles.devLogoA}>A</Text>
                    </View>
                    <Text style={styles.devLabel}>Developed by</Text>
                    <Text style={styles.devName}>
                      <Text style={{ color: "#1E3A8A" }}>ANI</Text>
                      <Text style={{ color: "#F97316" }}>Mitra</Text>
                      <Text style={{ color: "#1E3A8A" }}> Software</Text>
                    </Text>
                    <Text style={styles.devTagline}>(A Division of VETMECH PHARMACEUTICALS PRIVATE LIMITED)</Text>
                  </View>
                  <View style={styles.devSide}>
                    <View style={styles.contactRow}>
                      <View style={[styles.contactIcon, { backgroundColor: "#6366F1" }]}>
                        <Ionicons name="person" size={14} color="#fff" />
                      </View>
                      <Text style={styles.contactText}>Dr. T. Lokesh</Text>
                    </View>
                    <View style={[styles.contactRow, { marginTop: 8 }]}>
                      <View style={[styles.contactIcon, { backgroundColor: "#EC4899" }]}>
                        <Ionicons name="call" size={14} color="#fff" />
                      </View>
                      <Text style={styles.contactText}>+91 99444 72488</Text>
                    </View>
                  </View>
                </View>
              </Card>

              {/* Version pill */}
              <View style={styles.versionPill}>
                <Text style={styles.versionText}>Version 1.0.0</Text>
              </View>

              {/* Loading */}
              <Text style={styles.loadingText}>L O A D I N G ...</Text>
              <View style={styles.barTrack}>
                <Animated.View style={[styles.barFill, { width: barW }]}>
                  <LinearGradient
                    colors={["#A78BFA", "#F472B6", "#fff"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ flex: 1, borderRadius: 4 }}
                  />
                </Animated.View>
              </View>

              <Text testID="splash-skip-hint" style={styles.skipHint}>Tap anywhere to continue</Text>
              <Text style={styles.copyright}>© 2025 All Rights Reserved</Text>
            </Animated.View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </Pressable>
  );
}

const Card: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <View style={styles.card}>{children}</View>
);

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 24, alignItems: "center" },

  // Decorative blobs
  blob1: { position: "absolute", width: 320, height: 320, borderRadius: 320, backgroundColor: "rgba(255,255,255,0.06)", top: -80, right: -80 },
  blob2: { position: "absolute", width: 260, height: 260, borderRadius: 260, backgroundColor: "rgba(255,255,255,0.05)", bottom: 80, left: -60 },
  blob3: { position: "absolute", width: 180, height: 180, borderRadius: 180, backgroundColor: "rgba(255,255,255,0.04)", top: 200, left: -40 },

  // TANUVAS
  tanuvasSeal: { width: 96, height: 96, marginTop: 4 },
  fundedBanner: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  fundedSmall: { color: "#fff", fontSize: 11, fontWeight: "800", letterSpacing: 2 },
  fundedBig: { color: "#fff", fontSize: 32, fontWeight: "900", letterSpacing: 3, marginTop: 2, textShadowColor: "rgba(0,0,0,0.3)", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  fundedSub: { color: "#fff", fontSize: 11, fontWeight: "800", letterSpacing: 1.2, marginTop: 2 },

  // Doggy logo
  doggyLogo: { width: 240, height: 240, marginTop: 18, backgroundColor: "transparent" },

  // Cards (glass)
  card: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 14,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  cardIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#EDE9FE", alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: 14, fontWeight: "800", color: "#1E3A8A", letterSpacing: -0.2 },
  cardSub: { fontSize: 13, fontWeight: "800", color: "#1E3A8A", marginTop: 2 },
  cardDept: { fontSize: 12, color: "#475569", marginTop: 4, lineHeight: 16, fontWeight: "600" },

  // Guided By
  guidedHeader: { marginTop: 14, alignItems: "center" },
  guidedPill: { backgroundColor: "rgba(255,255,255,0.92)", paddingHorizontal: 22, paddingVertical: 7, borderRadius: 999 },
  guidedPillText: { color: "#4338CA", fontSize: 12, fontWeight: "900", letterSpacing: 2 },
  facultyGrid: { flexDirection: "row", justifyContent: "center", alignItems: "center", flexWrap: "wrap", gap: 4 },
  facultyName: { color: "#1E3A8A", fontWeight: "700", fontSize: 12 },
  facultySep: { color: "#94A3B8", marginHorizontal: 4 },

  // Developer card
  devRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  devSide: { flex: 1 },
  devLogoBadge: { width: 36, height: 36, borderRadius: 8, backgroundColor: "#fff", borderWidth: 2, borderColor: "#1E3A8A", alignItems: "center", justifyContent: "center", marginBottom: 4 },
  devLogoA: { color: "#1E3A8A", fontSize: 22, fontWeight: "900", letterSpacing: -1 },
  devLabel: { color: "#475569", fontSize: 11, fontWeight: "600" },
  devName: { fontSize: 15, fontWeight: "900", letterSpacing: -0.3 },
  devTagline: { fontSize: 8.5, color: "#64748B", marginTop: 3, fontWeight: "700", lineHeight: 11 },
  contactRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  contactIcon: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  contactText: { color: "#1E3A8A", fontWeight: "800", fontSize: 12 },

  // Version + loading
  versionPill: { marginTop: 14, backgroundColor: "rgba(255,255,255,0.18)", borderColor: "rgba(255,255,255,0.5)", borderWidth: 1, paddingHorizontal: 18, paddingVertical: 5, borderRadius: 999 },
  versionText: { color: "#fff", fontWeight: "800", fontSize: 11, letterSpacing: 1.2 },
  loadingText: { color: "#fff", fontSize: 13, fontWeight: "900", letterSpacing: 4, marginTop: 14 },
  barTrack: { width: "70%", height: 6, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 6, overflow: "hidden", marginTop: 8 },
  barFill: { height: 6, borderRadius: 6, overflow: "hidden" },
  skipHint: { color: "rgba(255,255,255,0.9)", fontSize: 11, marginTop: 10, fontWeight: "600", letterSpacing: 0.5 },
  copyright: { color: "rgba(255,255,255,0.75)", fontSize: 10, marginTop: 6, fontWeight: "600" },
});
