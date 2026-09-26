"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, LoaderCircle, Paperclip, StickyNote } from "lucide-react";
import dayjs from "dayjs";
import { CardSummary } from "@/models/board";
import { PRIORITY_META, TaskPriority } from "@/models/task";
import { C } from "@/components/board/ui";

type Props = {
  card: CardSummary;
  href: string;
  /** Trả Promise để nút tick hiện trạng thái chờ */
  onToggleComplete: (card: CardSummary) => Promise<unknown>;
  /** Chỗ cho menu thao tác (chuyển cột, xoá) — tab Hôm nay không cần */
  actions?: React.ReactNode;
};

/**
 * Một dòng việc trên mobile: ô tick to (ngón tay bấm được), tiêu đề, hạn.
 * Cố tình không dùng CardTile — thẻ đó gắn với kéo thả của bảng, mà trên màn
 * hình cảm ứng kéo thả dễ bấm nhầm hơn là có ích.
 */
export function MobileCardRow({ card, href, onToggleComplete, actions }: Props) {
  const [pending, setPending] = useState(false);
  const done = card.completedAt !== null;
  const overdue =
    !done && !!card.deadline && dayjs(card.deadline).isBefore(dayjs());

  return (
    <div
      className="flex items-start gap-3 px-3 py-3 rounded-2xl bg-white"
      style={{ border: `1px solid ${C.border}` }}
    >
      <button
        type="button"
        aria-label={done ? "Mở lại việc" : "Đánh dấu hoàn thành"}
        disabled={pending}
        onClick={() => {
          setPending(true);
          void onToggleComplete(card).finally(() => setPending(false));
        }}
        className="mt-0.5 grid place-items-center size-6 shrink-0 rounded-full cursor-pointer"
        style={{
          border: `2px solid ${done ? C.success : C.borderDark}`,
          background: done ? C.success : "transparent",
          color: "#fff",
        }}
      >
        {pending ? (
          <LoaderCircle size={13} className="animate-spin" style={{ color: C.neutral700 }} />
        ) : (
          done && <Check size={14} strokeWidth={3} />
        )}
      </button>

      <Link href={href} className="flex-1 min-w-0 no-underline">
        <div
          className="text-[15px] leading-snug font-medium [overflow-wrap:anywhere]"
          style={{
            color: done ? C.mutedForeground : C.foreground,
            textDecoration: done ? "line-through" : undefined,
          }}
        >
          {card.priority !== TaskPriority.NORMAL && (
            <span
              className="inline-block size-2 rounded-full mr-1.5 align-middle"
              style={{ background: PRIORITY_META[card.priority].color }}
            />
          )}
          {card.title}
        </div>
        <div
          className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[12px]"
          style={{ color: C.mutedForeground }}
        >
          <span className="font-mono">{card.code}</span>
          {card.deadline && (
            <span style={{ color: overdue ? C.danger : undefined, fontWeight: overdue ? 600 : 400 }}>
              {dayjs(card.deadline).format("HH:mm DD/MM")}
            </span>
          )}
          {card.checklistTotal > 0 && (
            <span>
              ☑ {card.checklistDone}/{card.checklistTotal}
            </span>
          )}
          {card.noteCount > 0 && (
            <span className="inline-flex items-center gap-0.5">
              <StickyNote size={11} /> {card.noteCount}
            </span>
          )}
          {card.attachmentCount > 0 && (
            <span className="inline-flex items-center gap-0.5">
              <Paperclip size={11} /> {card.attachmentCount}
            </span>
          )}
        </div>
      </Link>

      {actions}
    </div>
  );
}
