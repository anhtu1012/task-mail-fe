/**
 * Các mốc dời hạn nhanh.
 *
 * Vì sao cần: trong công cụ cá nhân, thao tác thường xuyên nhất không phải
 * "hoàn thành" mà là "hôm nay chưa làm được, để mai". Không có nút này thì
 * người dùng phải mở thẻ, mở lịch, chọn ngày — 4 bước cho một việc nghĩ 1 giây,
 * và kết cục là họ mặc kệ deadline sai, rồi cả bảng đầy việc quá hạn giả.
 */
export type SnoozeOption = {
  key: string;
  label: string;
  /** null = gỡ hạn hoàn toàn */
  resolve: (now: Date) => Date | null;
  /** Mô tả mốc thời gian đích, hiện trong menu */
  hint?: (now: Date) => string;
};

const at = (base: Date, addDays: number, hour: number, minute = 0): Date => {
  const d = new Date(base);
  d.setDate(d.getDate() + addDays);
  d.setHours(hour, minute, 0, 0);
  return d;
};

const WEEKDAY_SHORT = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

const fmtHint = (d: Date | null) =>
  d ? `${WEEKDAY_SHORT[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}` : "";

export const SNOOZE_OPTIONS: SnoozeOption[] = [
  {
    key: "later-today",
    label: "Cuối ngày hôm nay",
    resolve: (now) => at(now, 0, 18),
    hint: (now) => `${fmtHint(at(now, 0, 18))} · 18:00`,
  },
  {
    key: "tomorrow",
    label: "Sáng mai",
    resolve: (now) => at(now, 1, 9),
    hint: (now) => `${fmtHint(at(now, 1, 9))} · 09:00`,
  },
  {
    key: "next-week",
    label: "Đầu tuần sau",
    // Thứ 2 kế tiếp; nếu hôm nay đã là thứ 2 thì nhảy sang tuần sau
    resolve: (now) => at(now, ((8 - now.getDay()) % 7) || 7, 9),
    hint: (now) => `${fmtHint(at(now, ((8 - now.getDay()) % 7) || 7, 9))} · 09:00`,
  },
  {
    key: "next-month",
    label: "Tháng sau",
    resolve: (now) => {
      const d = new Date(now);
      d.setMonth(d.getMonth() + 1, 1);
      d.setHours(9, 0, 0, 0);
      return d;
    },
  },
  {
    key: "clear",
    label: "Bỏ hạn",
    resolve: () => null,
  },
];
