"use client";

import { useState } from "react";
import {
  Button,
  Card,
  ColorPicker,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Table,
  Tag,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  useDeleteTaskType,
  useMe,
  useSaveTaskType,
  useTaskTypes,
} from "@/hooks/useTaskApp";
import { presetColors } from "@/models/enums";
import { TaskType, isAdminRole } from "@/models/task";

type FormValues = { name: string; color: string };

export default function TaskTypesPage() {
  const { data: me } = useMe();
  const admin = isAdminRole(me?.role);

  const { data: taskTypes, isLoading } = useTaskTypes();
  const saveTaskType = useSaveTaskType();
  const deleteTaskType = useDeleteTaskType();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TaskType | null>(null);
  const [form] = Form.useForm<FormValues>();

  const openModal = (taskType?: TaskType) => {
    setEditing(taskType ?? null);
    form.setFieldsValue(
      taskType
        ? { name: taskType.name, color: taskType.color }
        : { name: "", color: "#93C47D" },
    );
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    await saveTaskType.mutateAsync({
      id: editing?.id,
      input: { name: values.name.trim(), color: values.color },
    });
    setModalOpen(false);
  };

  const columns: ColumnsType<TaskType> = [
    {
      title: "Màu",
      dataIndex: "color",
      width: 90,
      render: (color: string) => (
        <span
          className="inline-block size-6 rounded-md border border-black/10"
          style={{ background: color }}
          title={color}
        />
      ),
    },
    {
      title: "Tên loại",
      dataIndex: "name",
      render: (name: string, record) => <Tag color={record.color}>{name}</Tag>,
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      width: 160,
      render: (d: string) => dayjs(d).format("DD/MM/YYYY HH:mm"),
    },
    ...(admin
      ? [
          {
            title: "",
            key: "actions",
            width: 100,
            align: "right" as const,
            render: (_: unknown, record: TaskType) => (
              <div className="flex justify-end gap-1">
                <Button
                  size="small"
                  type="text"
                  icon={<Pencil size={14} />}
                  onClick={() => openModal(record)}
                />
                <Popconfirm
                  title="Xoá loại công việc này?"
                  okText="Xoá"
                  okButtonProps={{ danger: true }}
                  cancelText="Huỷ"
                  onConfirm={() => deleteTaskType.mutate(record.id)}
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
        ]
      : []),
  ];

  return (
    <div className="flex flex-col gap-4 max-w-[900px] mx-auto">
      <div className="flex items-center justify-between">
        <p className="text-slate-500 text-sm m-0">
          Loại công việc dùng để phân nhóm và tô màu task trong danh sách.
        </p>
        {admin && (
          <Button type="primary" icon={<Plus size={16} />} onClick={() => openModal()}>
            Thêm loại
          </Button>
        )}
      </div>

      <Card variant="borderless" styles={{ body: { padding: 0 } }}>
        <Table<TaskType>
          rowKey="id"
          columns={columns}
          dataSource={taskTypes}
          loading={isLoading}
          pagination={false}
          size="middle"
          scroll={{ x: 480 }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Chưa có loại công việc nào"
              />
            ),
          }}
        />
      </Card>

      <Modal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        confirmLoading={saveTaskType.isPending}
        title={editing ? "Sửa loại công việc" : "Thêm loại công việc"}
        okText={editing ? "Lưu" : "Tạo"}
        cancelText="Huỷ"
        width={420}
        destroyOnHidden
      >
        <Form<FormValues> form={form} layout="vertical" requiredMark={false}>
          <Form.Item
            name="name"
            label="Tên loại"
            rules={[
              { required: true, message: "Nhập tên loại" },
              { max: 100, message: "Tối đa 100 ký tự" },
            ]}
          >
            <Input placeholder="VD: Báo cáo, Họp, Phát triển..." />
          </Form.Item>
          <Form.Item
            name="color"
            label="Màu hiển thị"
            rules={[{ required: true, message: "Chọn màu" }]}
            getValueFromEvent={(color) => color.toHexString().toUpperCase()}
          >
            <ColorPicker
              disabledAlpha
              showText
              presets={[{ label: "Gợi ý", colors: presetColors }]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
