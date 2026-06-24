import React, { useMemo, useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Props {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  theme: any;
  testID?: string;
}

export const SelectField: React.FC<Props> = ({ label, value, onChange, options, placeholder = "Select", theme, testID }) => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const ql = q.toLowerCase();
    return ql ? options.filter((o) => o.toLowerCase().includes(ql)) : options;
  }, [q, options]);

  return (
    <View style={{ gap: 6 }}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      <Pressable
        testID={testID}
        onPress={() => { setOpen(true); setQ(""); }}
        style={[styles.field, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
      >
        <Text style={[styles.text, { color: value ? theme.text : theme.textMuted }]}>{value || placeholder}</Text>
        <Ionicons name="chevron-down" size={18} color={theme.textMuted} />
      </Pressable>

      <Modal transparent animationType="fade" visible={open} onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <View style={[styles.sheet, { backgroundColor: theme.card }]}>
          <View style={styles.sheetHeader}>
            <Text style={{ color: theme.text, fontWeight: "800", fontSize: 15 }}>{label}</Text>
            <Pressable onPress={() => setOpen(false)} hitSlop={10}>
              <Ionicons name="close" size={22} color={theme.text} />
            </Pressable>
          </View>
          <View style={[styles.searchBox, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
            <Ionicons name="search" size={16} color={theme.textMuted} />
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder="Search…"
              placeholderTextColor={theme.textMuted}
              style={{ flex: 1, color: theme.text, fontSize: 14 }}
            />
          </View>
          <FlatList
            data={filtered}
            keyExtractor={(o) => o}
            style={{ maxHeight: 380 }}
            renderItem={({ item }) => {
              const selected = item === value;
              return (
                <Pressable
                  testID={`${testID}-option-${item.toLowerCase().replace(/\s+/g, "-")}`}
                  onPress={() => { onChange(item); setOpen(false); }}
                  style={({ pressed }) => [styles.opt, { backgroundColor: selected ? theme.navy + "15" : pressed ? theme.inputBg : "transparent" }]}
                >
                  <Text style={{ color: theme.text, fontWeight: selected ? "800" : "500", fontSize: 14, flex: 1 }}>{item}</Text>
                  {selected && <Ionicons name="checkmark" size={18} color={theme.navy} />}
                </Pressable>
              );
            }}
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  label: { fontSize: 11, fontWeight: "800", letterSpacing: 0.8, textTransform: "uppercase" },
  field: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14 },
  text: { fontSize: 15 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.5)" },
  sheet: { position: "absolute", left: 16, right: 16, top: "15%", bottom: "10%", borderRadius: 18, padding: 16 },
  sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  searchBox: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, marginBottom: 8 },
  opt: { paddingVertical: 14, paddingHorizontal: 10, borderRadius: 10 },
});
