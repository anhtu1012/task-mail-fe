"use client";

import { useMemo, useState } from "react";
import {
  App,
  Button,
  Card,
  DatePicker,
  Dropdown,
  Input,
  Popconfirm,
  Segmented,
  Select,
  Table,
  Tag,
  Tooltip,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useQueryClient } from "@tanstack/react-query";
import dayjs, { Dayjs } from "dayjs";
import {
  CheckCheck,
  ChevronDown,
  Download,
  Mail,
  Pencil,
  Plus,
  RotateCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import TaskDetailDrawer from "@/components/tasks/TaskDetailDrawer";
import TaskFormModal from "@/components/tasks/TaskFormModal";
import TaskFilterPresets from "@/components/tasks/TaskFilterPresets";
import { taskApi } from "@/apis/task.api";
import { getApiErrorMessage } from "@/utils/client/apiError";
import { exportTasksToCsv } from "@/utils/client/exportTasksToCsv";
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

/** Chạy các API call theo từng lô nhỏ để tránh vượt rate-limit backend (20 req/60s) */
async function runInBatches<T>(
  items: T[],
  worker: (item: T) => Promise<unknown>,
  batchSize = 5,
): Promise<void> {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await Promise.all(batch.map(worker));
  }
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type Filters = {
  status?: TaskStatus;
  priority?: TaskPriority;
  category?: TaskCategory;
  taskTypeId?: string;
  sourceMailAccountId?: string;
  assigneeId?: string;
  range?: [Dayjs | null, Dayjs | null] | null;
  /** Tìm theo mã/tiêu đề — lọc phía client trên trang dữ liệu hiện tại */
  search?: string;
};

export default function TasksPage() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const { data: me } = useMe();
  const admin = isAdminRole(me?.role);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [filters, setFilters] = useState<Filters>({});
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

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

  // Search theo mã/tiêu đề/mô tả — lọc client-side trên trang dữ liệu đang tải
  const displayedItems = useMemo(() => {
    const items = data?.items ?? [];
    const keyword = filters.search?.trim().toLowerCase();
    if (!keyword) return items;
    return items.filter(
      (t) =>
        t.code.toLowerCase().includes(keyword) ||
        t.title.toLowerCase().includes(keyword) ||
        (t.description ?? "").toLowerCase().includes(keyword),
    );
  }, [data?.items, filters.search]);

  const invalidateAfterBulk = () => {
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
    queryClient.invalidateQueries({ queryKey: ["task-stats"] });
  };

  const handleBulkStatus = async (status: TaskStatus) => {
    const ids = selectedRowKeys as string[];
    setBulkLoading(true);
    try {
      await runInBatches(ids, (id) => taskApi.update(id, { status }));
      message.success(`Đã cập nhật trạng thái cho ${ids.length} công việc`);
      setSelectedRowKeys([]);
      invalidateAfterBulk();
    } catch (error) {
      message.error(getApiErrorMessage(error));
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkPriority = async (priority: TaskPriority) => {
    const ids = selectedRowKeys as string[];
    setBulkLoading(true);
    try {
      await runInBatches(ids, (id) => taskApi.update(id, { priority }));
      message.success(`Đã cập nhật độ ưu tiên cho ${ids.length} công việc`);
      setSelectedRowKeys([]);
      invalidateAfterBulk();
    } catch (error) {
      message.error(getApiErrorMessage(error));
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    const ids = selectedRowKeys as string[];
    setBulkLoading(true);
    try {
      await runInBatches(ids, (id) => taskApi.remove(id));
      message.success(`Đã xoá ${ids.length} công việc`);
      setSelectedRowKeys([]);
      invalidateAfterBulk();
    } catch (error) {
      message.error(getApiErrorMessage(error));
    } finally {
      setBulkLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      // Lấy toàn bộ dữ liệu khớp filter hiện tại (không chỉ trang đang xem)
      const all = await taskApi.list({ ...queryParams, page: 1, limit: 1000 });
      exportTasksToCsv(all.items, taskTypes ?? []);
      message.success(`Đã xuất ${all.items.length} công việc ra CSV`);
    } catch (error) {
      message.error(getApiErrorMessage(error));
    } finally {
      setExporting(false);
    }
  };

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
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Input
            allowClear
            placeholder="Tìm theo mã / tiêu đề / mô tả"
            prefix={<Search size={14} className="text-slate-400" />}
            className="w-full sm:w-[240px]"
            value={filters.search}
            onChange={(e) => setFilter("search", e.target.value)}
          />
          <Tooltip title="Làm mới">
            <Button
              icon={<RotateCw size={15} className={isFetching ? "animate-spin" : ""} />}
              onClick={() => refetch()}
            />
          </Tooltip>
          <Tooltip title="Xuất CSV theo bộ lọc hiện tại">
            <Button
              icon={<Download size={15} />}
              loading={exporting}
              onClick={handleExport}
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
          <TaskFilterPresets filters={filters} onApply={setFilters} />
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

      {/* ===== Bulk action bar ===== */}
      {selectedRowKeys.length > 0 && (
        <Card
          variant="borderless"
          styles={{ body: { padding: 12 } }}
          style={{ background: "#eff6ff", borderColor: "#bfdbfe" }}
        >
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-sm font-medium text-slate-700">
              Đã chọn {selectedRowKeys.length} công việc
            </span>
            <Dropdown
              trigger={["click"]}
              disabled={bulkLoading}
              menu={{
                items: Object.values(TaskStatus).map((s) => ({
                  key: s,
                  label: STATUS_META[s].label,
                  onClick: () => handleBulkStatus(s),
                })),
              }}
            >
              <Button loading={bulkLoading}>
                Đổi trạng thái <ChevronDown size={14} />
              </Button>
            </Dropdown>
            <Dropdown
              trigger={["click"]}
              disabled={bulkLoading}
              menu={{
                items: Object.values(TaskPriority).map((p) => ({
                  key: p,
                  label: PRIORITY_META[p].label,
                  onClick: () => handleBulkPriority(p),
                })),
              }}
            >
              <Button loading={bulkLoading}>
                Đổi ưu tiên <ChevronDown size={14} />
              </Button>
            </Dropdown>
            <Popconfirm
              title={`Xoá ${selectedRowKeys.length} công việc đã chọn?`}
              okText="Xoá"
              okButtonProps={{ danger: true, loading: bulkLoading }}
              cancelText="Huỷ"
              onConfirm={handleBulkDelete}
            >
              <Button danger icon={<Trash2 size={14} />} loading={bulkLoading}>
                Xoá
              </Button>
            </Popconfirm>
            <Button
              type="text"
              icon={<X size={14} />}
              onClick={() => setSelectedRowKeys([])}
            >
              Bỏ chọn
            </Button>
          </div>
        </Card>
      )}

      {/* ===== Table ===== */}
      <Card variant="borderless" styles={{ body: { padding: 0 } }}>
        <Table<Task>
          rowKey="id"
          columns={columns}
          dataSource={displayedItems}
          loading={isLoading}
          size="middle"
          scroll={{ x: 900 }}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
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
