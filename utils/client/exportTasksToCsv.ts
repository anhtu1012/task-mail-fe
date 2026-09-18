import dayjs from "dayjs";
import {
  CATEGORY_META,
  DEADLINE_META,
  PRIORITY_META,
  STATUS_META,
  Task,
  TaskType,
} from "@/models/task";
import { richTextToPlain } from "@/utils/client/richText";

const CSV_COLUMNS = [
  "Mã",
  "Tiêu đề",
  "Mô tả",
  "Loại công việc",
  "Phân loại",
  "Độ ưu tiên",
  "Trạng thái",
  "Tình trạng deadline",
  "Deadline",
  "Ngày tạo",
  "Ngày hoàn thành",
] as const;

/** Escape 1 ô CSV theo RFC 4180 — bọc nháy kép nếu chứa dấu phẩy/nháy/xuống dòng */
function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

const fmtDate = (d?: string | null) =>
  d ? dayjs(d).format("DD/MM/YYYY HH:mm") : "";

export function exportTasksToCsv(tasks: Task[], taskTypes: TaskType[] = []): void {
  const typeNameById = new Map(taskTypes.map((t) => [t.id, t.name]));

  const rows = tasks.map((task) => [
    task.code,
    task.title,
    richTextToPlain(task.description),
    (task.taskTypeId && typeNameById.get(task.taskTypeId)) ?? "",
    CATEGORY_META[task.category].label,
    PRIORITY_META[task.priority].label,
    STATUS_META[task.status].label,
    DEADLINE_META[task.deadlineStatus].label,
    fmtDate(task.deadline),
    fmtDate(task.createdAt),
    fmtDate(task.completedAt),
  ]);

  const csvBody = [CSV_COLUMNS, ...rows]
    .map((row) => row.map((cell) => escapeCsvCell(String(cell))).join(","))
    .join("\r\n");

  // BOM để Excel nhận đúng UTF-8 (tránh vỡ tiếng Việt có dấu)
  const blob = new Blob(["﻿" + csvBody], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `tasks_${dayjs().format("YYYYMMDD_HHmmss")}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
