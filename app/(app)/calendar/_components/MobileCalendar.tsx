"use client";

/**
 * Lịch trên điện thoại.
 *
 * Bản desktop là lưới tháng 7 cột có chip tiêu đề trong từng ô — trên màn 360px
 * mỗi ô chỉ còn ~50px, chữ không đọc nổi nên phải ép `min-width` và cuộn ngang.
 * Ở đây tách hai việc ra:
 *   - lưới tháng gọn: mỗi ngày một con số, dưới là chấm màu cho biết ngày đó
 *     có việc (và việc gấp cỡ nào) — trả lời "tháng này bận chỗ nào";
 *   - danh sách của NGÀY ĐANG CHỌN ngay bên dưới, dạng dòng thời gian — trả
 *     lời "hôm đó có gì, lúc mấy giờ".
 * Vuốt ngang trên lưới để đổi tháng.
 */
import { useMemo, useRef, useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import { CalendarPlus, ChevronLeft, ChevronRight, Mail, Plus, Repeat } from "lucide-react";
import { BoardLabel } from "@/models/board";
import { ItemKind, PRIORITY_META, STATUS_META, Task, TaskStatus } from "@/models/task";
import { C } from "@/components/board/ui";
import { rangeText } from "./timeline";

type Entry = { task: Task; at: string; projected: boolean };
type CalendarEvent = Task & { projected?: boolean; originalTask?: Task };

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
/** Màu chấm / viền của lịch hẹn — tách khỏi màu ưu tiên của việc */
const EVENT_COLOR = "#6366f1";

/** Chiều cao một hàng tuần: dạng thu gọn (số + chấm) và dạng mở rộng (thấy tên việc) */
const COMPACT_ROW = 50;
const EXPANDED_ROW = 108;
/** Mỗi dòng tên việc trong ô mở rộng */
const CHIP_H = 15;

/** Thứ tự chấm dưới ngày: việc gấp trước, lịch hẹn xếp như việc thường */
const weight = (task: Task) =>
  task.kind === ItemKind.EVENT ? 1 : PRIORITY_META[task.priority].weight;

const colorOf = (task: Task) =>
  task.kind === ItemKind.EVENT ? EVENT_COLOR : PRIORITY_META[task.priority].color;

type Props = {
  month: Dayjs;
  onMonthChange: (month: Dayjs) => void;
  weeks: Dayjs[][];
  tasksByDay: Map<string, Entry[]>;
  events: CalendarEvent[];
  status: TaskStatus | undefined;
  onStatusChange: (status: TaskStatus | undefined) => void;
  isFetching: boolean;
  labelById: Map<string, BoardLabel>;
  onSelectTask: (task: Task) => void;
  onCreate: (day: Dayjs) => void;
};

export default function MobileCalendar({
  month,
  onMonthChange,
  weeks,
  tasksByDay,
  events,
  status,
  onStatusChange,
  isFetching,
  labelById,
  onSelectTask,
  onCreate,
}: Props) {
  const today = dayjs();
  const [selected, setSelected] = useState<Dayjs>(today);

  /** Việc + lịch hẹn GIAO với một ngày (lịch hẹn nhiều ngày thì ngày giữa vẫn thấy) */
  const entriesOf = useMemo(() => {
    return (day: Dayjs): Entry[] => {
      const start = day.startOf("day");
      const end = day.endOf("day");
      const ofEvents: Entry[] = events
        .filter((e) => !dayjs(e.startAt!).isAfter(end) && !dayjs(e.endAt!).isBefore(start))
        .map((e) => ({ task: e.originalTask ?? e, at: e.startAt!, projected: !!e.projected }));
      const ofTasks = tasksByDay.get(day.format("YYYY-MM-DD")) ?? [];
      return [...ofEvents, ...ofTasks].sort((a, b) => dayjs(a.at).valueOf() - dayjs(b.at).valueOf());
    };
  }, [events, tasksByDay]);

  const selectedEntries = entriesOf(selected);

  const goMonth = (delta: number) => {
    const next = month.add(delta, "month");
    onMonthChange(next);
    // Chọn luôn một ngày trong tháng mới: hôm nay nếu rơi vào tháng đó, không thì mùng 1
    setSelected(next.isSame(today, "month") ? today : next.startOf("month"));
  };

  const pick = (day: Dayjs) => {
    navigator.vibrate?.(6);
    setSelected(day);
    if (!day.isSame(month, "month")) onMonthChange(day);
  };

  // ---------- Hai dạng lưới: thu gọn (chấm) / mở rộng (thấy tên việc) ----------
  const [expanded, setExpanded] = useState(false);
  /** Chiều cao hàng đang kéo dở trên tay nắm; null = không kéo, dùng chiều cao của dạng hiện tại */
  const [dragRowH, setDragRowH] = useState<number | null>(null);
  const rowH = dragRowH ?? (expanded ? EXPANDED_ROW : COMPACT_ROW);
  /** 0 = thu gọn hẳn, 1 = mở rộng hẳn — dùng để làm mờ dần chấm / hiện dần tên việc */
  const progress = (rowH - COMPACT_ROW) / (EXPANDED_ROW - COMPACT_ROW);

  const setMode = (next: boolean) => {
    if (next !== expanded) navigator.vibrate?.(8);
    setExpanded(next);
  };

  // Vuốt trên lưới: ngang = đổi tháng, dọc = đổi dạng. Chỉ xét lúc thả tay, để
  // trình duyệt vẫn cuộn trang bình thường khi ngón tay đặt lên lưới.
  const touch = useRef<{ x: number; y: number } | null>(null);

  // Kéo tay nắm: lưới giãn/co bám theo ngón tay, thả ra thì bật về dạng gần nhất
  const handleDrag = useRef<{ y: number; startH: number; moved: boolean } | null>(null);

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* ===== Header ===== */}
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-[22px] font-bold leading-tight capitalize" style={{ color: C.foreground }}>
            {month.format("MMMM")}
            <span className="font-medium" style={{ color: C.neutral500 }}>
              {" "}
              {month.format("YYYY")}
            </span>
          </div>
          <div className="text-[12px] h-4" style={{ color: C.mutedForeground }}>
            {isFetching ? "Đang tải…" : ""}
          </div>
        </div>
        {!(month.isSame(today, "month") && selected.isSame(today, "day")) && (
          <button
            type="button"
            onClick={() => {
              onMonthChange(today);
              setSelected(today);
            }}
            className="h-9 px-3 rounded-xl border-0 cursor-pointer text-[13px] font-semibold"
            style={{ background: C.primary50, color: C.primary }}
          >
            Hôm nay
          </button>
        )}
        <NavButton label="Tháng trước" onClick={() => goMonth(-1)}>
          <ChevronLeft size={18} />
        </NavButton>
        <NavButton label="Tháng sau" onClick={() => goMonth(1)}>
          <ChevronRight size={18} />
        </NavButton>
      </div>

      {/* ===== Lọc trạng thái ===== */}
      <div className="-mx-1 px-1 flex gap-1.5 overflow-x-auto [scrollbar-width:none]">
        {[undefined, ...Object.values(TaskStatus)].map((s) => {
          const active = status === s;
          return (
            <button
              key={s ?? "ALL"}
              type="button"
              onClick={() => onStatusChange(s)}
              className="shrink-0 h-8 px-3 rounded-full cursor-pointer text-[12.5px] font-medium whitespace-nowrap"
              style={{
                background: active ? C.primary : "#fff",
                color: active ? "#fff" : C.neutral700,
                border: `1px solid ${active ? C.primary : C.border}`,
              }}
            >
              {s ? STATUS_META[s].label : "Tất cả"}
            </button>
          );
        })}
      </div>

      {/* ===== Lưới tháng — thu gọn / mở rộng ===== */}
      <div
        className="rounded-[20px] bg-white px-1.5 pt-2 select-none"
        style={{ boxShadow: "0 1px 2px rgba(15,23,42,.06), 0 12px 28px -20px rgba(15,23,42,.45)" }}
        onTouchStart={(e) => {
          touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }}
        onTouchEnd={(e) => {
          const start = touch.current;
          touch.current = null;
          if (!start) return;
          const dx = e.changedTouches[0].clientX - start.x;
          const dy = e.changedTouches[0].clientY - start.y;
          if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
            goMonth(dx < 0 ? 1 : -1);
          } else if (Math.abs(dy) > 60 && Math.abs(dy) > Math.abs(dx) * 1.5) {
            // Vuốt xuống = mở rộng, vuốt lên = thu gọn
            setMode(dy > 0);
          }
        }}
      >
        <div className="grid grid-cols-7 mb-1">
          {WEEKDAYS.map((w, i) => (
            <div
              key={w}
              className="text-center text-[11px] font-semibold py-1"
              style={{ color: i >= 5 ? "#f59e0b" : C.neutral500 }}
            >
              {w}
            </div>
          ))}
        </div>

        {weeks.map((week) => (
          <div
            key={week[0].format("YYYY-MM-DD")}
            className="grid grid-cols-7"
            style={{
              height: rowH,
              // Đang kéo tay nắm thì bám ngón tay ngay, thả ra mới có hiệu ứng bật
              transition: dragRowH === null ? "height 220ms cubic-bezier(.2,.8,.3,1)" : undefined,
              borderTop: progress > 0.05 ? `1px solid rgba(226,232,240,${progress})` : undefined,
            }}
          >
            {week.map((day) => (
              <DayCell
                key={day.format("YYYY-MM-DD")}
                day={day}
                entries={entriesOf(day)}
                inMonth={day.isSame(month, "month")}
                isToday={day.isSame(today, "day")}
                isSelected={day.isSame(selected, "day")}
                rowH={rowH}
                progress={progress}
                onPick={() => pick(day)}
              />
            ))}
          </div>
        ))}

        {/*
          Tay nắm: chạm để đổi dạng, hoặc kéo lên/xuống — lưới đi theo ngón tay.
          Chặn cuộn (touch-action: none) CHỈ ở đây: trên lưới mà chặn cuộn thì
          lúc mở rộng (lưới gần kín màn hình) không còn chỗ nào để cuộn xuống
          danh sách bên dưới.
        */}
        <button
          type="button"
          aria-label={expanded ? "Thu gọn lịch" : "Mở rộng lịch"}
          aria-expanded={expanded}
          onClick={() => setMode(!expanded)}
          onTouchStart={(e) => {
            e.stopPropagation();
            handleDrag.current = { y: e.touches[0].clientY, startH: rowH, moved: false };
          }}
          onTouchMove={(e) => {
            const drag = handleDrag.current;
            if (!drag) return;
            const dy = e.touches[0].clientY - drag.y;
            if (Math.abs(dy) > 4) drag.moved = true;
            // 6 hàng cùng giãn -> mỗi hàng giãn 1/6 quãng kéo, đáy lưới đi đúng theo ngón tay
            const h = drag.startH + dy / weeks.length;
            setDragRowH(Math.min(EXPANDED_ROW, Math.max(COMPACT_ROW, h)));
          }}
          onTouchEnd={(e) => {
            e.stopPropagation();
            const drag = handleDrag.current;
            if (!drag) return;
            if (drag.moved) {
              const dy = e.changedTouches[0].clientY - drag.y;
              // Kéo dứt khoát theo một hướng thì theo hướng đó; kéo lưng chừng thì về dạng gần nhất
              setMode(Math.abs(dy) > 40 ? dy > 0 : progress > 0.5);
              setDragRowH(null);
              // Chặn cú "click" giả trình duyệt phát sau touchend — không thì
              // kéo xong nó lại đổi dạng thêm một lần nữa
              e.preventDefault();
            }
            handleDrag.current = null;
          }}
          className="w-full flex flex-col items-center gap-0.5 pt-1.5 pb-2 border-0 bg-transparent cursor-pointer"
          style={{ touchAction: "none" }}
        >
          <span className="w-10 h-1 rounded-full" style={{ background: C.borderDark }} />
          <span className="text-[10.5px] font-medium" style={{ color: C.neutral500 }}>
            {expanded ? "Vuốt lên để thu gọn" : "Kéo xuống để xem chi tiết"}
          </span>
        </button>
      </div>

      {/* ===== Ngày đang chọn ===== */}
      <div className="flex items-end justify-between gap-2 mt-1">
        <div>
          <div className="text-[16px] font-bold capitalize" style={{ color: C.foreground }}>
            {selected.isSame(today, "day")
              ? "Hôm nay"
              : selected.isSame(today.add(1, "day"), "day")
                ? "Ngày mai"
                : selected.format("dddd")}
          </div>
          <div className="text-[12.5px]" style={{ color: C.mutedForeground }}>
            {selected.format("DD/MM/YYYY")} · {selectedEntries.length} mục
          </div>
        </div>
        <button
          type="button"
          onClick={() => onCreate(selected)}
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border-0 cursor-pointer text-[13px] font-semibold text-white"
          style={{ background: C.primary }}
        >
          <Plus size={15} /> Thêm
        </button>
      </div>

      {selectedEntries.length === 0 ? (
        <button
          type="button"
          onClick={() => onCreate(selected)}
          className="flex flex-col items-center gap-2 py-8 rounded-[18px] cursor-pointer bg-transparent"
          style={{ border: `1.5px dashed ${C.border}`, color: C.mutedForeground }}
        >
          <CalendarPlus size={28} style={{ color: C.neutral500 }} />
          <span className="text-[14px]">Ngày này còn trống</span>
          <span className="text-[12.5px] font-semibold" style={{ color: C.primary }}>
            Chạm để thêm việc
          </span>
        </button>
      ) : (
        <div className="flex flex-col gap-2 pb-2">
          {selectedEntries.map((entry) => (
            <EntryRow
              key={`${entry.task.id}-${entry.at}`}
              entry={entry}
              labelById={labelById}
              onClick={() => onSelectTask(entry.task)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Một ô ngày. Thu gọn: số tròn + tối đa 3 chấm. Mở rộng: số nhỏ ở trên, bên
 * dưới là tên từng việc / lịch hẹn, bao nhiêu dòng vừa ô thì hiện bấy nhiêu,
 * còn lại gom "+N". Hai lớp chuyển dần theo `progress` khi đang kéo.
 */
function DayCell({
  day,
  entries,
  inMonth,
  isToday,
  isSelected,
  rowH,
  progress,
  onPick,
}: {
  day: Dayjs;
  entries: Entry[];
  inMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  rowH: number;
  progress: number;
  onPick: () => void;
}) {
  const sorted = [...entries].sort((a, b) => weight(b.task) - weight(a.task));
  const dots = sorted.slice(0, 3).map((e) => colorOf(e.task));
  const numberSize = 36 - progress * 14; // số tròn nhỏ dần khi mở rộng
  // Chỗ cho tên việc = chiều cao hàng trừ phần số ngày
  const fit = Math.max(0, Math.floor((rowH - numberSize - 6) / (CHIP_H + 2)));
  const chips = entries.length > fit ? entries.slice(0, Math.max(0, fit - 1)) : entries;
  const more = entries.length - chips.length;

  return (
    <button
      type="button"
      onClick={onPick}
      aria-label={`${day.format("dddd DD/MM")}, ${entries.length} mục`}
      aria-pressed={isSelected}
      className="relative flex flex-col items-center gap-0.5 pt-0.5 min-w-0 overflow-hidden border-0 cursor-pointer"
      style={{
        opacity: inMonth ? 1 : 0.35,
        background: isSelected && progress > 0.5 ? `${C.primary}0d` : "transparent",
        borderRadius: 10,
      }}
    >
      <span
        className="grid place-items-center rounded-full tabular-nums shrink-0"
        style={{
          width: numberSize,
          height: numberSize,
          fontSize: 14 - progress * 2,
          background: isSelected ? C.primary : isToday ? C.primary50 : "transparent",
          color: isSelected ? "#fff" : isToday ? C.primary : C.foreground,
          fontWeight: isSelected || isToday ? 700 : 500,
        }}
      >
        {day.date()}
      </span>

      {/* Chấm — mờ dần khi mở rộng */}
      {progress < 0.65 && (
        <span className="flex items-center gap-[3px] h-1.5" style={{ opacity: 1 - progress * 1.6 }}>
          {dots.map((color, i) => (
            <span key={i} className="size-[5px] rounded-full" style={{ background: color }} />
          ))}
        </span>
      )}

      {/* Tên việc — hiện dần khi mở rộng */}
      {progress > 0 && (
        <span
          className="absolute left-0.5 right-0.5 flex flex-col gap-0.5"
          style={{ top: numberSize + 4, opacity: Math.min(1, progress * 1.4) }}
        >
          {chips.map((e) => {
            const color = colorOf(e.task);
            const isEvent = e.task.kind === ItemKind.EVENT;
            const done = e.task.status === TaskStatus.DONE;
            return (
              <span
                key={`${e.task.id}-${e.at}`}
                className="block truncate rounded-[4px] px-1 text-left text-[9.5px] font-semibold"
                style={{
                  height: CHIP_H,
                  lineHeight: `${CHIP_H}px`,
                  background: isEvent ? `${color}24` : "#f1f5f9",
                  color: isEvent ? color : done ? C.neutral500 : C.foreground,
                  borderLeft: `2px solid ${color}`,
                  textDecoration: done ? "line-through" : undefined,
                  opacity: e.projected ? 0.7 : 1,
                }}
              >
                {e.task.title}
              </span>
            );
          })}
          {more > 0 && (
            <span className="text-[9.5px] font-semibold text-left pl-1" style={{ color: C.neutral500 }}>
              +{more}
            </span>
          )}
        </span>
      )}
    </button>
  );
}

function NavButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid place-items-center size-9 rounded-xl border-0 cursor-pointer"
      style={{ background: C.muted, color: C.neutral700 }}
    >
      {children}
    </button>
  );
}

/** Một mục trong ngày: cột giờ bên trái, thẻ bên phải có viền màu theo loại */
function EntryRow({
  entry,
  labelById,
  onClick,
}: {
  entry: Entry;
  labelById: Map<string, BoardLabel>;
  onClick: () => void;
}) {
  const { task, at, projected } = entry;
  const isEvent = task.kind === ItemKind.EVENT;
  const done = task.status === TaskStatus.DONE;
  const color = isEvent ? EVENT_COLOR : PRIORITY_META[task.priority].color;
  const labels = (task.labelIds ?? []).flatMap((id) => labelById.get(id) ?? []).slice(0, 3);

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-stretch gap-3 p-0 border-0 bg-transparent cursor-pointer text-left"
      style={{ opacity: projected ? 0.7 : 1 }}
    >
      <div className="w-11 shrink-0 pt-3 text-right">
        <div className="text-[13px] font-bold tabular-nums" style={{ color: C.foreground }}>
          {task.allDay ? "Cả" : dayjs(at).format("HH:mm")}
        </div>
        <div className="text-[10.5px]" style={{ color: C.neutral500 }}>
          {task.allDay ? "ngày" : isEvent ? "hẹn" : "hạn"}
        </div>
      </div>

      <div
        className="relative flex-1 min-w-0 rounded-2xl bg-white pl-3.5 pr-3 py-2.5 overflow-hidden"
        style={{
          boxShadow: "0 1px 2px rgba(15,23,42,.06), 0 10px 22px -18px rgba(15,23,42,.45)",
          border: projected ? `1.5px dashed ${color}66` : undefined,
        }}
      >
        <span
          aria-hidden
          className="absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-r-full"
          style={{ background: color }}
        />
        <div
          className="text-[14.5px] font-semibold leading-snug [overflow-wrap:anywhere]"
          style={{
            color: done ? C.mutedForeground : C.foreground,
            textDecoration: done ? "line-through" : undefined,
          }}
        >
          {task.title}
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] font-medium">
          {isEvent && (
            <Pill bg="#eef2ff" fg={EVENT_COLOR}>
              {rangeText(task)}
            </Pill>
          )}
          {isEvent && task.repeat && (
            <Pill bg="#eef2ff" fg={EVENT_COLOR}>
              <Repeat size={10} /> {projected ? "Dự kiến" : "Lặp lại"}
            </Pill>
          )}
          {!isEvent && (
            <Pill
              bg={done ? C.success50 : task.status === TaskStatus.IN_PROGRESS ? C.primary50 : C.muted}
              fg={done ? C.success : task.status === TaskStatus.IN_PROGRESS ? C.primary : C.neutral700}
            >
              {STATUS_META[task.status].label}
            </Pill>
          )}
          {labels.map((l) => (
            <Pill key={l.id} bg={`${l.color}1f`} fg={l.color}>
              {l.name}
            </Pill>
          ))}
          {task.sourceMailAccountId && <Mail size={11} style={{ color: "#06b6d4" }} />}
          <span className="font-mono text-[10.5px] ml-auto" style={{ color: C.neutral500 }}>
            {task.code}
          </span>
        </div>
      </div>
    </button>
  );
}

function Pill({ bg, fg, children }: { bg: string; fg: string; children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1 h-5 px-2 rounded-full whitespace-nowrap"
      style={{ background: bg, color: fg }}
    >
      {children}
    </span>
  );
}
