"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Clock, LoaderCircle, Paperclip, Plus, StickyNote } from "lucide-react";
import { BoardLabel, CardSummary } from "@/models/board";
import { PRIORITY_META, TaskPriority, TaskStatus } from "@/models/task";
import { C, LabelChip, SourceIcon } from "@/components/board/ui";
import { DeadlineTone, formatDeadline } from "./deadline";

const MAX_LABELS = 3;

type Props = {
  card: CardSummary;
  href: string;
  /** Trả Promise để nút tick hiện trạng thái chờ */
  onToggleComplete: (card: CardSummary) => Promise<unknown>;
  /** Nhãn của thẻ, đã tra từ labelIds */
  labels?: BoardLabel[];
  /** Có thì hàng nhãn bấm được (mở khung gắn nhãn) và thẻ chưa có nhãn hiện nút "+ Nhãn" */
  onEditLabels?: () => void;
  /** Chỗ cho menu thao tác (chuyển cột, xoá) — tab Hôm nay không cần */
  actions?: React.ReactNode;
};

/** Viên hạn chót: nền nhạt theo mức gấp, chữ đậm khi quá hạn / hôm nay */
const DEADLINE_STYLE: Record<DeadlineTone, { bg: string; fg: string }> = {
  overdue: { bg: C.danger50, fg: C.danger },
  soon: { bg: C.warning50, fg: C.warning600 },
  normal: { bg: C.muted, fg: C.neutral700 },
  done: { bg: C.muted, fg: C.neutral500 },
};

/** Viền trái theo ưu tiên — Bình thường thì không viền, để việc gấp nổi lên */
const PRIORITY_EDGE: Partial<Record<TaskPriority, string>> = {
  [TaskPriority.URGENT]: PRIORITY_META[TaskPriority.URGENT].color,
  [TaskPriority.HIGH]: PRIORITY_META[TaskPriority.HIGH].color,
  [TaskPriority.LOW]: "#cbd5e1",
};

/**
 * Một thẻ việc trên mobile: ô tick to (ngón tay bấm được), nhãn, tiêu đề, hàng
 * thông tin dạng viên. Cố tình không dùng CardTile — thẻ đó gắn với kéo thả
 * của bảng, mà trên màn hình cảm ứng kéo thả dễ bấm nhầm hơn là có ích.
 */
export function MobileCardRow({
  card,
  href,
  onToggleComplete,
  labels = [],
  onEditLabels,
  actions,
}: Props) {
  const [pending, setPending] = useState(false);
  const done = card.completedAt !== null;
  const deadline = card.deadline ? formatDeadline(card.deadline, done) : null;
  const edge = done ? undefined : PRIORITY_EDGE[card.priority];
  const checklistPct =
    card.checklistTotal > 0 ? Math.round((card.checklistDone / card.checklistTotal) * 100) : 0;

  const toggle = () => {
    // Rung nhẹ khi tick — cảm giác "đã bấm trúng" (Android; iOS bỏ qua lệnh này)
    if (!done) navigator.vibrate?.(12);
    setPending(true);
    void onToggleComplete(card).finally(() => setPending(false));
  };

  const labelRow = labels.length > 0 && (
    <div className="flex flex-wrap items-center gap-1">
      {labels.slice(0, MAX_LABELS).map((l) => (
        <LabelChip key={l.id} label={l} size="sm" />
      ))}
      {labels.length > MAX_LABELS && (
        <span
          className="inline-flex items-center h-[18px] px-1.5 rounded-md text-[10.5px] font-semibold"
          style={{ background: C.muted, color: C.neutral700 }}
        >
          +{labels.length - MAX_LABELS}
        </span>
      )}
    </div>
  );

  return (
    <article
      className="relative overflow-hidden rounded-[18px] bg-white transition-opacity"
      style={{
        opacity: done ? 0.7 : 1,
        boxShadow: "0 1px 2px rgba(15,23,42,.06), 0 10px 24px -18px rgba(15,23,42,.45)",
      }}
    >
      {/* Ảnh bìa thành một dải mỏng — đủ để nhận ra thẻ, không chiếm chỗ */}
      {card.cover && <div className="h-1.5" style={{ background: card.cover }} />}
      {edge && (
        <span
          aria-hidden
          className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full"
          style={{ background: edge }}
        />
      )}

      <div className="flex items-start gap-3 pl-3.5 pr-2 py-3">
        <button
          type="button"
          aria-label={done ? "Mở lại việc" : "Đánh dấu hoàn thành"}
          disabled={pending}
          onClick={toggle}
          // Vùng bấm 40px dù vòng tròn chỉ 24px — ngón tay không cần nhắm trúng
          className="-m-2 p-2 shrink-0 border-0 bg-transparent cursor-pointer"
        >
          <span
            className="grid place-items-center size-6 rounded-full transition-colors"
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
          </span>
        </button>

        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          {/* Hàng nhãn bấm được riêng: mở khung gắn nhãn, không mở chi tiết thẻ */}
          {labelRow &&
            (onEditLabels ? (
              <button
                type="button"
                onClick={onEditLabels}
                aria-label="Đổi nhãn"
                className="block p-0 border-0 bg-transparent cursor-pointer text-left"
              >
                {labelRow}
              </button>
            ) : (
              labelRow
            ))}

          <Link href={href} className="flex flex-col gap-2 no-underline">
            <div
              className="text-[15px] leading-[1.35] font-semibold [overflow-wrap:anywhere]"
              style={{
                color: done ? C.mutedForeground : C.foreground,
                textDecoration: done ? "line-through" : undefined,
              }}
            >
              {card.title}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-[11.5px] font-medium">
              {deadline && (
                <Pill bg={DEADLINE_STYLE[deadline.tone].bg} fg={DEADLINE_STYLE[deadline.tone].fg}>
                  <Clock size={11} />
                  {deadline.text}
                </Pill>
              )}
              {!done && card.status === TaskStatus.IN_PROGRESS && (
                <Pill bg={C.primary50} fg={C.primary}>
                  <span className="size-1.5 rounded-full" style={{ background: C.primary }} />
                  Đang làm
                </Pill>
              )}
              {card.checklistTotal > 0 && (
                <Pill bg={C.muted} fg={checklistPct === 100 ? C.success : C.neutral700}>
                  <span
                    className="relative w-7 h-1 rounded-full overflow-hidden"
                    style={{ background: C.border }}
                  >
                    <span
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{
                        width: `${checklistPct}%`,
                        background: checklistPct === 100 ? C.success : C.primary300,
                      }}
                    />
                  </span>
                  {card.checklistDone}/{card.checklistTotal}
                </Pill>
              )}
              {card.noteCount > 0 && (
                <Pill bg={C.muted} fg={C.neutral700}>
                  <StickyNote size={11} /> {card.noteCount}
                </Pill>
              )}
              {card.attachmentCount > 0 && (
                <Pill bg={C.muted} fg={C.neutral700}>
                  <Paperclip size={11} /> {card.attachmentCount}
                </Pill>
              )}
              <span className="inline-flex items-center gap-1 ml-auto" style={{ color: C.neutral500 }}>
                <SourceIcon source={card.source} size={11} />
                <span className="font-mono text-[10.5px]">{card.code}</span>
              </span>
            </div>
          </Link>

          {/* Chưa có nhãn: một nút nhỏ để gắn, khỏi phải mở menu ⋯ */}
          {labels.length === 0 && onEditLabels && !done && (
            <button
              type="button"
              onClick={onEditLabels}
              className="self-start inline-flex items-center gap-1 h-6 px-2 rounded-md cursor-pointer text-[11.5px] font-semibold bg-transparent"
              style={{ border: `1px dashed ${C.border}`, color: C.neutral500 }}
            >
              <Plus size={11} /> Nhãn
            </button>
          )}
        </div>

        {actions}
      </div>
    </article>
  );
}

function Pill({ bg, fg, children }: { bg: string; fg: string; children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1 h-[22px] px-2 rounded-full whitespace-nowrap"
      style={{ background: bg, color: fg }}
    >
      {children}
    </span>
  );
}
