import dayjs from "dayjs";

export type DeadlineTone = "overdue" | "soon" | "normal" | "done";

/**
 * Hạn chót viết theo cách người ta nói: "Hôm nay 14:00", "Mai 09:00",
 * "Quá hạn 2 ngày" — trên điện thoại liếc một cái phải hiểu, không phải đọc
 * "14:00 26/09" rồi tự nhẩm xem đó là hôm nào.
 */
export function formatDeadline(
  iso: string,
  done: boolean,
  now = dayjs(),
): { text: string; tone: DeadlineTone } {
  const d = dayjs(iso);
  const time = d.format("HH:mm");

  if (done) return { text: d.format("HH:mm DD/MM"), tone: "done" };

  if (d.isBefore(now)) {
    const days = now.startOf("day").diff(d.startOf("day"), "day");
    if (days === 0) return { text: `Quá hạn · ${time}`, tone: "overdue" };
    return { text: `Quá hạn ${days} ngày`, tone: "overdue" };
  }

  const days = d.startOf("day").diff(now.startOf("day"), "day");
  if (days === 0) return { text: `Hôm nay ${time}`, tone: "soon" };
  if (days === 1) return { text: `Mai ${time}`, tone: "normal" };
  if (days < 7) {
    // "Thứ 5 09:00" — trong tuần thì thứ dễ hình dung hơn ngày tháng
    const weekday = d.day() === 0 ? "CN" : `Thứ ${d.day() + 1}`;
    return { text: `${weekday} ${time}`, tone: "normal" };
  }
  return { text: d.format("DD/MM HH:mm"), tone: "normal" };
}
