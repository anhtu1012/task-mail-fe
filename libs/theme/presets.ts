/**
 * Nguồn dữ liệu cho hệ thống giao diện toàn hệ thống.
 *
 * Mọi thứ người dùng chọn được quy về vài biến CSS đặt trên <html>, nên thêm
 * một preset mới chỉ là thêm một phần tử vào mảng dưới đây — không phải sửa
 * component nào cả.
 */

export type BackgroundKind = "image" | "gradient" | "solid";

export interface BackgroundPreset {
  id: string;
  name: string;
  kind: BackgroundKind;
  /** Giá trị cho background-image của lớp nền (url(...) | linear-gradient(...) | none) */
  image: string;
  /** Màu nền phẳng nằm dưới, cũng là màu dự phòng khi ảnh chưa tải xong */
  color: string;
  /**
   * Nền tối hay sáng — quyết định lớp phủ và màu chữ trên vùng kính
   * (thanh điều hướng, màn Bảng công việc).
   */
  tone: "dark" | "light";
  /** Nền hiển thị trong ô chọn ở phần Cài đặt */
  thumb: string;
}

export const BACKGROUNDS: BackgroundPreset[] = [
  {
    id: "plain",
    name: "Trắng tinh",
    kind: "solid",
    image: "none",
    color: "#f7f8fa",
    tone: "light",
    thumb: "linear-gradient(140deg,#ffffff,#eef1f5)",
  },
  {
    id: "harbour",
    name: "Cảng biển",
    kind: "image",
    image: 'url("/images/bg.webp")',
    color: "#062b47",
    tone: "dark",
    thumb: 'url("/images/bg.webp") center/cover',
  },
  {
    id: "midnight",
    name: "Đêm xanh",
    kind: "gradient",
    image:
      "radial-gradient(120% 90% at 10% 0%, #0a436d 0%, transparent 58%), linear-gradient(165deg,#021321 0%,#062b47 55%,#08375a 100%)",
    color: "#021321",
    tone: "dark",
    thumb: "linear-gradient(140deg,#0a436d,#021321)",
  },
  {
    id: "teal",
    name: "Ngọc lục",
    kind: "gradient",
    image:
      "radial-gradient(120% 90% at 85% 0%, #2a9d8f 0%, transparent 55%), linear-gradient(165deg,#04272b 0%,#0a3f42 60%,#10565a 100%)",
    color: "#04272b",
    tone: "dark",
    thumb: "linear-gradient(140deg,#2a9d8f,#04272b)",
  },
  {
    id: "plum",
    name: "Tím mận",
    kind: "gradient",
    image:
      "radial-gradient(120% 90% at 20% 0%, #6d28d9 0%, transparent 58%), linear-gradient(165deg,#1b1032 0%,#2b1b4d 55%,#3b2568 100%)",
    color: "#1b1032",
    tone: "dark",
    thumb: "linear-gradient(140deg,#7c3aed,#1b1032)",
  },
  {
    id: "sunset",
    name: "Hoàng hôn",
    kind: "gradient",
    image:
      "radial-gradient(120% 90% at 80% 10%, #f4a261 0%, transparent 52%), linear-gradient(165deg,#3a1b16 0%,#5b2a1f 55%,#7a3b28 100%)",
    color: "#3a1b16",
    tone: "dark",
    thumb: "linear-gradient(140deg,#f4a261,#3a1b16)",
  },
  {
    id: "mist",
    name: "Sương sớm",
    kind: "gradient",
    image:
      "radial-gradient(110% 80% at 0% 0%, #dbeafe 0%, transparent 60%), linear-gradient(160deg,#f8fafc 0%,#eef2f7 60%,#e2e8f0 100%)",
    color: "#f1f5f9",
    tone: "light",
    thumb: "linear-gradient(140deg,#dbeafe,#e2e8f0)",
  },
];

export interface AccentPreset {
  id: string;
  name: string;
  color: string;
}

export const ACCENTS: AccentPreset[] = [
  { id: "navy", name: "Xanh hải quân", color: "#0a436d" },
  { id: "indigo", name: "Chàm", color: "#4f46e5" },
  { id: "violet", name: "Tím", color: "#7c3aed" },
  { id: "teal", name: "Ngọc", color: "#2a9d8f" },
  { id: "emerald", name: "Lục", color: "#059669" },
  { id: "amber", name: "Hổ phách", color: "#d97706" },
  { id: "rose", name: "Hồng đào", color: "#e11d48" },
  { id: "slate", name: "Đá xám", color: "#475569" },
];

export interface ThemeState {
  /** id của BACKGROUNDS */
  background: string;
  /** màu nhấn dạng #rrggbb */
  accent: string;
  /** độ đục của khung nội dung, 0.5 – 1 */
  surfaceOpacity: number;
  /** độ mờ kính sau khung nội dung, 0 – 28 (px) */
  surfaceBlur: number;
}

export const DEFAULT_THEME: ThemeState = {
  background: "harbour",
  accent: "#0a436d",
  surfaceOpacity: 0.7,
  surfaceBlur: 16,
};

export const THEME_STORAGE_KEY = "task-app-theme";

/** Khớp ACCENT_PATTERN của backend (src/modules/preferences/theme.constants.ts) */
export const ACCENT_PATTERN = /^#[0-9a-fA-F]{6}$/;

/* ------------------------------------------------------------------ */
/*  Tiện ích màu                                                       */
/* ------------------------------------------------------------------ */

const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

/** #rgb | #rrggbb -> [r,g,b] */
export function hexToRgb(hex: string): [number, number, number] {
  const v = hex.replace("#", "").trim();
  const full =
    v.length === 3
      ? v
          .split("")
          .map((c) => c + c)
          .join("")
      : v.padEnd(6, "0").slice(0, 6);
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgba(hex: string, a: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/** Trộn màu về phía đen (amount < 0) hoặc trắng (amount > 0), amount ∈ [-1, 1] */
export function shade(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const target = amount > 0 ? 255 : 0;
  const t = Math.abs(amount);
  const mix = (c: number) => Math.round(c + (target - c) * t);
  return `#${[mix(r), mix(g), mix(b)]
    .map((c) => clamp(c, 0, 255).toString(16).padStart(2, "0"))
    .join("")}`;
}

/** Độ sáng cảm nhận (WCAG relative luminance) */
export function luminance(hex: string): number {
  const srgb = hexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

/** Màu chữ đọc được khi đặt trên nền `hex` */
export function readableOn(hex: string): string {
  return luminance(hex) > 0.45 ? "#0f172a" : "#ffffff";
}

/**
 * Bậc thang độ đục của các lớp bề mặt, tính từ một con số duy nhất người dùng kéo.
 *
 * Thẻ/bảng nằm CHỒNG lên khung nội dung nên độ đục nhìn thấy là kết quả cộng
 * dồn: 1-(1-panel)(1-card). Vì vậy card phải nhạt hơn panel, nếu để bằng nhau
 * thì chồng hai lớp là đặc kín và chẳng còn thấy ảnh nền nữa.
 */
export function surfaceAlphas(opacity: number) {
  // Sàn 0.5: thấp hơn thì chữ tối trên kính đặt trên ảnh tối chỉ còn ~3.8:1,
  // dưới ngưỡng WCAG AA 4.5:1. Đo ở vùng tối nhất của ảnh nền.
  const panel = clamp(opacity, 0.5, 1);
  const card = clamp(panel * 0.55, 0.1, 0.85);
  return {
    panel,
    card,
    /* Đầu bảng đậm hơn thân một chút để vẫn tách được khỏi dữ liệu */
    head: clamp(card * 1.3, 0.12, 0.9),
    hover: clamp(card * 1.5, 0.14, 0.92),
  };
}

/**
 * Độ đục lớp kính của màn Bảng công việc, cũng tính từ đúng con số đó.
 *
 * Nền tối thì kính là màn trắng mỏng phủ lên ảnh; nền sáng thì phải dày hơn
 * hẳn vì chữ lúc đó là màu tối, cần nền sáng phía sau mới đọc được.
 */
export function boardGlassAlpha(opacity: number, tone: "dark" | "light") {
  const panel = clamp(opacity, 0.5, 1);
  return tone === "dark"
    ? clamp(panel * 0.3, 0.1, 0.42)
    : clamp(panel * 0.8, 0.45, 0.95);
}

export function findBackground(id: string): BackgroundPreset {
  return BACKGROUNDS.find((b) => b.id === id) ?? BACKGROUNDS[0];
}

/**
 * Quy toàn bộ lựa chọn về các biến CSS.
 *
 * Tách riêng khỏi React để dùng lại được trong đoạn script chạy trước khi
 * hydrate — nếu không, mở trang sẽ thấy nháy giao diện mặc định một nhịp.
 */
export function themeToCssVars(theme: ThemeState): Record<string, string> {
  const bg = findBackground(theme.background);
  const dark = bg.tone === "dark";
  const accent = theme.accent;
  const a = surfaceAlphas(theme.surfaceOpacity);
  const glass = boardGlassAlpha(theme.surfaceOpacity, bg.tone);

  return {
    "--app-bg-image": bg.image,
    "--app-bg-color": bg.color,
    /*
     * Lớp phủ của khung ngoài chỉ để tạo chiều sâu — cố tình nhạt, vì mục đích
     * của tính năng này là NHÌN THẤY ảnh nền. Chỗ cần tương phản mạnh là màn
     * Bảng công việc, dùng --board-overlay riêng bên dưới.
     */
    "--app-overlay": dark
      ? `radial-gradient(120% 80% at 20% 0%, ${rgba(accent, 0.3)} 0%, transparent 62%), linear-gradient(165deg, rgba(2,19,33,.3) 0%, rgba(4,31,52,.46) 100%)`
      : `linear-gradient(165deg, rgba(255,255,255,.28) 0%, rgba(255,255,255,.12) 100%)`,
    "--app-tone": bg.tone,
    /*
     * Màn Bảng công việc dùng chung nền và chung con số độ trong với phần còn
     * lại của hệ thống; chỉ lớp phủ và bảng màu chữ là đổi theo nền tối/sáng.
     */
    "--board-overlay": dark
      ? `radial-gradient(120% 80% at 20% 0%, ${rgba(accent, 0.45)} 0%, transparent 60%), linear-gradient(165deg, rgba(2,19,33,.82) 0%, rgba(3,26,45,.85) 45%, rgba(4,31,52,.88) 100%)`
      : `radial-gradient(120% 80% at 20% 0%, ${rgba(accent, 0.12)} 0%, transparent 60%), linear-gradient(165deg, rgba(255,255,255,.62) 0%, rgba(248,250,252,.7) 100%)`,
    "--g-panel": `rgba(255, 255, 255, ${glass})`,
    "--g-panel-strong": `rgba(255, 255, 255, ${clamp(glass * 1.25, 0.12, 0.98)})`,
    ...(dark
      ? {
          "--g-text": "#ffffff",
          "--g-text-soft": "rgba(255,255,255,.84)",
          "--g-text-muted": "rgba(255,255,255,.74)",
          "--g-text-faint": "rgba(255,255,255,.58)",
          "--g-line": "rgba(255,255,255,.18)",
          "--g-fill": "rgba(255,255,255,.14)",
          "--g-fill-strong": "rgba(255,255,255,.24)",
          "--g-danger": "#ffb3ba",
          "--g-danger-fill": "rgba(230,57,70,.3)",
          "--g-success": "#7fe0d0",
          "--g-success-fill": "rgba(42,157,143,.28)",
          "--g-warning": "#ffd29b",
          "--g-warning-fill": "rgba(244,162,97,.28)",
          "--g-info": "#bee0f4",
          "--g-info-fill": "rgba(81,150,191,.3)",
        }
      : {
          "--g-text": "#0f172a",
          "--g-text-soft": "rgba(15,23,42,.78)",
          "--g-text-muted": "rgba(15,23,42,.6)",
          "--g-text-faint": "rgba(15,23,42,.42)",
          "--g-line": "rgba(15,23,42,.12)",
          "--g-fill": "rgba(15,23,42,.06)",
          "--g-fill-strong": "rgba(15,23,42,.12)",
          "--g-danger": "#b91c1c",
          "--g-danger-fill": "rgba(230,57,70,.14)",
          "--g-success": "#0f766e",
          "--g-success-fill": "rgba(42,157,143,.16)",
          "--g-warning": "#b45309",
          "--g-warning-fill": "rgba(244,162,97,.18)",
          "--g-info": "#0369a1",
          "--g-info-fill": "rgba(14,165,233,.14)",
        }),

    "--accent": accent,
    "--accent-ink": readableOn(accent),
    "--accent-soft": rgba(accent, 0.12),
    "--accent-line": rgba(accent, 0.28),
    "--accent-dark": shade(accent, -0.35),
    "--accent-darker": shade(accent, -0.55),
    "--accent-light": shade(accent, 0.35),

    /* Thanh điều hướng dựng từ màu nhấn để luôn ăn khớp với nền */
    "--rail-1": shade(accent, -0.12),
    "--rail-2": accent,
    "--rail-3": shade(accent, -0.42),
    "--rail-shadow": rgba(shade(accent, -0.6), 0.75),

    /* Khung nội dung và các lớp bề mặt bên trong */
    "--surface": `rgba(255, 255, 255, ${a.panel})`,
    "--surface-card": `rgba(255, 255, 255, ${a.card})`,
    "--surface-head": `rgba(255, 255, 255, ${a.head})`,
    "--surface-hover": `rgba(255, 255, 255, ${a.hover})`,
    "--surface-blur": `${theme.surfaceBlur}px`,
    "--surface-border": dark
      ? "rgba(255,255,255,.28)"
      : "rgba(15,23,42,.08)",
    "--surface-shadow": dark
      ? "0 24px 60px -30px rgba(2,19,33,.85)"
      : "0 18px 44px -30px rgba(10,44,71,.45)",
  };
}

/**
 * Ép một object bất kỳ về đúng hình dạng `ThemeState` hợp lệ.
 *
 * Dùng ở cả hai đầu: đọc từ localStorage và ngay trước khi gửi lên server.
 * Backend bật `forbidNonWhitelisted` nên body **phải đúng bốn trường, không
 * thừa không thiếu** — chỉ cần lọt một khoá lạ là 422. Hàm này liệt kê từng
 * trường một nên không có đường nào để khoá lạ đi qua.
 */
export function normalizeTheme(input: Partial<ThemeState> | undefined): ThemeState {
  const source = input ?? {};
  return {
    background:
      typeof source.background === "string" &&
      BACKGROUNDS.some((b) => b.id === source.background)
        ? source.background
        : DEFAULT_THEME.background,
    accent:
      typeof source.accent === "string" && ACCENT_PATTERN.test(source.accent)
        ? source.accent
        : DEFAULT_THEME.accent,
    surfaceOpacity: clamp(
      Number(source.surfaceOpacity ?? DEFAULT_THEME.surfaceOpacity),
      0.5,
      1,
    ),
    // Backend ràng buộc @IsInt — 16.5 lọt qua là 422, và vì FE nuốt lỗi im
    // lặng nên sẽ hỏng mà không ai biết. Làm tròn ngay từ đây.
    surfaceBlur: Math.round(
      clamp(Number(source.surfaceBlur ?? DEFAULT_THEME.surfaceBlur), 0, 28),
    ),
  };
}

/**
 * So sánh theo từng trường, KHÔNG dùng JSON.stringify: thứ tự khoá của object
 * trả về từ server không nhất thiết trùng thứ tự khai ở đây, mà lệch thứ tự là
 * stringify ra hai chuỗi khác nhau dù nội dung y hệt.
 */
export function isSameTheme(a: ThemeState, b: ThemeState): boolean {
  return (
    a.background === b.background &&
    a.accent.toLowerCase() === b.accent.toLowerCase() &&
    a.surfaceOpacity === b.surfaceOpacity &&
    a.surfaceBlur === b.surfaceBlur
  );
}

/** Đọc lựa chọn đã lưu; hỏng dữ liệu thì trả mặc định chứ không ném lỗi */
export function readStoredTheme(): ThemeState {
  if (typeof window === "undefined") return DEFAULT_THEME;
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (!raw) return DEFAULT_THEME;
    return normalizeTheme(JSON.parse(raw) as Partial<ThemeState>);
  } catch {
    return DEFAULT_THEME;
  }
}
