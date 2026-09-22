/**
 * Phần tính toán dùng chung của mọi chế độ xem theo khung giờ.
 *
 * Tách khỏi component vì chế độ Ngày và chế độ Tuần cần **đúng một** thuật
 * toán xếp khối: tuần chỉ là bảy cột ngày đặt cạnh nhau. Để mỗi bên tự xếp thì
 * cùng một lịch sẽ hiện hai kiểu khác nhau ở hai chế độ — lỗi rất khó tin khi
 * nhìn thấy, và cũng rất khó sửa vì phải nhớ có hai nơi.
 */
import dayjs, { Dayjs } from "dayjs";
import { ItemKind, Task } from "@/models/task";

export const MINUTES_PER_DAY = 24 * 60;

/**
 * Khoảng thời gian viết ra chữ.
 *
 * Kèm NGÀY khi kết thúc rơi sang hôm khác. Chỉ ghi "17:00 – 18:00" cho một sự
 * kiện kết thúc 18:00 HÔM SAU là nói dối người đọc: họ thấy một tiếng, còn
 * lịch thì vẽ khối chạy tới nửa đêm — hai thứ mâu thuẫn ngay trên cùng màn hình.
 */
export function rangeText(task: Task): string {
  if (task.allDay) return "cả ngày";
  const start = dayjs(task.startAt!);
  const end = dayjs(task.endAt!);
  return start.isSame(end, "day")
    ? `${start.format("HH:mm")} – ${end.format("HH:mm")}`
    : `${start.format("HH:mm")} – ${end.format("HH:mm")} ngày ${end.format("DD/MM")}`;
}

export type TimeBlock = {
  task: Task;
  /** % tính từ 00:00 của ngày */
  top: number;
  height: number;
  /** Cột thứ mấy trong cụm chồng giờ, và cụm đó rộng mấy cột */
  column: number;
  columns: number;
};

/** Sự kiện có khung giờ và GIAO với ngày `day` */
export function eventsOfDay(items: Task[], day: Dayjs): Task[] {
  const start = day.startOf("day");
  const end = day.endOf("day");
  return items.filter(
    (t) =>
      t.kind === ItemKind.EVENT &&
      t.startAt &&
      t.endAt &&
      !dayjs(t.startAt).isAfter(end) &&
      !dayjs(t.endAt).isBefore(start),
  );
}

/** Việc có hạn chót rơi vào ngày `day` */
export function tasksOfDay(items: Task[], day: Dayjs): Task[] {
  return items.filter(
    (t) => t.kind !== ItemKind.EVENT && t.deadline && dayjs(t.deadline).isSame(day, "day"),
  );
}

/**
 * Xếp sự kiện của MỘT ngày thành các khối có vị trí và bề ngang.
 *
 * Sự kiện chồng giờ nhau thì chia đôi chiều ngang. Gom thành từng CỤM giao
 * nhau rồi chia đều trong cụm — chia theo từng cặp sẽ cho ra các khối rộng
 * khác nhau ở cùng một khung giờ, nhìn rất lệch.
 */
export function layoutDay(events: Task[], day: Dayjs): TimeBlock[] {
  const dayStart = day.startOf("day");
  const sorted = [...events].sort(
    (a, b) => dayjs(a.startAt!).valueOf() - dayjs(b.startAt!).valueOf(),
  );

  const out: TimeBlock[] = [];
  let cluster: Task[] = [];
  let clusterEnd = 0;

  const flush = () => {
    cluster.forEach((task, index) => {
      // Cắt theo ngày đang xem: sự kiện nhiều ngày chỉ vẽ phần thuộc hôm đó
      const from = Math.max(dayjs(task.startAt!).diff(dayStart, "minute"), 0);
      const to = Math.min(
        dayjs(task.endAt!).diff(dayStart, "minute"),
        MINUTES_PER_DAY,
      );
      out.push({
        task,
        top: (from / MINUTES_PER_DAY) * 100,
        // Tối thiểu 2.2% (~30 phút): sự kiện 10 phút vẽ đúng tỉ lệ thì thành
        // một vạch không đọc được chữ nào
        height: Math.max(2.2, ((to - from) / MINUTES_PER_DAY) * 100),
        column: index,
        columns: cluster.length,
      });
    });
    cluster = [];
    clusterEnd = 0;
  };

  sorted.forEach((task) => {
    const start = dayjs(task.startAt!).valueOf();
    if (cluster.length && start >= clusterEnd) flush();
    cluster.push(task);
    clusterEnd = Math.max(clusterEnd, dayjs(task.endAt!).valueOf());
  });
  flush();

  return out;
}
