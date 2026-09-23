"use client";

import { useEffect, useState } from "react";
import {
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
  Popover,
  Select,
  Space,
  Switch,
} from "antd";
import { CSegmented } from "@/components/ui";
import dayjs, { Dayjs } from "dayjs";
import {
  Briefcase,
  CalendarClock,
  Check,
  Home,
  Link2,
  ListChecks,
  Plus,
  Repeat,
  Tag,
  Trash2,
  UserRound,
} from "lucide-react";
import {
  useBoardLabels,
  useCreateBoardLabel,
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
import { BoardLabel, LABEL_COLORS, RepeatRule, repeatText } from "@/models/board";
import RepeatPicker from "@/components/board/RepeatPicker";

type FormValues = {
  kind: ItemKind;
  startAt?: Dayjs | null;
  endAt?: Dayjs | null;
  allDay?: boolean;
  title: string;
  description?: string;
  note?: string;
  taskTypeId?: string;
  labelIds?: string[];
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
  const { labels } = useBoardLabels();
  // Chỉ admin mới gọi được `GET /users`, nên chỉ bật khi đúng vai
  const { data: me } = useMe();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const isEdit = !!task;
  /*
   * Loại quyết định hiện ô nào: VIỆC có hạn chót (một mốc), LỊCH HẸN có khoảng
   * bắt đầu–kết thúc. Hai thứ loại trừ nhau, nên không bao giờ hiện cùng lúc.
   */
  const kind = Form.useWatch("kind", form) ?? ItemKind.TASK;
  const category = Form.useWatch("category", form) ?? TaskCategory.WORK;
  const allDay = Form.useWatch("allDay", form) ?? false;
  const isEvent = kind === ItemKind.EVENT;
  const saving = createTask.isPending || updateTask.isPending;

  const [repeatRule, setRepeatRule] = useState<RepeatRule | null>(null);
  const [repeatOpen, setRepeatOpen] = useState(false);
  const [createLabelOpen, setCreateLabelOpen] = useState(false);

  useEffect(() => {
    if (kind === ItemKind.TASK && repeatRule) {
      setRepeatRule(null);
    }
  }, [kind, repeatRule]);

  useEffect(() => {
    if (!open) return;
    if (task) {
      setRepeatRule(task.kind === ItemKind.EVENT ? (task.repeat ?? null) : null);
      form.setFieldsValue({
        title: task.title,
        description: task.description ?? "",
        note: task.note ?? undefined,
        taskTypeId: task.taskTypeId ?? undefined,
        labelIds: task.labelIds ?? [],
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
      setRepeatRule(null);
      form.resetFields();
      form.setFieldsValue({
        category: TaskCategory.WORK,
        priority: TaskPriority.NORMAL,
        attachments: [],
        description: "",
        kind: defaultKind,
        allDay: false,
        labelIds: [],
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
      labelIds: values.labelIds ?? [],
      category: values.category,
      priority: values.priority,
      attachments: (values.attachments ?? []).filter(Boolean),
      /*
       * Gửi đúng bộ mốc của loại đang chọn.
       */
      ...(values.kind === ItemKind.EVENT
        ? {
            kind: ItemKind.EVENT,
            startAt: values.startAt?.toISOString(),
            endAt: values.endAt?.toISOString(),
            allDay: values.allDay ?? false,
            repeat: repeatRule ?? null,
          }
        : {
            kind: ItemKind.TASK,
            deadline: values.deadline ? values.deadline.toISOString() : undefined,
            repeat: null,
          }),
    };

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
      width="min(1280px, 97vw)"
      centered
      style={{ top: 12, paddingBottom: 12 }}
      okText={isEdit ? "Lưu thay đổi" : "Tạo mới"}
      cancelText="Huỷ"
      destroyOnHidden
      styles={{
        container: { borderRadius: 14 },
        body: { maxHeight: "calc(100vh - 100px)", overflowY: "auto", padding: "6px 14px" },
      }}
      title={
        isEdit ? (
          <span className="text-[15px] font-bold text-slate-800">
            Sửa {isEvent ? "lịch hẹn" : "công việc"} <span className="font-mono text-slate-400 font-normal text-[13px]">{task?.code}</span>
          </span>
        ) : (
          <span className="text-[15px] font-bold text-slate-800">
            {isEvent ? "Tạo lịch hẹn mới" : "Tạo công việc mới"}
          </span>
        )
      }
    >
      <Form<FormValues> form={form} layout="vertical" requiredMark={false}>
        {/* Hàng 1: Loại mục & Tiêu đề - Đặt cạnh nhau tối đa diện tích hàng dọc */}
        <div className="grid grid-cols-1 md:grid-cols-[250px_minmax(0,1fr)] gap-2.5 mb-2.5 items-start">
          <Form.Item
            name="kind"
            label={<span className="font-semibold text-[11.5px] text-slate-700">Loại mục</span>}
            style={{ marginBottom: 0 }}
          >
            <CSegmented
              block
              size="small"
              disabled={isEdit}
              className="p-0.5 bg-slate-100 border border-slate-300"
              options={[
                {
                  value: ItemKind.TASK,
                  label: (
                    <KindOption
                      icon={<ListChecks size={13} />}
                      color="#0284c7"
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
                      icon={<CalendarClock size={13} />}
                      color="#0a436d"
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
            label={
              <span className="font-semibold text-[11.5px] text-slate-700">
                Tiêu đề {isEvent ? "lịch hẹn" : "công việc"} <span className="text-red-500">*</span>
              </span>
            }
            rules={[{ required: true, message: "Nhập tiêu đề" }]}
            style={{ marginBottom: 0 }}
          >
            <Input
              placeholder={isEvent ? "VD: Họp khách hàng, Phỏng vấn ứng viên, Gặp đối tác..." : "VD: Chuẩn bị báo cáo tài chính tuần..."}
              maxLength={255}
              className="h-[34px] text-[13px] font-medium border-slate-300 hover:border-[#0a436d] focus:border-[#0a436d]"
            />
          </Form.Item>
        </div>

        {/* Thân 2 cột: Cột trái (Nội dung) & Cột phải (Thuộc tính & Thời gian) */}
        <div className="grid gap-2.5 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_390px] items-start">
          {/* ===== Cột chính ===== */}
          <div className="flex flex-col gap-2 min-w-0">
            {/* Mô tả chi tiết - Chiều cao tinh gọn */}
            <div className="rounded-xl border border-slate-300 bg-white p-2.5 shadow-xs">
              <Form.Item
                name="description"
                label={<span className="font-semibold text-[11.5px] text-slate-700">Mô tả chi tiết</span>}
                style={{ marginBottom: 0 }}
              >
                <RichTextEditor minHeight={85} />
              </Form.Item>
            </div>

            {/* Ghi chú & Đính kèm 2 cột song song */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="rounded-xl border border-slate-300 bg-white p-2 shadow-xs flex flex-col">
                <Form.Item
                  name="note"
                  label={<span className="font-semibold text-[11.5px] text-slate-700">Ghi chú nội bộ</span>}
                  style={{ marginBottom: 0 }}
                >
                  <Input.TextArea
                    rows={2}
                    placeholder="Ghi chú thêm nội bộ..."
                    className="resize-none text-[12px] border-slate-300"
                  />
                </Form.Item>
              </div>

              <div className="rounded-xl border border-slate-300 bg-white p-2 shadow-xs flex flex-col">
                <Form.List name="attachments">
                  {(fields, { add, remove }) => (
                    <Form.Item
                      label={
                        <div className="flex items-center justify-between w-full">
                          <span className="font-semibold text-[11.5px] text-slate-700">
                            Tệp đính kèm ({fields.length})
                          </span>
                          <button
                            type="button"
                            onClick={() => add("")}
                            className="inline-flex items-center gap-1 text-[11px] text-[#0a436d] font-semibold hover:underline cursor-pointer border-0 bg-transparent p-0"
                          >
                            <Plus size={11} /> Thêm URL
                          </button>
                        </div>
                      }
                      tooltip="Backend hỗ trợ lưu liên kết URL đính kèm."
                      style={{ marginBottom: 0 }}
                    >
                      <div className="max-h-[58px] overflow-y-auto pr-1 flex flex-col gap-1">
                        {fields.length === 0 ? (
                          <div className="text-[11px] text-slate-400 py-1.5 text-center border border-dashed border-slate-300 rounded bg-slate-50/50">
                            Chưa có URL đính kèm
                          </div>
                        ) : (
                          fields.map((field) => (
                            <Space.Compact key={field.key} block size="small">
                              <Form.Item
                                name={field.name}
                                noStyle
                                rules={[{ required: true, message: "Nhập URL hoặc xoá dòng" }]}
                              >
                                <Input
                                  prefix={<Link2 size={11} className="text-slate-400" />}
                                  placeholder="https://..."
                                  className="text-[11.5px] border-slate-300"
                                />
                              </Form.Item>
                              <Button
                                size="small"
                                icon={<Trash2 size={11} />}
                                onClick={() => remove(field.name)}
                              />
                            </Space.Compact>
                          ))
                        )}
                      </div>
                    </Form.Item>
                  )}
                </Form.List>
              </div>
            </div>
          </div>

          {/* ===== Cột phụ — Viền rõ nét (border-2 border-slate-300), cực kỳ gọn gàng ===== */}
          <div className="flex flex-col gap-2 rounded-xl border-2 border-slate-300 bg-slate-100/70 p-2 shadow-xs">
            {/* Khối 1: Thời gian / Khung giờ */}
            <SideBlock
              title={isEvent ? "Khung giờ lịch hẹn" : "Thời hạn hoàn thành"}
            >
              {isEvent ? (
                <div className="flex flex-col gap-1.5">
                  <div className="grid grid-cols-2 gap-1.5">
                    <Form.Item
                      name="startAt"
                      label={<span className="text-[10.5px] font-medium text-slate-600">Bắt đầu</span>}
                      rules={[{ required: true, message: "Chọn giờ bắt đầu" }]}
                      style={{ marginBottom: 0 }}
                    >
                      <DatePicker
                        showTime={allDay ? false : { format: "HH:mm" }}
                        format={allDay ? "DD/MM/YYYY" : "DD/MM HH:mm"}
                        style={{ width: "100%" }}
                        placeholder="Bắt đầu"
                        size="small"
                        className="border-slate-300"
                      />
                    </Form.Item>

                    <Form.Item
                      name="endAt"
                      label={<span className="text-[10.5px] font-medium text-slate-600">Kết thúc</span>}
                      dependencies={["startAt"]}
                      rules={[
                        { required: true, message: "Chọn giờ kết thúc" },
                        ({ getFieldValue }) => ({
                          validator(_, value: Dayjs | null) {
                            const start = getFieldValue("startAt") as Dayjs | null;
                            if (!value || !start || !value.isBefore(start)) {
                              return Promise.resolve();
                            }
                            return Promise.reject(new Error("Kết thúc phải sau bắt đầu"));
                          },
                        }),
                      ]}
                      style={{ marginBottom: 0 }}
                    >
                      <DatePicker
                        showTime={allDay ? false : { format: "HH:mm" }}
                        format={allDay ? "DD/MM/YYYY" : "DD/MM HH:mm"}
                        style={{ width: "100%" }}
                        placeholder="Kết thúc"
                        size="small"
                        className="border-slate-300"
                      />
                    </Form.Item>
                  </div>

                  {/* Cả ngày & Lặp lại nằm chung 1 hàng tiết kiệm diện tích */}
                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <Form.Item
                      name="allDay"
                      valuePropName="checked"
                      noStyle
                    >
                      <div className="flex items-center gap-1.5 cursor-pointer select-none">
                        <Switch size="small" />
                        <span className="text-[11px] font-medium text-slate-600">Cả ngày</span>
                      </div>
                    </Form.Item>

                    <Popover
                      open={repeatOpen}
                      onOpenChange={setRepeatOpen}
                      trigger="click"
                      placement="bottomRight"
                      content={
                        <RepeatPicker
                          value={repeatRule}
                          anchor={
                            form.getFieldValue("startAt")?.toISOString() ||
                            defaultDeadline?.toISOString()
                          }
                          onChange={(rule) => setRepeatRule(rule)}
                          onClose={() => setRepeatOpen(false)}
                        />
                      }
                    >
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 h-[26px] px-2 rounded-md cursor-pointer text-[11px] border transition-all"
                        style={
                          repeatRule
                            ? {
                                background: "#f0f9ff",
                                color: "#0a436d",
                                borderColor: "#93c5fd",
                                fontWeight: 600,
                              }
                            : {
                                background: "#fff",
                                color: "#64748b",
                                borderColor: "#cbd5e1",
                              }
                        }
                      >
                        <Repeat size={11} />
                        <span className="truncate max-w-[130px]">
                          {repeatRule
                            ? repeatText(
                                repeatRule,
                                form.getFieldValue("startAt")?.toISOString() ||
                                  defaultDeadline?.toISOString(),
                              )
                            : "Không lặp"}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0 font-normal">
                          {repeatRule ? "Đổi" : "Cài đặt"}
                        </span>
                      </button>
                    </Popover>
                  </div>
                </div>
              ) : (
                <Form.Item
                  name="deadline"
                  label={<span className="text-[10.5px] font-medium text-slate-600">Hạn chót</span>}
                  style={{ marginBottom: 0 }}
                >
                  <DatePicker
                    showTime={{ format: "HH:mm" }}
                    format="DD/MM/YYYY HH:mm"
                    style={{ width: "100%" }}
                    placeholder="Chọn hạn hoàn thành"
                    size="small"
                    className="border-slate-300"
                  />
                </Form.Item>
              )}
            </SideBlock>

            {/* Khối 2: Phân loại & Gán nhãn — Hỗ trợ cả Việc lẫn Lịch hẹn */}
            <SideBlock title="Phân loại & Nhãn">
              <div className="flex flex-col gap-1.5">
                <div className="grid grid-cols-2 gap-1.5">
                  <Form.Item
                    name="category"
                    label={<span className="text-[10.5px] font-medium text-slate-600">Việc của ai</span>}
                    style={{ marginBottom: 0 }}
                  >
                    <CSegmented
                      block
                      size="small"
                      className="bg-slate-100 border border-slate-200"
                      options={Object.values(TaskCategory).map((c) => {
                        const on = category === c;
                        return {
                          value: c,
                          label: (
                            <span
                              className="inline-flex items-center justify-center gap-1 font-medium text-[11px]"
                              style={{ color: on ? "#0a436d" : "#64748b" }}
                            >
                              {c === TaskCategory.WORK ? <Briefcase size={11} /> : <Home size={11} />}
                              {CATEGORY_META[c].label}
                            </span>
                          ),
                        };
                      })}
                    />
                  </Form.Item>

                  <Form.Item
                    name="priority"
                    label={<span className="text-[10.5px] font-medium text-slate-600">Ưu tiên</span>}
                    style={{ marginBottom: 0 }}
                  >
                    <Select
                      size="small"
                      className="border-slate-300"
                      options={Object.values(TaskPriority).map((p) => ({
                        value: p,
                        label: (
                          <span className="inline-flex items-center gap-1.5 text-[11.5px]">
                            <span
                              className="size-1.5 rounded-full inline-block"
                              style={{ background: PRIORITY_META[p].color }}
                            />
                            {PRIORITY_META[p].label}
                          </span>
                        ),
                      }))}
                    />
                  </Form.Item>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <Form.Item
                    name="taskTypeId"
                    label={<span className="text-[10.5px] font-medium text-slate-600">Loại việc</span>}
                    style={{ marginBottom: 0 }}
                  >
                    <Select
                      size="small"
                      allowClear
                      placeholder="Chọn loại"
                      className="border-slate-300"
                      options={(taskTypes ?? []).map((t) => ({
                        value: t.id,
                        label: (
                          <span className="inline-flex items-center gap-1.5 text-[11.5px]">
                            <span
                              className="size-2 rounded-xs inline-block"
                              style={{ background: t.color }}
                            />
                            <span className="truncate">{t.name}</span>
                          </span>
                        ),
                      }))}
                    />
                  </Form.Item>

                  <Form.Item
                    name="labelIds"
                    label={
                      <div className="flex items-center justify-between w-full">
                        <span className="inline-flex items-center gap-1 text-[10.5px] font-medium text-slate-600">
                          <Tag size={10} /> Gán nhãn
                        </span>
                        <Popover
                          open={createLabelOpen}
                          onOpenChange={setCreateLabelOpen}
                          trigger="click"
                          placement="bottomRight"
                          content={
                            <QuickCreateLabel
                              onCreated={(newLabel) => {
                                const current = form.getFieldValue("labelIds") ?? [];
                                form.setFieldsValue({ labelIds: [...current, newLabel.id] });
                                setCreateLabelOpen(false);
                              }}
                              onCancel={() => setCreateLabelOpen(false)}
                            />
                          }
                        >
                          <button
                            type="button"
                            className="inline-flex items-center gap-0.5 text-[10px] text-[#0a436d] font-semibold hover:underline cursor-pointer border-0 bg-transparent p-0"
                          >
                            <Plus size={10} /> Thêm nhãn
                          </button>
                        </Popover>
                      </div>
                    }
                    style={{ marginBottom: 0 }}
                  >
                    <Select
                      mode="multiple"
                      size="small"
                      allowClear
                      placeholder="Chọn nhãn..."
                      maxTagCount="responsive"
                      className="w-full border-slate-300"
                      dropdownRender={(menu) => (
                        <>
                          {menu}
                          <div className="p-1 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => setCreateLabelOpen(true)}
                              className="w-full flex items-center justify-center gap-1 py-1 text-[11px] text-[#0a436d] font-semibold hover:bg-slate-50 rounded border-0 cursor-pointer"
                            >
                              <Plus size={11} /> Tạo nhãn mới...
                            </button>
                          </div>
                        </>
                      )}
                      tagRender={(props) => {
                        const { label, value, closable, onClose } = props;
                        const item = labels.find((l) => l.id === value);
                        const bg = item?.color ?? "#0a436d";
                        return (
                          <span
                            className="inline-flex items-center gap-1 px-1.5 py-0 rounded text-[10.5px] font-medium text-white mr-1 my-0.5 select-none"
                            style={{ backgroundColor: bg }}
                          >
                            <span className="truncate max-w-[75px]">{label}</span>
                            {closable && (
                              <span
                                onClick={onClose}
                                className="cursor-pointer opacity-75 hover:opacity-100 text-[10px] leading-none ml-0.5"
                              >
                                ×
                              </span>
                            )}
                          </span>
                        );
                      }}
                      options={labels.map((l) => ({
                        value: l.id,
                        label: l.name,
                        color: l.color,
                      }))}
                      optionRender={(option) => (
                        <div className="flex items-center gap-1.5 py-0.5">
                          <span
                            className="size-2 rounded-full shrink-0"
                            style={{ backgroundColor: option.data.color }}
                          />
                          <span className="text-[11.5px] text-slate-700 truncate">
                            {option.data.label}
                          </span>
                        </div>
                      )}
                    />
                  </Form.Item>
                </div>
              </div>
            </SideBlock>

            {/* Khối 3: Phụ trách & Việc con */}
            <SideBlock title={isEdit ? "Phụ trách & Việc con" : "Phụ trách"}>
              <div className="flex flex-col gap-1.5">
                <div className={`grid ${isEdit ? "grid-cols-2" : "grid-cols-1"} gap-1.5`}>
                  {isEdit && (
                    <Form.Item
                      name="status"
                      label={<span className="text-[10.5px] font-medium text-slate-600">Trạng thái</span>}
                      style={{ marginBottom: 0 }}
                    >
                      <Select
                        size="small"
                        options={Object.values(TaskStatus).map((s) => ({
                          value: s,
                          label: STATUS_META[s].label,
                        }))}
                      />
                    </Form.Item>
                  )}

                  <Form.Item
                    label={<span className="text-[10.5px] font-medium text-slate-600">Người thực hiện</span>}
                    style={{ marginBottom: 0 }}
                  >
                    <div
                      className="flex items-center gap-1.5 h-[24px] px-2 rounded-md text-[11px] bg-slate-50 border border-slate-200 text-slate-600 truncate"
                    >
                      <UserRound size={11} className="shrink-0" />
                      <span className="truncate">{me?.email ?? "Bạn"}</span>
                    </div>
                  </Form.Item>
                </div>

                {isEdit && task?.id && (
                  <Form.Item
                    label={<span className="text-[10.5px] font-medium text-slate-600">Task con</span>}
                    style={{ marginBottom: 0 }}
                  >
                    <TaskSubtasks taskId={task.id} />
                  </Form.Item>
                )}
              </div>
            </SideBlock>
          </div>
        </div>
      </Form>
    </Modal>
  );
}

/**
 * Một khối trong cột phụ với viền rõ nét (border-slate-300).
 */
function SideBlock({
  title,
  extra,
  children,
}: {
  title: string;
  extra?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-300 bg-white p-2 shadow-xs">
      <div className="mb-1.5 flex items-center justify-between border-b border-slate-100 pb-1">
        <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-700">
          {title}
        </span>
        {extra}
      </div>
      {children}
    </div>
  );
}

/**
 * Một lựa chọn trong bộ chọn Loại.
 * KHÔNG sử dụng màu tím — dùng màu xanh Sky cho Công việc và Navy cho Lịch hẹn.
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
      className="inline-flex items-center gap-1.5 py-0.5 px-0.5 rounded transition-all"
      style={{
        color: active ? color : "#64748b",
        opacity: active ? 1 : 0.75,
      }}
    >
      <span
        className="grid place-items-center size-5 rounded shrink-0 transition-transform"
        style={{
          background: active ? color : "#e2e8f0",
          color: active ? "#fff" : "#94a3b8",
        }}
      >
        {icon}
      </span>
      <span className="flex flex-col items-start leading-tight">
        <span className="text-[11.5px] font-bold">{title}</span>
        <span
          className="text-[9.5px] font-normal"
          style={{ color: active ? color : "#94a3b8" }}
        >
          {hint}
        </span>
      </span>
      {active && <Check size={12} className="ml-auto shrink-0" />}
    </span>
  );
}

/**
 * Khung tạo nhanh nhãn mới ngay trong modal mà không cần chuyển màn hình.
 */
function QuickCreateLabel({
  onCreated,
  onCancel,
}: {
  onCreated: (newLabel: BoardLabel) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(LABEL_COLORS[0]);
  const createLabel = useCreateBoardLabel();

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      const res = await createLabel.mutateAsync({ name: trimmed, color });
      if (res) {
        onCreated(res);
      }
    } catch {
      // Error handled in hook
    }
  };

  return (
    <div className="w-[220px] p-1 flex flex-col gap-2">
      <div className="flex items-center justify-between border-b border-slate-100 pb-1">
        <span className="text-[11.5px] font-bold text-slate-700">Tạo nhãn mới</span>
        <button
          type="button"
          onClick={onCancel}
          className="text-slate-400 hover:text-slate-600 border-0 bg-transparent cursor-pointer p-0 text-[13px] leading-none"
        >
          ×
        </button>
      </div>

      <Input
        size="small"
        placeholder="Nhập tên nhãn..."
        value={name}
        autoFocus
        maxLength={60}
        onChange={(e) => setName(e.target.value)}
        onPressEnter={handleCreate}
        className="text-[11.5px] border-slate-300"
      />

      <div>
        <div className="text-[10px] text-slate-500 mb-1 font-medium">Chọn màu</div>
        <div className="flex flex-wrap gap-1.5">
          {LABEL_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className="size-5 rounded-md border-0 cursor-pointer transition-transform"
              style={{
                background: c,
                outline: color === c ? "2px solid #0f172a" : "none",
                outlineOffset: 1,
                transform: color === c ? "scale(1.15)" : "scale(1)",
              }}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-slate-100">
        <Button size="small" onClick={onCancel} className="text-[11px] h-[24px]">
          Huỷ
        </Button>
        <Button
          type="primary"
          size="small"
          loading={createLabel.isPending}
          disabled={!name.trim()}
          onClick={handleCreate}
          className="bg-[#0a436d] text-[11px] h-[24px]"
        >
          Tạo
        </Button>
      </div>
    </div>
  );
}
