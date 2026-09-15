/**
 * Tách tiêu đề công việc viết tự nhiên thành dữ liệu có cấu trúc.
 *
 * Ví dụ:
 *   "Gọi khách hàng Hải An mai 9h !gap #baogia 30p"
 *   -> title "Gọi khách hàng Hải An"
 *      deadline ngày mai 09:00 · priority URGENT · nhãn baogia · 30 phút
 *
 * Vì sao đáng làm: với công cụ cá nhân, thứ giết trải nghiệm nhất là phải mở
 * form 6 ô để ghi một việc nghĩ ra trong 3 giây. Gõ một dòng rồi Enter thì
 * người dùng mới thực sự ghi lại mọi thứ.
 *
 * Toàn bộ hàm dưới đây thuần tuý, không phụ thuộc React — test được độc lập.
 */
import { TaskPriority } from "@/models/task";

export type QuickParsed = {
  title: string;
  deadline: string | null;
  priority: TaskPriority | null;
  labelSlugs: string[];
  estimateMinutes: number | null;
  /** Các đoạn đã được nhận diện, để tô sáng trong ô nhập */
  matches: { text: string; kind: "date" | "priority" | "label" | "estimate" }[];
};

const WEEKDAYS: Record<string, number> = {
  "chu nhat": 0, cn: 0,
  "thu 2": 1, t2: 1, "thu hai": 1,
  "thu 3": 2, t3: 2, "thu ba": 2,
  "thu 4": 3, t4: 3, "thu tu": 3,
  "thu 5": 4, t5: 4, "thu nam": 4,
  "thu 6": 5, t6: 5, "thu sau": 5,
  "thu 7": 6, t7: 6, "thu bay": 6,
};

const PRIORITY_WORDS: Record<string, TaskPriority> = {
  gap: TaskPriority.URGENT,
  khan: TaskPriority.URGENT,
  urgent: TaskPriority.URGENT,
  cao: TaskPriority.HIGH,
  high: TaskPriority.HIGH,
  thap: TaskPriority.LOW,
  low: TaskPriority.LOW,
};

/** Bỏ dấu tiếng Việt để so khớp từ khoá không phụ thuộc cách gõ */
export const deaccent = (s: string): string =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();

const atTime = (base: Date, hour: number, minute: number): Date => {
  const d = new Date(base);
  d.setHours(hour, minute, 0, 0);
  return d;
};

const addDays = (base: Date, n: number): Date => {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
};

/**
 * @param input  chuỗi người dùng gõ
 * @param now    mốc "bây giờ" — truyền vào để test được và để tránh
 *               kết quả phụ thuộc đồng hồ khi render
 */
export function quickParse(input: string, now: Date = new Date()): QuickParsed {
  const matches: QuickParsed["matches"] = [];
  let rest = ` ${input} `;

  // ---- 1. Nhãn: #slug ----
  const labelSlugs: string[] = [];
  rest = rest.replace(/#([\p{L}\p{N}_-]+)/gu, (full, slug: string) => {
    labelSlugs.push(deaccent(slug));
    matches.push({ text: full, kind: "label" });
    return " ";
  });

  // ---- 2. Ưu tiên: !gap / !cao / !thap ----
  let priority: TaskPriority | null = null;
  rest = rest.replace(/!([\p{L}]+)/gu, (full, word: string) => {
    const hit = PRIORITY_WORDS[deaccent(word)];
    if (!hit) return full;
    priority = hit;
    matches.push({ text: full, kind: "priority" });
    return " ";
  });

  // ---- 3. Thời lượng: 30p / 45 phut / 2h30 / 1h ----
  let estimateMinutes: number | null = null;
  rest = rest.replace(
    /(\d{1,3})\s*(phut|phút|p)\b/giu,
    (full, n: string) => {
      estimateMinutes = parseInt(n, 10);
      matches.push({ text: full.trim(), kind: "estimate" });
      return " ";
    },
  );

  // ---- 4. Ngày ----
  let day: Date | null = null;
  const consumeDay = (re: RegExp, resolve: (m: RegExpMatchArray) => Date) => {
    if (day) return;
    const m = deaccent(rest).match(re);
    if (!m) return;
    day = resolve(m);
    // Cắt đúng đoạn đã khớp trên chuỗi gốc (cùng vị trí vì deaccent giữ độ dài)
    const start = m.index!;
    matches.push({ text: rest.slice(start, start + m[0].length).trim(), kind: "date" });
    rest = rest.slice(0, start) + " " + rest.slice(start + m[0].length);
  };

  consumeDay(/\bhom nay\b|\bnay\b(?!\s*mai)/, () => now);
  consumeDay(/\bngay mai\b|\bmai\b/, () => addDays(now, 1));
  consumeDay(/\bngay kia\b|\bmot\b/, () => addDays(now, 2));
  consumeDay(/\btuan sau\b|\btuan toi\b/, () => addDays(now, 7));
  consumeDay(/\bthang sau\b|\bthang toi\b/, () => addDays(now, 30));

  // dd/mm hoặc dd/mm/yyyy
  consumeDay(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?\b/, (m) => {
    const d = new Date(now);
    d.setFullYear(m[3] ? parseInt(m[3], 10) : now.getFullYear());
    d.setMonth(parseInt(m[2], 10) - 1, parseInt(m[1], 10));
    // Ngày đã qua trong năm nay mà không ghi năm -> hiểu là năm sau
    if (!m[3] && d.getTime() < now.getTime() - 86400000) d.setFullYear(d.getFullYear() + 1);
    return d;
  });

  // thứ 2..CN -> lần xuất hiện kế tiếp
  consumeDay(
    /\b(thu\s?[2-7]|t[2-7]\b|chu nhat|cn)\b/,
    (m) => {
      const key = m[1].replace(/\s+/g, " ").trim();
      const target = WEEKDAYS[key] ?? WEEKDAYS[key.replace(" ", "")];
      if (target === undefined) return now;
      const diff = (target - now.getDay() + 7) % 7 || 7;
      return addDays(now, diff);
    },
  );

  // ---- 5. Giờ: 9h, 9h30, 14:00 ----
  let hour: number | null = null;
  let minute = 0;
  {
    const m = deaccent(rest).match(/\b(\d{1,2})\s*(?:h|:)\s*(\d{2})?\b/);
    if (m) {
      const h = parseInt(m[1], 10);
      if (h <= 23) {
        hour = h;
        minute = m[2] ? parseInt(m[2], 10) : 0;
        const start = m.index!;
        matches.push({ text: rest.slice(start, start + m[0].length).trim(), kind: "date" });
        rest = rest.slice(0, start) + " " + rest.slice(start + m[0].length);
      }
    }
  }

  let deadline: string | null = null;
  if (day || hour !== null) {
    const base = day ?? now;
    // Có ngày mà không có giờ -> mặc định 17:00 (cuối giờ làm)
    const withTime = atTime(base, hour ?? 17, minute);
    // Chỉ có giờ, mà giờ đó đã qua -> hiểu là ngày mai
    if (!day && withTime.getTime() < now.getTime()) withTime.setDate(withTime.getDate() + 1);
    deadline = withTime.toISOString();
  }

  const title = rest.replace(/\s{2,}/g, " ").trim();

  return {
    // Gõ toàn ký hiệu mà không có chữ nào -> giữ nguyên chuỗi gốc làm tiêu đề
    title: title || input.trim(),
    deadline,
    priority,
    labelSlugs,
    estimateMinutes,
    matches,
  };
}

/** Gợi ý cú pháp hiện dưới ô nhập */
export const QUICK_ADD_HINTS = [
  { syntax: "mai 9h", meaning: "đặt hạn" },
  { syntax: "thứ 5", meaning: "ngày trong tuần" },
  { syntax: "20/10", meaning: "ngày cụ thể" },
  { syntax: "!gấp", meaning: "ưu tiên" },
  { syntax: "#nhãn", meaning: "gắn nhãn" },
  { syntax: "30p", meaning: "thời lượng" },
];
