"use client";

import {
  Button,
  Descriptions,
  Drawer,
  Popconfirm,
  Space,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import dayjs from "dayjs";
import { CheckCheck, Mail, Pencil, Trash2 } from "lucide-react";
import { useCompleteTask, useDeleteTask, useTaskTypes } from "@/hooks/useTaskApp";
import { RichTextEditor } from "@/components/board/RichTextEditor";
import { isRichTextEmpty } from "@/utils/client/richText";
import {
  CATEGORY_META,
  DEADLINE_META,
  PRIORITY_META,
  STATUS_META,
  Task,
  TaskStatus,
} from "@/models/task";

const fmt = (d?: string | null) =>
  d ? dayjs(d).format("DD/MM/YYYY HH:mm") : "—";

type Props = {
  task: Task | null;
  onClose: () => void;
  onEdit: (task: Task) => void;
};

export default function TaskDetailDrawer({ task, onClose, onEdit }: Props) {
  const { data: taskTypes } = useTaskTypes();
  const completeTask = useCompleteTask();
  const deleteTask = useDeleteTask();

  const taskType = taskTypes?.find((t) => t.id === task?.taskTypeId);
  const canComplete =
    task && task.status !== TaskStatus.DONE && task.status !== TaskStatus.CANCELLED;

  return (
    <Drawer
      open={!!task}
      onClose={onClose}
      width={520}
      title={
        task && (
          <div className="flex items-center gap-2">
            <span className="font-mono text-slate-400 text-sm">{task.code}</span>
            {task.sourceMailAccountId && (
              <Tag color="cyan">
                <span className="inline-flex items-center gap-1">
                  <Mail size={11} /> Tạo từ email
                </span>
              </Tag>
            )}
          </div>
        )
      }
      extra={
        task && (
          <Space>
            {canComplete && (
              <Button
                type="primary"
                icon={<CheckCheck size={14} />}
                loading={completeTask.isPending}
                onClick={() =>
                  completeTask.mutate(task.id, { onSuccess: onClose })
                }
              >
                Hoàn thành
              </Button>
            )}
            <Button icon={<Pencil size={14} />} onClick={() => onEdit(task)} />
            <Popconfirm
              title="Xoá công việc này?"
              description="Hành động không thể hoàn tác."
              okText="Xoá"
              okButtonProps={{ danger: true }}
              cancelText="Huỷ"
              onConfirm={() => deleteTask.mutate(task.id, { onSuccess: onClose })}
            >
              <Button danger icon={<Trash2 size={14} />} />
            </Popconfirm>
          </Space>
        )
      }
    >
      {task && (
        <>
          <Typography.Title level={4} style={{ marginTop: 0 }}>
            {task.title}
          </Typography.Title>

          <Space size={[4, 8]} wrap style={{ marginBottom: 16 }}>
            <Tag color={STATUS_META[task.status].color}>
              {STATUS_META[task.status].label}
            </Tag>
            <Tag color={PRIORITY_META[task.priority].color}>
              {PRIORITY_META[task.priority].label}
            </Tag>
            <Tag color={CATEGORY_META[task.category].color}>
              {CATEGORY_META[task.category].label}
            </Tag>
            <Tag color={DEADLINE_META[task.deadlineStatus].color}>
              {DEADLINE_META[task.deadlineStatus].label}
            </Tag>
            {taskType && <Tag color={taskType.color}>{taskType.name}</Tag>}
          </Space>

          {!isRichTextEmpty(task.description) && (
            <>
              <Typography.Title level={5} style={{ marginTop: 0 }}>
                Mô tả
              </Typography.Title>
              <RichTextEditor readOnly value={task.description ?? ""} />
            </>
          )}

          <Descriptions
            column={1}
            size="small"
            bordered
            style={{ marginTop: 16 }}
          >
            <Descriptions.Item label="Ghi chú">
              <span className="whitespace-pre-wrap">{task.note || "—"}</span>
            </Descriptions.Item>
            <Descriptions.Item label="Hạn hoàn thành">
              {fmt(task.deadline)}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày giao">
              {fmt(task.assignedAt)}
            </Descriptions.Item>
            <Descriptions.Item label="Hoàn thành lúc">
              {fmt(task.completedAt)}
            </Descriptions.Item>
            <Descriptions.Item label="Tạo lúc">
              {fmt(task.createdAt)}
            </Descriptions.Item>
            <Descriptions.Item label="Cập nhật">
              {fmt(task.updatedAt)}
            </Descriptions.Item>
            <Descriptions.Item label="Người thực hiện">
              {/*
                Trước đây in nguyên UUID 36 ký tự ra cho người dùng đọc. Giờ
                backend trả kèm `assignee`; vẫn để `assigneeId` làm phương án
                cuối cho dữ liệu cũ trong cache.
              */}
              {task.assignee?.email ? (
                <span>{task.assignee.email}</span>
              ) : (
                <Tooltip title="Chưa tra được người thực hiện">
                  <span className="font-mono text-xs text-slate-400">
                    {task.assigneeId}
                  </span>
                </Tooltip>
              )}
            </Descriptions.Item>
          </Descriptions>

          {task.attachments?.length > 0 && (
            <>
              <Typography.Title level={5} style={{ marginTop: 20 }}>
                Tệp đính kèm ({task.attachments.length})
              </Typography.Title>
              <ul className="space-y-1.5 pl-0 list-none">
                {task.attachments.map((item, index) => {
                  const isUrl = /^https?:\/\//i.test(item);
                  return (
                    <li
                      key={index}
                      className="rounded-md border border-slate-200 px-3 py-2 text-[13px] break-all"
                    >
                      {isUrl ? (
                        <a href={item} target="_blank" rel="noopener noreferrer">
                          {item}
                        </a>
                      ) : (
                        <span className="text-slate-600">📎 {item}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </>
      )}
    </Drawer>
  );
}
