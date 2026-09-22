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
  Switch,
} from "antd";
import dayjs, { Dayjs } from "dayjs";
import {
  Briefcase,
  CalendarClock,
  Check,
  Home,
  Link2,
  ListChecks,
  Plus,
  Trash2,
  UserRound,
} from "lucide-react";
import {
  useCreateTask,
  useMe,
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
  ItemKind,
  STATUS_META,
  Task,
  TaskCategory,
  TaskPriority,
  TaskStatus,
  UpdateTaskInput,
} from "@/models/task";

type FormValues = {
  kind: ItemKind;
  startAt?: Dayjs | null;
  endAt?: Dayjs | null;
  allDay?: boolean;
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
  /** Deadline gợi ý khi tạo mới (VD: click 1 ngày trên lịch) */
  defaultDeadline?: Dayjs | null;
  /**
   * Loại mặc định khi tạo mới. Bảng công việc mở form này ở chế độ Lịch hẹn —
   * mở ra đã đúng loại thì bớt được một cú bấm và một lần chọn nhầm.
   */
  defaultKind?: ItemKind;
};

export default function TaskFormModal({
  open,
  onClose,
  task,
  defaultDeadline,
  defaultKind = ItemKind.TASK,
}: Props) {
  const [form] = Form.useForm<FormValues>();
  const { data: taskTypes } = useTaskTypes();
  // Chỉ admin mới gọi được `GET /users`, nên chỉ bật khi đúng vai
  const { data: me } = useMe();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const isEdit = !!task;
  /*
   * Loại quyết định hiện ô nào: VIỆC có hạn chót (một mốc), LỊCH HẸN có khoảng
   * bắt đầu–kết thúc. Hai thứ loại trừ nhau, nên không bao giờ hiện cùng lúc.
   *
   * Khi SỬA thì khoá loại lại: backend không cho đổi TASK thành EVENT bằng
   * PATCH (đổi loại kéo theo gỡ khỏi bảng, `completedAt` mất nghĩa...), nên để
   * người dùng bấm được rồi báo lỗi là tệ hơn không cho bấm.
   */
  const kind = Form.useWatch("kind", form) ?? ItemKind.TASK;
  const category = Form.useWatch("category", form) ?? TaskCategory.WORK;
  const allDay = Form.useWatch("allDay", form) ?? false;
  const isEvent = kind === ItemKind.EVENT;
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
        kind: task.kind ?? ItemKind.TASK,
        deadline: task.deadline ? dayjs(task.deadline) : null,
        startAt: task.startAt ? dayjs(task.startAt) : null,
        endAt: task.endAt ? dayjs(task.endAt) : null,
        allDay: task.allDay ?? false,
        attachments: task.attachments ?? [],
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        category: TaskCategory.WORK,
        priority: TaskPriority.NORMAL,
        attachments: [],
        description: "",
        kind: defaultKind,
        allDay: false,
        deadline: defaultDeadline ?? null,
        // Bấm tạo từ một ô ngày trên lịch: gợi ý luôn khung giờ 1 tiếng
        startAt: defaultDeadline ?? null,
        endAt: defaultDeadline ? defaultDeadline.add(1, "hour") : null,
      });
    }
  }, [open, task, form, defaultDeadline, defaultKind]);

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
      attachments: (values.attachments ?? []).filter(Boolean),
      /*
       * Gửi đúng bộ mốc của loại đang chọn. Gửi lẫn lộn thì backend bỏ qua
       * phần thừa, nhưng để `deadline` đi kèm một sự kiện là nói dối chính
       * mình: backend nhân bản `deadline` từ `startAt`, không lấy giá trị gửi lên.
       */
      ...(values.kind === ItemKind.EVENT
        ? {
            kind: ItemKind.EVENT,
            startAt: values.startAt?.toISOString(),
            endAt: values.endAt?.toISOString(),
            allDay: values.allDay ?? false,
          }
        : {
            kind: ItemKind.TASK,
            deadline: values.deadline ? values.deadline.toISOString() : undefined,
          }),
    };

    /*
     * KHÔNG gửi `assigneeId`: bỏ trống thì backend giao cho chính người gọi.
     * Giao diện không còn cho chọn người khác — xem ghi chú ở ô "Người thực hiện".
     */

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
      /*
       * Toàn màn hình thay vì hộp 920px.
       *
       * Form này có 12 ô cộng một trình soạn thảo văn bản; nhét vào hộp nhỏ thì
       * cột phải sinh thanh cuộn riêng và những ô cuối ("Task con") bị cắt mất
       * — người dùng không biết là còn nội dung bên dưới.
       */
      width="100vw"
      style={{ top: 0, maxWidth: "100vw", paddingBottom: 0 }}
      okText={isEdit ? "Lưu thay đổi" : "Tạo công việc"}
      cancelText="Huỷ"
      destroyOnHidden
      styles={{
        // `container` là hộp trắng của modal ở antd v6 (không phải `content`)
        container: { borderRadius: 0, minHeight: "100vh" },
        body: { height: "calc(100vh - 118px)", overflowY: "auto", paddingRight: 8 },
      }}
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
        {/*
          Hai cột trên màn rộng, xếp dọc trên màn hẹp. Cột phụ rộng hơn trước
          (340px) để nhãn "Hạn hoàn thành"/"Người thực hiện" không xuống dòng.
        */}
        <div className="mx-auto w-full max-w-[1400px] grid gap-x-8 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px]">
          {/* ===== Cột chính ===== */}
          <div>
            {/*
              Loại nằm TRÊN CÙNG vì nó quyết định các ô phía dưới. Khi sửa thì
              khoá lại — backend không cho đổi loại bằng PATCH.
            */}
            <Form.Item name="kind" label="Loại">
              {/*
                Hai lựa chọn này trước đây là hai ô chữ giống hệt nhau, nằm
                ngay trên một bộ chọn khác cũng y như vậy ("Phân loại") — nhìn
                lướt không phân biệt được cái nào là cái nào.

                Giờ mỗi bên có icon và MÀU riêng, kèm một dòng nói rõ nó thay
                đổi điều gì: chọn loại là chọn xem việc này có hạn chót hay có
                khung giờ, đó là khác biệt duy nhất mà cũng là khác biệt lớn nhất.
              */}
              <Segmented
                block
                size="large"
                disabled={isEdit}
                options={[
                  {
                    value: ItemKind.TASK,
                    label: (
                      <KindOption
                        icon={<ListChecks size={16} />}
                        color="#0ea5e9"
                        title="Công việc"
                        hint="có hạn chót"
                        active={kind === ItemKind.TASK}
                      />
                    ),
                  },
                  {
                    value: ItemKind.EVENT,
                    label: (
                      <KindOption
                        icon={<CalendarClock size={16} />}
                        color="#7c3aed"
                        title="Lịch hẹn"
                        hint="có khung giờ"
                        active={kind === ItemKind.EVENT}
                      />
                    ),
                  },
                ]}
              />
            </Form.Item>

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

          {/* ===== Cột phụ — chia khối có tiêu đề để quét mắt nhanh ===== */}
          <div className="flex flex-col gap-4">
            <SideBlock title="Phân loại">
            {/* Phân loại là chuyện KHÁC hẳn với "Loại" ở trên: việc của công
                ty hay việc riêng. Icon giúp không nhầm hai bộ chọn với nhau. */}
            <Form.Item name="category" label="Việc của ai">
              <Segmented
                block
                options={Object.values(TaskCategory).map((c) => {
                  const on = category === c;
                  return {
                    value: c,
                    label: (
                      <span
                        className="inline-flex items-center gap-1.5 font-medium"
                        style={{ color: on ? "#0a436d" : "#94a3b8" }}
                      >
                        {c === TaskCategory.WORK ? (
                          <Briefcase size={13} />
                        ) : (
                          <Home size={13} />
                        )}
                        {CATEGORY_META[c].label}
                        {on && <Check size={13} />}
                      </span>
                    ),
                  };
                })}
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
            </SideBlock>

            <SideBlock title={isEvent ? "Khung giờ" : "Thời hạn"}>
            {isEvent ? (
              <>
                <Form.Item
                  name="allDay"
                  label="Cả ngày"
                  valuePropName="checked"
                  tooltip="Bỏ phần giờ, lịch vẽ thành thanh ngang suốt ngày"
                >
                  <Switch size="small" />
                </Form.Item>

                <Form.Item
                  name="startAt"
                  label="Bắt đầu"
                  rules={[{ required: true, message: "Chọn thời gian bắt đầu" }]}
                >
                  <DatePicker
                    showTime={allDay ? false : { format: "HH:mm" }}
                    format={allDay ? "DD/MM/YYYY" : "DD/MM/YYYY HH:mm"}
                    style={{ width: "100%" }}
                    placeholder="Chọn thời gian bắt đầu"
                  />
                </Form.Item>

                <Form.Item
                  name="endAt"
                  label="Kết thúc"
                  dependencies={["startAt"]}
                  rules={[
                    { required: true, message: "Chọn thời gian kết thúc" },
                    /*
                     * Kiểm ngay ở form thay vì để backend trả 400: người dùng
                     * thấy lỗi ngay dưới ô vừa nhập, không phải sau khi bấm Lưu.
                     */
                    ({ getFieldValue }) => ({
                      validator(_, value: Dayjs | null) {
                        const start = getFieldValue("startAt") as Dayjs | null;
                        if (!value || !start || !value.isBefore(start)) {
                          return Promise.resolve();
                        }
                        return Promise.reject(
                          new Error("Kết thúc phải sau lúc bắt đầu"),
                        );
                      },
                    }),
                  ]}
                >
                  <DatePicker
                    showTime={allDay ? false : { format: "HH:mm" }}
                    format={allDay ? "DD/MM/YYYY" : "DD/MM/YYYY HH:mm"}
                    style={{ width: "100%" }}
                    placeholder="Chọn thời gian kết thúc"
                  />
                </Form.Item>
              </>
            ) : (
              <Form.Item name="deadline" label="Hạn hoàn thành">
                <DatePicker
                  showTime={{ format: "HH:mm" }}
                  format="DD/MM/YYYY HH:mm"
                  style={{ width: "100%" }}
                  placeholder="Chọn deadline"
                />
              </Form.Item>
            )}

            </SideBlock>

            <SideBlock title="Khác">
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

            {/*
              NGƯỜI THỰC HIỆN — hiển thị, không phải ô chọn.

              Bỏ danh sách người dùng đi là có chủ đích: đây là công cụ CÁ NHÂN
              (xem đầu `models/board.ts`), việc luôn thuộc về người tạo ra nó.
              Một ô chọn người khác ở màn tạo việc chỉ tạo ảo giác rằng có thể
              giao việc, trong khi cả bảng lẫn dự án đều không có khái niệm
              thành viên.

              Backend vẫn nhận `assigneeId` (admin gán cho người khác qua API
              được), nên không mất gì — chỉ là giao diện thôi không mời gọi.
            */}
            <Form.Item label="Người thực hiện">
              <div
                className="flex items-center gap-2 h-8 px-3 rounded-lg text-[13px]"
                style={{ background: "#f8fafc", color: "#64748b" }}
              >
                <UserRound size={14} />
                {me?.email ?? "Bạn"}
              </div>
            </Form.Item>

            <Form.Item label="Task con" style={{ marginBottom: 0 }}>
              <TaskSubtasks taskId={task?.id ?? null} />
            </Form.Item>
            </SideBlock>
          </div>
        </div>
      </Form>
    </Modal>
  );
}

/**
 * Một khối trong cột phụ.
 *
 * Trước đây mười ô nằm liền một mạch không có ngăn cách nào; mắt phải đọc từng
 * nhãn mới biết đang ở phần nào. Gom thành ba khối có tiêu đề ("Phân loại",
 * "Khung giờ"/"Thời hạn", "Khác") để quét nhanh.
 */
function SideBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-3 pt-3">
      <div className="mb-2 text-[11.5px] font-semibold uppercase tracking-wide text-slate-400">
        {title}
      </div>
      {children}
    </div>
  );
}

/**
 * Một lựa chọn trong bộ chọn Loại.
 *
 * Tự vẽ trạng thái đang chọn thay vì trông vào `Segmented`: nền trắng trên
 * xám nhạt của antd quá mờ, đặt cạnh một Segmented khác ngay bên phải thì
 * nhìn lướt không biết cái nào đang bật. Ở đây ô được chọn ăn nguyên màu của
 * nó, ô không chọn bị làm xám hẳn — khác biệt thấy từ xa.
 */
function KindOption({
  icon,
  color,
  title,
  hint,
  active,
}: {
  icon: React.ReactNode;
  color: string;
  title: string;
  hint: string;
  active: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-2 py-1 px-1 rounded-lg transition-colors"
      style={{
        color: active ? color : "#94a3b8",
        filter: active ? undefined : "grayscale(1)",
        opacity: active ? 1 : 0.75,
      }}
    >
      <span
        className="grid place-items-center size-7 rounded-lg shrink-0"
        style={{
          background: active ? color : "#e2e8f0",
          color: active ? "#fff" : "#94a3b8",
        }}
      >
        {icon}
      </span>
      <span className="flex flex-col items-start leading-tight">
        <span className="text-[13px] font-semibold">{title}</span>
        <span className="text-[11px]" style={{ color: active ? color : "#94a3b8" }}>
          {hint}
        </span>
      </span>
      {active && <Check size={15} className="ml-0.5 shrink-0" />}
    </span>
  );
}
