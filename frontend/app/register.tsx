import React, { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/theme/ThemeContext";
import { useAuth } from "@/src/auth/AuthContext";
import { useToast } from "@/src/components/Toast";

const CATEGORIES = ["Doctor", "Student", "Breeder", "Laboratory", "Clinic"] as const;

export default function Register() {
  const { theme } = useTheme();
  const router = useRouter();
  const { user, updateProfile, register } = useAuth();
  const toast = useToast();
  const params = useLocalSearchParams<{ user_id?: string; prefilled?: string }>();
  const isUpdate = Boolean(user?.id && params.user_id);

  const [name, setName] = useState(user?.name === "Veterinarian" ? "" : (user?.name || ""));
  const [mobile, setMobile] = useState(user?.mobile || "");
  const [email, setEmail] = useState(user?.email || "");
  const [hospital, setHospital] = useState(user?.hospital || "");
  const [category, setCategory] = useState<typeof CATEGORIES[number]>((user?.category as any) || "Doctor");
  const [location, setLocation] = useState(user?.location || "");
  const [state, setState] = useState(user?.state || "");
  const [busy, setBusy] = useState(false);

  const valid = useMemo(() => name.trim().length > 1 && mobile.trim().length >= 7, [name, mobile]);

  const submit = async () => {
    if (!valid) {
      toast.show("Please provide Name and Mobile Number.", "error");
      return;
    }
    setBusy(true);
    try {
      const payload = { name: name.trim(), mobile: mobile.trim(), email: email.trim(), hospital: hospital.trim(), category, location: location.trim(), state: state.trim() };
      if (isUpdate) await updateProfile(payload);
      else await register(payload);
      toast.show("Profile saved", "success");
      router.replace("/(tabs)/dashboard");
    } catch (e: any) {
      toast.show(e.message || "Failed to save profile", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={["top", "bottom"]}>
      <View style={[styles.header, { borderBottomColor: theme.border, backgroundColor: theme.bg }]}>
        <Pressable testID="register-back" onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={theme.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Complete Profile</Text>
        <View style={{ width: 26 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={[styles.intro, { color: theme.textMuted }]}>Tell us about yourself so we can personalize your reports.</Text>

          <Field label="Name *" testID="reg-name-input" value={name} onChangeText={setName} placeholder="Full name" theme={theme} />
          <Field label="Mobile Number *" testID="reg-mobile-input" value={mobile} onChangeText={setMobile} placeholder="+91 9xxxxxxxxx" keyboardType="phone-pad" theme={theme} />
          <Field label="Email" testID="reg-email-input" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" theme={theme} />
          <Field label="Hospital / Clinic / Laboratory" testID="reg-hospital-input" value={hospital} onChangeText={setHospital} placeholder="Organization name" theme={theme} />

          <Text style={[styles.label, { color: theme.text }]}>Category *</Text>
          <View style={styles.catRow}>
            {CATEGORIES.map((c) => {
              const selected = c === category;
              return (
                <Pressable
                  key={c}
                  testID={`reg-category-${c.toLowerCase()}`}
                  onPress={() => setCategory(c)}
                  style={[styles.cat, { backgroundColor: selected ? theme.navy : theme.card, borderColor: selected ? theme.navy : theme.border }]}
                >
                  <Text style={{ color: selected ? "#fff" : theme.text, fontWeight: "700", fontSize: 13 }}>{c}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Field label="Location" testID="reg-location-input" value={location} onChangeText={setLocation} placeholder="City / Town" theme={theme} />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="State" testID="reg-state-input" value={state} onChangeText={setState} placeholder="State" theme={theme} />
            </View>
          </View>

          <Pressable
            testID="register-submit-button"
            onPress={submit}
            disabled={busy || !valid}
            style={({ pressed }) => [styles.submit, { backgroundColor: theme.navy, opacity: busy || !valid ? 0.5 : pressed ? 0.85 : 1 }]}
          >
            <Text style={styles.submitText}>{busy ? "Saving…" : "Save & Continue"}</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, value, onChangeText, placeholder, theme, testID, keyboardType }: any) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      <TextInput
        testID={testID}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textMuted}
        keyboardType={keyboardType}
        style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 18, fontWeight: "800" },
  scroll: { padding: 20, gap: 14, paddingBottom: 32 },
  intro: { fontSize: 13, marginBottom: 6 },
  label: { fontSize: 12, fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase" },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  catRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  cat: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, borderWidth: 1 },
  submit: { flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", paddingVertical: 16, borderRadius: 14, marginTop: 16 },
  submitText: { color: "#fff", fontWeight: "800", fontSize: 16 },
});
