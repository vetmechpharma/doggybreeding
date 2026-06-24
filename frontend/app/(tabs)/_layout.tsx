import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/src/theme/ThemeContext";

export default function TabsLayout() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.navy,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.border,
          paddingTop: 6,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          height: 60 + (insets.bottom > 0 ? insets.bottom : 8),
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700" },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color, size }) => <Ionicons name="time" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="learning"
        options={{
          title: "Learn",
          tabBarIcon: ({ color, size }) => <Ionicons name="library" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => <Ionicons name="settings" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
