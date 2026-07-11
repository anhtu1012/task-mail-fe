// types/enums.ts
export enum BayDesign {
  DECK = "D", // boong
  COVER = "C", // nắp hầm
  HOLD = "H", // Hầm
}
export interface SelectOption {
  label: string;
  value: string | number | null;
}

export const presetColors = [
  "#FF0000",
  "#FF9900",
  "#FFFF00",
  "#008000",
  "#00FFFF",
  "#0000FF",
  "#800080",
  "#FFC0CB",
  "#A52A2A",
  "#FF8C00",
  "#B8860B",
  "#006400",
  "#008B8B",
  "#00008B",
  "#4B0082",
  "#C71585",
  "#FA8072",
  "#FFDAB9",
  "#FFFFE0",
  "#90EE90",
  "#E0FFFF",
  "#E6E6FA",
  "#D8BFD8",
  "#FFB6C1",
];

export enum DefaultPageSize {
  DEFAULT = 100,
}

export const BATCH_SIZE = 100;
