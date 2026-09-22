"use client";

import { DragEvent, useMemo, useState } from "react";
import {
  App,
  Badge,
  Button,
  Card,
  Input,
  Select,
  Skeleton,
  Switch,
  Tag,
  Tooltip,
} from "antd";
import dayjs from "dayjs";
import {
  AlertTriangle,
  CalendarClock,
  CheckCheck,
  LoaderCircle,
  Mail,
  Plus,
  RotateCw,
  Search,
} from "lucide-react";
import TaskDetailDrawer from "@/components/tasks/TaskDetailDrawer";
import TaskFormModal from "@/components/tasks/TaskFormModal";
import { taskApi } from "@/apis/task.api";
import {
  useCompleteTask,
  useInvalidateTaskData,
  useMe,
  useTasks,
  useTaskTypes,
} from "@/hooks/useTaskApp";
import {
  CATEGORY_META,
  PRIORITY_META,
  Task,
  TaskCategory,
  TaskPriority,
  TaskStatus,
  isAdminRole,
} from "@/models/task";
import { getApiErrorMessage } from "@/utils/client/apiError";

const COLUMNS: { status: TaskStatus; title: string; accent: string; bg: string }[] = [
  { status: TaskStatus.TODO, title: "Chờ xử lý", accent: "#94a3b8", bg: "#f8fafc" },
  { status: TaskStatus.IN_PROGRESS, title: "Đang làm", accent: "#0ea5e9", bg: "#f0f9ff" },
  { status: TaskStatus.DONE, title: "Hoàn thành", accent: "#2a9d8f", bg: "#f0fdf9" },
  { status: TaskStatus.CANCELLED, title: "Đã huỷ", accent: "#e63946", bg: "#fef2f2" },
];

export default function KanbanPage() {
  const { message } = App.useApp();
  const { data: me } = useMe();
  const admin = isAdminRole(me?.role);

  const [priority, setPriority] = useState<TaskPriority | undefined>();
  const [category, setCategory] = useState<TaskCategory | undefined>();
  const [taskTypeId, setTaskTypeId] = useState<string | undefined>();
  const [keyword, setKeyword] = useState("");
  const [showCancelled, setShowCancelled] = useState(false);

  // Backend cho tối đa limit=100 — bảng kanban lấy 100 task gần nhất theo filter
  const params = useMemo(
    () => ({ limit: 100, priority, category, taskTypeId }),
    [priority, category, taskTypeId],
  );
  const { data, isLoading, isFetching, refetch } = useTasks(params);
  const { data: taskTypes } = useTaskTypes();
  const completeTask = useCompleteTask();

  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);

  // Optimistic override: taskId -> status mới (áp ngay khi thả, xoá khi server trả lời)
  const [overrides, setOverrides] = useState<Record<string, TaskStatus>>({});
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  const tasks = useMemo(() => {
    let items = (data?.items ?? []).map((t) =>
      overrides[t.id] ? { ...t, status: overrides[t.id] } : t,
    );
    const query = keyword.trim().toLowerCase();
    if (query) {
      items = items.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          t.code.toLowerCase().includes(query) ||
          t.description?.toLowerCase().includes(query),
      );
    }
    return items;
  }, [data, overrides, keyword]);

  const grouped = useMemo(() => {
    const map = new Map<TaskStatus, Task[]>();
    COLUMNS.forEach((c) => map.set(c.status, []));
    tasks.forEach((t) => map.get(t.status)?.push(t));
    // Trong cột: khẩn cấp trước, rồi deadline gần trước
    map.forEach((list) =>
      list.sort((a, b) => {
        const w =
          PRIORITY_META[b.priority].weight - PRIORITY_META[a.priority].weight;
        if (w !== 0) return w;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return dayjs(a.deadline).valueOf() - dayjs(b.deadline).valueOf();
      }),
    );
    return map;
  }, [tasks]);

  const isOverdue = (task: Task) =>
    !!task.deadline &&
    task.status !== TaskStatus.DONE &&
    task.status !== TaskStatus.CANCELLED &&
    dayjs(task.deadline).isBefore(dayjs());

  // Dùng chung một danh sách khoá với mọi màn khác — xem useInvalidateTaskData
  const invalidate = useInvalidateTaskData();

  const handleDrop = async (event: DragEvent, status: TaskStatus) => {
    event.preventDefault();
    setDragOverColumn(null);
    setDraggingId(null);
    const taskId = event.dataTransfer.getData("text/task-id");
    const task = data?.items.find((t) => t.id === taskId);
    if (!task || task.status === status) return;

    // Optimistic: chuyển cột ngay lập tức
    setOverrides((prev) => ({ ...prev, [taskId]: status }));
    try {
      await taskApi.update(taskId, { status });
      message.success(
        `${task.code} → ${COLUMNS.find((c) => c.status === status)?.title}`,
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

  const openEdit = (task: Task) => {
    setViewingTask(null);
    setEditingTask(task);
    setFormOpen(true);
  };

  const liveViewingTask =
    tasks.find((t) => t.id === viewingTask?.id) ?? viewingTask;

  const visibleColumns = COLUMNS.filter(
    (c) => c.status !== TaskStatus.CANCELLED || showCancelled,
  );
  const cancelledCount = grouped.get(TaskStatus.CANCELLED)?.length ?? 0;

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* ===== Toolbar ===== */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <Input
            allowClear
            placeholder="Tìm tiêu đề, mã task..."
            prefix={<Search size={14} className="text-slate-400" />}
            className="w-full sm:w-[220px]"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <Select
            allowClear
            placeholder="Độ ưu tiên"
            style={{ width: 140 }}
            value={priority}
            onChange={setPriority}
            options={Object.values(TaskPriority).map((p) => ({
              value: p,
              label: PRIORITY_META[p].label,
            }))}
          />
          <Select
            allowClear
            placeholder="Phân loại"
            style={{ width: 130 }}
            value={category}
            onChange={setCategory}
            options={Object.values(TaskCategory).map((c) => ({
              value: c,
              label: CATEGORY_META[c].label,
            }))}
          />
          <Select
            allowClear
            placeholder="Loại công việc"
            style={{ width: 170 }}
            value={taskTypeId}
            onChange={setTaskTypeId}
            options={(taskTypes ?? []).map((t) => ({
              value: t.id,
              label: t.name,
            }))}
          />
          <span className="inline-flex items-center gap-2 text-[13px] text-slate-500">
            <Switch
              size="small"
              checked={showCancelled}
              onChange={setShowCancelled}
            />
            Cột Đã huỷ {cancelledCount > 0 && `(${cancelledCount})`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Tooltip title="Làm mới">
            <Button
              icon={
                <RotateCw
                  size={15}
                  className={isFetching ? "animate-spin" : ""}
                />
              }
              onClick={() => refetch()}
            />
          </Tooltip>
          <Button
            type="primary"
            icon={<Plus size={16} />}
            onClick={() => {
              setEditingTask(null);
              setFormOpen(true);
            }}
          >
            Tạo công việc
          </Button>
        </div>
      </div>

      {/* ===== Board ===== */}
      <div
        className={`grid grid-cols-1 md:grid-cols-2 gap-4 items-start ${
          visibleColumns.length === 4 ? "xl:grid-cols-4" : "xl:grid-cols-3"
        }`}
      >
        {visibleColumns.map((column) => {
          const items = grouped.get(column.status) ?? [];
          const overdueCount = items.filter(isOverdue).length;
          const isOver = dragOverColumn === column.status;
          return (
            <div
              key={column.status}
              className="rounded-xl border transition-all"
              style={{
                background: isOver ? "#eef6ff" : column.bg,
                borderColor: isOver ? "#0ea5e9" : "#e2e8f0",
                boxShadow: isOver ? "0 0 0 3px rgba(14,165,233,0.15)" : "none",
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverColumn(column.status);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setDragOverColumn(null);
                }
              }}
              onDrop={(e) => handleDrop(e, column.status)}
            >
              {/* Column header */}
              <div
                className="flex items-center gap-2 px-4 pt-3.5 pb-2 border-b border-black/5"
                style={{ borderTop: `3px solid ${column.accent}`, borderTopLeftRadius: 12, borderTopRightRadius: 12 }}
              >
                <span className="font-semibold text-[13.5px] text-slate-700">
                  {column.title}
                </span>
                <Badge
                  count={items.length}
                  showZero
                  color="#cbd5e1"
                  style={{ color: "#475569" }}
                />
                {overdueCount > 0 && (
                  <Tooltip title={`${overdueCount} task quá hạn`}>
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-500 bg-red-50 border border-red-200 rounded-full px-2 py-0.5 ml-auto">
                      <AlertTriangle size={11} />
                      {overdueCount}
                    </span>
                  </Tooltip>
                )}
              </div>

              {/* Cards */}
              <div className="flex flex-col gap-2 p-2.5 min-h-[140px] max-h-[calc(100vh-280px)] overflow-y-auto">
                {isLoading ? (
                  <Card size="small">
                    <Skeleton active paragraph={{ rows: 1 }} title={false} />
                  </Card>
                ) : (
                  items.map((task) => {
                    const type = taskTypes?.find(
                      (t) => t.id === task.taskTypeId,
                    );
                    const overdue = isOverdue(task);
                    const canComplete =
                      task.status !== TaskStatus.DONE &&
                      task.status !== TaskStatus.CANCELLED;
                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/task-id", task.id);
                          setDraggingId(task.id);
                        }}
                        onDragEnd={() => {
                          setDraggingId(null);
                          setDragOverColumn(null);
                        }}
                        onClick={() => setViewingTask(task)}
                        className={`group bg-white rounded-lg border p-3 cursor-grab active:cursor-grabbing shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-md transition-all ${
                          draggingId === task.id
                            ? "opacity-40 rotate-1 scale-[0.98]"
                            : ""
                        } ${
                          overdue
                            ? "border-red-200 hover:border-red-300"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                        style={{
                          borderLeft: `3px solid ${PRIORITY_META[task.priority].color}`,
                          opacity: overrides[task.id] ? 0.6 : undefined,
                        }}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-mono text-[11px] text-slate-400">
                            {task.code}
                          </span>
                          <span className="flex items-center gap-1.5">
                            {task.sourceMailAccountId && (
                              <Tooltip title="Tự tạo từ email">
                                <Mail
                                  size={12}
                                  className="text-cyan-500 shrink-0"
                                />
                              </Tooltip>
                            )}
                            {canComplete && (
                              <Tooltip title="Hoàn thành ngay">
                                <button
                                  disabled={
                                    completeTask.isPending &&
                                    completeTask.variables === task.id
                                  }
                                  className="opacity-0 group-hover:opacity-100 transition-opacity grid place-items-center size-5 rounded border-0 cursor-pointer bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white disabled:opacity-100"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    completeTask.mutate(task.id);
                                  }}
                                >
                                  {completeTask.isPending &&
                                  completeTask.variables === task.id ? (
                                    <LoaderCircle
                                      size={13}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <CheckCheck size={13} />
                                  )}
                                </button>
                              </Tooltip>
                            )}
                          </span>
                        </div>
                        <div className="text-[13px] font-medium text-slate-700 leading-snug mb-2 line-clamp-2">
                          {task.title}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
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
                          <Tag
                            style={{
                              fontSize: 10,
                              lineHeight: "16px",
                              margin: 0,
                            }}
                            color={CATEGORY_META[task.category].color}
                          >
                            {CATEGORY_META[task.category].label}
                          </Tag>
                          {task.deadline && (
                            <span
                              className={`inline-flex items-center gap-1 text-[11px] ml-auto ${
                                overdue
                                  ? "text-red-500 font-medium"
                                  : "text-slate-400"
                              }`}
                            >
                              {overdue && <AlertTriangle size={11} />}
                              <CalendarClock size={11} />
                              {dayjs(task.deadline).format("DD/MM HH:mm")}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                {!isLoading && items.length === 0 && (
                  <div className="grid place-items-center h-24 text-slate-300 text-xs border border-dashed border-slate-200 rounded-lg">
                    {keyword ? "Không khớp tìm kiếm" : "Kéo thả task vào đây"}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <TaskFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        task={editingTask}
        isAdmin={admin}
      />
      <TaskDetailDrawer
        task={viewingTask ? liveViewingTask : null}
        onClose={() => setViewingTask(null)}
        onEdit={openEdit}
      />
    </div>
  );
}
