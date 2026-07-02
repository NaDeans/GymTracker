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

const darkTheme = {
  /* ================= BASE COLORS ================= */
  white: "#FFFFFF",
  black: "#000000",
  shadow: "#000000",

  /* ================= BLUES (legacy palette, kept for in-progress call sites) ================= */
  blue: "#007AFF",
  blueDark: "#0066D6",
  blueLight: "#007AFF33",
  blueVeryLight: "#1A3A52",

  /* ================= GREENS ================= */
  green: "#2ECC71",
  greenDark: "#27AE60",
  greenLight: "#2ECC7133",

  /* ================= REDS ================= */
  red: "#FF3B30",
  redDark: "#D9362B",
  redLight: "#4A2424",

  /* ================= YELLOW ================= */
  yellow: "#F4D03F",

  /* ================= MACRO SPECIFIC ================= */
  protein: "#EB5A5A",
  carbs: "#F4D03F",
  fats: "#5DADE2",

  /* ================= BACKGROUNDS ================= */
  background: "#1A1A1A",
  card: "#262626",
  cardLight: "#303030",
  inputBackground: "#2D2D2D",
  overlayDark: "rgba(0,0,0,0.65)",
  overlayLight: "rgba(0,0,0,0.60)",

  /* ================= TEXT ================= */
  textPrimary: "#FFFFFF",
  textDark: "#E0E0E0",
  textMedium: "#CCCCCC",
  textLight: "#AAAAAA",
  textMuted: "#888888",
  textWhite: "#FFFFFF",

  /* ================= BORDERS ================= */
  border: "#404040",

  /* ================= SEMANTIC (new design system — use these for all new/touched UI) ================= */
  primary: "#6366F1",
  primaryDark: "#4F46E5",
  primaryLight: "#818CF8",
  primarySurface: "#312E81",

  neutral: "#9CA3AF",
  neutralDark: "#FFFFFF",
  neutralSurface: "#2D2D2D",

  success: "#2ECC71",
  successDark: "#27AE60",
  successSurface: "#1B3A25",

  danger: "#FF3B30",
  dangerDark: "#D9362B",
  dangerSurface: "#3D1F1F",

  surfaceBase: "#1A1A1A",
  surface1: "#262626",
  surface2: "#303030",
  surfaceRaised: "#2D2D2D",

  textOnPrimary: "#FFFFFF",
  textDisabled: "#555555",
  textPlaceholder: "#757575",

  chart: {
    protein: "#EB5A5A",
    carbs: "#F4D03F",
    fats: "#5DADE2",
    track: "#424242",
  },
};

export const COLORS = lightTheme;

export const themes = {
  light: lightTheme,
  dark: darkTheme,
};
