"use client";
/**
 * Xem một ngày theo KHUNG GIỜ.
 *
 * Lưới tháng trả lời "tháng này bận chỗ nào"; nó không trả lời được "9 giờ
 * sáng mai tôi có trống không" — vì mọi thứ trong một ô ngày đều cùng kích
 * thước, dù là cuộc họp 15 phút hay buổi dạy 3 tiếng.
 *
 * Màn này vẽ thời gian theo chiều dọc: mỗi giờ một hàng cao bằng nhau, sự kiện
 * là khối đặt đúng vị trí bắt đầu và cao đúng bằng thời lượng. Nhìn một cái là
 * thấy chỗ trống.
 *
 * Việc (TASK) không có khoảng thời gian nên không vẽ thành khối được — chúng
 * nằm thành một dải riêng phía trên, đánh dấu ở mốc hạn chót.
 */
import { useMemo } from "react";
import dayjs, { Dayjs } from "dayjs";
import { CalendarClock, Clock } from "lucide-react";
import { PRIORITY_META, Task, TaskStatus } from "@/models/task";
import {
  eventsOfDay,
  layoutDay,
  rangeText,
  TimeBlock,
  tasksOfDay,
} from "./timeline";

export { rangeText };

/**
 * TRỌN 24 GIỜ TRONG MỘT MÀN, không cuộn.
 *
 * Vì thế mọi thứ bên trong định vị bằng PHẦN TRĂM của chiều cao khung, không
 * phải pixel: khung cao bao nhiêu thì một giờ chiếm 1/24 chừng ấy. Đổi sang
 * pixel cố định là quay lại phải cuộn.
 *
 * Cái giá phải trả: ở chiều cao thường gặp, một giờ chỉ còn ~26px nên sự kiện
 * ngắn không đủ chỗ cho hai dòng chữ — khối dưới 34px chỉ hiện tiêu đề.
 */
const MINUTES_PER_DAY = 24 * 60;
/** Cao đủ để nhãn giờ không chồng nhau, thấp đủ để vừa màn hình phổ biến */
const GRID_HEIGHT = "clamp(460px, 62vh, 760px)";

type Props = {
  day: Dayjs;
  items: Task[];
  onSelect: (task: Task) => void;
  /** Bấm vào một khoảng trống -> tạo lịch hẹn bắt đầu từ giờ đó */
  onCreateAt: (at: Dayjs) => void;
};

export default function DayTimeline({ day, items, onSelect, onCreateAt }: Props) {
  const dayStart = day.startOf("day");

  const events = useMemo(() => eventsOfDay(items, day), [items, day]);
  const tasks = useMemo(() => tasksOfDay(items, day), [items, day]);
  const blocks = useMemo<TimeBlock[]>(() => layoutDay(events, day), [events, day]);

  const now = dayjs();
  const isToday = day.isSame(now, "day");
  const nowTop = (now.diff(dayStart, "minute") / MINUTES_PER_DAY) * 100;

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      {/* Dải việc có hạn trong ngày — không có khoảng nên không vẽ theo giờ được */}
      {tasks.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-slate-50/70 px-3 py-2">
          <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold uppercase tracking-wide text-slate-400">
            <CalendarClock size={12} /> Đến hạn
          </span>
          {tasks.map((task) => (
            <button
              key={task.id}
              type="button"
              onClick={() => onSelect(task)}
              className="inline-flex items-center gap-1.5 h-6 px-2 rounded-md border-0 cursor-pointer text-[11.5px]"
              style={{
                background: `${PRIORITY_META[task.priority].color}1f`,
                color: PRIORITY_META[task.priority].color,
              }}
            >
              <span className="tabular-nums font-semibold">
                {dayjs(task.deadline).format("HH:mm")}
              </span>
              <span
                className="max-w-[200px] truncate"
                style={{
                  textDecoration:
                    task.status === TaskStatus.DONE ? "line-through" : undefined,
                }}
              >
                {task.title}
              </span>
            </button>
          ))}
        </div>
      )}

      {/*
        `pt-2` để nhãn 00:00 không bị mép trên cắt mất — nhãn nằm giữa đường kẻ
        nên nửa trên của nó tràn ra ngoài khung.
      */}
      <div className="relative pt-2 pb-1" style={{ height: GRID_HEIGHT }}>
        <div className="relative h-full">
          {/* Máng giờ bên trái — nền riêng để tách khỏi vùng nội dung */}
          <div className="absolute inset-y-0 left-0 w-[54px] border-r border-slate-200 bg-slate-50/70" />

          {/* Giờ ngoài khung làm việc làm mờ đi, để mắt tập trung vào 6h–22h */}
          <div
            className="absolute left-[54px] right-0 bg-slate-50/60"
            style={{ top: 0, height: `${(6 / 24) * 100}%` }}
          />
          <div
            className="absolute left-[54px] right-0 bg-slate-50/60"
            style={{ top: `${(22 / 24) * 100}%`, height: `${(2 / 24) * 100}%` }}
          />

          {/* Lưới giờ — 24 hàng chia đều chiều cao khung */}
          {Array.from({ length: 24 }, (_, hour) => (
              <div
                key={hour}
                className="absolute left-0 right-0"
                style={{ top: `${(hour / 24) * 100}%`, height: `${100 / 24}%` }}
              >
                {/* Đường kẻ chỉ kéo trong vùng nội dung, không cắt ngang máng giờ */}
                <span className="absolute left-[54px] right-0 top-0 border-t border-slate-200/80" />
                <span
                  className="absolute left-0 w-[46px] text-right text-[10.5px] font-medium
                    tabular-nums text-slate-400"
                  style={{ top: -7 }}
                >
                  {String(hour).padStart(2, "0")}:00
                </span>
                {/* Bấm vào khoảng trống = tạo lịch hẹn từ giờ đó */}
                <button
                  type="button"
                  aria-label={`Tạo lịch hẹn lúc ${hour}:00`}
                  onClick={() => onCreateAt(dayStart.hour(hour))}
                  className="absolute inset-y-0 left-[54px] right-0 border-0 bg-transparent cursor-pointer
                    transition-colors hover:bg-sky-100/50"
                />
              </div>
          ))}

          {/* Vạch giờ hiện tại */}
          {isToday && nowTop >= 0 && (
            <div
              className="pointer-events-none absolute left-[46px] right-0 z-20 flex items-center"
              style={{ top: `${nowTop}%` }}
            >
              <span className="size-2 rounded-full bg-red-500 shrink-0" />
              <span className="h-px flex-1 bg-red-500" />
            </div>
          )}

          {/* Khối sự kiện */}
          {blocks.map((block) => {
            const { task } = block;
            const color = PRIORITY_META[task.priority].color;
            // Chừa 8px mép phải + 3px khe giữa hai khối cùng khung giờ
            const width = `calc((100% - 62px) / ${block.columns} - 3px)`;
            // Khối thấp thì không đủ chỗ cho cả dòng giờ lẫn tiêu đề
            const compact = block.height < 3.2;
            return (
              <button
                key={task.id}
                type="button"
                onClick={() => onSelect(task)}
                title={`${task.code} — ${task.title}`}
                className="absolute z-10 overflow-hidden rounded-md border-0 cursor-pointer px-2 py-[3px]
                  text-left transition-transform hover:z-20 hover:brightness-95"
                /*
                 * Khối ĐẶC màu chữ trắng, không phải nền nhạt viền mỏng.
                 *
                 * Đây là thứ duy nhất trên màn có "khối lượng" — nhìn lướt là
                 * thấy ngay ngày kín tới đâu. Nền nhạt trên nền trắng thì phải
                 * nhìn kỹ mới phân biệt được khối với lưới giờ.
                 */
                style={{
                  top: `${block.top}%`,
                  height: `${block.height}%`,
                  left: `calc(58px + ${block.column} * (${width} + 3px))`,
                  width,
                  background: color,
                  boxShadow: `inset 3px 0 0 rgba(255,255,255,.45), 0 1px 3px ${color}59`,
                }}
              >
                {compact ? (
                  <div className="truncate text-[11px] font-medium text-white">
                    {!task.allDay && (
                      <span className="tabular-nums mr-1 text-white/85">
                        {dayjs(task.startAt!).format("HH:mm")}
                      </span>
                    )}
                    {task.title}
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-1 text-[10.5px] font-semibold tabular-nums text-white/90">
                      <Clock size={10} />
                      {rangeText(task)}
                    </div>
                    <div className="truncate text-[12px] font-medium text-white">
                      {task.title}
                    </div>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
