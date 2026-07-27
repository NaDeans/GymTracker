const lightTheme = {
  /* ================= BASE COLORS ================= */
  white: "#FFFFFF",
  black: "#000000",
  shadow: "#000000",

  /* ================= BLUES (legacy palette, kept for in-progress call sites) ================= */
  blue: "#007AFF",
  blueDark: "#0066D6",
  blueLight: "#007AFF33",
  blueVeryLight: "#E6F0FF",

  /* ================= GREENS ================= */
  green: "#2ECC71",
  greenDark: "#27AE60",
  greenLight: "#2ECC7133",

  /* ================= REDS ================= */
  red: "#FF3B30",
  redDark: "#D9362B",
  redLight: "#FFDDDD",

  /* ================= YELLOW ================= */
  yellow: "#F4D03F",

  /* ================= MACRO SPECIFIC ================= */
  protein: "#EB5A5A",
  carbs: "#F4D03F",
  fats: "#5DADE2",

  /* ================= BACKGROUNDS ================= */
  background: "#FDFDFD",
  card: "#F5F5F5",
  cardLight: "#F0F0F0",
  inputBackground: "#FFFFFF",
  overlayDark: "rgba(0,0,0,0.35)",
  overlayLight: "rgba(0,0,0,0.30)",

  /* ================= TEXT ================= */
  textPrimary: "#000000",
  textDark: "#222222",
  textMedium: "#333333",
  textLight: "#555555",
  textMuted: "#777777",
  textWhite: "#FFFFFF",

  /* ================= BORDERS ================= */
  border: "#DDDDDD",

  /* ================= SEMANTIC (new design system — use these for all new/touched UI) ================= */
  primary: "#4F46E5",
  primaryDark: "#3730A3",
  primaryLight: "#6366F1",
  primarySurface: "#EEF0FF",

  neutral: "#6B7280",
  neutralDark: "#4B5563",
  neutralSurface: "#F1F2F4",

  success: "#2ECC71",
  successDark: "#27AE60",
  successSurface: "#E7F9EF",

  warning: "#F5A623",
  warningDark: "#D6890F",
  warningSurface: "#FFF4E0",

  danger: "#FF3B30",
  dangerDark: "#D9362B",
  dangerSurface: "#FFE9E7",

  surfaceBase: "#FDFDFD",
  surface1: "#F5F5F5",
  surface2: "#F0F0F0",
  surfaceRaised: "#FFFFFF",

  textOnPrimary: "#FFFFFF",
  textDisabled: "#AAAAAA",
  textPlaceholder: "#8A8A8E",

  chart: {
    protein: "#EB5A5A",
    carbs: "#F4D03F",
    fats: "#5DADE2",
    track: "#E4E4E7",
  },
};

export const COLORS = lightTheme;

export const themes = {
  light: lightTheme,
};
