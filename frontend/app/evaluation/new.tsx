import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/src/theme/ThemeContext";
import { useAuth } from "@/src/auth/AuthContext";
import { useToast } from "@/src/components/Toast";
import { ScreenHeader } from "@/src/components/ScreenHeader";
import { DatePickerField } from "@/src/components/DatePickerField";
import { api } from "@/src/api/client";

export default function NewEvaluation() {
  const { theme } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
  const [dogName, setDogName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerMobile, setOwnerMobile] = useState("");
  const [breed, setBreed] = useState("");
  const [age, setAge] = useState("");
  const [whelping, setWhelping] = useState("");
  const [prevWhelping, setPrevWhelping] = useState("");
  const [proestrusDate, setProestrusDate] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!user) return;
    if (!dogName.trim() || !ownerName.trim() || !ownerMobile.trim()) {
      toast.show("Dog Name, Owner and Owner Mobile are required.", "error");
      return;
    }
    setBusy(true);
    try {
      const dog = await api.post<{ id: string }>("/dogs", {
        user_id: user.id,
        dog_name: dogName.trim(),
        owner_name: ownerName.trim(),
        owner_mobile: ownerMobile.trim(),
        breed: breed.trim(),
        age: age.trim(),
        sex: "Female",
        weight: "",
        whelping_count: Number(whelping) || 0,
        previous_whelping_date: prevWhelping || null,
        proestrus_bleeding_date: proestrusDate || null,
        photo_base64: "",
      });
      router.push({ pathname: "/evaluation/type", params: { dog_id: dog.id, proestrus_date: proestrusDate } });
    } catch (e: any) {
      toast.show(e.message || "Failed to save dog", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={["bottom"]}>
      <ScreenHeader title="New Evaluation" subtitle="Dog & Owner Information" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Field label="Dog Name *" testID="dog-name-input" value={dogName} onChangeText={setDogName} theme={theme} />
          <Field label="Owner Name *" testID="owner-name-input" value={ownerName} onChangeText={setOwnerName} theme={theme} />
          <Field label="Owner Mobile *" testID="owner-mobile-input" value={ownerMobile} onChangeText={setOwnerMobile} keyboardType="phone-pad" theme={theme} />

          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1.5 }}><Field label="Breed" testID="breed-input" value={breed} onChangeText={setBreed} theme={theme} /></View>
            <View style={{ flex: 1 }}><Field label="Age" testID="age-input" value={age} onChangeText={setAge} placeholder="years" theme={theme} /></View>
          </View>

          <Field label="No. of Whelpings" testID="whelping-count-input" value={whelping} onChangeText={setWhelping} keyboardType="number-pad" placeholder="0" theme={theme} />

          <DatePickerField
            testID="prev-whelping-date"
            label="Previous Whelping Date"
            value={prevWhelping}
            onChange={setPrevWhelping}
            placeholder="Tap to pick a date (optional)"
            theme={theme}
            maxToday
          />

          <DatePickerField
            testID="proestrus-bleeding-date"
            label="Onset of Proestrus Bleeding Date"
            value={proestrusDate}
            onChange={setProestrusDate}
            placeholder="Tap to pick a date (optional)"
            theme={theme}
            maxToday
          />

          <Pressable
            testID="new-eval-continue-button"
            onPress={submit}
            disabled={busy}
            style={({ pressed }) => [styles.btn, { backgroundColor: theme.navy, opacity: busy ? 0.6 : pressed ? 0.85 : 1 }]}
          >
            <Text style={styles.btnText}>{busy ? "Saving…" : "Continue"}</Text>
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
  scroll: { padding: 16, gap: 12, paddingBottom: 32 },
  label: { fontSize: 11, fontWeight: "800", letterSpacing: 0.8, textTransform: "uppercase" },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  btn: { flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", paddingVertical: 16, borderRadius: 14, marginTop: 14 },
  btnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
});
