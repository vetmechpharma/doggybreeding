import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { LogBox, StatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { useIconFonts } from "@/src/hooks/use-icon-fonts";
import { ThemeProvider } from "@/src/theme/ThemeContext";
import { AuthProvider } from "@/src/auth/AuthContext";
import { ToastProvider } from "@/src/components/Toast";

LogBox.ignoreAllLogs(true);

// Preserve icon prewarm: keep native splash visible until icon fonts register.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useIconFonts();

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <StatusBar barStyle="light-content" />
              <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }} />
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
