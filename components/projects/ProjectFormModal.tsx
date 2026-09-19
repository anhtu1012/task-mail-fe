"use client";
/**
 * Modal tạo / sửa dự án. Dùng chung ở trang chọn dự án và trang quản lý.
 *
 * Mã dự án: gợi ý tự động từ tên cho tới khi người dùng tự gõ. Sau khi họ đã
 * gõ tay thì thôi ghi đè — đang nhập mà bị chữ nhảy loạn là khó chịu nhất.
 */
import { useState } from "react";
import { Form, Input, Modal, Switch } from "antd";
import {
  CreateProjectInput,
  DEFAULT_PROJECT_COLOR,
  DEFAULT_PROJECT_ICON,
  Project,
  PROJECT_COLORS,
  PROJECT_ICONS,
  suggestProjectCode,
} from "@/models/project";
import {
  useCreateProject,
  useSetDefaultProject,
  useUpdateProject,
} from "@/hooks/useProjects";
import ProjectIcon from "@/app/(app)/_components/ProjectIcon";

type Values = CreateProjectInput;

type Props = {
  open: boolean;
  /** Có = chế độ sửa, không có = chế độ tạo */
  project?: Project | null;
  onClose: () => void;
  onCreated?: (project: Project) => void;
};

/**
 * Chỉ dựng phần thân khi mở. Nhờ vậy giá trị ban đầu của form lấy được ngay
 * lúc khởi tạo state, không phải đồng bộ lại bằng useEffect — vừa gọn vừa
 * tránh một vòng render thừa mỗi lần mở modal.
 */
export default function ProjectFormModal(props: Props) {
  if (!props.open) return null;
  return <ProjectForm {...props} />;
}

function ProjectForm({ project, onClose, onCreated }: Props) {
  const [form] = Form.useForm<Values>();
  const create = useCreateProject();
  const update = useUpdateProject();
  const setDefault = useSetDefaultProject();
  const [color, setColor] = useState<string>(
    project?.color ?? DEFAULT_PROJECT_COLOR,
  );
  const [icon, setIcon] = useState<string>(
    project?.icon ?? DEFAULT_PROJECT_ICON,
  );
  // Đang sửa thì coi như mã đã do người dùng đặt -> không tự ghi đè theo tên
  const [codeTouched, setCodeTouched] = useState(!!project);

  const submit = async () => {
    const { isDefault, ...rest } = await form.validateFields();
    const payload: CreateProjectInput = {
      ...rest,
      name: rest.name.trim(),
      code: rest.code?.trim() || undefined,
      color,
      icon,
    };

    if (project) {
      // `isDefault` KHÔNG được đi kèm PATCH: backend không nhận field đó và
      // `forbidNonWhitelisted` sẽ trả 400. Nó có endpoint riêng, gọi sau và
      // chỉ khi thật sự đổi.
      await update.mutateAsync({ id: project.id, input: payload });
      if (isDefault && !project.isDefault) {
        await setDefault.mutateAsync(project.id);
      }
    } else {
      // POST thì ngược lại: backend nhận `isDefault` ngay trong body
      const created = await create.mutateAsync({ ...payload, isDefault });
      onCreated?.(created);
    }
    onClose();
  };

  return (
    <Modal
      open
      title={project ? "Sửa dự án" : "Dự án mới"}
      okText={project ? "Lưu" : "Tạo dự án"}
      cancelText="Huỷ"
      confirmLoading={
        create.isPending || update.isPending || setDefault.isPending
      }
      onOk={submit}
      onCancel={onClose}
      destroyOnHidden
      width={520}
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        initialValues={{
          name: project?.name ?? "",
          code: project?.code ?? "",
          description: project?.description ?? "",
          isDefault: project?.isDefault ?? false,
        }}
      >
        <Form.Item
          name="name"
          label="Tên dự án"
          rules={[
            { required: true, message: "Nhập tên dự án" },
            { max: 80, message: "Tối đa 80 ký tự" },
          ]}
        >
          <Input
            placeholder="Ví dụ: Khách hàng A — website"
            autoFocus
            onChange={(e) => {
              if (!codeTouched) {
                form.setFieldValue("code", suggestProjectCode(e.target.value));
              }
            }}
          />
        </Form.Item>

        <Form.Item
          name="code"
          label="Mã ngắn"
          tooltip="Hiện ở bộ chọn dự án và trong mã công việc. Bỏ trống thì hệ thống tự sinh."
          rules={[
            {
              pattern: /^[A-Za-z0-9]{2,8}$/,
              message: "2–8 ký tự chữ hoặc số, không dấu",
            },
          ]}
        >
          <Input
            placeholder="KHA"
            maxLength={8}
            onChange={() => setCodeTouched(true)}
            style={{ maxWidth: 160, textTransform: "uppercase" }}
          />
        </Form.Item>

        <Form.Item name="description" label="Mô tả">
          <Input.TextArea
            rows={2}
            maxLength={280}
            showCount
            placeholder="Dự án này gồm những việc gì?"
          />
        </Form.Item>

        <Form.Item label="Màu">
          <div className="flex flex-wrap gap-2">
            {PROJECT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Màu ${c}`}
                onClick={() => setColor(c)}
                className="size-8 rounded-lg transition"
                style={{
                  background: c,
                  outline: color === c ? "2px solid #0f172a" : "none",
                  outlineOffset: 2,
                }}
              />
            ))}
          </div>
        </Form.Item>

        <Form.Item label="Biểu tượng">
          <div className="flex flex-wrap gap-2">
            {PROJECT_ICONS.map((ic) => (
              <button
                key={ic}
                type="button"
                aria-label={`Biểu tượng ${ic}`}
                onClick={() => setIcon(ic)}
                className="grid place-items-center size-9 rounded-lg border transition"
                style={{
                  borderColor: icon === ic ? "#0f172a" : "#e2e8f0",
                  background: icon === ic ? color : "#fff",
                  color: icon === ic ? "#fff" : "#475569",
                }}
              >
                <ProjectIcon name={ic} size={17} />
              </button>
            ))}
          </div>
        </Form.Item>

        <Form.Item
          name="isDefault"
          label="Đặt làm dự án mặc định"
          tooltip="Dự án tự mở sau khi đăng nhập trên một máy mới"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
}
