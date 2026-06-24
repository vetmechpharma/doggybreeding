// Doggy Breeding App — Theme tokens
// Source of truth for colors, spacing, typography across the app.

export type StageKey =
  | "ANESTRUS"
  | "EARLY_PROESTRUS"
  | "MID_PROESTRUS"
  | "LATE_PROESTRUS"
  | "ESTRUS"
  | "ESTRUS_OVULATION"
  | "DIESTRUS";

export const stageColors: Record<StageKey, string> = {
  ANESTRUS: "#3B82F6",
  EARLY_PROESTRUS: "#A855F7",
  MID_PROESTRUS: "#F97316",
  LATE_PROESTRUS: "#EAB308",
  ESTRUS: "#22C55E",
  ESTRUS_OVULATION: "#16A34A",
  DIESTRUS: "#EF4444",
};

export const stageLabels: Record<StageKey, string> = {
  ANESTRUS: "Anestrus",
  EARLY_PROESTRUS: "Early Proestrus",
  MID_PROESTRUS: "Mid Proestrus",
  LATE_PROESTRUS: "Late Proestrus",
  ESTRUS: "Estrus",
  ESTRUS_OVULATION: "Estrus / Ovulation",
  DIESTRUS: "Diestrus",
};

export const stageOrder: StageKey[] = [
  "ANESTRUS",
  "EARLY_PROESTRUS",
  "MID_PROESTRUS",
  "LATE_PROESTRUS",
  "ESTRUS",
  "DIESTRUS",
];

export const brand = {
  navy: "#0F172A",
  navyLight: "#1E3A8A",
  coral: "#FF6B6B",
  pink: "#FB7185",
  splashGradient: ["#3B82F6", "#8B5CF6", "#EC4899"] as const,
};

export const lightTheme = {
  mode: "light" as const,
  bg: "#F8FAFC",
  card: "#FFFFFF",
  cardElevated: "#FFFFFF",
  border: "#E2E8F0",
  text: "#0F172A",
  textMuted: "#64748B",
  navy: brand.navy,
  coral: brand.coral,
  pink: brand.pink,
  accent: brand.navy,
  tint: "#1E3A8A",
  inputBg: "#F1F5F9",
  shadow: "rgba(15, 23, 42, 0.08)",
};

export const darkTheme = {
  mode: "dark" as const,
  bg: "#020617",
  card: "#0F172A",
  cardElevated: "#1E293B",
  border: "#1E293B",
  text: "#F8FAFC",
  textMuted: "#94A3B8",
  navy: "#1E3A8A",
  coral: brand.coral,
  pink: brand.pink,
  accent: brand.coral,
  tint: "#60A5FA",
  inputBg: "#1E293B",
  shadow: "rgba(0, 0, 0, 0.5)",
};

export type ThemeShape = typeof lightTheme;

export const spacing = (n: number) => n * 8;
export const radius = { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 };
