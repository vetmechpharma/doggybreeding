import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { useAuth } from "@/src/auth/AuthContext";
import { brand } from "@/src/theme";

const LOGO_URL = "https://customer-assets.emergentagent.com/job_453e719f-8513-486c-b1fd-4be9ca8fb67d/artifacts/j7h9vi8t_logo.jpg";
const SPLASH_DURATION = 5000;

export default function Splash() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const progress = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;
  const [navigated, setNavigated] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(progress, { toValue: 1, duration: SPLASH_DURATION - 200, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
      Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: true }),
    ]).start();
  }, [progress, fade, scale]);

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
        colors={[...brand.splashGradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <View style={styles.bgCircle1} />
        <View style={styles.bgCircle2} />

        <Animated.View style={[styles.center, { opacity: fade, transform: [{ scale }] }]}>
          <BlurView intensity={40} tint="light" style={styles.glassCard}>
            <Image source={{ uri: LOGO_URL }} style={styles.logo} resizeMode="contain" />
            <Text style={styles.appName}>Doggy Breeding App</Text>
            <Text style={styles.tagline}>Breed • Track • Care</Text>

            <View style={styles.divider} />

            <Text style={styles.inst}>Veterinary College and Research Institute</Text>
            <Text style={styles.instSub}>Namakkal</Text>
            <Text style={styles.dept}>Dept. of Veterinary Gynaecology and Obstetrics</Text>

            <View style={styles.barTrack}>
              <Animated.View style={[styles.barFill, { width: barW }]} />
            </View>
            <Text testID="splash-skip-hint" style={styles.skipHint}>Tap anywhere to continue</Text>
          </BlurView>

          <View style={styles.footer}>
            <Text style={styles.guidedBy}>Guided By</Text>
            <Text style={styles.faculty}>Dr R Shreemathi  •  Dr Mridul Sarma  •  Dr S Manokaran</Text>
            <Text style={styles.faculty}>Dr M Palanisamy  •  Dr M Selvaraju</Text>
            <Text style={styles.dev}>Developed by ANIMitra Software</Text>
            <Text style={styles.contact}>+91 99444 72488   •   v1.0.0</Text>
          </View>
        </Animated.View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, overflow: "hidden" },
  bgCircle1: { position: "absolute", width: 360, height: 360, borderRadius: 360, backgroundColor: "rgba(255,255,255,0.12)", top: -80, right: -80 },
  bgCircle2: { position: "absolute", width: 260, height: 260, borderRadius: 260, backgroundColor: "rgba(255,255,255,0.08)", bottom: -60, left: -60 },
  center: { width: "100%", alignItems: "center", gap: 24 },
  glassCard: {
    width: "100%",
    paddingVertical: 28,
    paddingHorizontal: 22,
    borderRadius: 28,
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  logo: { width: 110, height: 110, borderRadius: 22, marginBottom: 12, backgroundColor: "rgba(255,255,255,0.95)" },
  appName: { fontSize: 30, fontWeight: "900", color: "#fff", letterSpacing: -0.5, textAlign: "center" },
  tagline: { fontSize: 15, fontWeight: "800", color: "#fff", marginTop: 6, letterSpacing: 4, textTransform: "uppercase" },
  divider: { width: 70, height: 3, backgroundColor: "rgba(255,255,255,0.7)", borderRadius: 2, marginVertical: 18 },
  inst: { color: "#fff", fontSize: 16, fontWeight: "800", textAlign: "center" },
  instSub: { color: "#fff", fontSize: 14, fontWeight: "700", marginTop: 2 },
  dept: { color: "rgba(255,255,255,0.95)", fontSize: 13, marginTop: 8, textAlign: "center", lineHeight: 18, fontWeight: "600" },
  barTrack: { width: "100%", height: 4, backgroundColor: "rgba(255,255,255,0.25)", borderRadius: 4, marginTop: 22, overflow: "hidden" },
  barFill: { height: 4, backgroundColor: "#fff", borderRadius: 4 },
  skipHint: { color: "rgba(255,255,255,0.85)", fontSize: 11, marginTop: 10, fontWeight: "600", letterSpacing: 0.5 },
  footer: { alignItems: "center", gap: 4 },
  guidedBy: { color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: "800", letterSpacing: 1.8, textTransform: "uppercase" },
  faculty: { color: "#fff", fontSize: 12, opacity: 0.98, textAlign: "center", fontWeight: "600" },
  dev: { color: "#fff", fontSize: 13, fontWeight: "800", marginTop: 6 },
  contact: { color: "rgba(255,255,255,0.95)", fontSize: 12, fontWeight: "600" },
});
