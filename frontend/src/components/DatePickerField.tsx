import React, { useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";

interface Props {
  label: string;
  value: string; // YYYY-MM-DD or ""
  onChange: (v: string) => void;
  placeholder?: string;
  theme: any;
  testID?: string;
  maxToday?: boolean;
}

const fmt = (d: Date) => d.toISOString().slice(0, 10);

export const DatePickerField: React.FC<Props> = ({ label, value, onChange, placeholder = "Select date", theme, testID, maxToday = false }) => {
  const [open, setOpen] = useState(false);
  const initial = value ? new Date(value) : new Date();

  const handleChange = (_event: any, date?: Date) => {
    if (Platform.OS !== "ios") setOpen(false);
    if (date) onChange(fmt(date));
  };

  const display = value || "";

  return (
    <View style={{ gap: 6 }}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      <Pressable
        testID={testID}
        onPress={() => setOpen(true)}
        style={[styles.field, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
      >
        <Ionicons name="calendar" size={18} color={theme.navy} />
        <Text style={[styles.text, { color: display ? theme.text : theme.textMuted }]}>{display || placeholder}</Text>
        {display ? (
          <Pressable hitSlop={10} onPress={(e) => { e.stopPropagation(); onChange(""); }}>
            <Ionicons name="close-circle" size={18} color={theme.textMuted} />
          </Pressable>
        ) : null}
      </Pressable>

      {open && Platform.OS === "android" && (
        <DateTimePicker
          value={initial}
          mode="date"
          onChange={handleChange}
          maximumDate={maxToday ? new Date() : undefined}
        />
      )}

      {open && Platform.OS === "ios" && (
        <Modal transparent animationType="slide" visible={open} onRequestClose={() => setOpen(false)}>
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
            <View />
          </Pressable>
          <View style={[styles.sheet, { backgroundColor: theme.card }]}>
            <View style={styles.sheetHeader}>
              <Pressable onPress={() => setOpen(false)}><Text style={{ color: theme.textMuted, fontSize: 14 }}>Cancel</Text></Pressable>
              <Text style={{ color: theme.text, fontWeight: "800", fontSize: 14 }}>{label}</Text>
              <Pressable onPress={() => setOpen(false)}><Text style={{ color: theme.navy, fontWeight: "800", fontSize: 14 }}>Done</Text></Pressable>
            </View>
            <DateTimePicker
              value={initial}
              mode="date"
              display="spinner"
              onChange={handleChange}
              maximumDate={maxToday ? new Date() : undefined}
            />
          </View>
        </Modal>
      )}

      {open && Platform.OS === "web" && (
        <Modal transparent animationType="fade" visible={open} onRequestClose={() => setOpen(false)}>
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
          <View style={[styles.webPicker, { backgroundColor: theme.card }]}>
            <Text style={{ color: theme.text, fontWeight: "800", marginBottom: 12 }}>{label}</Text>
            <input
              type="date"
              value={value}
              onChange={(e: any) => onChange(e.target.value)}
              max={maxToday ? fmt(new Date()) : undefined}
              style={{ padding: 12, fontSize: 16, borderRadius: 8, border: `1px solid ${theme.border}` }}
            />
            <Pressable onPress={() => setOpen(false)} style={[styles.webDone, { backgroundColor: theme.navy }]}>
              <Text style={{ color: "#fff", fontWeight: "800" }}>Done</Text>
            </Pressable>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  label: { fontSize: 11, fontWeight: "800", letterSpacing: 0.8, textTransform: "uppercase" },
  field: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14 },
  text: { flex: 1, fontSize: 15 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)" },
  sheet: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 16, paddingBottom: 32, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(0,0,0,0.1)" },
  webPicker: { position: "absolute", top: "30%", left: "10%", right: "10%", padding: 20, borderRadius: 16, gap: 12 },
  webDone: { paddingVertical: 12, alignItems: "center", borderRadius: 10, marginTop: 8 },
});
