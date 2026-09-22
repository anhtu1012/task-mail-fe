"use client";

import { useEffect } from "react";
import {
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
  Segmented,
  Select,
  Space,
  Tooltip,
} from "antd";
import dayjs, { Dayjs } from "dayjs";
import { Link2, Plus, Trash2 } from "lucide-react";
import {
  useAssignableUsers,
  useCreateTask,
  useTaskTypes,
  useUpdateTask,
} from "@/hooks/useTaskApp";
import { RichTextEditor } from "@/components/board/RichTextEditor";
import TaskSubtasks from "@/components/tasks/TaskSubtasks";
import { isRichTextEmpty } from "@/utils/client/richText";
import {
  CATEGORY_META,
  CreateTaskInput,
  PRIORITY_META,
  STATUS_META,
  Task,
  TaskCategory,
  TaskPriority,
  TaskStatus,
  UpdateTaskInput,
} from "@/models/task";

type FormValues = {
  title: string;
  description?: string;
  note?: string;
  taskTypeId?: string;
  category: TaskCategory;
  priority: TaskPriority;
  status?: TaskStatus;
  assigneeId?: string;
  deadline?: Dayjs | null;
  attachments?: string[];
};

type Props = {
  open: boolean;
  onClose: () => void;
  /** null = tạo mới, khác null = sửa */
  task?: Task | null;
  isAdmin: boolean;
  /** Deadline gợi ý khi tạo mới (VD: click 1 ngày trên lịch) */
  defaultDeadline?: Dayjs | null;
};

export default function TaskFormModal({
  open,
  onClose,
  task,
  isAdmin,
  defaultDeadline,
}: Props) {
  const [form] = Form.useForm<FormValues>();
  const { data: taskTypes } = useTaskTypes();
  // Chỉ admin mới gọi được `GET /users`, nên chỉ bật khi đúng vai
  const { users, isLoading: usersLoading } = useAssignableUsers(isAdmin);
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const isEdit = !!task;
  const saving = createTask.isPending || updateTask.isPending;

  useEffect(() => {
    if (!open) return;
    if (task) {
      form.setFieldsValue({
        title: task.title,
        description: task.description ?? "",
        note: task.note ?? undefined,
        taskTypeId: task.taskTypeId ?? undefined,
        category: task.category,
        priority: task.priority,
        status: task.status,
        assigneeId: task.assigneeId,
        deadline: task.deadline ? dayjs(task.deadline) : null,
        attachments: task.attachments ?? [],
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        category: TaskCategory.WORK,
        priority: TaskPriority.NORMAL,
        attachments: [],
        description: "",
        deadline: defaultDeadline ?? null,
      });
    }
  }, [open, task, form, defaultDeadline]);

  const handleSubmit = async () => {
    const values = await form.validateFields();

    // Chỉ gửi đúng field backend cho phép (forbidNonWhitelisted)
    const payload: CreateTaskInput & UpdateTaskInput = {
      title: values.title.trim(),
      description: isRichTextEmpty(values.description)
        ? undefined
        : values.description,
      note: values.note?.trim() || undefined,
      taskTypeId: values.taskTypeId || undefined,
      category: values.category,
      priority: values.priority,
      deadline: values.deadline ? values.deadline.toISOString() : undefined,
      attachments: (values.attachments ?? []).filter(Boolean),
    };

    // Chỉ admin mới được gán người khác — user thường tuyệt đối không gửi assigneeId
    if (isAdmin && values.assigneeId?.trim()) {
      payload.assigneeId = values.assigneeId.trim();
    }

    if (isEdit && task) {
      if (values.status) payload.status = values.status;
      await updateTask.mutateAsync({ id: task.id, input: payload });
    } else {
      await createTask.mutateAsync(payload);
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={saving}
      width={920}
      okText={isEdit ? "Lưu thay đổi" : "Tạo công việc"}
      cancelText="Huỷ"
      destroyOnHidden
      styles={{ body: { maxHeight: "72vh", overflowY: "auto", paddingRight: 4 } }}
      title={
        isEdit ? (
          <span>
            Sửa công việc <span className="font-mono text-slate-400">{task?.code}</span>
          </span>
        ) : (
          "Tạo công việc mới"
        )
      }
    >
      <Form<FormValues> form={form} layout="vertical" requiredMark={false}>
        <div className="grid grid-cols-[1fr_280px] gap-x-6">
          {/* ===== Cột chính ===== */}
          <div>
            <Form.Item
              name="title"
              label="Tiêu đề"
              rules={[{ required: true, message: "Nhập tiêu đề công việc" }]}
            >
              <Input placeholder="VD: Chuẩn bị báo cáo tuần" maxLength={255} />
            </Form.Item>

            <Form.Item name="description" label="Mô tả">
              <RichTextEditor minHeight={180} />
            </Form.Item>

            <Form.Item name="note" label="Ghi chú">
              <Input.TextArea rows={2} placeholder="Ghi chú nội bộ..." />
            </Form.Item>

            <Form.List name="attachments">
              {(fields, { add, remove }) => (
                <Form.Item
                  label="Tệp đính kèm (URL)"
                  tooltip="Backend chưa hỗ trợ upload file — chỉ lưu đường dẫn URL."
                  style={{ marginBottom: 0 }}
                >
                  {fields.map((field) => (
                    <Space.Compact key={field.key} block style={{ marginBottom: 8 }}>
                      <Form.Item
                        name={field.name}
                        noStyle
                        rules={[{ required: true, message: "Nhập URL hoặc xoá dòng" }]}
                      >
                        <Input
                          prefix={<Link2 size={14} className="text-slate-400" />}
                          placeholder="https://..."
                        />
                      </Form.Item>
                      <Button
                        icon={<Trash2 size={14} />}
                        onClick={() => remove(field.name)}
                      />
                    </Space.Compact>
                  ))}
                  <Button
                    type="dashed"
                    block
                    icon={<Plus size={14} />}
                    onClick={() => add("")}
                  >
                    Thêm đường dẫn
                  </Button>
                </Form.Item>
              )}
            </Form.List>
          </div>

          {/* ===== Cột phụ ===== */}
          <div>
            <Form.Item name="category" label="Phân loại">
              <Segmented
                block
                options={Object.values(TaskCategory).map((c) => ({
                  label: CATEGORY_META[c].label,
                  value: c,
                }))}
              />
            </Form.Item>

            <Form.Item name="priority" label="Độ ưu tiên">
              <Select
                options={Object.values(TaskPriority).map((p) => ({
                  value: p,
                  label: (
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="size-2 rounded-full inline-block"
                        style={{ background: PRIORITY_META[p].color }}
                      />
                      {PRIORITY_META[p].label}
                    </span>
                  ),
                }))}
              />
            </Form.Item>

            <Form.Item name="taskTypeId" label="Loại công việc">
              <Select
                allowClear
                placeholder="Chọn loại"
                options={(taskTypes ?? []).map((t) => ({
                  value: t.id,
                  label: (
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="size-2.5 rounded-sm inline-block"
                        style={{ background: t.color }}
                      />
                      {t.name}
                    </span>
                  ),
                }))}
              />
            </Form.Item>

            <Form.Item name="deadline" label="Hạn hoàn thành">
              <DatePicker
                showTime={{ format: "HH:mm" }}
                format="DD/MM/YYYY HH:mm"
                style={{ width: "100%" }}
                placeholder="Chọn deadline"
              />
            </Form.Item>

            {isEdit && (
              <Form.Item name="status" label="Trạng thái">
                <Select
                  options={Object.values(TaskStatus).map((s) => ({
                    value: s,
                    label: STATUS_META[s].label,
                  }))}
                />
              </Form.Item>
            )}

            {isAdmin && (
              <Form.Item
                name="assigneeId"
                label={
                  <Tooltip title="Bỏ trống = giao cho chính bạn">
                    <span>Người thực hiện</span>
                  </Tooltip>
                }
              >
                {/*
                  Trước đây là ô nhập UUID — người dùng phải tự đi đâu đó tìm
                  id 36 ký tự rồi dán vào, vì backend chưa có endpoint liệt kê
                  người dùng. Giờ đã có `GET /users` (chỉ admin).
                */}
                <Select
                  allowClear
                  showSearch
                  loading={usersLoading}
                  placeholder="Giao cho chính tôi"
                  optionFilterProp="label"
                  options={users.map((u) => ({
                    label: u.email,
                    value: u.id,
                  }))}
                />
              </Form.Item>
            )}

            <Form.Item label="Task con" style={{ marginBottom: 0 }}>
              <TaskSubtasks taskId={task?.id ?? null} />
            </Form.Item>
          </div>
        </div>
      </Form>
    </Modal>
  );
}
