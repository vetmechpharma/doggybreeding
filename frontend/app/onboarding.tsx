import React, { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/src/theme/ThemeContext";
import { useAuth } from "@/src/auth/AuthContext";
import { useToast } from "@/src/components/Toast";

const LOGO_URL = "https://customer-assets.emergentagent.com/job_453e719f-8513-486c-b1fd-4be9ca8fb67d/artifacts/j7h9vi8t_logo.jpg";

const CATEGORIES = [
  { key: "Doctor", icon: "medkit", label: "Veterinarian" },
  { key: "Clinic", icon: "business", label: "Clinic" },
  { key: "Institution", icon: "school", label: "Institution" },
  { key: "Student", icon: "book", label: "Student" },
] as const;

export default function Onboarding() {
  const { theme } = useTheme();
  const router = useRouter();
  const { user, register } = useAuth();
  const toast = useToast();

  const isEditing = !!(user?.name && user?.mobile && user.name !== "Veterinarian");

  const [category, setCategory] = useState<string>(user?.category || "Doctor");
  const [name, setName] = useState<string>(user?.name && user.name !== "Veterinarian" ? user.name : "");
  const [mobile, setMobile] = useState<string>(user?.mobile || "");
  const [hospital, setHospital] = useState<string>(user?.hospital || "");
  const [location, setLocation] = useState<string>(user?.location || "");
  const [busy, setBusy] = useState(false);

  const nameLabel = useMemo(() => {
    switch (category) {
      case "Clinic":
        return "Clinic Name";
      case "Institution":
        return "Institution / College Name";
      case "Student":
        return "Your Full Name";
      default:
        return "Doctor Name";
    }
  }, [category]);

  const hospitalLabel = useMemo(() => {
    switch (category) {
      case "Clinic":
        return "Address / Location (optional)";
      case "Institution":
        return "Department (optional)";
      case "Student":
        return "College / University (optional)";
      default:
        return "Clinic / Hospital Name (optional)";
    }
  }, [category]);

  const submit = async () => {
    if (!name.trim()) {
      toast.show(`${nameLabel} is required.`, "error");
      return;
    }
    const cleanMobile = mobile.replace(/\D/g, "");
    if (cleanMobile.length < 7) {
      toast.show("Enter a valid mobile number.", "error");
      return;
    }
    setBusy(true);
    try {
      await register({
        name: name.trim(),
        mobile: cleanMobile,
        category,
        hospital: hospital.trim(),
        location: location.trim(),
      });
      toast.show(isEditing ? "Profile updated" : "Welcome!", "success");
      router.replace("/(tabs)/dashboard");
    } catch (e: any) {
      toast.show(e?.message || "Failed to save profile", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={["top", "bottom"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Image source={{ uri: LOGO_URL }} style={styles.logo} />
            <Text style={[styles.title, { color: theme.text }]}>
              {isEditing ? "Edit Your Profile" : "Welcome!"}
            </Text>
            <Text style={[styles.sub, { color: theme.textMuted }]}>
              {isEditing
                ? "Update your details anytime."
                : "Tell us who you are — this appears on every WhatsApp report & PDF you share with pet owners."}
            </Text>
          </View>

          {/* Category chips */}
          <Text style={[styles.section, { color: theme.textMuted }]}>I am a</Text>
          <View style={styles.chipRow}>
            {CATEGORIES.map((c) => {
              const active = category === c.key;
              return (
                <Pressable
                  key={c.key}
                  testID={`onboarding-cat-${c.key.toLowerCase()}`}
                  onPress={() => setCategory(c.key)}
                  style={({ pressed }) => [
                    styles.chip,
                    {
                      backgroundColor: active ? theme.navy : theme.card,
                      borderColor: active ? theme.navy : theme.border,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <Ionicons name={c.icon as any} size={16} color={active ? "#fff" : theme.text} />
                  <Text style={[styles.chipText, { color: active ? "#fff" : theme.text }]}>{c.label}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Fields */}
          <View style={{ gap: 12, marginTop: 6 }}>
            <Field
              testID="onboarding-name-input"
              label={`${nameLabel} *`}
              value={name}
              onChangeText={setName}
              placeholder={nameLabel}
              theme={theme}
            />
            <Field
              testID="onboarding-mobile-input"
              label="Mobile Number *"
              value={mobile}
              onChangeText={setMobile}
              placeholder="10-digit mobile number"
              theme={theme}
              keyboardType="phone-pad"
            />
            <Field
              testID="onboarding-hospital-input"
              label={hospitalLabel}
              value={hospital}
              onChangeText={setHospital}
              placeholder={hospitalLabel.replace(" (optional)", "")}
              theme={theme}
            />
            <Field
              testID="onboarding-location-input"
              label="City / Location (optional)"
              value={location}
              onChangeText={setLocation}
              placeholder="e.g., Namakkal, Tamil Nadu"
              theme={theme}
            />
          </View>

          <View style={[styles.privacy, { borderColor: theme.border, backgroundColor: theme.card }]}>
            <Ionicons name="shield-checkmark" size={16} color={theme.navy} />
            <Text style={[styles.privacyText, { color: theme.textMuted }]}>
              Stored only on this device. Used in report headers, PDFs and WhatsApp messages you share.
            </Text>
          </View>

          <Pressable
            testID="onboarding-continue-button"
            onPress={submit}
            disabled={busy}
            style={({ pressed }) => [styles.btn, { backgroundColor: theme.navy, opacity: busy ? 0.6 : pressed ? 0.85 : 1 }]}
          >
            <Text style={styles.btnText}>{busy ? "Saving…" : isEditing ? "Save Changes" : "Continue"}</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </Pressable>

          {isEditing && (
            <Pressable
              testID="onboarding-cancel-button"
              onPress={() => router.back()}
              style={({ pressed }) => [styles.cancel, { opacity: pressed ? 0.6 : 1 }]}
            >
              <Text style={[styles.cancelText, { color: theme.textMuted }]}>Cancel</Text>
            </Pressable>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, value, onChangeText, placeholder, theme, keyboardType, testID }: any) {
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
  scroll: { padding: 20, gap: 14, paddingBottom: 40 },
  header: { alignItems: "center", gap: 8, marginTop: 8, marginBottom: 4 },
  logo: { width: 76, height: 76, borderRadius: 20, backgroundColor: "#fff" },
  title: { fontSize: 26, fontWeight: "800", letterSpacing: -0.5, textAlign: "center", marginTop: 8 },
  sub: { fontSize: 13, lineHeight: 20, textAlign: "center", paddingHorizontal: 12 },

  section: { fontSize: 11, fontWeight: "800", letterSpacing: 1.2, textTransform: "uppercase", marginTop: 6 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: "700" },

  label: { fontSize: 11, fontWeight: "800", letterSpacing: 0.8, textTransform: "uppercase" },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },

  privacy: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 12, borderWidth: 1, marginTop: 4 },
  privacyText: { flex: 1, fontSize: 11.5, lineHeight: 17 },

  btn: { flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", paddingVertical: 16, borderRadius: 14, marginTop: 10 },
  btnText: { color: "#fff", fontWeight: "800", fontSize: 16 },

  cancel: { alignItems: "center", justifyContent: "center", paddingVertical: 12 },
  cancelText: { fontSize: 13, fontWeight: "700" },
});
