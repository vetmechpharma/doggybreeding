import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ToastCtx {
  show: (msg: string, type?: "info" | "success" | "error") => void;
}
const Ctx = createContext<ToastCtx | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const insets = useSafeAreaInsets();
  const [msg, setMsg] = useState<string>("");
  const [type, setType] = useState<"info" | "success" | "error">("info");
  const opacity = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((m: string, t: "info" | "success" | "error" = "info") => {
    setMsg(m);
    setType(t);
    Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }).start();
    }, 2400);
  }, [opacity]);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const bg = type === "success" ? "#16A34A" : type === "error" ? "#DC2626" : "#0F172A";

  return (
    <Ctx.Provider value={{ show }}>
      {children}
      <Animated.View
        testID="toast"
        style={[styles.wrap, { opacity, top: insets.top + 16, backgroundColor: bg, pointerEvents: "none" }]}
      >
        <Text style={styles.text}>{msg}</Text>
      </Animated.View>
    </Ctx.Provider>
  );
};

export const useToast = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useToast must be used inside ToastProvider");
  return c;
};

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 16,
    right: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    zIndex: 9999,
  },
  text: { color: "#fff", fontWeight: "600", fontSize: 14 },
});
