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
  ChevronLeft,
  ChevronRight,
  Mail,
  Plus,
} from "lucide-react";
import TaskDetailDrawer from "@/components/tasks/TaskDetailDrawer";
import TaskFormModal from "@/components/tasks/TaskFormModal";
import { taskApi } from "@/apis/task.api";
import {
  useInvalidateTaskData,
  useMe,
  useTasks,
  useTaskTypes,
} from "@/hooks/useTaskApp";
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

  const tasksByDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    tasks.forEach((task) => {
      if (!task.deadline) return;
      const key = dayjs(task.deadline).format("YYYY-MM-DD");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(task);
    });
    map.forEach((list) =>
      list.sort(
        (a, b) => dayjs(a.deadline).valueOf() - dayjs(b.deadline).valueOf(),
      ),
    );
    return map;
  }, [tasks]);

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
                  {shown.map((task) => {
                    const finished =
                      task.status === TaskStatus.DONE ||
                      task.status === TaskStatus.CANCELLED;
                    const overdue =
                      !finished && dayjs(task.deadline).isBefore(today);
                    const type = taskTypes?.find(
                      (t) => t.id === task.taskTypeId,
                    );
                    return (
                      <div
                        key={task.id}
                        draggable={!finished}
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
                        title={`${task.code} — ${task.title} (${dayjs(task.deadline).format("HH:mm")})`}
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
                        } ${draggingId === task.id ? "opacity-40" : ""}`}
                        style={{
                          borderLeftWidth: 3,
                          borderLeftColor: type?.color
                            ? type.color
                            : PRIORITY_META[task.priority].color,
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
                        <span
                          className={`shrink-0 tabular-nums ${
                            overdue ? "text-red-400" : "text-slate-400"
                          }`}
                        >
                          {dayjs(task.deadline).format("HH:mm")}
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
            <span>
              📅 {selectedDay.format("dddd, DD/MM/YYYY")}
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
            renderItem={(task) => {
              const type = taskTypes?.find((t) => t.id === task.taskTypeId);
              return (
                <List.Item
                  onClick={() => setViewingTask(task)}
                  style={{ cursor: "pointer" }}
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
                          {dayjs(task.deadline).format("HH:mm")}
                        </span>
                      </div>
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
