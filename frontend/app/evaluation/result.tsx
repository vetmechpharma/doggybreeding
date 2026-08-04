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
import { api } from "@/src/api/client"; void api;
import { localDB } from "@/src/lib/offline";
import { useAuth } from "@/src/auth/AuthContext";

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

  const { user } = useAuth();
  const load = useCallback(async () => {
    if (!params.eval_id) return;
    try {
      const evaluation = await localDB.getEval(params.eval_id);
      if (!evaluation) throw new Error("Evaluation not found");
      const dog = await localDB.getDog(evaluation.dog_id);
      setData({ evaluation, dog, user });
    } catch (e: any) {
      toast.show(e.message || "Failed to load evaluation", "error");
    }
  }, [params.eval_id, toast, user]);

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
  const evalUser = data.user || user;
  const result = ev.result || {};
  const stageKey = (result.stage_key as StageKey) || "ANESTRUS";
  const color = stageColors[stageKey] || theme.navy;

  const generateHTML = () => {
    const logo = "https://customer-assets.emergentagent.com/job_453e719f-8513-486c-b1fd-4be9ca8fb67d/artifacts/j7h9vi8t_logo.jpg";
    const today = new Date().toLocaleDateString();
    const reportId = `DBG-${ev.id.slice(0, 8).toUpperCase()}`;
    const inputs = ev.inputs || {};

    // Stage-specific suggestions/care tips (rendered as bullets).
    const SUGGESTIONS: Record<string, string[]> = {
      ANESTRUS: [
        "Maintain balanced nutrition and regular exercise.",
        "Track prior heat dates; expect next proestrus in 4–7 months.",
        "Recheck cytology when vulvar bleeding starts.",
      ],
      EARLY_PROESTRUS: [
        "Keep female indoors — bleeding will continue 5–10 days.",
        "Do NOT introduce the stud yet; female is not receptive.",
        "Repeat cytology in 3–4 days.",
      ],
      MID_PROESTRUS: [
        "Cornification is progressing — repeat cytology in 2–3 days.",
        "Prepare the stud and mating environment.",
        "Consider a progesterone assay to pinpoint the LH surge.",
      ],
      LATE_PROESTRUS: [
        "Repeat cytology in 24–48 hours — estrus is imminent.",
        "Introduce the stud briefly for teasing; expect receptivity within 1–2 days.",
        "Progesterone assay recommended to confirm LH surge.",
      ],
      ESTRUS: [
        "Optimal breeding window — mate today and repeat in 48 hours.",
        "For AI, inseminate within 24–48 hours of the LH surge.",
        "Confirm pregnancy with ultrasound 21–25 days after mating.",
      ],
      ESTRUS_OVULATION: [
        "Peak fertility — inseminate now or within 24–48 hours.",
        "Repeat mating/AI 48 hours later to maximise conception rate.",
        "Schedule ultrasound at 25–30 days post-ovulation.",
      ],
      DIESTRUS: [
        "If bred, schedule ultrasound at 25–30 days post-mating.",
        "Provide gestational nutrition and calm environment.",
        "If not bred, next cycle expected in ~4–7 months.",
      ],
    };
    const suggestions = SUGGESTIONS[stageKey] || SUGGESTIONS.ANESTRUS;
    const suggestionsHtml = suggestions.map((s) => `<li>${s}</li>`).join("");

    let inputRows = "";
    if (ev.type === "cytology") {
      const flex = inputs._mode === "flex";
      const fmtRow = (name: string, count: any, pct: any) =>
        flex
          ? `<tr><td>${name}</td><td>${count ?? 0} cells</td><td><b>${(pct ?? 0).toFixed(1)}%</b></td></tr>`
          : `<tr><td>${name}</td><td>${count ?? 0}%</td></tr>`;
      const header = flex
        ? `<tr><th>Cell Type</th><th>Count</th><th>%</th></tr><tr><td colspan="3" style="text-align:right;font-weight:700;padding:2px 8px;font-size:10px;color:#64748B"><i>Total counted: ${inputs.total_cells ?? 0} cells</i></td></tr>`
        : `<tr><th>Cell Type</th><th>Value</th></tr>`;
      inputRows = header +
        fmtRow("Parabasal Cells (PC)", inputs.pc, inputs.pct_pc) +
        fmtRow("Intermediate Cells (IC)", inputs.ic, inputs.pct_ic) +
        fmtRow("Superficial Intermediate Cells (SIC)", inputs.sic, inputs.pct_sic) +
        fmtRow("Superficial Cells (SC)", inputs.sc, inputs.pct_sc) +
        fmtRow("Cornified Cells (CC)", inputs.cc, inputs.pct_cc) +
        `<tr><td${flex ? ' colspan="2"' : ''} style="background:#F1F5F9"><b>Cornification Index</b></td><td style="background:#F1F5F9"><b>${result.cornification_index}%</b></td></tr>`;
    } else if (ev.type === "progesterone") {
      inputRows =
        `<tr><th>Parameter</th><th>Value</th></tr>` +
        `<tr><td>Serum Progesterone (P₄)</td><td><b>${inputs.value} ng/ml</b></td></tr>`;
    }

    const senderName = `${evalUser?.category === "Doctor" || evalUser?.category === "Student" ? "Dr. " : ""}${evalUser?.name || ""}`;

    return `<!doctype html><html><head><meta charset="utf-8"/>
      <style>
        @page { size: A4; margin: 12mm; }
        * { box-sizing: border-box; }
        html, body { margin:0; padding:0; }
        body { font-family: 'Helvetica Neue', Arial, sans-serif; color:#0F172A; font-size:11px; line-height:1.4; }
        .wrap { padding: 0; }

        /* Header */
        .hdr { display:flex; align-items:center; gap:14px; border-bottom:3px solid ${color}; padding-bottom:10px; }
        .logo { width:60px; height:60px; border-radius:10px; object-fit:cover; }
        .brand h1 { margin:0; font-size:20px; color:${color}; letter-spacing:-0.3px; }
        .brand .tag { color:#64748B; font-size:10px; letter-spacing:2.5px; margin-top:2px; font-weight:700; }
        .brand .inst { font-size:9.5px; color:#475569; margin-top:4px; line-height:1.35; }
        .hdr .rid { margin-left:auto; text-align:right; font-size:9.5px; color:#334155; line-height:1.5; }
        .hdr .rid .idbox { display:inline-block; background:${color}; color:#fff; padding:3px 8px; border-radius:6px; font-weight:800; letter-spacing:0.5px; }

        /* Two-column mid section */
        .row { display:flex; gap:10px; margin-top:10px; }
        .col { flex:1; }
        h3 { margin:0 0 5px; font-size:10px; text-transform:uppercase; letter-spacing:1.2px; color:${color}; border-bottom:1px solid #E2E8F0; padding-bottom:3px; }
        .kv { font-size:10.5px; color:#334155; line-height:1.55; }
        .kv b { color:#0F172A; }

        /* Stage banner */
        .stage { background:${color}; color:#fff; padding:12px 14px; border-radius:10px; margin:10px 0; display:flex; align-items:center; justify-content:space-between; gap:10px; }
        .stage h2 { margin:0; font-size:18px; letter-spacing:-0.3px; }
        .stage .conf { background:rgba(255,255,255,0.25); padding:3px 10px; border-radius:999px; font-size:10px; font-weight:700; letter-spacing:0.4px; }
        .stage .stat { font-size:10px; margin-top:4px; opacity:0.95; }

        /* Sections */
        .box { border:1px solid #E2E8F0; border-radius:8px; padding:8px 10px; background:#FFFFFF; }
        .interp p { margin:0; font-size:11px; line-height:1.5; color:#1E293B; }

        /* Tables */
        table { width:100%; border-collapse:collapse; margin-top:2px; }
        th { background:#F1F5F9; text-align:left; padding:5px 8px; font-size:9.5px; text-transform:uppercase; letter-spacing:0.8px; color:#475569; border-bottom:1px solid #E2E8F0; }
        td { padding:5px 8px; border-bottom:1px solid #F1F5F9; font-size:10.5px; }

        /* Recommendation + Suggestions */
        .rec p { margin:0 0 4px; font-size:11px; line-height:1.5; }
        ul.tips { margin:2px 0 0 14px; padding:0; }
        ul.tips li { font-size:10.5px; line-height:1.5; margin:1px 0; color:#334155; }

        /* Schedule chips */
        .sched { display:flex; gap:6px; margin-top:4px; }
        .sched .chip { flex:1; text-align:center; border:1px solid ${color}55; border-radius:8px; padding:6px 4px; background:#FFFFFF; }
        .sched .chip .lbl { font-size:8.5px; color:#64748B; text-transform:uppercase; letter-spacing:0.8px; font-weight:700; }
        .sched .chip .val { font-size:11.5px; font-weight:800; color:${color}; margin-top:2px; }

        /* Signature + footer */
        .sig { display:flex; align-items:flex-end; justify-content:space-between; margin-top:12px; padding-top:8px; border-top:1px solid #E2E8F0; }
        .sig .who { font-size:10.5px; color:#0F172A; }
        .sig .who b { display:block; font-size:12px; margin-bottom:2px; }
        .sig .who small { color:#64748B; font-size:9.5px; }
        .sig .line { width:150px; text-align:center; }
        .sig .line .l { border-bottom:1px solid #64748B; height:22px; }
        .sig .line small { color:#64748B; font-size:9px; }

        .footer { margin-top:8px; padding-top:6px; border-top:2px solid ${color}; text-align:center; font-size:9px; color:#64748B; line-height:1.5; }
        .footer b { color:${color}; }
        .disclaimer { text-align:center; font-size:8.5px; color:#94A3B8; margin-top:4px; font-style:italic; }
      </style></head>
      <body>
        <div class="wrap">

          <!-- Branded Header -->
          <div class="hdr">
            <img class="logo" src="${logo}"/>
            <div class="brand">
              <h1>Doggy Breeding Guide</h1>
              <div class="tag">BREED • TRACK • CARE</div>
              <div class="inst">
                Veterinary College and Research Institute, Namakkal<br/>
                Department of Veterinary Gynaecology &amp; Obstetrics
              </div>
            </div>
            <div class="rid">
              <div class="idbox">${reportId}</div><br/>
              <span><b>Date:</b> ${today}</span><br/>
              <span><b>Method:</b> ${ev.type === "cytology" ? "Vaginal Cytology" : "Progesterone Analysis"}${ev.type === "cytology" && inputs._mode === "flex" ? " (Flex)" : ""}</span>
            </div>
          </div>

          <!-- Patient + Owner in two columns -->
          <div class="row">
            <div class="col">
              <h3>Patient</h3>
              <div class="kv">
                <b>${dog?.dog_name || "—"}</b><br/>
                Breed: ${dog?.breed || "—"}<br/>
                Age: ${dog?.age || "—"}${dog?.weight ? `  &nbsp;•&nbsp; Weight: ${dog.weight} kg` : ""}<br/>
                Whelpings: ${dog?.whelping_count ?? "—"}
              </div>
            </div>
            <div class="col">
              <h3>Owner &amp; Case</h3>
              <div class="kv">
                <b>${dog?.owner_name || "—"}</b><br/>
                📞 ${dog?.owner_mobile || "—"}<br/>
                Proestrus Onset: ${dog?.proestrus_bleeding_date || "—"}
              </div>
            </div>
          </div>

          <!-- Stage banner -->
          <div class="stage">
            <div>
              <h2>${result.stage}</h2>
              <div class="stat">${result.breeding_status || ""}</div>
            </div>
            <div class="conf">Confidence ${result.confidence}%</div>
          </div>

          <!-- Two-column: Measurements | Interpretation -->
          <div class="row">
            <div class="col">
              <h3>Measurements</h3>
              <table>${inputRows}</table>
            </div>
            <div class="col interp">
              <h3>Interpretation</h3>
              <div class="box">
                <p>${result.interpretation || "—"}</p>
              </div>
            </div>
          </div>

          <!-- Recommendation + Suggestions -->
          <div class="row">
            <div class="col rec">
              <h3>Recommendation</h3>
              <div class="box"><p>${result.recommendation || "—"}</p></div>
            </div>
            <div class="col">
              <h3>Suggestions &amp; Care Tips</h3>
              <div class="box">
                <ul class="tips">${suggestionsHtml}</ul>
              </div>
            </div>
          </div>

          <!-- Breeding Schedule -->
          <div style="margin-top:10px;">
            <h3>Breeding Schedule</h3>
            <div class="sched">
              <div class="chip">
                <div class="lbl">Suggested Mating</div>
                <div class="val">${result.suggested_mating_date || "—"}</div>
              </div>
              <div class="chip">
                <div class="lbl">Next Evaluation</div>
                <div class="val">${result.next_evaluation_date || result.next_test_date || "—"}</div>
              </div>
              <div class="chip">
                <div class="lbl">Expected Whelping</div>
                <div class="val">${result.expected_whelping_date || "—"}</div>
              </div>
            </div>
          </div>

          <!-- Signature -->
          <div class="sig">
            <div class="who">
              <b>${senderName || "—"}</b>
              <small>${evalUser?.category || ""}${evalUser?.hospital ? "  •  " + evalUser.hospital : ""}${evalUser?.location ? "  •  " + evalUser.location : ""}</small>
              ${evalUser?.mobile ? `<br/><small>📞 ${evalUser.mobile}</small>` : ""}
            </div>
            <div class="line">
              <div class="l"></div>
              <small>Signature &amp; Seal</small>
            </div>
          </div>

          <!-- Branding footer -->
          <div class="footer">
            <b>Doggy Breeding Guide</b> &nbsp;•&nbsp; Breed • Track • Care<br/>
            Developed by <b>ANIMitra Software</b> &nbsp;•&nbsp; +91 99444 72488 &nbsp;•&nbsp; support@animitra.in
          </div>
          <div class="disclaimer">
            This report is an evidence-based decision aid. Clinical judgement of the attending veterinarian remains final.
          </div>

        </div>
      </body></html>`;
  };

  const onPDF = async () => {
    try {
      const html = generateHTML();
      if (Platform.OS === "web") {
        // On web, expo-print's `printAsync` is a stub (`window.print()`) that
        // IGNORES the html argument — it prints the current page instead of
        // our branded template. Bypass it and render the HTML into a new tab
        // ourselves, then call window.print() from that tab.
        try {
          const w = window.open("", "_blank");
          if (w) {
            w.document.open();
            w.document.write(html);
            w.document.close();
            setTimeout(() => {
              try { w.focus(); w.print(); } catch { /* noop */ }
            }, 500);
            return;
          }
        } catch {
          /* fallthrough */
        }
        // As a last resort, try the built-in dialog (which will print the app UI).
        try {
          await Print.printAsync({ html });
          return;
        } catch {
          toast.show("Enable pop-ups to view/print the PDF", "error");
          return;
        }
      }
      // Native (iOS / Android) — real PDF file, then share.
      const printed = await Print.printToFileAsync({ html });
      const uri = printed?.uri;
      if (!uri) {
        toast.show("Failed to generate PDF file", "error");
        return;
      }
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { dialogTitle: "Share Report", mimeType: "application/pdf" });
      } else {
        toast.show(`PDF saved: ${uri}`, "success");
      }
    } catch (e: any) {
      toast.show(e?.message || "Failed to generate PDF", "error");
    }
  };

  const onShareWhatsApp = async () => {
    const senderPrefix = user?.category === "Doctor" || user?.category === "Student" ? "Dr. " : "";
    const senderLine = user?.name ? `— ${senderPrefix}${user.name}${user.hospital ? `, ${user.hospital}` : ""}${user.mobile ? `\n📞 ${user.mobile}` : ""}` : "";
    const text = `🐕 *Doggy Breeding App Report*\n\nDog: ${dog?.dog_name}\nOwner: ${dog?.owner_name}\nStage: ${result.stage} (${result.confidence}% confidence)\n\n${result.recommendation}\n\nSuggested Mating: ${result.suggested_mating_date || "—"}\nExpected Whelping: ${result.expected_whelping_date || "—"}\n\n${senderLine}`;
    const phone = dog?.owner_mobile?.replace(/[^0-9]/g, "") || "";
    try {
      if (Platform.OS === "web") {
        const webUrl = phone
          ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
          : `https://wa.me/?text=${encodeURIComponent(text)}`;
        try {
          window.open(webUrl, "_blank");
          return;
        } catch {
          const nav: any = typeof navigator !== "undefined" ? navigator : null;
          if (nav?.clipboard?.writeText) {
            await nav.clipboard.writeText(text);
            toast.show("Report copied — paste it into WhatsApp", "success");
            return;
          }
          toast.show("WhatsApp not available on this browser", "error");
          return;
        }
      }
      const url = phone ? `whatsapp://send?phone=${phone}&text=${encodeURIComponent(text)}` : `whatsapp://send?text=${encodeURIComponent(text)}`;
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        await Share.share({ message: text });
      }
    } catch (e: any) {
      try {
        await Share.share({ message: text });
      } catch {
        toast.show(e?.message || "Failed to open WhatsApp", "error");
      }
    }
  };

  const onShare = async () => {
    const text = `${dog?.dog_name} (${dog?.breed}) — ${result.stage}. ${result.recommendation}`;
    try {
      if (Platform.OS === "web") {
        // Web Share API isn't universally supported on desktop browsers.
        const nav: any = typeof navigator !== "undefined" ? navigator : null;
        if (nav?.share) {
          try {
            await nav.share({ title: "Doggy Breeding Report", text });
            return;
          } catch (err: any) {
            // User cancelled — bail silently.
            if (err?.name === "AbortError") return;
          }
        }
        // Fallback: copy to clipboard
        try {
          if (nav?.clipboard?.writeText) {
            await nav.clipboard.writeText(text);
            toast.show("Copied to clipboard", "success");
            return;
          }
        } catch {
          /* fallthrough */
        }
        toast.show("Sharing not supported in this browser", "error");
        return;
      }
      await Share.share({ message: text });
    } catch (e: any) {
      toast.show(e?.message || "Failed to share", "error");
    }
  };

  const onDelete = async () => {
    try {
      await localDB.deleteEval(ev.id);
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
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <Text style={[styles.cardTitle, { color: theme.text, marginBottom: 0 }]}>Cell Counts</Text>
              {ev.inputs._mode === "flex" && (
                <View style={{ backgroundColor: theme.navy + "18", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}>
                  <Text style={{ color: theme.navy, fontWeight: "800", fontSize: 11, letterSpacing: 0.5 }}>
                    TOTAL {ev.inputs.total_cells} CELLS
                  </Text>
                </View>
              )}
            </View>
            <View style={{ gap: 6 }}>
              <CellLine theme={theme} label="Parabasal (PC)" value={ev.inputs.pc} pct={ev.inputs.pct_pc} color="#3B82F6" mode={ev.inputs._mode} />
              <CellLine theme={theme} label="Intermediate (IC)" value={ev.inputs.ic} pct={ev.inputs.pct_ic} color="#A855F7" mode={ev.inputs._mode} />
              <CellLine theme={theme} label="Superficial Intermediate (SIC)" value={ev.inputs.sic} pct={ev.inputs.pct_sic} color="#F97316" mode={ev.inputs._mode} />
              <CellLine theme={theme} label="Superficial (SC)" value={ev.inputs.sc} pct={ev.inputs.pct_sc} color="#22C55E" mode={ev.inputs._mode} />
              <CellLine theme={theme} label="Cornified (CC)" value={ev.inputs.cc} pct={ev.inputs.pct_cc} color="#EF4444" mode={ev.inputs._mode} />
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

function CellLine({ theme, label, value, color, pct, mode }: any) {
  const isFlex = mode === "flex";
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 6 }}>
      <View style={{ flexDirection: "row", gap: 8, alignItems: "center", flex: 1 }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
        <Text style={{ color: theme.text, fontSize: 13 }}>{label}</Text>
      </View>
      {isFlex ? (
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
          <Text style={{ color: theme.textMuted, fontSize: 12 }}>{value ?? 0} cells</Text>
          <Text style={{ color: theme.text, fontWeight: "800", fontSize: 14, minWidth: 52, textAlign: "right" }}>{(pct ?? 0).toFixed(1)}%</Text>
        </View>
      ) : (
        <Text style={{ color: theme.text, fontWeight: "800", fontSize: 14 }}>{value ?? 0}%</Text>
      )}
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
