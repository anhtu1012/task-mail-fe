"use client";

/**
 * Khung "Thêm nhanh" — nút + giữa thanh tab mobile.
 *
 * Việc mới vào Hộp thư đến: lúc đang cầm điện thoại người ta chỉ muốn ghi lại
 * cho khỏi quên, phân loại vào cột nào để sau. Vẫn hiểu cú pháp gõ nhanh như ô
 * thêm việc trên bảng ("mai 9h", "!gấp", "#nhãn", "30p").
 *
 * Nằm ngoài BoardProvider (nó sống ở layout, mở được từ mọi tab) nên gọi API
 * thẳng rồi làm mới cache, không đi qua BoardStore.
 */
import { useState } from "react";
import Link from "next/link";
import { App, Drawer } from "antd";
import { LoaderCircle, Send } from "lucide-react";
import dayjs from "dayjs";
import { useQueryClient } from "@tanstack/react-query";
import { boardApi } from "@/apis/board.api";
import { C } from "@/components/board/ui";
import { useCurrentProject } from "@/hooks/useProjects";
import { useBoardLabels } from "@/hooks/useTaskApp";
import { LABEL_COLORS } from "@/models/board";
import { PRIORITY_META, TaskPriority } from "@/models/task";
import { getApiErrorMessage } from "@/utils/client/apiError";
import { quickParse } from "@/utils/client/quickParse";
import { cardHref, useBoardId } from "./links";

export function QuickAddSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const { projectId, project } = useCurrentProject();
  const boardId = useBoardId();
  const { labels } = useBoardLabels();
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  const parsed = quickParse(text);

  const submit = async () => {
    if (!parsed.title.trim() || saving) return;
    setSaving(true);
    try {
      // Nhãn gõ bằng #slug: có sẵn thì gắn, chưa có thì tạo — giống ô thêm việc
      // trên bảng. Màu theo slug để cùng một tên luôn ra cùng một màu.
      const labelIds: string[] = [];
      for (const slug of parsed.labelSlugs) {
        const existing = labels.find((l) => l.slug === slug);
        if (existing) {
          labelIds.push(existing.id);
        } else if (boardId) {
          const seed = [...slug].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
          const created = await boardApi.createLabel(boardId, {
            name: slug,
            color: LABEL_COLORS[seed % LABEL_COLORS.length],
          });
          labelIds.push(created.id);
        }
      }

      const card = await boardApi.createCard(null, {
        projectId: projectId ?? undefined,
        title: parsed.title,
        deadline: parsed.deadline,
        priority: parsed.priority ?? TaskPriority.NORMAL,
        labelIds: labelIds.length ? labelIds : undefined,
        estimateMinutes: parsed.estimateMinutes ?? undefined,
      });

      // Mọi thứ dưới khoá "board": bảng, lịch hôm nay, nhãn
      queryClient.invalidateQueries({ queryKey: ["board"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });

      const key = `quick-add-${card.id}`;
      message.open({
        key,
        type: "success",
        duration: 4,
        content: (
          <span className="inline-flex items-center gap-3">
            Đã thêm vào Hộp thư đến
            <Link
              href={cardHref(card.boardId, card.id)}
              onClick={() => message.destroy(key)}
              className="font-semibold"
              style={{ color: "#0a436d" }}
            >
              Mở
            </Link>
          </span>
        ),
      });
      setText("");
      onClose();
    } catch (error) {
      message.error(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      placement="bottom"
      open={open}
      onClose={onClose}
      closable={false}
      size="auto"
      destroyOnHidden
      styles={{
        wrapper: { borderRadius: "20px 20px 0 0", overflow: "hidden" },
        body: { padding: "14px 16px calc(16px + env(safe-area-inset-bottom))" },
      }}
    >
      <div className="flex flex-col gap-3">
        <div className="mx-auto w-10 h-1 rounded-full" style={{ background: C.border }} />
        <div className="flex items-baseline justify-between gap-2">
          <div className="text-[16px] font-bold" style={{ color: C.foreground }}>
            Thêm việc nhanh
          </div>
          <div className="text-[12px] truncate" style={{ color: C.mutedForeground }}>
            vào Hộp thư đến{project ? ` · ${project.name}` : ""}
          </div>
        </div>

        <textarea
          autoFocus
          rows={3}
          value={text}
          maxLength={500}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void submit();
            }
          }}
          placeholder="Gọi khách hàng mai 9h !gấp #baogia 30p"
          className="w-full resize-none rounded-xl px-3 py-2.5 text-[15px] outline-none"
          style={{ border: `1px solid ${C.primary300}`, color: C.foreground }}
        />

        {/* Xem trước những gì đã hiểu được — để biết "mai 9h" có được nhận không */}
        {(parsed.deadline || parsed.priority || parsed.labelSlugs.length > 0 || parsed.estimateMinutes) && (
          <div className="flex flex-wrap gap-1.5 text-[12px]">
            {parsed.deadline && (
              <Chip>⏰ {dayjs(parsed.deadline).format("HH:mm DD/MM")}</Chip>
            )}
            {parsed.priority && (
              <Chip color={PRIORITY_META[parsed.priority].color}>
                {PRIORITY_META[parsed.priority].label}
              </Chip>
            )}
            {parsed.estimateMinutes && <Chip>⌛ {parsed.estimateMinutes} phút</Chip>}
            {parsed.labelSlugs.map((slug) => (
              <Chip key={slug}>#{slug}</Chip>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => void submit()}
          disabled={!parsed.title.trim() || saving}
          className="inline-flex items-center justify-center gap-2 h-11 rounded-xl border-0 cursor-pointer
            text-[15px] font-semibold text-white disabled:opacity-50"
          style={{ background: C.primary }}
        >
          {saving ? <LoaderCircle size={16} className="animate-spin" /> : <Send size={16} />}
          Thêm việc
        </button>
      </div>
    </Drawer>
  );
}

function Chip({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      className="inline-flex items-center h-6 px-2 rounded-full font-medium"
      style={{ background: C.muted, color: color ?? C.neutral800 }}
    >
      {children}
    </span>
  );
}
