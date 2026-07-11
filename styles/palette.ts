// ============================================================
// Task Design System - TypeScript Color Palette
// ============================================================
// Single source of truth for JS/TS usage (components, charts, etc.)

const palette = {
  // --- Primary Colors ---
  primary:       "#0A436D",
  success: "#2A9D8F",
  danger: "#E63946",
  warning: "#F4A261",

  // --- Primary Shades ---
  primary50:     "#E8F1F7",
  primary100:    "#C5DCE9",
  primary200:    "#8BB9D4",
  primary300:    "#5196BF",
  primary400:    "#2D79A8",
  primary500:    "#0A436D",
  primary600:    "#08375A",
  primary700:    "#062B47",
  primary800:    "#041F34",
  primary900:    "#021321",

  // --- Neutral Colors ---
  background: "#F7F8FA",
  muted: "#F0F2F5",
  foreground: "#333333",
  mutedForeground: "#808080",
  white: "#FFFFFF",
  black: "#000000",

  // --- Border ---
  border: "#E2E8F0",
  borderLight: "#F0F2F5",
  borderDark: "#CBD5E1",

  // --- Status (FunctionButton mapping) ---
  statusPrimary:  "#0A436D",   // Save, Search, Import
  statusSuccess: "#2A9D8F", // Add, Confirm, Calculate
  statusDanger: "#E63946", // Delete, Cancel
  statusWarning: "#F4A261", // Alerts, Mandatory fields

  // --- Legacy (backward compat) ---
  primary_1: "#062C60",
  primary_2: "#0A3A7B",
  primary_3: "#0E499A",
  primary_4: "#2C60A8",
  primary_5: "#4C79B7",
  primary_6: "#9ADBFF",
  secondary_1: "#EACE01",
  secondary_2: "#FFE730",
  secondary_3: "#FFEC5C",
  third_1: "#EA2101",
  third_2: "#FF4C30",
  third_3: "#FF725C",
  error: "#FF5252",
  successLegacy: "#3AFF36",
  warningLegacy: "#FFBF1A",
  bg: "#EEEEEE",
  subtitle: "#4D4D4D",
  subtitle_light: "#DEDEDE",
} as const;

export default palette;
