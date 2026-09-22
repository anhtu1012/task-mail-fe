"use client";
/**
 * Xem một TUẦN theo khung giờ — bảy cột ngày đặt cạnh nhau.
 *
 * Đây là chế độ dùng nhiều nhất khi lên kế hoạch: tháng cho biết bận chỗ nào,
 * ngày cho biết hôm nay còn chỗ trống nào, còn tuần trả lời câu ở giữa — "dời
 * cuộc họp này sang hôm nào thì hợp".
 *
 * Dùng chung `layoutDay` với chế độ Ngày: một tuần chỉ là bảy lần xếp khối của
 * một ngày. Không viết lại thuật toán thứ hai.
 */
import { useMemo } from "react";
import dayjs, { Dayjs } from "dayjs";
import { PRIORITY_META, Task, TaskStatus } from "@/models/task";
import {
  eventsOfDay,
  layoutDay,
  rangeText,
  tasksOfDay,
} from "./timeline";

/** Cao đủ để nhãn giờ không chồng nhau, thấp đủ để vừa màn hình phổ biến */
const GRID_HEIGHT = "clamp(460px, 58vh, 720px)";
const GUTTER = 54;

type Props = {
  /** Ngày đầu tuần (thứ Hai) */
  weekStart: Dayjs;
  items: Task[];
  onSelect: (task: Task) => void;
  onCreateAt: (at: Dayjs) => void;
  /** Bấm số ngày -> mở chế độ xem ngày đó */
  onPickDay: (day: Dayjs) => void;
};

export default function WeekTimeline({
  weekStart,
  items,
  onSelect,
  onCreateAt,
  onPickDay,
}: Props) {
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => weekStart.add(i, "day")),
    [weekStart],
  );

  /** Mỗi ngày một tập khối, xếp độc lập — cột này không ảnh hưởng cột kia */
  const columns = useMemo(
    () =>
      days.map((day) => ({
        day,
        blocks: layoutDay(eventsOfDay(items, day), day),
        tasks: tasksOfDay(items, day),
      })),
    [days, items],
  );

  const now = dayjs();
  const nowTop = (now.diff(now.startOf("day"), "minute") / (24 * 60)) * 100;
  const todayIndex = days.findIndex((d) => d.isSame(now, "day"));

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      {/* Hàng đầu: thứ + ngày, cùng lưới cột với phần giờ bên dưới */}
      <div
        className="grid border-b border-slate-200 bg-slate-50/70"
        style={{ gridTemplateColumns: `${GUTTER}px repeat(7, minmax(0, 1fr))` }}
      >
        <div />
        {days.map((day) => {
          const isToday = day.isSame(now, "day");
          const isWeekend = day.day() === 0 || day.day() === 6;
          return (
            <button
              key={day.format("YYYY-MM-DD")}
              type="button"
              onClick={() => onPickDay(day)}
              title="Xem riêng ngày này"
              className="flex flex-col items-center gap-0.5 border-l border-slate-200 py-2
                border-0 bg-transparent cursor-pointer hover:bg-white"
            >
              <span
                className={`text-[11px] font-semibold uppercase ${
                  isWeekend ? "text-orange-400" : "text-slate-400"
                }`}
              >
                {day.format("ddd")}
              </span>
              <span
                className={`grid place-items-center size-7 rounded-full text-[13px] font-semibold ${
                  isToday ? "bg-sky-600 text-white" : "text-slate-600"
                }`}
              >
                {day.date()}
              </span>

              {/* Việc đến hạn: chỉ đếm, không liệt kê — cột tuần quá hẹp cho chữ */}
              {columns[days.indexOf(day)]?.tasks.length > 0 && (
                <span className="text-[10.5px] font-medium text-sky-600">
                  {columns[days.indexOf(day)].tasks.length} việc đến hạn
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="relative pt-2 pb-1" style={{ height: GRID_HEIGHT }}>
        <div className="relative h-full">
          {/* Máng giờ + nhãn */}
          <div
            className="absolute inset-y-0 left-0 border-r border-slate-200 bg-slate-50/70"
            style={{ width: GUTTER }}
          />
          {Array.from({ length: 24 }, (_, hour) => (
            <div
              key={hour}
              className="absolute left-0 right-0"
              style={{ top: `${(hour / 24) * 100}%`, height: `${100 / 24}%` }}
            >
              <span
                className="absolute right-0 left-0 top-0 border-t border-slate-200/70"
                style={{ marginLeft: GUTTER }}
              />
              <span
                className="absolute left-0 text-right text-[10.5px] font-medium tabular-nums text-slate-400"
                style={{ width: GUTTER - 8, top: -7 }}
              >
                {String(hour).padStart(2, "0")}:00
              </span>
            </div>
          ))}

          {/* Bảy cột ngày */}
          <div
            className="absolute inset-0 grid"
            style={{ gridTemplateColumns: `${GUTTER}px repeat(7, minmax(0, 1fr))` }}
          >
            <div />
            {columns.map(({ day, blocks }, index) => {
              const isWeekend = day.day() === 0 || day.day() === 6;
              return (
                <div
                  key={day.format("YYYY-MM-DD")}
                  className={`relative border-l border-slate-200 ${
                    isWeekend ? "bg-slate-50/50" : ""
                  }`}
                >
                  {/* Vùng bấm để tạo: một nút cho mỗi giờ */}
                  {Array.from({ length: 24 }, (_, hour) => (
                    <button
                      key={hour}
                      type="button"
                      aria-label={`Tạo lịch hẹn ${day.format("DD/MM")} lúc ${hour}:00`}
                      onClick={() => onCreateAt(day.hour(hour).minute(0))}
                      className="absolute left-0 right-0 border-0 bg-transparent cursor-pointer
                        transition-colors hover:bg-sky-100/50"
                      style={{ top: `${(hour / 24) * 100}%`, height: `${100 / 24}%` }}
                    />
                  ))}

                  {blocks.map((block) => {
                    const { task } = block;
                    const color = PRIORITY_META[task.priority].color;
                    const width = `calc(100% / ${block.columns} - 2px)`;
                    return (
                      <button
                        key={task.id}
                        type="button"
                        onClick={() => onSelect(task)}
                        title={`${task.code} — ${task.title} · ${rangeText(task)}`}
                        className="absolute z-10 overflow-hidden rounded-md border-0 cursor-pointer
                          px-1.5 py-[2px] text-left transition hover:z-20 hover:brightness-95"
                        style={{
                          top: `${block.top}%`,
                          height: `${block.height}%`,
                          left: `calc(1px + ${block.column} * (${width} + 2px))`,
                          width,
                          background: color,
                          boxShadow: `inset 2px 0 0 rgba(255,255,255,.45), 0 1px 2px ${color}59`,
                          textDecoration:
                            task.status === TaskStatus.DONE ? "line-through" : undefined,
                        }}
                      >
                        {/* Cột tuần hẹp: chỉ đủ chỗ cho giờ bắt đầu + tiêu đề */}
                        <div className="truncate text-[10.5px] font-medium text-white">
                          {!task.allDay && (
                            <span className="tabular-nums mr-1 text-white/85">
                              {dayjs(task.startAt!).format("HH:mm")}
                            </span>
                          )}
                          {task.title}
                        </div>
                      </button>
                    );
                  })}

                  {/* Vạch giờ hiện tại, chỉ vẽ ở cột hôm nay */}
                  {index === todayIndex && (
                    <div
                      className="pointer-events-none absolute left-0 right-0 z-20 flex items-center"
                      style={{ top: `${nowTop}%` }}
                    >
                      <span className="size-1.5 rounded-full bg-red-500 shrink-0" />
                      <span className="h-px flex-1 bg-red-500" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
