"use client";

import { DragEvent, useMemo, useState } from "react";
import {
  App,
  Badge,
  Button,
  Drawer,
  Empty,
  Grid,
  List,
  Radio,
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
  useMe,
  useTasks,
  useTaskTypes,
} from "@/hooks/useTaskApp";
import { repeatText } from "@/models/board";
import { projectOccurrences } from "@/utils/client/recurrence";

/**
 * Một dòng trên lịch: việc thật, hoặc một lượt lặp DỰ KIẾN của việc đó.
 * `at` là mốc của riêng dòng này — với lượt dự kiến nó khác `task.deadline`.
 */
type CalendarEntry = { task: Task; at: string; projected: boolean };
import {
  PRIORITY_META,
  STATUS_META,
  Task,
  TaskPriority,
  TaskStatus,
  isAdminRole,
} from "@/models/task";
import { getApiErrorMessage } from "@/utils/client/apiError";

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

export default function CalendarPage() {
  const { message } = App.useApp();
  const screens = Grid.useBreakpoint();
  // Dùng chung một danh sách khoá với mọi màn khác — xem useInvalidateTaskData
  const invalidate = useInvalidateTaskData();
  const { data: me } = useMe();
  const admin = isAdminRole(me?.role);

  const [month, setMonth] = useState<Dayjs>(dayjs());
  const [status, setStatus] = useState<TaskStatus | undefined>();

  // 42 ô = 6 tuần, bắt đầu từ thứ 2 của tuần chứa mùng 1
  const gridStart = useMemo(() => {
    const first = month.startOf("month");
    // dayjs vi locale: tuần bắt đầu thứ 2; phòng khi locale khác, tự tính
    const offset = (first.day() + 6) % 7; // 0 = thứ 2
    return first.subtract(offset, "day");
  }, [month]);
  const days = useMemo(
    () => Array.from({ length: 42 }, (_, i) => gridStart.add(i, "day")),
    [gridStart],
  );

  const { data, isFetching } = useTasks({
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
  const tasksByDay = useMemo(() => {
    const map = new Map<string, CalendarEntry[]>();
    const push = (at: string, entry: CalendarEntry) => {
      const key = dayjs(at).format("YYYY-MM-DD");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(entry);
    };

    const gridEnd = gridStart.add(41, "day");

    tasks.forEach((task) => {
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

  const [selectedDay, setSelectedDay] = useState<Dayjs | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultDeadline, setDefaultDeadline] = useState<Dayjs | null>(null);

  const selectedDayTasks = selectedDay
    ? (tasksByDay.get(selectedDay.format("YYYY-MM-DD")) ?? [])
    : [];

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
          <Button
            icon={<ChevronLeft size={16} />}
            onClick={() => setMonth((m) => m.subtract(1, "month"))}
          />
          <span className="font-bold text-lg text-slate-700 min-w-[170px] text-center capitalize">
            {month.format("MMMM YYYY")}
          </span>
          <Button
            icon={<ChevronRight size={16} />}
            onClick={() => setMonth((m) => m.add(1, "month"))}
          />
          <Button onClick={() => setMonth(dayjs())}>Hôm nay</Button>
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
        <span>💡 Kéo thả task sang ngày khác để dời deadline</span>
      </div>

      {/* ===== Month grid ===== */}
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

        {/* Cells */}
        <div className="grid grid-cols-7">
          {days.map((day) => {
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
                      ? "bg-blue-50/60"
                      : isWeekend && inMonth
                        ? "bg-slate-50/50 hover:bg-slate-50"
                        : "hover:bg-slate-50"
                } ${!inMonth ? "bg-slate-50/30" : ""}`}
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

                {/* Task chips */}
                <div className="flex flex-col gap-1">
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
                            ? "border-slate-100 bg-slate-50 cursor-pointer"
                            : "cursor-grab active:cursor-grabbing hover:shadow-sm"
                        } ${
                          overdue
                            ? "border-red-200 bg-red-50"
                            : !finished
                              ? "border-slate-200 bg-white"
                              : ""
                        } ${draggingId === task.id ? "opacity-40" : ""} ${
                          projected ? "border-dashed opacity-70" : ""
                        }`}
                        style={{
                          borderLeftWidth: 3,
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
        </div>
      </div>

      {/* ===== Drawer danh sách task của 1 ngày ===== */}
      <Drawer
        open={!!selectedDay}
        onClose={() => setSelectedDay(null)}
        width={screens.sm ? 440 : "100%"}
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
                          {dayjs(at).format("HH:mm")}
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
        isAdmin={admin}
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
