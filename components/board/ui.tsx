"use client";

/**
 * Các mảnh UI dùng lại trong màn Board.
 *
 * Có HAI bảng màu:
 *   C — dùng trên nền trắng (màn chi tiết việc, popover, menu)
 *   G — dùng trên nền kính tối (bảng, thẻ, hộp thư đến)
 * Component nào xuất hiện ở cả hai chỗ thì nhận prop `onGlass`.
 */
import { ReactNode } from "react";
import dayjs from "dayjs";
import { Mail, MessageCircle } from "lucide-react";
import palette from "@/styles/palette";
import { BoardLabel, CardSource } from "@/models/board";

/** Sắc độ board cần mà palette.ts chưa export — trùng giá trị với styles/_colors.scss */
export const C = {
  primary: palette.primary,
  primary50: palette.primary50,
  primary100: palette.primary100,
  primary200: palette.primary200,
  primary300: palette.primary300,
  success: palette.success,
  success50: "#e6f5f3",
  danger: palette.danger,
  danger50: "#fde8ea",
  warning: palette.warning,
  warning50: "#fef4e8",
  warning600: "#c47725",
  info: "#0ea5e9",
  border: palette.border,
  borderDark: palette.borderDark,
  muted: palette.muted,
  mutedForeground: palette.mutedForeground,
  foreground: palette.foreground,
  neutral500: "#94a3b8",
  neutral700: "#64748b",
  neutral800: "#475569",
} as const;

/**
 * Bảng màu dùng TRÊN NỀN KÍNH của màn Bảng công việc.
 *
 * Giá trị thật do hệ thống giao diện cấp (libs/theme/presets.ts) nên khi
 * người dùng đổi nền sáng/tối hoặc kéo độ trong thì màn này đổi theo cùng —
 * chung đúng một bộ cài đặt với phần còn lại của hệ thống. Phần ghi sau dấu
 * phẩy chỉ là giá trị dự phòng lúc biến chưa được đặt.
 *
 * Lưu ý: chỉ dùng được ở ngữ cảnh CSS (style, class). Thuộc tính trình bày
 * của SVG (stroke=, fill=) KHÔNG hiểu var(), chỗ đó phải để currentColor.
 */
export const G = {
  text: "var(--g-text, #ffffff)",
  textSoft: "var(--g-text-soft, rgba(255,255,255,.84))",
  textMuted: "var(--g-text-muted, rgba(255,255,255,.74))",
  textFaint: "var(--g-text-faint, rgba(255,255,255,.58))",
  line: "var(--g-line, rgba(255,255,255,.18))",
  fill: "var(--g-fill, rgba(255,255,255,.14))",
  fillStrong: "var(--g-fill-strong, rgba(255,255,255,.24))",
  danger: "var(--g-danger, #ffb3ba)",
  dangerFill: "var(--g-danger-fill, rgba(230,57,70,.3))",
  success: "var(--g-success, #7fe0d0)",
  successFill: "var(--g-success-fill, rgba(42,157,143,.28))",
  warning: "var(--g-warning, #ffd29b)",
  warningFill: "var(--g-warning-fill, rgba(244,162,97,.28))",
  info: "var(--g-info, #bee0f4)",
  infoFill: "var(--g-info-fill, rgba(81,150,191,.3))",
} as const;

export const fmtDateTime = (iso?: string | null) =>
  iso ? dayjs(iso).format("HH:mm DD/MM/YYYY") : "—";

export const fmtShort = (iso?: string | null) =>
  iso ? dayjs(iso).format("DD/MM HH:mm") : "—";

export const fmtBytes = (bytes: number | null) => {
  if (bytes === null) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

/** #rrggbb -> rgba(...) */
export const alpha = (hex: string, a: number): string => {
  const v = hex.replace("#", "");
  const full = v.length === 3 ? v.split("").map((c) => c + c).join("") : v;
  const n = parseInt(full, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

// ==========================================
// NHÃN
// ==========================================
/**
 * Trên nền trắng: chip nền nhạt, chữ đúng màu nhãn.
 * Trên nền kính: chữ TRẮNG, nền là màu nhãn pha loãng, kèm chấm màu giữ nhận
 * diện — vì nhiều màu nhãn (#0a436d) quá tối để làm màu chữ trên nền tối.
 */
export function LabelChip({
  label,
  size = "md",
  onGlass = false,
}: {
  label: BoardLabel;
  size?: "sm" | "md";
  onGlass?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md font-semibold whitespace-nowrap"
      style={{
        height: size === "sm" ? 18 : 22,
        padding: size === "sm" ? "0 6px" : "0 8px",
        fontSize: size === "sm" ? 10.5 : 11.5,
        background: onGlass ? alpha(label.color, 0.34) : alpha(label.color, 0.12),
        color: onGlass ? G.text : label.color,
        border: `1px solid ${alpha(label.color, onGlass ? 0.55 : 0.22)}`,
      }}
    >
      <span
        className="inline-block rounded-full shrink-0"
        style={{
          width: 5,
          height: 5,
          background: onGlass ? "rgba(255,255,255,.9)" : label.color,
        }}
      />
      {label.name}
    </span>
  );
}

// ==========================================
// BADGE
// ==========================================
type Tone = "muted" | "danger" | "success" | "primary";

export function Badge({
  children,
  tone = "muted",
  title,
  onGlass = false,
}: {
  children: ReactNode;
  tone?: Tone;
  title?: string;
  onGlass?: boolean;
}) {
  const light: Record<Tone, { color: string; background?: string }> = {
    muted: { color: C.mutedForeground },
    danger: { color: C.danger, background: C.danger50 },
    success: { color: C.success, background: C.success50 },
    primary: { color: C.primary, background: C.primary50 },
  };
  const glass: Record<Tone, { color: string; background?: string }> = {
    muted: { color: G.textMuted },
    danger: { color: G.danger, background: G.dangerFill },
    success: { color: G.success, background: G.successFill },
    primary: { color: G.info, background: G.infoFill },
  };

  const t = (onGlass ? glass : light)[tone];
  return (
    <span
      title={title}
      className="inline-flex items-center gap-1 text-[11.5px] leading-[18px] font-medium rounded"
      style={{
        color: t.color,
        background: t.background,
        padding: t.background ? "0 5px" : undefined,
      }}
    >
      {children}
    </span>
  );
}

// ==========================================
// NGUỒN TẠO VIỆC
// ==========================================
export function SourceIcon({
  source,
  size = 12,
  onGlass = false,
}: {
  source: CardSource;
  size?: number;
  onGlass?: boolean;
}) {
  if (source === "EMAIL")
    return (
      <Mail
        size={size}
        style={{ color: onGlass ? G.info : C.primary300 }}
        aria-label="Tạo từ email"
      />
    );
  if (source === "ZALO")
    return (
      <MessageCircle
        size={size}
        style={{ color: onGlass ? G.info : C.info }}
        aria-label="Tạo từ Zalo"
      />
    );
  return null;
}
