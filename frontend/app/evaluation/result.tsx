import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, Image, Share, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as Linking from "expo-linking";
import { useTheme } from "@/src/theme/ThemeContext";
import { useToast } from "@/src/components/Toast";
import { ScreenHeader } from "@/src/components/ScreenHeader";
import { HeatTimeline } from "@/src/components/HeatTimeline";
import { stageColors, StageKey } from "@/src/theme";
import { api } from "@/src/api/client";

interface FullEval {
  evaluation: any;
  dog: any;
  user: any;
}

export default function Result() {
  const { theme } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const params = useLocalSearchParams<{ eval_id?: string }>();
  const [data, setData] = useState<FullEval | null>(null);

  const load = useCallback(async () => {
    if (!params.eval_id) return;
    try {
      const d = await api.get<FullEval>(`/evaluations/${params.eval_id}`);
      setData(d);
    } catch (e: any) {
      toast.show(e.message || "Failed to load evaluation", "error");
    }
  }, [params.eval_id, toast]);

  useEffect(() => { load(); }, [load]);

  if (!data) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={theme.navy} />
      </SafeAreaView>
    );
  }

  const ev = data.evaluation;
  const dog = data.dog;
  const user = data.user;
  const result = ev.result || {};
  const stageKey = (result.stage_key as StageKey) || "ANESTRUS";
  const color = stageColors[stageKey] || theme.navy;

  const generateHTML = () => {
    const logo = "https://customer-assets.emergentagent.com/job_453e719f-8513-486c-b1fd-4be9ca8fb67d/artifacts/j7h9vi8t_logo.jpg";
    const today = new Date().toLocaleDateString();
    const reportId = `DBA-${ev.id.slice(0, 8).toUpperCase()}`;
    const inputs = ev.inputs || {};
    let inputRows = "";
    if (ev.type === "cytology") {
      inputRows = `
        <tr><td>PC</td><td>${inputs.pc ?? 0}</td></tr>
        <tr><td>IC</td><td>${inputs.ic ?? 0}</td></tr>
        <tr><td>SIC</td><td>${inputs.sic ?? 0}</td></tr>
        <tr><td>SC</td><td>${inputs.sc ?? 0}</td></tr>
        <tr><td>CC</td><td>${inputs.cc ?? 0}</td></tr>
        <tr><td><b>Cornification Index</b></td><td><b>${result.cornification_index}%</b></td></tr>`;
    } else if (ev.type === "progesterone") {
      inputRows = `<tr><td>Progesterone</td><td>${inputs.value} ng/ml</td></tr>`;
    }
    return `<!doctype html><html><head><meta charset="utf-8"/>
      <style>
        body{font-family:Arial,sans-serif;color:#0F172A;padding:32px;}
        .hdr{display:flex;align-items:center;gap:16px;border-bottom:3px solid ${color};padding-bottom:16px;}
        .logo{width:80px;height:80px;border-radius:12px;}
        h1{margin:0;font-size:24px;color:#0F172A;}
        .tag{color:#64748B;font-size:12px;letter-spacing:3px;margin-top:4px;}
        .meta{margin-top:24px;font-size:13px;color:#334155;line-height:1.6;}
        .stage{background:${color};color:#fff;padding:18px;border-radius:14px;margin:24px 0;}
        .stage h2{margin:0;font-size:26px;}
        .stage p{margin:8px 0 0;opacity:.95;}
        table{width:100%;border-collapse:collapse;margin-top:16px;}
        td{padding:8px;border-bottom:1px solid #E2E8F0;font-size:13px;}
        .section{margin-top:24px;}
        h3{font-size:14px;color:#0F172A;margin-bottom:6px;text-transform:uppercase;letter-spacing:1px;}
        .footer{margin-top:32px;border-top:1px solid #E2E8F0;padding-top:12px;color:#64748B;font-size:11px;text-align:center;}
        .badge{display:inline-block;background:#F1F5F9;padding:4px 10px;border-radius:999px;font-size:11px;margin-right:6px;}
      </style></head><body>
        <div class="hdr">
          <img class="logo" src="${logo}"/>
          <div>
            <h1>Doggy Breeding App</h1>
            <div class="tag">BREED • TRACK • CARE</div>
            <div style="font-size:11px;color:#475569;margin-top:6px;">
              Veterinary College and Research Institute, Namakkal<br/>
              Department of Veterinary Gynaecology and Obstetrics
            </div>
          </div>
        </div>

        <div class="meta">
          <div><b>Report ID:</b> ${reportId}</div>
          <div><b>Date:</b> ${today}</div>
          <div><b>Method:</b> ${ev.type.toUpperCase()}</div>
        </div>

        <div class="section">
          <h3>Patient Information</h3>
          <div class="meta">
            <div><b>Dog:</b> ${dog?.dog_name || "—"} (${dog?.breed || "—"})</div>
            <div><b>Age / Weight:</b> ${dog?.age || "—"} / ${dog?.weight || "—"} kg</div>
            <div><b>Owner:</b> ${dog?.owner_name || "—"}  •  ${dog?.owner_mobile || "—"}</div>
            <div><b>Onset of Proestrus Bleeding:</b> ${dog?.proestrus_bleeding_date || "—"}</div>
          </div>
        </div>

        <div class="stage">
          <h2>${result.stage}</h2>
          <p>${result.interpretation || ""}</p>
          <div style="margin-top:10px;">
            <span class="badge" style="background:rgba(255,255,255,0.25);color:#fff;">Confidence: ${result.confidence}%</span>
            <span class="badge" style="background:rgba(255,255,255,0.25);color:#fff;">${result.breeding_status || ""}</span>
          </div>
        </div>

        <div class="section">
          <h3>Measurements</h3>
          <table>${inputRows}</table>
        </div>

        <div class="section">
          <h3>Recommendation</h3>
          <p style="font-size:13px;line-height:1.6;">${result.recommendation || ""}</p>
        </div>

        <div class="section">
          <h3>Breeding Schedule</h3>
          <table>
            <tr><td>Suggested Mating Date</td><td>${result.suggested_mating_date || "—"}</td></tr>
            <tr><td>Next Evaluation</td><td>${result.next_evaluation_date || result.next_test_date || "—"}</td></tr>
            <tr><td>Expected Whelping</td><td>${result.expected_whelping_date || "—"}</td></tr>
          </table>
        </div>

        <div class="footer">
          Evaluating Veterinarian: <b>Dr. ${user?.name || ""}</b> (${user?.category || ""})<br/>
          ${user?.hospital || ""}  •  ${user?.mobile || ""}<br/>
          Generated by Doggy Breeding App  •  ANIMitra Software  •  +91 99444 72488
        </div>
      </body></html>`;
  };

  const onPDF = async () => {
    try {
      const { uri } = await Print.printToFileAsync({ html: generateHTML() });
      if (Platform.OS === "web") {
        toast.show("PDF generated", "success");
      } else if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { dialogTitle: "Share Report", mimeType: "application/pdf" });
      }
    } catch (e: any) {
      toast.show(e.message || "Failed to generate PDF", "error");
    }
  };

  const onShareWhatsApp = async () => {
    const text = `🐕 Doggy Breeding App Report\n\nDog: ${dog?.dog_name}\nOwner: ${dog?.owner_name}\nStage: ${result.stage} (${result.confidence}% confidence)\n\n${result.recommendation}\n\nSuggested Mating: ${result.suggested_mating_date || "—"}\nExpected Whelping: ${result.expected_whelping_date || "—"}\n\n— Dr. ${user?.name}, ${user?.hospital || user?.category || ""}`;
    try {
      const phone = dog?.owner_mobile?.replace(/[^0-9]/g, "") || "";
      const url = phone ? `whatsapp://send?phone=${phone}&text=${encodeURIComponent(text)}` : `whatsapp://send?text=${encodeURIComponent(text)}`;
      const supported = await Linking.canOpenURL(url);
      if (supported) await Linking.openURL(url);
      else await Share.share({ message: text });
    } catch {
      await Share.share({ message: text });
    }
  };

  const onShare = async () => {
    const text = `${dog?.dog_name} (${dog?.breed}) — ${result.stage}. ${result.recommendation}`;
    await Share.share({ message: text });
  };

  const onDelete = async () => {
    try {
      await api.del(`/evaluations/${ev.id}`);
      toast.show("Evaluation deleted", "success");
      router.replace("/(tabs)/history");
    } catch (e: any) {
      toast.show(e.message || "Failed to delete", "error");
    }
  };

  const stageColor = color;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={["bottom"]}>
      <ScreenHeader title="Evaluation Result" subtitle={dog?.dog_name || ""} />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Stage banner */}
        <View style={[styles.stageBanner, { backgroundColor: stageColor }]}>
          <View style={styles.stageHeader}>
            <Text style={styles.stageLabel}>STAGE</Text>
            <View style={styles.confChip}>
              <Text style={styles.confText}>{result.confidence}%</Text>
            </View>
          </View>
          <Text style={styles.stageTitle}>{result.stage}</Text>
          <Text style={styles.stageBody}>{result.interpretation}</Text>
          {result.breeding_status ? (
            <View style={styles.statusChip}>
              <Ionicons name="ribbon" size={14} color="#fff" />
              <Text style={styles.statusText}>{result.breeding_status}</Text>
            </View>
          ) : null}
        </View>

        {/* Recommendation */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Recommendation</Text>
          <Text style={[styles.body, { color: theme.textMuted }]}>{result.recommendation}</Text>
        </View>

        {/* Heat cycle timeline */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Heat Cycle Timeline</Text>
          <HeatTimeline current={stageKey} theme={theme} />
        </View>

        {/* Schedule */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Breeding Schedule</Text>
          <DateRow theme={theme} icon="heart" label="Suggested Mating" value={result.suggested_mating_date} color={stageColors.ESTRUS} />
          <DateRow theme={theme} icon="calendar" label="Next Evaluation" value={result.next_evaluation_date || result.next_test_date} color={theme.navy} />
          <DateRow theme={theme} icon="paw" label="Expected Whelping" value={result.expected_whelping_date} color={stageColors.LATE_PROESTRUS} />
          {result.ovulation_prediction && (
            <DateRow theme={theme} icon="pulse" label="Ovulation" value={result.ovulation_prediction} color={stageColors.ESTRUS_OVULATION} />
          )}
        </View>

        {/* Cytology details */}
        {ev.type === "cytology" && (
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Cell Counts</Text>
            <View style={{ gap: 6 }}>
              <CellLine theme={theme} label="Parabasal (PC)" value={ev.inputs.pc} color="#3B82F6" />
              <CellLine theme={theme} label="Intermediate (IC)" value={ev.inputs.ic} color="#A855F7" />
              <CellLine theme={theme} label="Small Intermediate (SIC)" value={ev.inputs.sic} color="#F97316" />
              <CellLine theme={theme} label="Superficial (SC)" value={ev.inputs.sc} color="#22C55E" />
              <CellLine theme={theme} label="Cornified (CC)" value={ev.inputs.cc} color="#EF4444" />
              <View style={[styles.ciHighlight, { backgroundColor: stageColor + "22" }]}>
                <Text style={{ color: stageColor, fontWeight: "800", fontSize: 13 }}>Cornification Index (SC+CC)</Text>
                <Text style={{ color: stageColor, fontWeight: "800", fontSize: 18 }}>{result.cornification_index}%</Text>
              </View>
            </View>
          </View>
        )}

        {/* Patient summary */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Patient</Text>
          <View style={{ flexDirection: "row", gap: 12 }}>
            {dog?.photo_base64 ? (
              <Image source={{ uri: dog.photo_base64 }} style={styles.dogImg} />
            ) : (
              <View style={[styles.dogImg, { backgroundColor: theme.inputBg, alignItems: "center", justifyContent: "center" }]}>
                <Ionicons name="paw" size={28} color={theme.textMuted} />
              </View>
            )}
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={[styles.body, { color: theme.text, fontWeight: "700" }]}>{dog?.dog_name} • {dog?.breed || "—"}</Text>
              <Text style={[styles.bodySmall, { color: theme.textMuted }]}>Owner: {dog?.owner_name}</Text>
              <Text style={[styles.bodySmall, { color: theme.textMuted }]}>{dog?.owner_mobile}</Text>
              <Text style={[styles.bodySmall, { color: theme.textMuted }]}>Proestrus onset: {dog?.proestrus_bleeding_date || "—"}</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <ActionBtn testID="result-pdf-button" onPress={onPDF} icon="document-text" label="PDF" theme={theme} primary />
          <ActionBtn testID="result-whatsapp-button" onPress={onShareWhatsApp} icon="logo-whatsapp" label="WhatsApp" theme={theme} color="#25D366" />
          <ActionBtn testID="result-share-button" onPress={onShare} icon="share-social" label="Share" theme={theme} />
        </View>

        <Pressable
          testID="result-delete-button"
          onPress={onDelete}
          style={({ pressed }) => [styles.deleteBtn, { borderColor: theme.border, opacity: pressed ? 0.85 : 1 }]}
        >
          <Ionicons name="trash" size={16} color="#EF4444" />
          <Text style={styles.deleteText}>Delete this evaluation</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function DateRow({ theme, icon, label, value, color }: any) {
  return (
    <View style={styles.dateRow}>
      <View style={[styles.dateIcon, { backgroundColor: color + "22" }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <Text style={[styles.dateLabel, { color: theme.text }]}>{label}</Text>
      <Text style={[styles.dateValue, { color: value ? theme.text : theme.textMuted }]}>{value || "—"}</Text>
    </View>
  );
}

function CellLine({ theme, label, value, color }: any) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 6 }}>
      <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
        <Text style={{ color: theme.text, fontSize: 13 }}>{label}</Text>
      </View>
      <Text style={{ color: theme.text, fontWeight: "800", fontSize: 14 }}>{value ?? 0}</Text>
    </View>
  );
}

function ActionBtn({ icon, label, onPress, theme, primary, color, testID }: any) {
  const bg = primary ? theme.navy : color || theme.card;
  const fg = primary || color ? "#fff" : theme.text;
  return (
    <Pressable testID={testID} onPress={onPress} style={({ pressed }) => [styles.action, { backgroundColor: bg, borderColor: theme.border, opacity: pressed ? 0.85 : 1 }]}>
      <Ionicons name={icon} size={20} color={fg} />
      <Text style={{ color: fg, fontWeight: "800", fontSize: 12 }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, gap: 14, paddingBottom: 60 },
  stageBanner: { padding: 20, borderRadius: 22 },
  stageHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  stageLabel: { color: "rgba(255,255,255,0.85)", fontSize: 11, fontWeight: "800", letterSpacing: 2 },
  confChip: { backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  confText: { color: "#fff", fontWeight: "800", fontSize: 12 },
  stageTitle: { color: "#fff", fontSize: 32, fontWeight: "800", letterSpacing: -1, marginTop: 6 },
  stageBody: { color: "rgba(255,255,255,0.95)", fontSize: 13, marginTop: 8, lineHeight: 20 },
  statusChip: { flexDirection: "row", gap: 6, alignItems: "center", alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, marginTop: 12 },
  statusText: { color: "#fff", fontSize: 12, fontWeight: "800" },
  card: { padding: 16, borderRadius: 18, borderWidth: 1, gap: 8 },
  cardTitle: { fontSize: 13, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase" },
  body: { fontSize: 14, lineHeight: 21 },
  bodySmall: { fontSize: 12 },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 },
  dateIcon: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  dateLabel: { flex: 1, fontSize: 13, fontWeight: "600" },
  dateValue: { fontSize: 13, fontWeight: "800" },
  ciHighlight: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 12, borderRadius: 12, marginTop: 8 },
  dogImg: { width: 80, height: 80, borderRadius: 14 },
  actionsRow: { flexDirection: "row", gap: 10 },
  action: { flex: 1, alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 14, borderRadius: 14, borderWidth: 1 },
  deleteBtn: { flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", paddingVertical: 12, borderRadius: 12, borderWidth: 1, marginTop: 4 },
  deleteText: { color: "#EF4444", fontWeight: "700", fontSize: 13 },
});
