"use client";
/**
 * Lịch trình: mọi thứ sắp tới xếp thành một dòng thời gian dọc.
 *
 * Ba chế độ lưới (tháng/tuần/ngày) đều đánh đổi: chúng dành chỗ cho **thời
 * gian trống**, mà chỗ trống thì không cần đọc. Chế độ này bỏ hẳn lưới, chỉ
 * liệt kê những gì thật sự có — nên nó là chế độ duy nhất dùng được tử tế trên
 * màn hẹp, và cũng là chế độ trả lời nhanh nhất câu "tiếp theo là gì".
 *
 * Ngày không có gì thì KHÔNG hiện — khác hẳn lưới tháng, nơi ô trống vẫn phải
 * chiếm chỗ để giữ hình dạng lịch.
 */
import { useMemo } from "react";
import dayjs, { Dayjs } from "dayjs";
import { Empty } from "antd";
import { CalendarClock, Clock, Repeat } from "lucide-react";
import {
  ItemKind,
  PRIORITY_META,
  STATUS_META,
  Task,
  TaskStatus,
} from "@/models/task";
import { rangeText } from "./timeline";

type Entry = { task: Task; at: string; projected: boolean };

type Props = {
  /** Đã gồm cả lượt lặp dự kiến, do trang lịch tính sẵn */
  entries: Entry[];
  from: Dayjs;
  onSelect: (task: Task) => void;
};

export default function AgendaList({ entries, from, onSelect }: Props) {
  /** Gom theo ngày, bỏ qua ngày rỗng, sắp tăng dần */
  const groups = useMemo(() => {
    const byDay = new Map<string, Entry[]>();
    entries
      .filter((e) => !dayjs(e.at).isBefore(from, "day"))
      .forEach((entry) => {
        const key = dayjs(entry.at).format("YYYY-MM-DD");
        if (!byDay.has(key)) byDay.set(key, []);
        byDay.get(key)!.push(entry);
      });

    return [...byDay.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, list]) => ({
        day: dayjs(key),
        list: list.sort((a, b) => dayjs(a.at).valueOf() - dayjs(b.at).valueOf()),
      }));
  }, [entries, from]);

  if (!groups.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white py-16">
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Không có việc hay lịch hẹn nào trong khoảng này"
        />
      </div>
    );
  }

  const today = dayjs();

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      {groups.map(({ day, list }) => {
        const isToday = day.isSame(today, "day");
        return (
          <div key={day.format("YYYY-MM-DD")} className="flex gap-3 px-3 py-3 border-b border-slate-100 last:border-b-0">
            {/* Cột ngày — dính bên trái để cuộn vẫn biết đang ở hôm nào */}
            <div className="w-[64px] shrink-0 text-center">
              <div
                className={`text-[11px] font-semibold uppercase ${
                  day.day() === 0 || day.day() === 6
                    ? "text-orange-400"
                    : "text-slate-400"
                }`}
              >
                {day.format("ddd")}
              </div>
              <div
                className={`mx-auto grid place-items-center size-9 rounded-full text-[16px] font-bold ${
                  isToday ? "bg-sky-600 text-white" : "text-slate-700"
                }`}
              >
                {day.date()}
              </div>
              <div className="text-[10.5px] text-slate-400">
                {day.format("MM/YYYY")}
              </div>
            </div>

            <div className="flex-1 min-w-0 flex flex-col gap-1.5">
              {list.map(({ task, at, projected }) => {
                const isEvent = task.kind === ItemKind.EVENT;
                const color = PRIORITY_META[task.priority].color;
                const finished =
                  task.status === TaskStatus.DONE ||
                  task.status === TaskStatus.CANCELLED;
                return (
                  <button
                    key={projected ? `${task.id}@${at}` : task.id}
                    type="button"
                    onClick={() => onSelect(task)}
                    className="flex items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left
                      cursor-pointer transition hover:shadow-sm"
                    style={{
                      borderColor: projected ? "#e2e8f0" : `${color}40`,
                      borderStyle: projected ? "dashed" : "solid",
                      background: isEvent ? `${color}12` : "#fff",
                      opacity: projected ? 0.7 : 1,
                    }}
                  >
                    <span
                      className="w-1 self-stretch rounded-full shrink-0"
                      style={{ background: color }}
                    />

                    <span
                      className="inline-flex items-center gap-1 text-[11.5px] font-semibold tabular-nums shrink-0"
                      style={{ color }}
                    >
                      {isEvent ? <Clock size={11} /> : <CalendarClock size={11} />}
                      {isEvent ? rangeText(task) : dayjs(at).format("HH:mm")}
                    </span>

                    <span
                      className="flex-1 min-w-0 truncate text-[13px] text-slate-700"
                      style={{
                        textDecoration: finished ? "line-through" : undefined,
                      }}
                    >
                      {task.title}
                    </span>

                    {task.repeat && !finished && (
                      <Repeat size={12} className="shrink-0 text-sky-500" />
                    )}

                    {projected ? (
                      <span className="shrink-0 text-[10.5px] text-slate-400">
                        dự kiến
                      </span>
                    ) : (
                      <span
                        className="shrink-0 rounded px-1.5 py-0.5 text-[10.5px] font-medium"
                        style={{ background: "#f1f5f9", color: "#64748b" }}
                      >
                        {isEvent ? "lịch hẹn" : STATUS_META[task.status].label}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
