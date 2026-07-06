// Offline classification + local storage — no backend needed.
// Ports the stage logic from backend/server.py so the app is fully offline-capable.
import { storage } from "@/src/utils/storage";

type StageKey = "ANESTRUS" | "EARLY_PROESTRUS" | "MID_PROESTRUS" | "LATE_PROESTRUS" | "ESTRUS" | "ESTRUS_OVULATION" | "DIESTRUS";

const STAGE_LABEL: Record<StageKey, string> = {
  ANESTRUS: "Anestrus",
  EARLY_PROESTRUS: "Early Proestrus",
  MID_PROESTRUS: "Mid Proestrus",
  LATE_PROESTRUS: "Late Proestrus",
  ESTRUS: "Estrus",
  ESTRUS_OVULATION: "Estrus / Ovulation",
  DIESTRUS: "Diestrus",
};

const uuid = () =>
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

const parseDate = (s?: string | null): Date | null => {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
};

const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);
const fmtDate = (d?: Date | null) => (d ? d.toISOString().slice(0, 10) : null);
const now = () => new Date().toISOString();

// ─── Cytology ───
export interface CytologyInput { pc: number; ic: number; sic: number; sc: number; cc: number }
export interface StageResult {
  stage: string;
  stage_key: StageKey;
  confidence: number;
  cornification_index?: number;
  interpretation: string;
  recommendation: string;
  breeding_status: string;
  next_evaluation_date?: string | null;
  next_test_date?: string | null;
  suggested_mating_date?: string | null;
  expected_whelping_date?: string | null;
  ovulation_prediction?: string | null;
}

export function classifyCytology(i: CytologyInput, proestrusDateIso?: string | null): StageResult {
  const { pc, ic, sic: _sic, sc, cc } = i; void _sic;
  const ci = Math.round((sc + cc) * 10) / 10;
  let key: StageKey; let conf: number; let interp: string; let rec: string; let status: string;
  if (sc + cc >= 80) { key = "ESTRUS"; conf = 92; interp = "High superficial + cornified cells. Female is in full estrus and receptive."; rec = "Optimal breeding window. Natural mating today or AI within 24-48 hours."; status = "Optimal — Breed now"; }
  else if (sc + cc >= 60) { key = "LATE_PROESTRUS"; conf = 85; interp = "Cornification rising rapidly. Estrus imminent within 1-2 days."; rec = "Schedule next cytology in 1-2 days. Prepare for mating."; status = "Breeding window approaching"; }
  else if (sc + cc >= 30) { key = "MID_PROESTRUS"; conf = 78; interp = "Mid-proestrus. Cornification progressing but not yet optimal."; rec = "Re-evaluate cytology in 2-3 days."; status = "Not yet — re-check soon"; }
  else if (sc + cc >= 10) { key = "EARLY_PROESTRUS"; conf = 75; interp = "Early proestrus. Bleeding likely active, female not yet receptive."; rec = "Re-evaluate cytology in 3-4 days."; status = "Not receptive yet"; }
  else if (pc >= 80 && ic <= 20) { key = "ANESTRUS"; conf = 90; interp = "Predominantly parabasal cells. Reproductive quiescence."; rec = "No breeding. Re-evaluate when proestrus bleeding begins."; status = "Not in cycle"; }
  else if (pc < 80 && ic > 20) { key = "DIESTRUS"; conf = 80; interp = "Return of intermediate / parabasal cells after estrus."; rec = "If bred recently, monitor for pregnancy. Otherwise wait for next cycle."; status = "Past optimal window"; }
  else { key = "EARLY_PROESTRUS"; conf = 60; interp = "Pattern unclear — repeat cytology recommended."; rec = "Re-evaluate in 2 days."; status = "Inconclusive"; }

  const pd = parseDate(proestrusDateIso);
  let mating: Date | null = null, nextEval: Date | null = null, whelp: Date | null = null;
  const today = new Date();
  if (pd) {
    if (key === "ESTRUS") { mating = addDays(pd, 10); whelp = addDays(mating, 63); nextEval = addDays(today, 2); }
    else if (key === "LATE_PROESTRUS") { mating = addDays(today, 2); whelp = addDays(mating, 63); nextEval = addDays(today, 1); }
    else if (key === "MID_PROESTRUS" || key === "EARLY_PROESTRUS") { nextEval = addDays(today, 3); mating = addDays(pd, 10); whelp = addDays(mating, 63); }
    else if (key === "DIESTRUS") { whelp = addDays(pd, 63); }
  }
  return {
    stage: STAGE_LABEL[key], stage_key: key, confidence: conf, cornification_index: ci,
    interpretation: interp, recommendation: rec, breeding_status: status,
    next_evaluation_date: fmtDate(nextEval), suggested_mating_date: fmtDate(mating), expected_whelping_date: fmtDate(whelp),
  };
}

// ─── Progesterone ───
export function classifyProgesterone(v: number, proestrusDateIso?: string | null): StageResult {
  let key: StageKey, conf: number, interp: string, rec: string, ovul: string | null;
  if (v < 0.5) { key = "ANESTRUS"; conf = 90; interp = "Baseline progesterone — anestrus."; rec = "No breeding. Recheck when proestrus begins."; ovul = null; }
  else if (v <= 1.0) { key = "EARLY_PROESTRUS"; conf = 80; interp = "Progesterone beginning to rise. Early proestrus."; rec = "Recheck progesterone in 2-3 days."; ovul = "Ovulation in ~4-6 days"; }
  else if (v <= 1.9) { key = "LATE_PROESTRUS"; conf = 85; interp = "LH surge approaching. Late proestrus."; rec = "Recheck in 24-48 hours. Mating window is imminent."; ovul = "Ovulation in ~2-4 days"; }
  else if (v <= 4.0) { key = "ESTRUS"; conf = 92; interp = "LH surge has occurred. Estrus."; rec = "Optimal natural mating window opens in 2-3 days."; ovul = "Ovulation within ~24-48 hours"; }
  else if (v <= 18.0) { key = "ESTRUS_OVULATION"; conf = 95; interp = "Post-ovulation, oocytes maturing. Peak fertility window."; rec = "Breed now or within 24-48 hours. Ideal time for AI."; ovul = "Ovulation occurred — oocyte maturation in progress"; }
  else { key = "DIESTRUS"; conf = 88; interp = "High progesterone — diestrus / luteal phase."; rec = "If bred, monitor pregnancy. Otherwise cycle is past optimal window."; ovul = "Past ovulation"; }

  const pd = parseDate(proestrusDateIso);
  const today = new Date();
  let mating: Date | null = null, nextTest: Date | null = null, whelp: Date | null = null;
  if (key === "ESTRUS_OVULATION") { mating = today; whelp = addDays(today, 63); }
  else if (key === "ESTRUS") { mating = addDays(today, 2); whelp = addDays(mating, 63); nextTest = addDays(today, 2); }
  else if (key === "LATE_PROESTRUS") { nextTest = addDays(today, 2); mating = addDays(today, 4); whelp = addDays(mating, 63); }
  else if (key === "EARLY_PROESTRUS") { nextTest = addDays(today, 3); mating = addDays(today, 6); whelp = addDays(mating, 63); }
  else if (key === "DIESTRUS" && pd) { whelp = addDays(pd, 63); }

  return {
    stage: STAGE_LABEL[key], stage_key: key, confidence: conf, interpretation: interp, recommendation: rec,
    breeding_status: rec, ovulation_prediction: ovul,
    suggested_mating_date: fmtDate(mating), next_test_date: fmtDate(nextTest), expected_whelping_date: fmtDate(whelp),
  };
}

// ─── Local storage models ───
export interface DogRecord {
  id: string; user_id: string; dog_name: string; owner_name: string; owner_mobile: string;
  breed: string; age: string; sex: string; whelping_count: number;
  proestrus_bleeding_date: string | null; created_at: string;
}
export interface EvalRecord {
  id: string; user_id: string; dog_id: string;
  type: "cytology" | "progesterone";
  inputs: any; result: StageResult;
  proestrus_bleeding_date: string | null; created_at: string;
}

const DOGS_KEY = "dogs_v1";
const EVALS_KEY = "evals_v1";

async function loadArr<T>(key: string): Promise<T[]> {
  const s = await storage.getItem<string>(key, "");
  if (!s) return [];
  try { return JSON.parse(s) as T[]; } catch { return []; }
}
async function saveArr<T>(key: string, arr: T[]) { await storage.setItem(key, JSON.stringify(arr)); }

export const localDB = {
  async createDog(input: Omit<DogRecord, "id" | "created_at">): Promise<DogRecord> {
    const dog: DogRecord = { ...input, id: uuid(), created_at: now() };
    const list = await loadArr<DogRecord>(DOGS_KEY);
    list.unshift(dog); await saveArr(DOGS_KEY, list);
    return dog;
  },
  async getDog(id: string): Promise<DogRecord | null> {
    const list = await loadArr<DogRecord>(DOGS_KEY);
    return list.find((d) => d.id === id) || null;
  },
  async listDogs(user_id: string): Promise<DogRecord[]> {
    const list = await loadArr<DogRecord>(DOGS_KEY);
    return list.filter((d) => d.user_id === user_id);
  },
  async createEval(input: Omit<EvalRecord, "id" | "created_at">): Promise<EvalRecord> {
    const ev: EvalRecord = { ...input, id: uuid(), created_at: now() };
    const list = await loadArr<EvalRecord>(EVALS_KEY);
    list.unshift(ev); await saveArr(EVALS_KEY, list);
    return ev;
  },
  async getEval(id: string): Promise<EvalRecord | null> {
    const list = await loadArr<EvalRecord>(EVALS_KEY);
    return list.find((e) => e.id === id) || null;
  },
  async listEvals(user_id: string, q?: string): Promise<EvalRecord[]> {
    const evals = await loadArr<EvalRecord>(EVALS_KEY);
    const dogs = await loadArr<DogRecord>(DOGS_KEY);
    const dogMap = new Map(dogs.map((d) => [d.id, d]));
    let list = evals.filter((e) => e.user_id === user_id);
    if (q) {
      const ql = q.toLowerCase();
      list = list.filter((e) => {
        const d = dogMap.get(e.dog_id);
        return [d?.dog_name, d?.owner_name, d?.owner_mobile, d?.breed, e.type, e.result?.stage].join(" ").toLowerCase().includes(ql);
      });
    }
    return list;
  },
  async deleteEval(id: string) {
    const list = await loadArr<EvalRecord>(EVALS_KEY);
    await saveArr(EVALS_KEY, list.filter((e) => e.id !== id));
  },
  async stats(user_id: string) {
    const list = (await loadArr<EvalRecord>(EVALS_KEY)).filter((e) => e.user_id === user_id);
    const by_stage: Record<string, number> = {};
    for (const e of list) {
      const k = e.result?.stage_key || "UNKNOWN";
      by_stage[k] = (by_stage[k] || 0) + 1;
    }
    return {
      total: list.length,
      estrus: (by_stage.ESTRUS || 0) + (by_stage.ESTRUS_OVULATION || 0),
      anestrus: by_stage.ANESTRUS || 0,
      diestrus: by_stage.DIESTRUS || 0,
      proestrus: (by_stage.EARLY_PROESTRUS || 0) + (by_stage.MID_PROESTRUS || 0) + (by_stage.LATE_PROESTRUS || 0),
      by_stage,
    };
  },
  async wipe() { await storage.removeItem(DOGS_KEY); await storage.removeItem(EVALS_KEY); },
};
