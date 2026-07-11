"use client";

import { useMemo, useState } from "react";
import {
  Button,
  Card,
  DatePicker,
  Input,
  Popconfirm,
  Segmented,
  Select,
  Table,
  Tag,
  Tooltip,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs, { Dayjs } from "dayjs";
import { CheckCheck, Mail, Pencil, Plus, RotateCw, Trash2 } from "lucide-react";
import TaskDetailDrawer from "@/components/tasks/TaskDetailDrawer";
import TaskFormModal from "@/components/tasks/TaskFormModal";
import {
  useCompleteTask,
  useDeleteTask,
  useMailAccounts,
  useMe,
  useTasks,
  useTaskTypes,
} from "@/hooks/useTaskApp";
import {
  CATEGORY_META,
  DEADLINE_META,
  PRIORITY_META,
  QueryTaskParams,
  STATUS_META,
  Task,
  TaskCategory,
  TaskPriority,
  TaskStatus,
  isAdminRole,
} from "@/models/task";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Filters = {
  status?: TaskStatus;
  priority?: TaskPriority;
  category?: TaskCategory;
  taskTypeId?: string;
  sourceMailAccountId?: string;
  assigneeId?: string;
  range?: [Dayjs | null, Dayjs | null] | null;
};

export default function TasksPage() {
  const { data: me } = useMe();
  const admin = isAdminRole(me?.role);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [filters, setFilters] = useState<Filters>({});
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);

  const setFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const queryParams: QueryTaskParams = useMemo(
    () => ({
      page,
      limit,
      status: filters.status,
      priority: filters.priority,
      category: filters.category,
      taskTypeId: filters.taskTypeId,
      sourceMailAccountId: filters.sourceMailAccountId,
      assigneeId:
        admin && filters.assigneeId && UUID_RE.test(filters.assigneeId)
          ? filters.assigneeId
          : undefined,
      from: filters.range?.[0]?.startOf("day").toISOString(),
      to: filters.range?.[1]?.endOf("day").toISOString(),
    }),
    [page, limit, filters, admin],
  );

  const { data, isLoading, isFetching, refetch } = useTasks(queryParams);
  const { data: taskTypes } = useTaskTypes();
  const { data: mailAccounts } = useMailAccounts();
  const completeTask = useCompleteTask();
  const deleteTask = useDeleteTask();

  // Task đang xem trong drawer luôn lấy bản mới nhất từ list
  const liveViewingTask =
    data?.items.find((t) => t.id === viewingTask?.id) ?? viewingTask;

  const openCreate = () => {
    setEditingTask(null);
    setFormOpen(true);
  };
  const openEdit = (task: Task) => {
    setViewingTask(null);
    setEditingTask(task);
    setFormOpen(true);
  };

  const columns: ColumnsType<Task> = [
    {
      title: "Mã",
      dataIndex: "code",
      width: 110,
      render: (code: string, task) => (
        <div className="font-mono text-xs text-slate-500">
          {code}
          {task.sourceMailAccountId && (
            <Tooltip title="Tự tạo từ email Gmail">
              <Tag
                color="cyan"
                style={{ marginLeft: 0, marginTop: 4, display: "block", width: "fit-content" }}
              >
                <span className="inline-flex items-center gap-1">
                  <Mail size={10} /> Email
                </span>
              </Tag>
            </Tooltip>
          )}
        </div>
      ),
    },
    {
      title: "Tiêu đề",
      dataIndex: "title",
      ellipsis: true,
      render: (title: string, task) => (
        <div>
          <div className="font-medium text-slate-700 truncate">{title}</div>
          {task.description && (
            <div className="text-xs text-slate-400 truncate">
              {task.description}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Loại",
      dataIndex: "taskTypeId",
      width: 130,
      render: (taskTypeId: string | null) => {
        const type = taskTypes?.find((t) => t.id === taskTypeId);
        return type ? <Tag color={type.color}>{type.name}</Tag> : "—";
      },
    },
    {
      title: "Phân loại",
      dataIndex: "category",
      width: 110,
      render: (category: TaskCategory) => (
        <Tag color={CATEGORY_META[category].color}>
          {CATEGORY_META[category].label}
        </Tag>
      ),
    },
    {
      title: "Ưu tiên",
      dataIndex: "priority",
      width: 120,
      render: (priority: TaskPriority) => (
        <span className="inline-flex items-center gap-1.5 text-[13px]">
          <span
            className="size-2 rounded-full inline-block"
            style={{ background: PRIORITY_META[priority].color }}
          />
          {PRIORITY_META[priority].label}
        </span>
      ),
    },
    {
      title: "Deadline",
      dataIndex: "deadline",
      width: 170,
      render: (deadline: string | null, task) =>
        deadline ? (
          <div>
            <div className="text-[13px]">
              {dayjs(deadline).format("DD/MM/YYYY HH:mm")}
            </div>
            <Tag
              color={DEADLINE_META[task.deadlineStatus].color}
              style={{ fontSize: 11, lineHeight: "16px", marginTop: 2 }}
            >
              {DEADLINE_META[task.deadlineStatus].label}
            </Tag>
          </div>
        ) : (
          "—"
        ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 120,
      render: (status: TaskStatus) => (
        <Tag color={STATUS_META[status].color}>{STATUS_META[status].label}</Tag>
      ),
    },
    {
      title: "",
      key: "actions",
      width: 130,
      align: "right",
      render: (_, task) => (
        <div
          className="flex justify-end gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          {task.status !== TaskStatus.DONE &&
            task.status !== TaskStatus.CANCELLED && (
              <Tooltip title="Đánh dấu hoàn thành">
                <Button
                  size="small"
                  type="text"
                  style={{ color: "#2a9d8f" }}
                  icon={<CheckCheck size={15} />}
                  onClick={() => completeTask.mutate(task.id)}
                />
              </Tooltip>
            )}
          <Tooltip title="Sửa">
            <Button
              size="small"
              type="text"
              icon={<Pencil size={14} />}
              onClick={() => openEdit(task)}
            />
          </Tooltip>
          <Popconfirm
            title="Xoá công việc này?"
            okText="Xoá"
            okButtonProps={{ danger: true }}
            cancelText="Huỷ"
            onConfirm={() => deleteTask.mutate(task.id)}
          >
            <Button
              size="small"
              type="text"
              danger
              icon={<Trash2 size={14} />}
            />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4 max-w-[1400px] mx-auto">
      {/* ===== Toolbar ===== */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented
          value={filters.status ?? "ALL"}
          onChange={(value) =>
            setFilter(
              "status",
              value === "ALL" ? undefined : (value as TaskStatus),
            )
          }
          options={[
            { label: "Tất cả", value: "ALL" },
            ...Object.values(TaskStatus).map((s) => ({
              label: STATUS_META[s].label,
              value: s,
            })),
          ]}
        />
        <div className="flex items-center gap-2">
          <Tooltip title="Làm mới">
            <Button
              icon={<RotateCw size={15} className={isFetching ? "animate-spin" : ""} />}
              onClick={() => refetch()}
            />
          </Tooltip>
          <Button type="primary" icon={<Plus size={16} />} onClick={openCreate}>
            Tạo công việc
          </Button>
        </div>
      </div>

      {/* ===== Filters ===== */}
      <Card variant="borderless" styles={{ body: { padding: 16 } }}>
        <div className="flex flex-wrap items-center gap-2.5">
          <Select
            allowClear
            placeholder="Độ ưu tiên"
            style={{ width: 140 }}
            value={filters.priority}
            onChange={(v) => setFilter("priority", v)}
            options={Object.values(TaskPriority).map((p) => ({
              value: p,
              label: PRIORITY_META[p].label,
            }))}
          />
          <Select
            allowClear
            placeholder="Phân loại"
            style={{ width: 130 }}
            value={filters.category}
            onChange={(v) => setFilter("category", v)}
            options={Object.values(TaskCategory).map((c) => ({
              value: c,
              label: CATEGORY_META[c].label,
            }))}
          />
          <Select
            allowClear
            placeholder="Loại công việc"
            style={{ width: 170 }}
            value={filters.taskTypeId}
            onChange={(v) => setFilter("taskTypeId", v)}
            options={(taskTypes ?? []).map((t) => ({
              value: t.id,
              label: t.name,
            }))}
          />
          {(mailAccounts?.length ?? 0) > 0 && (
            <Select
              allowClear
              placeholder="Nguồn email"
              style={{ width: 200 }}
              value={filters.sourceMailAccountId}
              onChange={(v) => setFilter("sourceMailAccountId", v)}
              options={(mailAccounts ?? []).map((m) => ({
                value: m.id,
                label: `📧 ${m.email}`,
              }))}
            />
          )}
          <DatePicker.RangePicker
            placeholder={["Deadline từ", "đến"]}
            format="DD/MM/YYYY"
            value={filters.range ?? null}
            onChange={(range) => setFilter("range", range)}
          />
          {admin && (
            <Tooltip title="Chỉ admin — lọc theo UUID người thực hiện">
              <Input
                allowClear
                placeholder="Assignee UUID (admin)"
                style={{ width: 220 }}
                value={filters.assigneeId}
                onChange={(e) => setFilter("assigneeId", e.target.value)}
                status={
                  filters.assigneeId && !UUID_RE.test(filters.assigneeId)
                    ? "warning"
                    : undefined
                }
              />
            </Tooltip>
          )}
        </div>
      </Card>

      {/* ===== Table ===== */}
      <Card variant="borderless" styles={{ body: { padding: 0 } }}>
        <Table<Task>
          rowKey="id"
          columns={columns}
          dataSource={data?.items}
          loading={isLoading}
          size="middle"
          onRow={(task) => ({
            onClick: () => setViewingTask(task),
            style: { cursor: "pointer" },
          })}
          pagination={{
            current: data?.page ?? page,
            pageSize: data?.limit ?? limit,
            total: data?.total ?? 0,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50, 100],
            showTotal: (total) => `Tổng ${total} công việc`,
            onChange: (nextPage, nextLimit) => {
              setPage(nextLimit !== limit ? 1 : nextPage);
              setLimit(nextLimit);
            },
          }}
        />
      </Card>

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
