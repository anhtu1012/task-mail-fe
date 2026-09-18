"use client";

/**
 * Danh sách task con (checklist) của một công việc.
 *
 * Backend không có bảng "subtask" riêng cho Task — nhưng endpoint checklist
 * của module board (`/tasks/:id/checklists`, xem apis/board.api.ts) vận hành
 * trực tiếp trên id của Task (Checklist.taskId), nên tái dùng thẳng boardApi
 * ở đây thay vì phải chờ backend thêm API mới.
 *
 * Chỉ dùng 1 checklist ẩn danh mỗi task (tự tạo khi thêm mục đầu tiên) — coi
 * như "danh sách task con", không lộ khái niệm nhiều checklist ra UI.
 */
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { App, Button, Checkbox, Input, Progress } from "antd";
import { ListTodo, Plus, Trash2 } from "lucide-react";
import { boardApi } from "@/apis/board.api";
import { getApiErrorMessage } from "@/utils/client/apiError";

type Props = {
  /** null khi đang tạo task mới — chưa có id để gắn checklist */
  taskId: string | null;
};

const SUBTASKS_TITLE = "Việc con";

export default function TaskSubtasks({ taskId }: Props) {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");
  const queryKey = ["task-checklist", taskId];

  const { data: detail, isLoading } = useQuery({
    queryKey,
    queryFn: () => boardApi.cardDetail(taskId as string),
    enabled: !!taskId,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey });
  const onError = (error: unknown) => message.error(getApiErrorMessage(error));

  const checklist = detail?.checklists[0];

  const addItem = useMutation({
    mutationFn: async (content: string) => {
      const cl = checklist ?? (await boardApi.addChecklist(taskId as string, SUBTASKS_TITLE));
      return boardApi.addChecklistItem(cl.id, content);
    },
    onSuccess: invalidate,
    onError,
  });

  const toggleItem = useMutation({
    mutationFn: ({ itemId, checked }: { itemId: string; checked: boolean }) =>
      boardApi.updateChecklistItem(itemId, { checked }),
    onSuccess: invalidate,
    onError,
  });

  const deleteItem = useMutation({
    mutationFn: (itemId: string) => boardApi.deleteChecklistItem(itemId),
    onSuccess: invalidate,
    onError,
  });

  const handleAdd = () => {
    const content = draft.trim();
    if (!content) return;
    addItem.mutate(content);
    setDraft("");
  };

  if (!taskId) {
    return (
      <div className="rounded-md border border-dashed border-slate-200 px-3 py-2.5 text-[13px] text-slate-400">
        Lưu công việc trước để thêm task con.
      </div>
    );
  }

  const items = checklist?.items ?? [];
  const total = items.length;
  const done = items.filter((i) => i.checked).length;

  return (
    <div className="flex flex-col gap-2">
      {total > 0 && (
        <div className="flex items-center gap-2">
          <Progress
            percent={Math.round((done / total) * 100)}
            size="small"
            style={{ flex: 1 }}
            format={() => `${done}/${total}`}
          />
        </div>
      )}

      <div className="flex flex-col gap-1 max-h-[220px] overflow-y-auto">
        {!isLoading && total === 0 && (
          <div className="flex items-center gap-1.5 text-[13px] text-slate-400">
            <ListTodo size={14} /> Chưa có task con
          </div>
        )}
        {items.map((item) => (
          <div
            key={item.id}
            className="group flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-slate-50"
          >
            <Checkbox
              checked={item.checked}
              onChange={(e) =>
                toggleItem.mutate({ itemId: item.id, checked: e.target.checked })
              }
            />
            <span
              className={`flex-1 text-[13px] break-all ${
                item.checked ? "line-through text-slate-400" : "text-slate-700"
              }`}
            >
              {item.content}
            </span>
            <Button
              size="small"
              type="text"
              danger
              className="opacity-0 group-hover:opacity-100"
              icon={<Trash2 size={13} />}
              onClick={() => deleteItem.mutate(item.id)}
            />
          </div>
        ))}
      </div>

      <div className="flex gap-1.5">
        <Input
          size="small"
          placeholder="Thêm task con..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onPressEnter={handleAdd}
        />
        <Button
          size="small"
          icon={<Plus size={13} />}
          loading={addItem.isPending}
          onClick={handleAdd}
        />
      </div>
    </div>
  );
}
