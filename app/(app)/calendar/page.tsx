"use client";

import { DragEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  App,
  Badge,
  Button,
  Drawer,
  Empty,
  Grid,
  List,
  Radio,
  Segmented,
  Tag,
  Tooltip,
} from "antd";
import dayjs, { Dayjs } from "dayjs";
import {
  CalendarClock,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Mail,
  Plus,
  Repeat,
  Timer,
} from "lucide-react";
import TaskDetailDrawer from "@/components/tasks/TaskDetailDrawer";
import TaskFormModal from "@/components/tasks/TaskFormModal";
import { taskApi } from "@/apis/task.api";
import {
  useBoardLabels,
  useInvalidateTaskData,
  useTasks,
  useTaskTypes,
} from "@/hooks/useTaskApp";
import { repeatText } from "@/models/board";
import { projectOccurrences } from "@/utils/client/recurrence";
import DayTimeline, { rangeText } from "./_components/DayTimeline";
import WeekTimeline from "./_components/WeekTimeline";
import AgendaList from "./_components/AgendaList";
import { useStickyState } from "@/components/board/useStickyState";

type CalendarView = "month" | "week" | "day" | "agenda";

/**
 * Một dòng trên lịch: việc thật, hoặc một lượt lặp DỰ KIẾN của việc đó.
 * `at` là mốc của riêng dòng này — với lượt dự kiến nó khác `task.deadline`.
 */
type CalendarEntry = { task: Task; at: string; projected: boolean };
import {
  ItemKind,
  PRIORITY_META,
  STATUS_META,
  Task,
  TaskPriority,
  TaskStatus,
} from "@/models/task";
import { getApiErrorMessage } from "@/utils/client/apiError";

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

/** Chiều cao một làn thanh sự kiện. Dùng ở CẢ hai nơi: lớp thanh và phần chừa
 *  chỗ bên dưới — tách ra hằng số để hai bên không bao giờ lệch nhau. */
const LANE_HEIGHT = 21;

export default function CalendarPage() {
  const { message } = App.useApp();
  const screens = Grid.useBreakpoint();
  // Dùng chung một danh sách khoá với mọi màn khác — xem useInvalidateTaskData
  const invalidate = useInvalidateTaskData();

  const [month, setMonth] = useState<Dayjs>(dayjs());
  const [status, setStatus] = useState<TaskStatus | undefined>();
  /**
   * Chế độ xem. Tháng trả lời "tháng này bận chỗ nào"; Ngày trả lời "9 giờ mai
   * tôi có trống không" — hai câu khác nhau nên không gộp vào một lưới được.
   */
  /**
   * Bốn chế độ, mỗi chế độ trả lời một câu khác nhau:
   *   tháng  — tháng này bận chỗ nào
   *   tuần   — dời việc này sang hôm nào thì hợp
   *   ngày   — hôm nay còn khung giờ nào trống
   *   lịch trình — tiếp theo là gì (và là chế độ duy nhất dùng tốt trên màn hẹp)
   *
   * Nhớ lại lựa chọn: người dùng gần như luôn quay lại đúng chế độ họ quen.
   */
  const [view, setView] = useStickyState<CalendarView>("calendar:view", "month");
  const [focusDay, setFocusDay] = useState<Dayjs>(dayjs());

  /** Đầu tuần (thứ Hai) của ngày đang xem — dùng cho chế độ Tuần */
  const weekStart = useMemo(
    () => focusDay.subtract((focusDay.day() + 6) % 7, "day").startOf("day"),
    [focusDay],
  );

  /** Nhảy tới/lui MỘT KỲ của chế độ đang xem, không phải luôn luôn một tháng */
  const step = useCallback(
    (direction: 1 | -1) => {
      if (view === "month") {
        setMonth((m) => m.add(direction, "month"));
        return;
      }
      /*
       * Lịch trình nhảy theo TUẦN: nó là danh sách dài, bước từng ngày thì phải
       * bấm cả chục lần mới thấy đổi. Ngày thì bước từng ngày.
       */
      const unit = view === "day" ? "day" : "week";
      setFocusDay((d) => {
        const next = d.add(direction, unit);
        // Giữ lưới tháng bám theo ngày đang xem, để đổi về chế độ tháng không lạc
        setMonth(next);
        return next;
      });
    },
    [view],
  );

  const goToday = useCallback(() => {
    setMonth(dayjs());
    setFocusDay(dayjs());
  }, []);

  /*
   * Phím tắt kiểu lịch quen thuộc: M/W/D/A đổi chế độ, ←/→ đổi kỳ, T về hôm nay.
   * Bỏ qua khi con trỏ đang ở ô nhập, nếu không gõ chữ "d" vào tiêu đề sẽ nhảy
   * mất màn hình.
   */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (
        e.metaKey ||
        e.ctrlKey ||
        el?.isContentEditable ||
        ["INPUT", "TEXTAREA", "SELECT"].includes(el?.tagName ?? "")
      ) {
        return;
      }
      const map: Record<string, CalendarView> = {
        m: "month",
        w: "week",
        d: "day",
        a: "agenda",
      };
      const next = map[e.key.toLowerCase()];
      if (next) return setView(next);
      if (e.key === "ArrowLeft") return step(-1);
      if (e.key === "ArrowRight") return step(1);
      if (e.key.toLowerCase() === "t") goToday();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, goToday, setView]);

  // 42 ô = 6 tuần, bắt đầu từ thứ 2 của tuần chứa mùng 1
  const gridStart = useMemo(() => {
    const first = month.startOf("month");
    // dayjs vi locale: tuần bắt đầu thứ 2; phòng khi locale khác, tự tính
    const offset = (first.day() + 6) % 7; // 0 = thứ 2
    return first.subtract(offset, "day");
  }, [month]);
  const { data, isFetching } = useTasks({
    // Lịch là màn DUY NHẤT cần cả việc lẫn sự kiện; các màn khác để mặc định
    // (chỉ việc) — xem ghi chú ở QueryTaskParams.kind
    kind: "ALL",
    limit: 100, // tối đa backend cho phép
    status,
    from: gridStart.startOf("day").toISOString(),
    to: gridStart.add(41, "day").endOf("day").toISOString(),
  });
  const { data: taskTypes } = useTaskTypes();
  const { labelById } = useBoardLabels();

  // Optimistic: taskId -> deadline mới (khi kéo thả dời ngày)
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverDay, setDragOverDay] = useState<string | null>(null);

  const tasks = useMemo(
    () =>
      (data?.items ?? []).map((t) =>
        overrides[t.id] ? { ...t, deadline: overrides[t.id] } : t,
      ),
    [data, overrides],
  );

  /**
   * Lịch xếp theo ngày, gồm CẢ các lượt lặp dự kiến.
   *
   * Một việc lặp chỉ có MỘT hàng trong cơ sở dữ liệu — backend chỉ tạo lượt kế
   * tiếp lúc người dùng bấm hoàn thành lượt hiện tại. Nên trước đây "họp giao
   * ban mỗi thứ Hai" chỉ hiện đúng một ô trên cả tháng.
   *
   * Các lượt dự kiến được tính ở trình duyệt (`projectOccurrences`) và đánh
   * dấu `projected` để giao diện vẽ khác đi: chúng KHÔNG phải việc có thật —
   * không kéo thả, không sửa, và sẽ không xảy ra nếu người dùng bỏ dở chuỗi.
   */
  /** Sự kiện vẽ thành thanh ngang, không phải chip theo ngày */
  const events = useMemo(
    () => tasks.filter((t) => t.kind === ItemKind.EVENT && t.startAt && t.endAt),
    [tasks],
  );

  const weeks = useMemo(
    () =>
      Array.from({ length: 6 }, (_, w) =>
        Array.from({ length: 7 }, (_, d) => gridStart.add(w * 7 + d, "day")),
      ),
    [gridStart],
  );

  /**
   * Thanh sự kiện của từng tuần, đã xếp làn.
   *
   * Một sự kiện kéo dài nhiều ngày bị CẮT theo từng tuần: lưới lịch xuống dòng
   * mỗi 7 ô nên không có cách nào vẽ một thanh liền mạch vắt qua hai hàng.
   *
   * Xếp làn tham lam: duyệt theo thứ tự bắt đầu (dài hơn trước khi cùng ngày),
   * đặt vào làn đầu tiên còn trống. Đủ tốt cho lịch cá nhân, và quan trọng hơn
   * là ổn định — cùng một tập sự kiện luôn ra cùng một cách xếp.
   */
  const barsByWeek = useMemo(() => {
    return weeks.map((week) => {
      const weekStart = week[0].startOf("day");
      const weekEnd = week[6].endOf("day");

      const segments = events
        .filter(
          (e) =>
            !dayjs(e.startAt!).isAfter(weekEnd) &&
            !dayjs(e.endAt!).isBefore(weekStart),
        )
        .map((event) => {
          const start = dayjs(event.startAt!);
          const end = dayjs(event.endAt!);
          const from = start.isBefore(weekStart) ? weekStart : start;
          const to = end.isAfter(weekEnd) ? weekEnd : end;
          return {
            event,
            colStart: from.diff(weekStart, "day"),
            span: Math.max(1, to.startOf("day").diff(from.startOf("day"), "day") + 1),
            // Bị cắt ở đầu/cuối tuần -> bo góc phẳng để thấy là còn tiếp
            clippedStart: start.isBefore(weekStart),
            clippedEnd: end.isAfter(weekEnd),
            startsHere: !start.isBefore(weekStart),
          };
        })
        .sort(
          (a, b) =>
            a.colStart - b.colStart || b.span - a.span ||
            a.event.title.localeCompare(b.event.title),
        );

      const laneEnds: number[] = [];
      return segments.map((seg) => {
        let lane = laneEnds.findIndex((end) => end <= seg.colStart);
        if (lane === -1) {
          lane = laneEnds.length;
          laneEnds.push(0);
        }
        laneEnds[lane] = seg.colStart + seg.span;
        return { ...seg, lane };
      });
    });
  }, [weeks, events]);

  const tasksByDay = useMemo(() => {
    const map = new Map<string, CalendarEntry[]>();
    const push = (at: string, entry: CalendarEntry) => {
      const key = dayjs(at).format("YYYY-MM-DD");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(entry);
    };

    const gridEnd = gridStart.add(41, "day");

    tasks.forEach((task) => {
      // Sự kiện đi đường riêng (thanh ngang) — bỏ qua ở luồng chip theo ngày
      if (task.kind === ItemKind.EVENT) return;
      if (!task.deadline) return;
      push(task.deadline, { task, at: task.deadline, projected: false });

      // Việc đã xong hoặc đã huỷ thì chuỗi lặp dừng ở đó — chiếu tiếp là hứa
      // hão với người dùng
      const closed =
        task.status === TaskStatus.DONE || task.status === TaskStatus.CANCELLED;
      if (closed || !task.repeat) return;

      projectOccurrences(task.deadline, task.repeat, gridStart, gridEnd).forEach(
        (occurrence) =>
          push(occurrence.deadline, {
            task,
            at: occurrence.deadline,
            projected: true,
          }),
      );
    });

    map.forEach((list) =>
      list.sort((a, b) => dayjs(a.at).valueOf() - dayjs(b.at).valueOf()),
    );
    return map;
  }, [tasks, gridStart]);

  /**
   * Nguồn cho chế độ Lịch trình.
   *
   * `tasksByDay` cố tình KHÔNG chứa sự kiện (chúng đi đường thanh ngang ở lưới
   * tháng), nên phải ghép lại ở đây — nếu không, chế độ Lịch trình sẽ im lặng
   * bỏ sót đúng loại mục mà người dùng quan tâm nhất: cái có giờ hẹn.
   */
  const agendaEntries = useMemo(
    () => [
      ...[...tasksByDay.values()].flat(),
      ...events.map((event) => ({
        task: event,
        at: event.startAt!,
        projected: false,
      })),
    ],
    [tasksByDay, events],
  );

  const [selectedDay, setSelectedDay] = useState<Dayjs | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultDeadline, setDefaultDeadline] = useState<Dayjs | null>(null);

  /**
   * Danh sách của ngày đang mở: việc + sự kiện GIAO với ngày đó.
   *
   * Sự kiện phải xét theo khoảng, không theo ngày bắt đầu: chuyến công tác
   * 22→25 thì ngày 24 cũng phải thấy nó, dù nó không bắt đầu hôm ấy.
   */
  const selectedDayTasks: CalendarEntry[] = useMemo(() => {
    if (!selectedDay) return [];
    const start = selectedDay.startOf("day");
    const end = selectedDay.endOf("day");

    const ofDay = tasksByDay.get(selectedDay.format("YYYY-MM-DD")) ?? [];
    const eventsOfDay: CalendarEntry[] = events
      .filter(
        (e) =>
          !dayjs(e.startAt!).isAfter(end) && !dayjs(e.endAt!).isBefore(start),
      )
      .map((event) => ({
        task: event,
        at: event.startAt!,
        projected: false,
      }));

    return [...eventsOfDay, ...ofDay].sort(
      (a, b) => dayjs(a.at).valueOf() - dayjs(b.at).valueOf(),
    );
  }, [selectedDay, tasksByDay, events]);

  const openCreate = (deadline?: Dayjs | null) => {
    setEditingTask(null);
    setDefaultDeadline(deadline ? deadline.hour(17).minute(0) : null);
    setFormOpen(true);
  };
  const openEdit = (task: Task) => {
    setViewingTask(null);
    setEditingTask(task);
    setFormOpen(true);
  };

  // ===== Kéo thả dời deadline =====
  const handleDrop = async (event: DragEvent, day: Dayjs) => {
    event.preventDefault();
    setDragOverDay(null);
    setDraggingId(null);
    const taskId = event.dataTransfer.getData("text/task-id");
    const task = data?.items.find((t) => t.id === taskId);
    if (!task?.deadline) return;

    const oldDeadline = dayjs(task.deadline);
    if (oldDeadline.isSame(day, "day")) return;
    // Giữ nguyên giờ:phút cũ, chỉ đổi ngày
    const newDeadline = day
      .hour(oldDeadline.hour())
      .minute(oldDeadline.minute())
      .second(0)
      .millisecond(0);

    setOverrides((prev) => ({ ...prev, [taskId]: newDeadline.toISOString() }));
    try {
      await taskApi.update(taskId, { deadline: newDeadline.toISOString() });
      message.success(
        `${task.code}: deadline → ${newDeadline.format("DD/MM/YYYY HH:mm")}`,
      );
    } catch (error) {
      message.error(getApiErrorMessage(error));
    } finally {
      setOverrides((prev) => {
        const next = { ...prev };
        delete next[taskId];
        return next;
      });
      invalidate();
    }
  };

  /** Có việc lặp nào trong tháng đang xem không — quyết định hiện chú giải */
  const hasRepeating = useMemo(
    () => tasks.some((t) => !!t.repeat),
    [tasks],
  );

  const today = dayjs();

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* ===== Header ===== */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button icon={<ChevronLeft size={16} />} onClick={() => step(-1)} />
          {/* Tiêu đề đổi theo chế độ — "Tháng 9" vô nghĩa khi đang xem một ngày */}
          <span className="font-bold text-lg text-slate-700 min-w-[210px] text-center capitalize">
            {view === "month"
              ? month.format("MMMM YYYY")
              : view === "week"
                ? `${weekStart.format("DD/MM")} – ${weekStart
                    .add(6, "day")
                    .format("DD/MM/YYYY")}`
                : view === "day"
                  ? focusDay.format("dddd, DD/MM/YYYY")
                  : focusDay.isSame(dayjs(), "day")
                    ? "Sắp tới"
                    : `Từ ${focusDay.format("DD/MM/YYYY")}`}
          </span>
          <Button icon={<ChevronRight size={16} />} onClick={() => step(1)} />
          <Tooltip title="Phím T">
            <Button onClick={goToday}>Hôm nay</Button>
          </Tooltip>

          <Tooltip title="Phím tắt: M tháng · W tuần · D ngày · A lịch trình · ←/→ đổi kỳ">
            <Segmented
              value={view}
              onChange={(v) => setView(v as CalendarView)}
              options={[
                { label: "Tháng", value: "month" },
                { label: "Tuần", value: "week" },
                { label: "Ngày", value: "day" },
                { label: "Lịch trình", value: "agenda" },
              ]}
            />
          </Tooltip>
          {isFetching && (
            <span className="text-xs text-slate-400 ml-1">đang tải…</span>
          )}

          {/*
            Chú giải — viền đứt mà không giải thích thì người dùng chỉ thấy lạ.
            Chỉ hiện khi trong tháng thật sự có việc lặp, để không chiếm chỗ vô ích.
          */}
          {hasRepeating && (
            <Tooltip title="Các lượt lặp được tính trước để bạn thấy lịch trình. Chúng chỉ thành việc thật khi bạn hoàn thành lượt hiện tại.">
              <span className="inline-flex items-center gap-1.5 ml-1 text-[11.5px] text-slate-400">
                <span className="inline-block w-4 border-t-2 border-dashed border-slate-400" />
                lượt lặp dự kiến
              </span>
            </Tooltip>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Radio.Group
            value={status ?? "ALL"}
            onChange={(e) =>
              setStatus(e.target.value === "ALL" ? undefined : e.target.value)
            }
            optionType="button"
            options={[
              { label: "Tất cả", value: "ALL" },
              ...Object.values(TaskStatus).map((s) => ({
                label: STATUS_META[s].label,
                value: s,
              })),
            ]}
          />
          <Button
            type="primary"
            icon={<Plus size={15} />}
            onClick={() => openCreate(null)}
          >
            Tạo công việc
          </Button>
        </div>
      </div>

      {/* ===== Legend ===== */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
        <span className="font-medium text-slate-400">Độ ưu tiên:</span>
        {Object.values(TaskPriority).map((p) => (
          <span key={p} className="inline-flex items-center gap-1.5">
            <span
              className="size-2 rounded-full inline-block"
              style={{ background: PRIORITY_META[p].color }}
            />
            {PRIORITY_META[p].label}
          </span>
        ))}
        <span className="text-slate-300">•</span>
        {/* Ba loại hiển thị khác nhau trên cùng một lưới — nói thẳng ra để
            khỏi phải đoán viền đứt với thanh đặc khác nhau chỗ nào */}
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-4 rounded-sm bg-slate-400" />
          lịch hẹn
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-4 rounded-sm border border-slate-300 bg-white" />
          công việc
        </span>
        <span className="text-slate-300">•</span>
        <span>Kéo thả công việc sang ngày khác để dời hạn</span>
      </div>

      {view === "day" ? (
        <DayTimeline
          day={focusDay}
          items={tasks}
          onSelect={setViewingTask}
          onCreateAt={(at) => openCreate(at)}
        />
      ) : view === "week" ? (
        <WeekTimeline
          weekStart={weekStart}
          items={tasks}
          onSelect={setViewingTask}
          onCreateAt={(at) => openCreate(at)}
          onPickDay={(day) => {
            setFocusDay(day);
            setView("day");
          }}
        />
      ) : view === "agenda" ? (
        <AgendaList
          entries={agendaEntries}
          /* Bắt đầu từ ngày đang xem chứ không cứng ở hôm nay — nếu không thì
             ←/→ đổi dữ liệu tải về mà màn hình không đổi gì */
          from={focusDay}
          onSelect={setViewingTask}
        />
      ) : (
      /* ===== Month grid ===== */
      <div className="rounded-xl border border-slate-200 bg-white overflow-x-auto shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="min-w-[560px]">
        {/* Weekday header */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/70">
          {WEEKDAYS.map((weekday, index) => (
            <div
              key={weekday}
              className={`py-2 text-center text-xs font-semibold uppercase tracking-wide ${
                index >= 5 ? "text-orange-400" : "text-slate-500"
              }`}
            >
              {weekday}
            </div>
          ))}
        </div>

        {/*
          Lưới chia theo TUẦN, không phải 42 ô phẳng.

          Bắt buộc phải vậy để vẽ được sự kiện kéo dài nhiều ngày: một thanh
          vắt từ thứ Ba sang thứ Sáu chỉ đặt được khi có một hàng lưới riêng để
          nó chiếm 4 cột. Với 42 ô phẳng thì mỗi ô là một ốc đảo.

          Mỗi tuần gồm hai lớp chồng nhau: lớp ô (ngày + việc) và lớp thanh sự
          kiện phủ lên phần đầu ô. Ô chừa sẵn chiều cao đúng bằng số làn để
          thanh không đè lên nội dung.
        */}
        {weeks.map((week, weekIndex) => {
          const bars = barsByWeek[weekIndex];
          const laneCount = bars.reduce((max, b) => Math.max(max, b.lane + 1), 0);

          return (
            <div key={week[0].format("YYYY-MM-DD")} className="relative">
              <div className="grid grid-cols-7">
          {week.map((day) => {
            const key = day.format("YYYY-MM-DD");
            const items = tasksByDay.get(key) ?? [];
            const inMonth = day.isSame(month, "month");
            const isToday = day.isSame(today, "day");
            const isWeekend = day.day() === 0 || day.day() === 6;
            const isOver = dragOverDay === key;
            const shown = items.slice(0, 3);

            return (
              <div
                key={key}
                onClick={() => setSelectedDay(day)}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverDay(key);
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    setDragOverDay(null);
                  }
                }}
                onDrop={(e) => handleDrop(e, day)}
                className={`group relative min-h-[112px] border-b border-r border-slate-100 p-1.5 cursor-pointer transition-colors ${
                  isOver
                    ? "bg-sky-50 ring-2 ring-inset ring-sky-400"
                    : isToday
                      ? "bg-sky-50 ring-1 ring-inset ring-sky-200"
                      : isWeekend && inMonth
                        ? "bg-slate-50 hover:bg-slate-100/70"
                        : "hover:bg-slate-50"
                } ${!inMonth ? "bg-slate-100/60 text-slate-300" : ""}`}
              >
                {/* Day number + quick add */}
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`grid place-items-center size-6 rounded-full text-[12.5px] font-medium ${
                      isToday
                        ? "bg-[#0a436d] text-white"
                        : inMonth
                          ? "text-slate-600"
                          : "text-slate-300"
                    }`}
                  >
                    {day.date()}
                  </span>
                  <button
                    className="opacity-0 group-hover:opacity-100 transition-opacity grid place-items-center size-5 rounded bg-slate-100 hover:bg-[#0a436d] hover:text-white text-slate-500 border-0 cursor-pointer"
                    title="Tạo task ngày này"
                    onClick={(e) => {
                      e.stopPropagation();
                      openCreate(day);
                    }}
                  >
                    <Plus size={13} />
                  </button>
                </div>

                {/*
                  Chừa chỗ cho thanh sự kiện ở ĐÂY, không phải bằng padding của
                  cả ô.

                  Bản đầu tôi đặt `paddingTop` lên chính ô — nhưng số ngày cũng
                  nằm trong ô, nên nó bị đẩy xuống đúng vùng dành cho thanh sự
                  kiện và hai thứ đè lên nhau. Lùi phần nội dung xuống mới đúng:
                  số ngày ở yên trên cùng, thanh nằm ngay dưới nó.
                */}
                <div
                  className="flex flex-col gap-1"
                  style={{ marginTop: laneCount * LANE_HEIGHT }}
                >
                  {shown.map((entry) => {
                    const { task, at, projected } = entry;
                    const finished =
                      task.status === TaskStatus.DONE ||
                      task.status === TaskStatus.CANCELLED;
                    // Lượt dự kiến chưa tới hạn theo định nghĩa — không bao giờ
                    // tô đỏ quá hạn dù mốc của nó nằm ở quá khứ trên lưới
                    const overdue =
                      !finished && !projected && dayjs(at).isBefore(today);
                    const type = taskTypes?.find(
                      (t) => t.id === task.taskTypeId,
                    );
                    return (
                      <div
                        key={projected ? `${task.id}@${at}` : task.id}
                        // Kéo một lượt DỰ KIẾN là vô nghĩa: nó không có bản ghi
                        // nào để dời, dời chỉ có thể dời việc gốc
                        draggable={!finished && !projected}
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/task-id", task.id);
                          setDraggingId(task.id);
                        }}
                        onDragEnd={() => {
                          setDraggingId(null);
                          setDragOverDay(null);
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewingTask(task);
                        }}
                        title={[
                          `${task.code} — ${task.title}`,
                          dayjs(at).format("HH:mm"),
                          projected ? "Lượt lặp dự kiến" : null,
                          task.repeat ? repeatText(task.repeat, task.deadline) : null,
                          task.estimateMinutes
                            ? `${task.estimateMinutes} phút`
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                        className={`flex items-center gap-1.5 rounded-md border px-1.5 py-1 text-[11px] leading-tight transition-all ${
                          finished
                            ? "border-slate-100 bg-slate-50 text-slate-300 cursor-pointer"
                            : "cursor-grab active:cursor-grabbing hover:shadow-sm"
                        } ${
                          overdue
                            ? "border-red-300 bg-red-50 font-medium"
                            : !finished
                              ? "border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,.06)]"
                              : ""
                        } ${draggingId === task.id ? "opacity-40" : ""} ${
                          projected ? "border-dashed opacity-70" : ""
                        }`}
                        style={{
                          borderLeftWidth: 4,
                          borderLeftColor: type?.color
                            ? type.color
                            : PRIORITY_META[task.priority].color,
                          // Lượt dự kiến: viền đứt + nhạt hơn, để phân biệt
                          // ngay với việc có thật mà không cần đọc chữ
                          borderLeftStyle: projected ? "dashed" : "solid",
                        }}
                      >
                        <span
                          className="size-1.5 rounded-full shrink-0"
                          style={{
                            background: PRIORITY_META[task.priority].color,
                          }}
                        />
                        <span
                          className={`truncate flex-1 ${
                            finished
                              ? "line-through text-slate-300"
                              : overdue
                                ? "text-red-600 font-medium"
                                : "text-slate-600"
                          }`}
                        >
                          {task.title}
                        </span>
                        {/* Chấm màu nhãn — ô ngày quá hẹp cho chip có chữ,
                            nhưng vẫn phải thấy việc này thuộc nhóm nào */}
                        {(task.labelIds ?? []).length > 0 && (
                          <span className="flex items-center gap-0.5 shrink-0">
                            {(task.labelIds ?? [])
                              .slice(0, 3)
                              .map((id) => labelById.get(id))
                              .filter((l) => !!l)
                              .map((l) => (
                                <span
                                  key={l!.id}
                                  title={l!.name}
                                  className="size-1.5 rounded-full"
                                  style={{ background: l!.color }}
                                />
                              ))}
                          </span>
                        )}

                        {/* Việc lặp: trước đây lịch không hề cho biết, nên một
                            việc lặp hàng tuần nhìn y hệt việc chỉ có một lần */}
                        {task.repeat && (
                          <Repeat
                            size={10}
                            className="shrink-0 text-sky-500"
                          />
                        )}

                        <span
                          className={`shrink-0 tabular-nums ${
                            overdue ? "text-red-400" : "text-slate-400"
                          }`}
                        >
                          {dayjs(at).format("HH:mm")}
                        </span>
                      </div>
                    );
                  })}
                  {items.length > 3 && (
                    <span className="text-[10.5px] text-sky-600 font-medium px-1">
                      +{items.length - 3} công việc khác
                    </span>
                  )}
                </div>
              </div>
            );
          })}
              </div>

              {/* Lớp thanh sự kiện — phủ lên phần đầu các ô của tuần này */}
              <div
                className="pointer-events-none absolute left-0 right-0 grid grid-cols-7 px-1"
                /*
                 * `gridAutoRows` khoá chiều cao một làn = LANE_HEIGHT. Nhờ vậy
                 * phần chừa chỗ bên dưới (marginTop của cụm việc) khớp chính
                 * xác; để lưới tự co thì lệch vài pixel mỗi làn và với hai làn
                 * là thanh đè lên việc.
                 */
                style={{ top: 34, gridAutoRows: `${LANE_HEIGHT}px` }}
              >
                {bars.map((bar) => {
                  const { event } = bar;
                  const color = PRIORITY_META[event.priority].color;
                  return (
                    <button
                      key={`${event.id}-${weekIndex}`}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewingTask(event);
                      }}
                      title={`${event.code} — ${event.title}`}
                      className="pointer-events-auto flex items-center gap-1 px-1.5 text-[11px]
                        leading-none truncate border-0 cursor-pointer text-left"
                      /*
                       * Nền ĐẶC, chữ trắng — không phải nền nhạt 13% như trước.
                       *
                       * Trên ô trắng, một thanh nhạt gần như tan vào nền: phải
                       * nhìn kỹ mới biết ngày đó có lịch hẹn. Đặc màu thì lướt
                       * mắt qua cả tháng là thấy ngay ngày nào kín.
                       */
                      style={{
                        height: LANE_HEIGHT - 2,
                        marginBottom: 2,
                        gridColumn: `${bar.colStart + 1} / span ${bar.span}`,
                        gridRow: bar.lane + 1,
                        background: color,
                        color: "#fff",
                        // Bị cắt ở mép tuần thì để phẳng góc đó — dấu hiệu
                        // "còn tiếp sang tuần khác"
                        borderRadius: `${bar.clippedStart ? 0 : 4}px ${
                          bar.clippedEnd ? 0 : 4
                        }px ${bar.clippedEnd ? 0 : 4}px ${bar.clippedStart ? 0 : 4}px`,
                      }}
                    >
                      {/* Giờ bắt đầu chỉ hiện ở tuần mà sự kiện thật sự bắt đầu,
                          và chỉ khi không phải sự kiện cả ngày */}
                      {bar.startsHere && !event.allDay && (
                        <span className="font-semibold tabular-nums shrink-0">
                          {dayjs(event.startAt!).format("HH:mm")}
                        </span>
                      )}
                      <span className="truncate">{event.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
        </div>
      </div>
      )}

      {/* ===== Drawer danh sách task của 1 ngày ===== */}
      <Drawer
        open={!!selectedDay}
        onClose={() => setSelectedDay(null)}
        width={screens.sm ? 560 : "100%"}
        title={
          selectedDay && (
            <span className="inline-flex items-center gap-2">
              <CalendarDays size={16} className="text-slate-500" />
              {selectedDay.format("dddd, DD/MM/YYYY")}
              <Badge
                count={selectedDayTasks.length}
                color="#0a436d"
                style={{ marginLeft: 10 }}
              />
            </span>
          )
        }
        extra={
          <Button
            type="primary"
            size="small"
            icon={<Plus size={14} />}
            onClick={() => openCreate(selectedDay)}
          >
            Tạo task ngày này
          </Button>
        }
      >
        {/*
          TIMELINE THEO GIỜ đặt lên trên cùng.

          Danh sách bên dưới trả lời "hôm nay có những gì", còn timeline trả
          lời "lúc nào trống" — câu thứ hai mới là lý do người ta bấm vào một
          ngày. Dùng lại đúng component của chế độ xem Ngày, không dựng thứ hai.
        */}
        {selectedDay && (
          <div className="mb-4">
            <DayTimeline
              day={selectedDay}
              items={selectedDayTasks
                .filter((e) => !e.projected)
                .map((e) => e.task)}
              onSelect={setViewingTask}
              onCreateAt={(at) => openCreate(at)}
            />
          </div>
        )}

        {selectedDayTasks.length ? (
          <List
            dataSource={selectedDayTasks}
            renderItem={(entry) => {
              const { task, at, projected } = entry;
              const type = taskTypes?.find((t) => t.id === task.taskTypeId);
              return (
                <List.Item
                  // Bấm vào lượt dự kiến vẫn mở VIỆC GỐC — nó là cùng một việc,
                  // và đó cũng là bản ghi duy nhất sửa được
                  onClick={() => setViewingTask(task)}
                  style={{ cursor: "pointer", opacity: projected ? 0.75 : 1 }}
                >
                  <div className="flex w-full items-start gap-3">
                    <span
                      className="size-2.5 rounded-full mt-1.5 shrink-0"
                      style={{ background: PRIORITY_META[task.priority].color }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-slate-400">
                          {task.code}
                        </span>
                        {task.kind === ItemKind.EVENT && (
                          <Tag
                            bordered={false}
                            color="purple"
                            style={{ fontSize: 10, lineHeight: "16px", margin: 0 }}
                          >
                            lịch hẹn
                          </Tag>
                        )}
                        {projected && (
                          <Tooltip title="Lượt lặp tính trước — chỉ thành việc thật khi bạn hoàn thành lượt hiện tại">
                            <Tag
                              bordered={false}
                              color="blue"
                              style={{ fontSize: 10, lineHeight: "16px", margin: 0 }}
                            >
                              dự kiến
                            </Tag>
                          </Tooltip>
                        )}
                        {task.sourceMailAccountId && (
                          <Tooltip title="Tự tạo từ email">
                            <Mail size={11} className="text-cyan-500" />
                          </Tooltip>
                        )}
                      </div>
                      <div className="text-[13px] font-medium text-slate-700">
                        {task.title}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {type && (
                          <Tag
                            color={type.color}
                            style={{
                              fontSize: 10,
                              lineHeight: "16px",
                              margin: 0,
                            }}
                          >
                            {type.name}
                          </Tag>
                        )}
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                          <CalendarClock size={11} />
                          {/* Sự kiện hiện KHOẢNG, việc hiện MỘT mốc */}
                          {task.kind === ItemKind.EVENT
                            ? rangeText(task)
                            : dayjs(at).format("HH:mm")}
                        </span>

                        {/* Thời lượng dự kiến — có sẵn trong dữ liệu, trước
                            giờ chỉ bảng công việc dùng tới */}
                        {!!task.estimateMinutes && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                            <Timer size={11} />
                            {task.estimateMinutes} phút
                          </span>
                        )}

                        {/* Lặp lại: ngăn kéo đủ rộng nên ghi hẳn thành chữ,
                            "Mỗi 2 tuần vào T2, T5" rõ hơn một biểu tượng */}
                        {task.repeat && (
                          <Tooltip title="Việc lặp lại">
                            <span className="inline-flex items-center gap-1 text-[11px] text-sky-600">
                              <Repeat size={11} />
                              {repeatText(task.repeat, task.deadline)}
                            </span>
                          </Tooltip>
                        )}
                      </div>

                      {/* Nhãn: ngăn kéo rộng nên hiện chip có chữ, giới hạn 4
                          cái rồi gom phần dư — cùng quy tắc với thẻ ở bảng */}
                      {(task.labelIds ?? []).length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 mt-1.5">
                          {(task.labelIds ?? [])
                            .slice(0, 4)
                            .map((id) => labelById.get(id))
                            .filter((l) => !!l)
                            .map((l) => (
                              <span
                                key={l!.id}
                                className="inline-flex items-center gap-1 h-[18px] px-1.5 rounded-md text-[10.5px] font-semibold"
                                style={{
                                  background: `${l!.color}1f`,
                                  color: l!.color,
                                  border: `1px solid ${l!.color}39`,
                                }}
                              >
                                <span
                                  className="inline-block size-1.5 rounded-full"
                                  style={{ background: l!.color }}
                                />
                                {l!.name}
                              </span>
                            ))}
                          {(task.labelIds ?? []).length > 4 && (
                            <span className="text-[10.5px] text-slate-400 font-semibold">
                              +{(task.labelIds ?? []).length - 4}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <Tag color={STATUS_META[task.status].color}>
                      {STATUS_META[task.status].label}
                    </Tag>
                  </div>
                </List.Item>
              );
            }}
          />
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Không có công việc nào đến hạn ngày này"
          >
            <Button
              type="primary"
              icon={<Plus size={14} />}
              onClick={() => openCreate(selectedDay)}
            >
              Tạo công việc
            </Button>
          </Empty>
        )}
      </Drawer>

      <TaskFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        task={editingTask}
        defaultDeadline={defaultDeadline}
      />
      <TaskDetailDrawer
        task={viewingTask}
        onClose={() => setViewingTask(null)}
        onEdit={openEdit}
      />
    </div>
  );
}
