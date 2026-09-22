/**
 * Sinh các mốc LẶP DỰ KIẾN để vẽ lên lịch.
 *
 * VÌ SAO CẦN: một việc lặp chỉ tồn tại **một hàng** trong cơ sở dữ liệu. Backend
 * chỉ tạo lượt kế tiếp vào đúng lúc người dùng bấm hoàn thành lượt hiện tại
 * (`POST /tasks/:id/complete`). Nên "họp giao ban mỗi thứ Hai" chỉ hiện đúng
 * một ô trên lịch — ô của lượt sắp tới — còn cả tháng còn lại trống trơn.
 *
 * Hàm này tính TRƯỚC những ngày đó ở phía trình duyệt để vẽ ra. Phải hiểu rõ:
 * đây là **dự kiến**, không phải việc có thật. Chúng không có id, không sửa
 * được, không kéo thả được, và sẽ không xảy ra nếu người dùng bỏ dở chuỗi lặp.
 * Giao diện phải nói rõ điều đó — xem cách trang Lịch gắn nhãn "dự kiến".
 *
 * MÚI GIỜ: tính bằng giờ địa phương của trình duyệt. Backend tính theo múi giờ
 * của chủ việc; hai cái trùng nhau trong mọi trường hợp bình thường (người
 * dùng xem lịch của chính mình). Nếu lệch thì chỉ lệch ở phần dự kiến, dữ liệu
 * thật vẫn do backend quyết.
 *
 * Luật phải khớp `src/common/utils/recurrence.util.ts` của backend:
 *   - WEEK có chọn thứ: nhảy tới thứ gần nhất trong tập; hết tuần thì vòng
 *     sang tuần sau, cộng thêm `interval - 1` tuần nữa;
 *   - MONTH có `dayOfMonth`: tháng ngắn hơn thì KẸP về ngày cuối tháng, không
 *     tràn sang tháng sau;
 *   - dừng khi vượt `until`, hoặc khi đã sinh đủ `remaining` lượt.
 */
import dayjs, { Dayjs } from "dayjs";
import { RepeatRule } from "@/models/task";

/** Trần cứng cho mỗi việc — chặn vòng lặp vô hạn nếu luật lặp bị hỏng */
const MAX_OCCURRENCES = 60;

/** Mốc kế tiếp sau `from`, hoặc `null` khi chuỗi đã kết thúc */
function nextOccurrence(from: Dayjs, rule: RepeatRule): Dayjs | null {
  const interval = Math.max(1, Math.trunc(rule.interval));

  if (rule.unit === "WEEK" && rule.weekdays?.length) {
    const wanted = [...new Set(rule.weekdays)]
      .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
      .sort((a, b) => a - b);
    if (!wanted.length) return from.add(interval * 7, "day");

    const today = from.day(); // 0 = Chủ nhật, khớp quy ước backend
    const ahead = wanted.find((d) => d > today);
    if (ahead !== undefined) return from.add(ahead - today, "day");
    // Hết thứ trong tuần này: sang tuần đầu tiên của chu kỳ kế tiếp
    return from.add(7 - today + wanted[0] + (interval - 1) * 7, "day");
  }

  if (rule.unit === "MONTH") {
    const target = from.add(interval, "month");
    const wanted = rule.dayOfMonth ?? from.date();
    // `dayjs.add(..., "month")` đã tự kẹp (31/01 + 1 tháng = 28/02), nhưng khi
    // có `dayOfMonth` thì phải kẹp theo ngày NGƯỜI DÙNG chọn, không phải theo
    // ngày của mốc hiện tại.
    return target.date(Math.min(wanted, target.daysInMonth()));
  }

  return from.add(rule.unit === "WEEK" ? interval * 7 : interval, "day");
}

/**
 * Đúng MỘT mốc kế tiếp sau hạn hiện tại, hoặc `null` khi chuỗi đã hết.
 *
 * Tách riêng khỏi `projectOccurrences` vì màn chi tiết chỉ cần một ngày: gọi
 * hàm sinh cả dải rồi lấy phần tử đầu là chạy vòng lặp cho một kết quả bỏ đi,
 * và nó chạy lại ở mỗi lần render.
 */
export function nextOccurrenceAfter(
  currentDeadline: string | null | undefined,
  rule: RepeatRule | null | undefined,
): string | null {
  if (!currentDeadline || !rule?.unit || !rule.interval) return null;
  if (rule.remaining !== null && rule.remaining !== undefined && rule.remaining <= 0) {
    return null;
  }

  const next = nextOccurrence(dayjs(currentDeadline), rule);
  if (!next) return null;
  if (rule.until && next.isAfter(dayjs(rule.until))) return null;
  return next.toISOString();
}

export type ProjectedOccurrence = {
  /** ISO của mốc dự kiến */
  deadline: string;
  /** Lượt thứ mấy tính từ mốc hiện tại (1 = lượt kế tiếp) */
  index: number;
};

/**
 * Các mốc lặp rơi vào khoảng `[from, to]`, KHÔNG tính mốc hiện tại.
 *
 * `to` nên là cuối lưới lịch đang xem — sinh xa hơn là tính toán bỏ đi.
 */
export function projectOccurrences(
  currentDeadline: string | null | undefined,
  rule: RepeatRule | null | undefined,
  from: Dayjs,
  to: Dayjs,
): ProjectedOccurrence[] {
  if (!currentDeadline || !rule?.unit || !rule.interval) return [];

  const until = rule.until ? dayjs(rule.until) : null;
  // `remaining` = số lượt còn lại SAU lượt hiện tại. null = lặp mãi.
  const budget =
    rule.remaining === null || rule.remaining === undefined
      ? MAX_OCCURRENCES
      : Math.min(rule.remaining, MAX_OCCURRENCES);

  const out: ProjectedOccurrence[] = [];
  let cursor = dayjs(currentDeadline);

  for (let index = 1; index <= budget; index += 1) {
    const next = nextOccurrence(cursor, rule);
    if (!next) break;
    if (until && next.isAfter(until)) break;
    // Đã vượt quá khung đang xem thì dừng — các mốc chỉ tăng dần
    if (next.isAfter(to, "day")) break;

    if (!next.isBefore(from, "day")) {
      out.push({ deadline: next.toISOString(), index });
    }
    cursor = next;
  }

  return out;
}
